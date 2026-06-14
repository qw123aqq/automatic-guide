import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios } from 'axios';

interface LLMProvider {
  name: string;
  isAvailable: boolean;
  generate(prompt: string): Promise<string>;
}

@Injectable()
export class LLMService {
  private logger = new Logger('LLMService');
  private providers: LLMProvider[] = [];

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  private initializeProviders() {
    // 豆包 (Zhipu)
    this.providers.push({
      name: 'zhipu',
      isAvailable: !!this.configService.get('ZHIPU_API_KEY'),
      generate: (prompt) => this.generateWithZhipu(prompt),
    });

    // OpenAI
    this.providers.push({
      name: 'openai',
      isAvailable: !!this.configService.get('OPENAI_API_KEY'),
      generate: (prompt) => this.generateWithOpenAI(prompt),
    });

    // 本地 Ollama
    this.providers.push({
      name: 'ollama',
      isAvailable: true,
      generate: (prompt) => this.generateWithOllama(prompt),
    });

    // 本地 LocalAI
    this.providers.push({
      name: 'localai',
      isAvailable: true,
      generate: (prompt) => this.generateWithLocalAI(prompt),
    });
  }

  /**
   * 生成文本 - 自动切换提供商
   */
  async generate(prompt: string): Promise<string> {
    // 按优先级尝试
    for (const provider of this.providers) {
      try {
        if (provider.isAvailable) {
          this.logger.debug(`使用 ${provider.name} 生成文本`);
          const result = await provider.generate(prompt);
          return result;
        }
      } catch (error) {
        this.logger.warn(`${provider.name} 失败，尝试下一个提供商: ${error.message}`);
      }
    }

    throw new Error('所有 LLM 提供商都不可用');
  }

  /**
   * 使用豆包生成
   */
  private async generateWithZhipu(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v3/model-api/glm-4/sse',
        {
          model: this.configService.get('ZHIPU_MODEL', 'glm-4'),
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('ZHIPU_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 豆包返回流式数据，这里简化处理
      return response.data.choices?.[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('豆包 API 错误', error);
      throw error;
    }
  }

  /**
   * 使用 OpenAI 生成
   */
  private async generateWithOpenAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.configService.get('OPENAI_MODEL', 'gpt-4'),
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices?.[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('OpenAI API 错误', error);
      throw error;
    }
  }

  /**
   * 使用本地 Ollama 生成
   */
  private async generateWithOllama(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.configService.get('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/generate`,
        {
          model: this.configService.get('OLLAMA_MODEL', 'llama2'),
          prompt: prompt,
          stream: false,
        },
      );

      return response.data.response || '';
    } catch (error) {
      this.logger.error('Ollama 连接错误', error);
      throw error;
    }
  }

  /**
   * 使用本地 LocalAI 生成
   */
  private async generateWithLocalAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.configService.get('LOCALAI_BASE_URL', 'http://localhost:8080')}/v1/chat/completions`,
        {
          model: this.configService.get('LOCALAI_MODEL', 'ggml-gpt4all-j'),
          messages: [{ role: 'user', content: prompt }],
        },
      );

      return response.data.choices?.[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('LocalAI 连接错误', error);
      throw error;
    }
  }

  /**
   * 生成故事大纲
   */
  async generateStoryOutline(story: string, episodeCount: number): Promise<any> {
    const prompt = `
你是一位专业的编剧。用户提供了一部小说或故事，需要你改编成${episodeCount}集的漫剧。

请完成以下任务：
1. 生成总体故事大纲（200-300字）
2. 为每一集生成分集大纲（每集50-100字）
3. 明确每集的起承转合

故事内容：
${story}

输出格式为 JSON:
{
  "summary": "总体大纲",
  "episodes": [
    { "episodeNumber": 1, "title": "第一集标题", "outline": "..." }
  ]
}
    `;

    const result = await this.generate(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return { error: '大纲生成失败' };
    }
  }

  /**
   * 生成剧本
   */
  async generateScript(
    storyOutline: string,
    characters: any[],
  ): Promise<any> {
    const prompt = `
你是一位专业的编剧。根据以下故事大纲和角色信息生成详细的剧本。

故事大纲：
${storyOutline}

角色列表：
${characters.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

请生成一份详细的剧本，包括每个场景的对话、动作和舞台指示。

输出格式为 JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "location": "场景地点",
      "paragraphs": [
        {
          "character": "角色名",
          "dialogue": "台词",
          "action": "动作/舞台指示"
        }
      ]
    }
  ]
}
    `;

    const result = await this.generate(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return { error: '剧本生成失败' };
    }
  }
}
