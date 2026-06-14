import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TTSProvider {
  name: string;
  isAvailable: boolean;
  synthesize(text: string, voiceId: string): Promise<string>;
}

@Injectable()
export class TTSService {
  private logger = new Logger('TTSService');
  private providers: TTSProvider[] = [];

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Azure
    this.providers.push({
      name: 'azure',
      isAvailable: !!this.configService.get('AZURE_SPEECH_KEY'),
      synthesize: (text, voiceId) => this.synthesizeWithAzure(text, voiceId),
    });

    // 阿里云
    this.providers.push({
      name: 'aliyun',
      isAvailable: !!this.configService.get('ALIYUN_TTS_APPID'),
      synthesize: (text, voiceId) => this.synthesizeWithAliyun(text, voiceId),
    });

    // 本地 TTS
    this.providers.push({
      name: 'local',
      isAvailable: true,
      synthesize: (text, voiceId) => this.synthesizeWithLocal(text, voiceId),
    });
  }

  /**
   * 合成语音 - 自动切换提供商
   */
  async synthesize(text: string, voiceId: string = 'default'): Promise<string> {
    for (const provider of this.providers) {
      try {
        if (provider.isAvailable) {
          this.logger.debug(`使用 ${provider.name} 合成语音`);
          const audioUrl = await provider.synthesize(text, voiceId);
          return audioUrl;
        }
      } catch (error) {
        this.logger.warn(`${provider.name} 失败，尝试下一个提供商`);
      }
    }

    throw new Error('所有 TTS 提供商都不可用');
  }

  /**
   * 使用 Azure 合成
   */
  private async synthesizeWithAzure(text: string, voiceId: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://${this.configService.get('AZURE_SPEECH_REGION', 'eastasia')}.tts.speech.microsoft.com/cognitiveservices/v1`,
        `<speak version="1.0" xml:lang="zh-CN">
          <voice name="${voiceId || 'zh-CN-YunxiNeural'}">
            ${text}
          </voice>
        </speak>`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.configService.get('AZURE_SPEECH_KEY'),
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          },
        },
      );

      // Azure 返回音频二进制数据，需要上传到存储
      return 'audio_url_from_azure';
    } catch (error) {
      this.logger.error('Azure TTS 失败', error.message);
      throw error;
    }
  }

  /**
   * 使用阿里云合成
   */
  private async synthesizeWithAliyun(text: string, voiceId: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://nls-gateway.aliyuncs.com/stream/v1/tts',
        {
          appid: this.configService.get('ALIYUN_TTS_APPID'),
          text: text,
          voice: voiceId || 'xiaoyun',
          format: 'mp3',
        },
        {
          headers: {
            'X-NLS-Token': this.configService.get('ALIYUN_TTS_ACCESS_KEY'),
          },
        },
      );

      return response.data.audio_url || '';
    } catch (error) {
      this.logger.error('阿里云 TTS 失败', error.message);
      throw error;
    }
  }

  /**
   * 使用本地 TTS 合成
   */
  private async synthesizeWithLocal(text: string, voiceId: string): Promise<string> {
    try {
      const response = await axios.post(
        'http://localhost:5002/api/tts',
        {
          text: text,
          speaker_idx: voiceId || '0',
        },
      );

      return response.data.audio_url || '';
    } catch (error) {
      this.logger.error('本地 TTS 失败', error.message);
      throw error;
    }
  }

  /**
   * 批量合成 - 为多个角色的台词生成语音
   */
  async batchSynthesize(
    dialogues: Array<{ characterId: string; text: string; voiceId: string }>,
  ): Promise<Array<{ characterId: string; audioUrl: string }>> {
    return Promise.all(
      dialogues.map(async (dialogue) => ({
        characterId: dialogue.characterId,
        audioUrl: await this.synthesize(dialogue.text, dialogue.voiceId),
      })),
    );
  }
}
