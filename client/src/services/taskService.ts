import api from './api';
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

export const taskService = {
  async getTasksByWorkspace(workspaceId: string): Promise<Task[]> {
    const { data } = await api.get(`/tasks/workspace/${workspaceId}`);
    return data.data.tasks;
  },

  async getTask(taskId: string): Promise<Task> {
    const { data } = await api.get(`/tasks/${taskId}`);
    return data.data.task;
  },

  async createTask(payload: CreateTaskRequest): Promise<Task> {
    const { data } = await api.post('/tasks', payload);
    return data.data.task;
  },

  async updateTask(taskId: string, payload: UpdateTaskRequest): Promise<Task> {
    const { data } = await api.put(`/tasks/${taskId}`, payload);
    return data.data.task;
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },
};
