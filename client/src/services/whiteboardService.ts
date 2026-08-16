import api from './api';
import type { WhiteboardObject } from '../types';

export interface WhiteboardData {
  _id: string;
  roomId: string;
  objects: WhiteboardObject[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const whiteboardService = {
  async getWhiteboard(roomId: string): Promise<WhiteboardData> {
    const { data } = await api.get(`/whiteboards/${roomId}`);
    return data.data.whiteboard as WhiteboardData;
  },

  async saveWhiteboard(roomId: string, objects: WhiteboardObject[]): Promise<WhiteboardData> {
    const { data } = await api.put(`/whiteboards/${roomId}`, { objects });
    return data.data.whiteboard as WhiteboardData;
  },
};
