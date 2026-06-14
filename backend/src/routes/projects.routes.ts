import express, { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const projectRouter = Router();

// 内存存储 (实际项目使用数据库)
const projects: any[] = [];

/**
 * 创建项目
 * POST /api/projects
 */
projectRouter.post('/', (req, res) => {
  try {
    const { title, description, creationType } = req.body;

    if (!title) {
      return res.status(400).json({ error: '缺少项目标题' });
    }

    const project = {
      id: uuidv4(),
      title,
      description: description || '',
      creationType: creationType || 'story', // story | script | idea
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        aspectRatio: '16:9',
        episodeDuration: '2-3min',
        visualStyle: 'default',
        totalEpisodes: 10,
      },
      episodes: [],
    };

    projects.push(project);

    console.log(`✅ 项目创建成功: ${project.id}`);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取所有项目
 * GET /api/projects
 */
projectRouter.get('/', (req, res) => {
  res.json({
    success: true,
    data: projects,
    total: projects.length,
  });
});

/**
 * 获取单个项目
 * GET /api/projects/:id
 */
projectRouter.get('/:id', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }

  res.json({
    success: true,
    data: project,
  });
});

/**
 * 更新项目
 * PUT /api/projects/:id
 */
projectRouter.put('/:id', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }

  Object.assign(project, req.body, {
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ 项目更新成功: ${project.id}`);

  res.json({
    success: true,
    data: project,
  });
});

/**
 * 删除项目
 * DELETE /api/projects/:id
 */
projectRouter.delete('/:id', (req, res) => {
  const index = projects.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: '项目不存在' });
  }

  const deleted = projects.splice(index, 1)[0];

  console.log(`✅ 项目删除成功: ${deleted.id}`);

  res.json({
    success: true,
    message: '项目已删除',
    data: deleted,
  });
});
