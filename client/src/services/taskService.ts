import api from './api';
import { demo, noop } from './demo';
import { getTasksForWorkspace, demoTasks, demoUser } from '../data/demoData';
import type { Task, TaskStatus, TaskPriority } from '../types';

interface CreateTaskRequest {
  title: string;
  description?: string;
  workspace: string;
  room?: string;
  assignee?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  dueDate?: string;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  labels?: string[];
  dueDate?: string | null;
  checklist?: { text: string; done: boolean }[];
  order?: number;
}

function buildDemoTask(payload: CreateTaskRequest): Task {
  const nowIso = new Date().toISOString();
  return {
    _id: `task-demo-${Date.now()}`,
    title: payload.title,
    description: payload.description || '',
    workspace: payload.workspace,
    room: payload.room,
    creator: demoUser,
    assignee: demoUser,
    status: payload.status || 'todo',
    priority: payload.priority || 'medium',
    labels: payload.labels || [],
    dueDate: payload.dueDate,
    checklist: [],
    order: 0,
    isDeleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export const taskService = {
  async getTasksByWorkspace(workspaceId: string): Promise<Task[]> {
    return demo(
      () => api.get(`/tasks/workspace/${workspaceId}`).then(({ data }) => data.data.tasks),
      () => getTasksForWorkspace(workspaceId),
    );
  },

  async getTask(taskId: string): Promise<Task> {
    return demo(
      () => api.get(`/tasks/${taskId}`).then(({ data }) => data.data.task),
      () => demoTasks.find((t) => t._id === taskId) || demoTasks[0],
    );
  },

  async createTask(payload: CreateTaskRequest): Promise<Task> {
    return demo(
      () => api.post('/tasks', payload).then(({ data }) => data.data.task),
      () => buildDemoTask(payload),
    );
  },

  async updateTask(taskId: string, payload: UpdateTaskRequest): Promise<Task> {
    return demo(
      () => api.put(`/tasks/${taskId}`, payload).then(({ data }) => data.data.task),
      () => {
        const task = demoTasks.find((t) => t._id === taskId) || demoTasks[0];
        return { ...task, ...payload, updatedAt: new Date().toISOString() };
      },
    );
  },

  async deleteTask(taskId: string): Promise<void> {
    await noop(() => api.delete(`/tasks/${taskId}`));
  },
};
