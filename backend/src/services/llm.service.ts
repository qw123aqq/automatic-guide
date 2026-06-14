import axios from 'axios';
import { config } from 'dotenv';

config();

interface AIProvider {
  name: string;
  available: boolean;
  type: 'cloud' | 'local';
}

export class LLMService {
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // 检查云端提供商
    if (process.env.ZHIPU_API_KEY) {
      this.providers.push({
        name: 'zhipu',
        available: true,
        type: 'cloud',
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: 'openai',
        available: true,
        type: 'cloud',
      });
    }

    // 检查本地提供商
    this.providers.push({
      name: 'ollama',
      available: true,
      type: 'local',
    });

    this.providers.push({
      name: 'localai',
      available: true,
      type: 'local',
    });

    console.log('🤖 已初始化 AI 提供商:', this.providers.map((p) => p.name).join(', '));
  }

  /**
   * 获取可用的提供商
   */
  getAvailableProviders(): AIProvider[] {
    return this.providers;
  }

  /**
   * 测试连接
   */
  async testConnection() {
    const results = [];

    for (const provider of this.providers) {
      try {
        let success = false;

        if (provider.name === 'zhipu') {
          success = await this.testZhipu();
        } else if (provider.name === 'openai') {
          success = await this.testOpenAI();
        } else if (provider.name === 'ollama') {
          success = await this.testOllama();
        } else if (provider.name === 'localai') {
          success = await this.testLocalAI();
        }

        results.push({
          provider: provider.name,
          status: success ? '✅ 可用' : '❌ 不可用',
        });
      } catch (error: any) {
        results.push({
          provider: provider.name,
          status: '❌ 错误: ' + error.message,
        });
      }
    }

    return results;
  }

  /**
   * 测试豆包连接
   */
  private async testZhipu(): Promise<boolean> {
    if (!process.env.ZHIPU_API_KEY) return false;

    try {
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: process.env.ZHIPU_MODEL || 'glm-4',
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      return !!response.data?.choices?.[0]?.message?.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 测试 OpenAI 连接
   */
  private async testOpenAI(): Promise<boolean> {
    if (!process.env.OPENAI_API_KEY) return false;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      return !!response.data?.choices?.[0]?.message?.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 测试 Ollama 连接
   */
  private async testOllama(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'llama2',
          prompt: 'Hi',
          stream: false,
        },
        { timeout: 5000 },
      );

      return !!response.data?.response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 测试 LocalAI 连接
   */
  private async testLocalAI(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${process.env.LOCALAI_BASE_URL || 'http://localhost:8080'}/v1/chat/completions`,
        {
          model: process.env.LOCALAI_MODEL || 'ggml-gpt4all-j',
          messages: [{ role: 'user', content: 'Hi' }],
        },
        { timeout: 5000 },
      );

      return !!response.data?.choices?.[0]?.message?.content;
    } catch (error) {
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
    { "episodeNumber": 1, "title": "第一集标题", "outline": "..." },
    { "episodeNumber": 2, "title": "第二集标题", "outline": "..." }
  ]
}
    `;

    return this.generateText(prompt);
  }

  /**
   * 生成剧本
   */
  async generateScript(
    storyOutline: string,
    characters: any[],
    sceneDescription: string,
  ): Promise<any> {
    const prompt = `
你是一位专业的编剧。根据以下故事大纲、角色信息和场景描述生成详细的剧本。

故事大纲：
${storyOutline}

角色列表：
${characters.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

场景描述：
${sceneDescription}

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

    return this.generateText(prompt);
  }

  /**
   * 优化文本
   */
  async optimizeText(text: string, type: string = 'dialogue'): Promise<string> {
    let prompt = '';

    if (type === 'dialogue') {
      prompt = `请改进以下对话，使其更自然、更有趣、更符合角色性格。只返回改进后的对话，不要其他内容。\n\n对话：${text}`;
    } else if (type === 'description') {
      prompt = `请改进以下场景描述，使其更生动、更详细、更具视觉感。只返回改进后的描述，不要其他内容。\n\n描述：${text}`;
    }

    return this.generateText(prompt);
  }

  /**
   * 生成文本 - 核心方法，自动选择提供商
   */
  private async generateText(prompt: string): Promise<any> {
    // 优先尝试云端模型
    if (process.env.ZHIPU_API_KEY) {
      try {
        console.log('🤖 使用豆包生成...');
        return await this.generateWithZhipu(prompt);
      } catch (error: any) {
        console.warn('豆包失败，尝试下一个提供商:', error.message);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🤖 使用 OpenAI 生成...');
        return await this.generateWithOpenAI(prompt);
      } catch (error: any) {
        console.warn('OpenAI 失败，尝试下一个提供商:', error.message);
      }
    }

    // 降级到本地模型
    try {
      console.log('🤖 使用本地 Ollama 生成...');
      return await this.generateWithOllama(prompt);
    } catch (error: any) {
      console.warn('Ollama 失败，尝试 LocalAI');
    }

    try {
      console.log('🤖 使用本地 LocalAI 生成...');
      return await this.generateWithLocalAI(prompt);
    } catch (error: any) {
      console.warn('LocalAI 失败');
    }

    throw new Error('❌ 所有 AI 提供商都不可用，请检查网络和配置');
  }

  /**
   * 豆包生成
   */
  private async generateWithZhipu(prompt: string): Promise<any> {
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: process.env.ZHIPU_MODEL || 'glm-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('豆包未返回内容');

    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { text: content };
  }

  /**
   * OpenAI 生成
   */
  private async generateWithOpenAI(prompt: string): Promise<any> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI 未返回内容');

    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { text: content };
  }

  /**
   * Ollama 生成
   */
  private async generateWithOllama(prompt: string): Promise<any> {
    const response = await axios.post(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`,
      {
        model: process.env.OLLAMA_MODEL || 'llama2',
        prompt: prompt,
        stream: false,
      },
      { timeout: 120000 },
    );

    const content = response.data?.response;
    if (!content) throw new Error('Ollama 未返回内容');

    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { text: content };
      }
    }

    return { text: content };
  }

  /**
   * LocalAI 生成
   */
  private async generateWithLocalAI(prompt: string): Promise<any> {
    const response = await axios.post(
      `${process.env.LOCALAI_BASE_URL || 'http://localhost:8080'}/v1/chat/completions`,
      {
        model: process.env.LOCALAI_MODEL || 'ggml-gpt4all-j',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      { timeout: 120000 },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('LocalAI 未返回内容');

    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { text: content };
      }
    }

    return { text: content };
  }
}
