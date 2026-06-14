import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { ImageService } from './image.service';
import { VideoService } from './video.service';
import { TTSService } from './tts.service';

@Module({
  providers: [LLMService, ImageService, VideoService, TTSService],
  exports: [LLMService, ImageService, VideoService, TTSService],
})
export class AiModule {}
