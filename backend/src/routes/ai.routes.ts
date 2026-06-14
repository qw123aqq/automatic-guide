import express, { Router } from 'express';
import { LLMService } from '../services/llm.service';

export const aiRouter = Router();
const llmService = new LLMService();

/**
 * 生成故事大纲
 * POST /api/ai/generate-outline
 */
aiRouter.post('/generate-outline', async (req, res) => {
  try {
    const { story, episodeCount } = req.body;

    if (!story || !episodeCount) {
      return res.status(400).json({
        error: '缺少必要参数: story, episodeCount',
      });
    }

    console.log(`📝 生成故事大纲 - 集数: ${episodeCount}`);

    const outline = await llmService.generateStoryOutline(story, episodeCount);

    res.json({
      success: true,
      data: outline,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('生成大纲失败:', error.message);
    res.status(500).json({
      error: '生成大纲失败: ' + error.message,
    });
  }
});

/**
 * 生成剧本
 * POST /api/ai/generate-script
 */
aiRouter.post('/generate-script', async (req, res) => {
  try {
    const { storyOutline, characters, sceneDescription } = req.body;

    if (!storyOutline) {
      return res.status(400).json({
        error: '缺少必要参数: storyOutline',
      });
    }

    console.log('📖 生成剧本');

    const script = await llmService.generateScript(
      storyOutline,
      characters || [],
      sceneDescription || '',
    );

    res.json({
      success: true,
      data: script,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('生成剧本失败:', error.message);
    res.status(500).json({
      error: '生成剧本失败: ' + error.message,
    });
  }
});

/**
 * 优化文本
 * POST /api/ai/optimize-text
 */
aiRouter.post('/optimize-text', async (req, res) => {
  try {
    const { text, type } = req.body; // type: 'dialogue' | 'description'

    if (!text) {
      return res.status(400).json({
        error: '缺少必要参数: text',
      });
    }

    console.log(`✨ 优化文本 - 类型: ${type}`);

    const optimized = await llmService.optimizeText(text, type);

    res.json({
      success: true,
      data: { original: text, optimized },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('优化文本失败:', error.message);
    res.status(500).json({
      error: '优化文本失败: ' + error.message,
    });
  }
});

/**
 * 测试 AI 连接
 * GET /api/ai/test
 */
aiRouter.get('/test', async (req, res) => {
  try {
    const result = await llmService.testConnection();
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: '测试失败: ' + error.message,
    });
  }
});

/**
 * 获取可用的 AI 模型列表
 * GET /api/ai/providers
 */
aiRouter.get('/providers', (req, res) => {
  const providers = llmService.getAvailableProviders();
  res.json({
    success: true,
    data: providers,
    timestamp: new Date().toISOString(),
  });
});
