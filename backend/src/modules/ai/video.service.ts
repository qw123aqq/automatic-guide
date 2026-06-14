import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class VideoService {
  private logger = new Logger('VideoService');

  constructor(private configService: ConfigService) {}

  /**
   * 生成视频 - 自动选择提供商
   */
  async generateVideo(
    shots: any[],
    resolution: '720p' | '1080p' = '720p',
    style: string = 'default',
  ): Promise<string> {
    // 如果要求 1080p 且有 Seedance API
    if (
      resolution === '1080p' &&
      this.configService.get('SEEDANCE_API_KEY')
    ) {
      try {
        return await this.generateWithSeedance(shots, resolution, style);
      } catch (error) {
        this.logger.warn('Seedance 生成失败，降级到本地 FFmpeg');
      }
    }

    // 本地 FFmpeg (支持 720p)
    try {
      return await this.generateWithFFmpeg(shots, resolution, style);
    } catch (error) {
      this.logger.error('视频生成完全失败', error);
      throw error;
    }
  }

  /**
   * 使用 Seedance 2.0 生成高质量视频 (付费)
   */
  private async generateWithSeedance(
    shots: any[],
    resolution: string,
    style: string,
  ): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.seedance.io/v1/generate',
        {
          model: 'seedance-2.0',
          images: shots.map((s) => s.imageUrl),
          resolution: resolution,
          fps: 24,
          style: style,
          enhance_quality: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('SEEDANCE_API_KEY')}`,
          },
          timeout: 300000,
        },
      );

      return response.data.video_url || '';
    } catch (error) {
      this.logger.error('Seedance 生成失败', error.message);
      throw error;
    }
  }

  /**
   * 使用本地 FFmpeg 生成视频
   */
  private async generateWithFFmpeg(
    shots: any[],
    resolution: string,
    style: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = this.configService.get('FFMPEG_PATH', 'ffmpeg');
      const outputFile = path.join(
        '/tmp',
        `video_${Date.now()}.mp4`,
      );

      // 构建 FFmpeg 命令
      const args = this.buildFFmpegArgs(shots, resolution, outputFile);

      const ffmpeg = spawn(ffmpegPath, args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          this.logger.log(`视频生成成功: ${outputFile}`);
          resolve(outputFile);
        } else {
          reject(new Error(`FFmpeg 生成失败，退出代码: ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        this.logger.error('FFmpeg 进程错误', error);
        reject(error);
      });
    });
  }

  /**
   * 构建 FFmpeg 命令行参数
   */
  private buildFFmpegArgs(
    shots: any[],
    resolution: string,
    outputFile: string,
  ): string[] {
    const args: string[] = ['-y'];

    // 输入文件
    shots.forEach((shot) => {
      args.push('-i', shot.imageUrl);
    });

    // 视频编码参数
    const resolutionMap = {
      '720p': '1280:720',
      '1080p': '1920:1080',
    };

    args.push(
      '-c:v',
      'libx264',
      '-vf',
      `scale=${resolutionMap[resolution]},fps=24`,
      '-preset',
      'medium',
      '-crf',
      '23',
      outputFile,
    );

    return args;
  }

  /**
   * 生成视频缩略图
   */
  async generateThumbnail(videoPath: string, timestamp: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = this.configService.get('FFMPEG_PATH', 'ffmpeg');
      const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');

      const args = [
        '-i',
        videoPath,
        '-ss',
        timestamp.toString(),
        '-vframes',
        '1',
        '-vf',
        'scale=320:-1',
        thumbnailPath,
      ];

      const ffmpeg = spawn(ffmpegPath, args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(thumbnailPath);
        } else {
          reject(new Error('缩略图生成失败'));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }
}
