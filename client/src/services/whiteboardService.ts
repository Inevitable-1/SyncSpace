import api from './api';
import { demo } from './demo';
import { getWhiteboardForRoom, demoUser } from '../data/demoData';
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
    return demo(
      () => api.get(`/whiteboards/${roomId}`).then((response) => response.data.data.whiteboard),
      () => getWhiteboardForRoom(roomId),
    );
  },

  async saveWhiteboard(roomId: string, objects: WhiteboardObject[]): Promise<WhiteboardData> {
    return demo(
      () =>
        api
          .put(`/whiteboards/${roomId}`, { objects })
          .then((response) => response.data.data.whiteboard),
      () => ({
        _id: `wb-${roomId}`,
        roomId,
        objects,
        createdBy: demoUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  },
};
