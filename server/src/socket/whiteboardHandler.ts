import type { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { logger } from '../utils/logger.js';

interface CursorData {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

interface RoomState {
  objects: Record<string, unknown>[];
  users: Map<string, { userId: string; userName: string; color: string }>;
  undoStack: Record<string, unknown>[][];
  redoStack: Record<string, unknown>[][];
}

const rooms = new Map<string, RoomState>();

const CURSOR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F1948A',
  '#82E0AA',
];

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      objects: [],
      users: new Map(),
      undoStack: [],
      redoStack: [],
    });
  }
  return rooms.get(roomId)!;
}

export function initializeSocketHandlers(io: Server): void {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Whiteboard client connected: ${socket.id}`);

    socket.on('join-room', async (data: { roomId: string; userName: string }) => {
      const { roomId, userName } = data;
      socket.join(roomId);

      const room = getRoom(roomId);
      const colorIndex = room.users.size % CURSOR_COLORS.length;
      const userColor = CURSOR_COLORS[colorIndex];

      room.users.set(socket.id, {
        userId: socket.data.userId as string,
        userName,
        color: userColor,
      });

      // Load saved whiteboard state
      try {
        const WhiteboardModel = (await import('../models/Whiteboard.js')).Whiteboard;
        const saved = await WhiteboardModel.findOne({ roomId });
        if (saved && room.objects.length === 0) {
          room.objects = saved.objects as unknown as Record<string, unknown>[];
        }
      } catch {
        // Continue without saved state
      }

      socket.emit('room-joined', {
        objects: room.objects,
        users: Array.from(room.users.entries()).map(([id, u]) => ({
          socketId: id,
          ...u,
        })),
      });

      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userId: socket.data.userId,
        userName,
        color: userColor,
      });

      logger.info(`${userName} joined room ${roomId}`);
    });

    socket.on('leave-room', (data: { roomId: string }) => {
      const { roomId } = data;
      handleLeaveRoom(socket, roomId);
    });

    socket.on('draw', (data: { roomId: string; object: Record<string, unknown> }) => {
      const { roomId, object } = data;
      const room = getRoom(roomId);

      room.objects.push(object);
      room.undoStack.push([...room.objects]);
      room.redoStack = [];

      socket.to(roomId).emit('object-added', { object });
    });

    socket.on('update-object', (data: { roomId: string; object: Record<string, unknown> }) => {
      const { roomId, object } = data;
      const room = getRoom(roomId);

      const index = room.objects.findIndex(
        (o) => (o as Record<string, unknown>).id === (object as Record<string, unknown>).id,
      );
      if (index !== -1) {
        room.objects[index] = object;
        room.undoStack.push([...room.objects]);
        room.redoStack = [];
      }

      socket.to(roomId).emit('object-updated', { object });
    });

    socket.on('delete-object', (data: { roomId: string; objectId: string }) => {
      const { roomId, objectId } = data;
      const room = getRoom(roomId);

      room.objects = room.objects.filter((o) => (o as Record<string, unknown>).id !== objectId);
      room.undoStack.push([...room.objects]);
      room.redoStack = [];

      socket.to(roomId).emit('object-deleted', { objectId });
    });

    socket.on('cursor-move', (data: { roomId: string; x: number; y: number }) => {
      const { roomId, x, y } = data;
      const room = getRoom(roomId);
      const user = room.users.get(socket.id);

      if (user) {
        const cursorData: CursorData = {
          socketId: socket.id,
          userId: user.userId,
          userName: user.userName,
          color: user.color,
          x,
          y,
        };
        socket.to(roomId).emit('cursor-update', cursorData);
      }
    });

    socket.on('undo', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (room.undoStack.length > 0) {
        const previousState = room.undoStack.pop()!;
        room.redoStack.push([...room.objects]);
        room.objects = previousState;

        io.to(roomId).emit('canvas-state', { objects: room.objects });
      }
    });

    socket.on('redo', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (room.redoStack.length > 0) {
        const nextState = room.redoStack.pop()!;
        room.undoStack.push([...room.objects]);
        room.objects = nextState;

        io.to(roomId).emit('canvas-state', { objects: room.objects });
      }
    });

    socket.on('clear-canvas', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      room.objects = [];
      room.undoStack = [];
      room.redoStack = [];

      io.to(roomId).emit('canvas-cleared');
    });

    socket.on('save-whiteboard', async (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      try {
        const WhiteboardModel = (await import('../models/Whiteboard.js')).Whiteboard;
        await WhiteboardModel.findOneAndUpdate(
          { roomId },
          { objects: room.objects },
          { upsert: true, new: true },
        );
        socket.emit('whiteboard-saved', { success: true });
      } catch (error) {
        logger.error('Failed to save whiteboard:', error);
        socket.emit('whiteboard-saved', { success: false });
      }
    });

    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          handleLeaveRoom(socket, roomId);
        }
      });
      logger.info(`Whiteboard client disconnected: ${socket.id}`);
    });
  });
}

function handleLeaveRoom(socket: Socket, roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  if (user) {
    socket.to(roomId).emit('user-left', { socketId: socket.id });
    room.users.delete(socket.id);

    socket.leave(roomId);
    logger.info(`${user.userName} left room ${roomId}`);

    if (room.users.size === 0) {
      rooms.delete(roomId);
    }
  }
}
