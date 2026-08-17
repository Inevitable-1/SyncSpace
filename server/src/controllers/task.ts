import type { Response } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { TaskComment } from '../models/TaskComment.js';
import { Member } from '../models/Member.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from './activity.js';

async function assertWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  const member = await Member.findOne({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
  });
  if (!member) {
    throw new AppError('You are not a member of this workspace', 403);
  }
}

export async function getTask(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const taskId = String(req.params.id);
  const task = await Task.findById(taskId)
    .populate('creator', 'name email avatar')
    .populate('assignee', 'name email avatar');

  if (!task || task.isDeleted) {
    throw new AppError('Task not found', 404);
  }

  await assertWorkspaceMember(String(task.workspace), req.user.userId);

  res.json({ success: true, data: { task } });
}

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, status } = req.query;

  if (!workspaceId) {
    throw new AppError('workspaceId query parameter is required', 400);
  }

  const query: Record<string, unknown> = {
    workspace: new mongoose.Types.ObjectId(String(workspaceId)),
    isDeleted: false,
  };

  if (status && typeof status === 'string') {
    query.status = status;
  }

  const tasks = await Task.find(query)
    .populate('creator', 'name email avatar')
    .populate('assignee', 'name email avatar')
    .sort({ order: 1, createdAt: -1 });

  res.json({ success: true, data: { tasks } });
}

export async function getTasksByWorkspace(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaceId = String(req.params.workspaceId);
  const { status } = req.query;

  const query: Record<string, unknown> = {
    workspace: new mongoose.Types.ObjectId(workspaceId),
    isDeleted: false,
  };

  if (status && typeof status === 'string') {
    query.status = status;
  }

  const tasks = await Task.find(query)
    .populate('creator', 'name email avatar')
    .populate('assignee', 'name email avatar')
    .sort({ order: 1, createdAt: -1 });

  res.json({ success: true, data: { tasks } });
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { title, description, workspace, room, assignee, status, priority, labels, dueDate } =
    req.body;

  if (!title || !workspace) {
    throw new AppError('Title and workspace are required', 400);
  }

  const task = await Task.create({
    title: title.trim(),
    description: description || '',
    workspace: new mongoose.Types.ObjectId(workspace),
    room: room ? new mongoose.Types.ObjectId(room) : undefined,
    creator: new mongoose.Types.ObjectId(req.user.userId),
    assignee: assignee ? new mongoose.Types.ObjectId(assignee) : undefined,
    status: status || 'todo',
    priority: priority || 'medium',
    labels: labels || [],
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  const populated = await task.populate('creator', 'name email avatar');

  await logActivity({
    userId: req.user.userId,
    action: 'created task',
    entityType: 'task',
    entityId: String(task._id),
    entityName: title,
  });

  res.status(201).json({ success: true, data: { task: populated } });
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const taskId = String(req.params.id);
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new AppError('Task not found', 404);
  }

  const { title, description, room, assignee, status, priority, labels, dueDate } = req.body;

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (room !== undefined) task.room = room ? new mongoose.Types.ObjectId(room) : undefined;
  if (assignee !== undefined)
    task.assignee = assignee ? new mongoose.Types.ObjectId(assignee) : undefined;
  if (priority !== undefined) task.priority = priority;
  if (labels !== undefined) task.labels = labels;
  if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;

  const statusChanged = status !== undefined && status !== task.status;
  if (status !== undefined) {
    task.status = status;
  }

  await task.save();

  const populated = await task.populate('creator', 'name email avatar');

  await logActivity({
    userId: req.user.userId,
    action: 'updated task',
    entityType: 'task',
    entityId: String(task._id),
    entityName: task.title,
  });

  if (statusChanged && task.status === 'completed') {
    await logActivity({
      userId: req.user.userId,
      action: 'completed task',
      entityType: 'task',
      entityId: String(task._id),
      entityName: task.title,
    });
  }

  res.json({ success: true, data: { task: populated } });
}

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const taskId = String(req.params.id);
  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new AppError('Task not found', 404);
  }

  task.isDeleted = true;
  task.deletedAt = new Date();
  await task.save();

  await logActivity({
    userId: req.user.userId,
    action: 'deleted task',
    entityType: 'task',
    entityId: String(task._id),
    entityName: task.title,
  });

  res.json({ success: true, message: 'Task deleted' });
}

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const taskId = String(req.params.id);
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new AppError('Comment content is required', 400);
  }

  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new AppError('Task not found', 404);
  }

  const comment = await TaskComment.create({
    task: new mongoose.Types.ObjectId(taskId),
    author: new mongoose.Types.ObjectId(req.user.userId),
    content: content.trim(),
  });

  const populated = await comment.populate('author', 'name email avatar');

  await logActivity({
    userId: req.user.userId,
    action: 'added task comment',
    entityType: 'task',
    entityId: String(task._id),
    entityName: task.title,
  });

  res.status(201).json({ success: true, data: { comment: populated } });
}

export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const taskId = String(req.params.id);

  const task = await Task.findById(taskId);

  if (!task || task.isDeleted) {
    throw new AppError('Task not found', 404);
  }

  const comments = await TaskComment.find({
    task: new mongoose.Types.ObjectId(taskId),
    isDeleted: false,
  })
    .populate('author', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { comments } });
}
