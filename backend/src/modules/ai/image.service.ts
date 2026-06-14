import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ImageService {
  private logger = new Logger('ImageService');

  constructor(private configService: ConfigService) {}

  /**
   * 生成角色头像
   */
  async generateCharacterAvatar(description: string, style: string = 'default'): Promise<string> {
    // 优先尝试本地 ComfyUI
    try {
      return await this.generateWithComfyUI(description, style);
    } catch (error) {
      this.logger.warn('ComfyUI 生成失败，尝试云端');
    }

    // 降级到云端
    try {
      return await this.generateWithAliyun(description, style);
    } catch (error) {
      this.logger.error('所有图像生成提供商都失败了', error);
      throw error;
    }
  }

  /**
   * 生成分镜图片
   */
  async generateStoryboardImage(
    shotScript: string,
    style: string,
    characters: any[] = [],
  ): Promise<string> {
    const prompt = this.buildImagePrompt(shotScript, style, characters);
    return this.generateCharacterAvatar(prompt, style);
  }

  /**
   * 使用本地 ComfyUI 生成图像
   */
  private async generateWithComfyUI(description: string, style: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.configService.get('COMFYUI_BASE_URL', 'http://localhost:8188')}/api/generate`,
        {
          prompt: this.buildComfyUIPrompt(description, style),
        },
        { timeout: 60000 },
      );

      // ComfyUI 返回图片 URL 或路径
      return response.data.image_url || response.data.image_path || '';
    } catch (error) {
      this.logger.error('ComfyUI 生成失败', error.message);
      throw error;
    }
  }

  /**
   * 使用阿里云灵积生成图像
   */
  private async generateWithAliyun(description: string, style: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
        {
          model: 'wanx-v1',
          input: {
            prompt: description,
            negative_prompt: 'blurry, bad quality',
            style: style,
          },
          parameters: {
            size: '1024x1024',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('ALIYUN_DASHSCOPE_API_KEY')}`,
          },
        },
      );

      return response.data?.output?.results?.[0]?.url || '';
    } catch (error) {
      this.logger.error('阿里云图像生成失败', error.message);
      throw error;
    }
  }

  /**
   * 构建图像生成 prompt
   */
  private buildImagePrompt(shotScript: string, style: string, characters: any[]): string {
    let prompt = `
根据以下镜头脚本生成一幅概念艺术图像：

镜头脚本：${shotScript}

视觉风格：${style}
    `;

    if (characters.length > 0) {
      prompt += `\n\n涉及的角色：`;
      characters.forEach((char) => {
        prompt += `\n- ${char.name}: ${char.appearance}`;
      });
    }

    prompt += `\n\n要求：电影级质量，高细节，专业美术指导`;
    return prompt;
  }

  /**
   * 构建 ComfyUI prompt
   */
  private buildComfyUIPrompt(description: string, style: string): any {
    // ComfyUI 使用特定的节点格式
    return {
      '1': {
        inputs: {
          ckpt_name: 'sd_xl_base_1.0.safetensors',
        },
        class_type: 'CheckpointLoaderSimple',
      },
      '3': {
        inputs: {
          text: `${description}. ${style} style, cinematic lighting, professional art direction`,
          clip: ['1', 1],
        },
        class_type: 'CLIPTextEncode(Prompt)',
      },
      '4': {
        inputs: {
          text: 'blurry, low quality, bad anatomy',
          clip: ['1', 1],
        },
        class_type: 'CLIPTextEncode(Prompt)',
      },
      '5': {
        inputs: {
          seed: 8566257,
          steps: 20,
          cfg: 7,
          sampler_name: 'euler',
          scheduler: 'normal',
          denoise: 1,
          model: ['1', 0],
          positive: ['3', 0],
          negative: ['4', 0],
          latent_image: ['7', 0],
        },
        class_type: 'KSampler',
      },
    };
  }
}
