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
    logger.info(`Client connected: ${socket.id}`);

    // ==================== WHITEBOARD EVENTS ====================

    socket.on('join-room', async (data: { roomId: string; userName: string }) => {
      const { roomId, userName } = data;
      socket.join(`room:${roomId}`);
      socket.join(`chat:${roomId}`);

      const room = getRoom(roomId);
      const colorIndex = room.users.size % CURSOR_COLORS.length;
      const userColor = CURSOR_COLORS[colorIndex];

      room.users.set(socket.id, {
        userId: socket.data.userId as string,
        userName,
        color: userColor,
      });

      try {
        const WhiteboardModel = (await import('../models/Whiteboard.js')).Whiteboard;
        const saved = await WhiteboardModel.findOne({ roomId });
        if (saved && room.objects.length === 0) {
          room.objects = saved.objects as unknown as Record<string, unknown>[];
        }
      } catch {
        // Continue without saved state
      }

      try {
        const { RoomPresence } = await import('../models/RoomPresence.js');
        const { User } = await import('../models/User.js');
        const user = await User.findById(socket.data.userId).select('name email avatar');
        const userNameStr = user?.name || userName;
        const userAvatar = user?.avatar || '';

        await RoomPresence.findOneAndUpdate(
          { room: roomId, user: socket.data.userId },
          {
            socketId: socket.id,
            status: 'online',
            currentActivity: 'Viewing room',
            lastActiveAt: new Date(),
          },
          { upsert: true, new: true },
        );

        const allPresence = await RoomPresence.find({ room: roomId }).populate(
          'user',
          'name email avatar',
        );

        const presenceList = allPresence.map((p) => ({
          socketId: p.socketId,
          userId: (p.user as unknown as { _id: string })._id,
          userName: (p.user as unknown as { name: string }).name,
          userAvatar: (p.user as unknown as { avatar: string }).avatar || '',
          status: p.status,
          currentActivity: p.currentActivity,
          joinedAt: p.joinedAt,
        }));

        socket.emit('room-joined', {
          objects: room.objects,
          users: Array.from(room.users.entries()).map(([id, u]) => ({
            socketId: id,
            ...u,
          })),
          presence: presenceList,
        });

        socket.to(`room:${roomId}`).emit('user-joined', {
          socketId: socket.id,
          userId: socket.data.userId,
          userName: userNameStr,
          color: userColor,
          presence: {
            socketId: socket.id,
            userId: socket.data.userId,
            userName: userNameStr,
            userAvatar,
            status: 'online',
            currentActivity: 'Viewing room',
            joinedAt: new Date(),
          },
        });

        socket.to(`room:${roomId}`).emit('notification', {
          title: 'User Joined',
          message: `${userNameStr} joined the room`,
          type: 'info',
          entityType: 'room',
          entityId: roomId,
        });
      } catch (err) {
        logger.error('Error in join-room presence:', err);
        socket.emit('room-joined', {
          objects: room.objects,
          users: Array.from(room.users.entries()).map(([id, u]) => ({
            socketId: id,
            ...u,
          })),
          presence: [],
        });
      }

      logger.info(`${userName} joined room ${roomId}`);
    });

    socket.on('leave-room', (data: { roomId: string }) => {
      const { roomId } = data;
      handleLeaveRoom(socket, roomId);
    });

    // ==================== WHITEBOARD DRAWING ====================

    socket.on('draw', (data: { roomId: string; object: Record<string, unknown> }) => {
      const { roomId, object } = data;
      const room = getRoom(roomId);

      room.objects.push(object);
      room.undoStack.push([...room.objects]);
      room.redoStack = [];

      socket.to(`room:${roomId}`).emit('object-added', { object });
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

      socket.to(`room:${roomId}`).emit('object-updated', { object });
    });

    socket.on('delete-object', (data: { roomId: string; objectId: string }) => {
      const { roomId, objectId } = data;
      const room = getRoom(roomId);

      room.objects = room.objects.filter((o) => (o as Record<string, unknown>).id !== objectId);
      room.undoStack.push([...room.objects]);
      room.redoStack = [];

      socket.to(`room:${roomId}`).emit('object-deleted', { objectId });
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
        socket.to(`room:${roomId}`).emit('cursor-update', cursorData);
      }
    });

    socket.on('undo', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (room.undoStack.length > 0) {
        const previousState = room.undoStack.pop()!;
        room.redoStack.push([...room.objects]);
        room.objects = previousState;

        io.to(`room:${roomId}`).emit('canvas-state', { objects: room.objects });
      }
    });

    socket.on('redo', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (room.redoStack.length > 0) {
        const nextState = room.redoStack.pop()!;
        room.undoStack.push([...room.objects]);
        room.objects = nextState;

        io.to(`room:${roomId}`).emit('canvas-state', { objects: room.objects });
      }
    });

    socket.on('clear-canvas', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = getRoom(roomId);

      room.objects = [];
      room.undoStack = [];
      room.redoStack = [];

      io.to(`room:${roomId}`).emit('canvas-cleared');
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

    // ==================== CHAT EVENTS ====================

    socket.on(
      'send-message',
      async (data: { roomId: string; content: string; type?: string; replyTo?: string }) => {
        const { roomId, content, type, replyTo } = data;

        if (!content || !content.trim()) return;

        try {
          const chatModule = await import('../models/ChatMessage.js');
          const userModule = await import('../models/User.js');
          const ChatMessage = chatModule.ChatMessage;
          const User = userModule.User;

          const user = await User.findById(socket.data.userId).select('name email avatar');
          const userName = (user as { name?: string } | null)?.name || 'Unknown';
          const userAvatar = (user as { avatar?: string } | null)?.avatar || '';
          const userEmail = (user as { email?: string } | null)?.email || '';

          const msgType = (type || 'text') as 'text' | 'emoji' | 'system';

          const message = await ChatMessage.create({
            room: roomId,
            sender: socket.data.userId,
            content: content.trim(),
            type: msgType,
            replyTo: replyTo || undefined,
          });

          const messageDoc = message as unknown as {
            _id: string;
            createdAt: Date;
            updatedAt: Date;
          };

          const messageData = {
            _id: messageDoc._id,
            room: roomId,
            sender: {
              _id: socket.data.userId,
              name: userName,
              email: userEmail,
              avatar: userAvatar,
            },
            content: content.trim(),
            type: msgType,
            replyTo: replyTo || null,
            edited: false,
            isDeleted: false,
            seenBy: [socket.data.userId],
            createdAt: messageDoc.createdAt,
            updatedAt: messageDoc.updatedAt,
          };

          io.to(`chat:${roomId}`).emit('receive-message', messageData);

          io.to(`room:${roomId}`).emit('activity', {
            user: {
              _id: socket.data.userId,
              name: userName,
              avatar: userAvatar,
            },
            action: 'sent message',
            entityType: 'room',
            entityId: roomId,
            entityName: content.substring(0, 50),
            createdAt: new Date(),
          });
        } catch (err) {
          logger.error('Failed to send message:', err);
          socket.emit('message-error', { error: 'Failed to send message' });
        }
      },
    );

    socket.on(
      'edit-message',
      async (data: { messageId: string; content: string; roomId: string }) => {
        const { messageId, content, roomId } = data;

        if (!content || !content.trim()) return;

        try {
          const { ChatMessage } = await import('../models/ChatMessage.js');
          const { User } = await import('../models/User.js');

          const message = await ChatMessage.findById(messageId);
          if (!message) return;
          if (message.sender.toString() !== socket.data.userId) return;

          message.content = content.trim();
          message.edited = true;
          message.editedAt = new Date();
          await message.save();

          const user = await User.findById(socket.data.userId).select('name email avatar');

          io.to(`chat:${roomId}`).emit('message-edited', {
            _id: messageId,
            content: content.trim(),
            edited: true,
            editedAt: message.editedAt,
            sender: {
              _id: socket.data.userId,
              name: user?.name || 'Unknown',
              email: user?.email || '',
              avatar: user?.avatar || '',
            },
            roomId,
          });
        } catch (err) {
          logger.error('Failed to edit message:', err);
        }
      },
    );

    socket.on('delete-message', async (data: { messageId: string; roomId: string }) => {
      const { messageId, roomId } = data;

      try {
        const { ChatMessage } = await import('../models/ChatMessage.js');

        const message = await ChatMessage.findById(messageId);
        if (!message) return;
        if (message.sender.toString() !== socket.data.userId) return;

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        io.to(`chat:${roomId}`).emit('message-deleted', {
          messageId,
          roomId,
        });
      } catch (err) {
        logger.error('Failed to delete message:', err);
      }
    });

    socket.on('typing-start', async (data: { roomId: string }) => {
      try {
        const { RoomPresence } = await import('../models/RoomPresence.js');
        const { User } = await import('../models/User.js');

        await RoomPresence.findOneAndUpdate(
          { room: data.roomId, user: socket.data.userId },
          { status: 'typing', lastActiveAt: new Date() },
        );

        const user = await User.findById(socket.data.userId).select('name');
        socket.to(`room:${data.roomId}`).emit('user-typing', {
          userId: socket.data.userId,
          userName: user?.name || 'Unknown',
          roomId: data.roomId,
        });
      } catch {
        socket.to(`room:${data.roomId}`).emit('user-typing', {
          userId: socket.data.userId,
          userName: 'Unknown',
          roomId: data.roomId,
        });
      }
    });

    socket.on('typing-stop', async (data: { roomId: string }) => {
      try {
        const { RoomPresence } = await import('../models/RoomPresence.js');

        await RoomPresence.findOneAndUpdate(
          { room: data.roomId, user: socket.data.userId },
          { status: 'online', lastActiveAt: new Date() },
        );

        socket.to(`room:${data.roomId}`).emit('user-stopped-typing', {
          userId: socket.data.userId,
          roomId: data.roomId,
        });
      } catch {
        socket.to(`room:${data.roomId}`).emit('user-stopped-typing', {
          userId: socket.data.userId,
          roomId: data.roomId,
        });
      }
    });

    socket.on('mark-seen', async (data: { roomId: string }) => {
      try {
        const { ChatMessage } = await import('../models/ChatMessage.js');

        await ChatMessage.updateMany(
          {
            room: data.roomId,
            sender: { $ne: socket.data.userId },
            seenBy: { $ne: socket.data.userId },
          },
          { $addToSet: { seenBy: socket.data.userId } },
        );

        io.to(`chat:${data.roomId}`).emit('messages-seen', {
          userId: socket.data.userId,
          roomId: data.roomId,
        });
      } catch (err) {
        logger.error('Failed to mark seen:', err);
      }
    });

    // ==================== PRESENCE EVENTS ====================

    socket.on('update-activity', async (data: { roomId: string; activity: string }) => {
      try {
        const { RoomPresence } = await import('../models/RoomPresence.js');
        const { User } = await import('../models/User.js');

        await RoomPresence.findOneAndUpdate(
          { room: data.roomId, user: socket.data.userId },
          { currentActivity: data.activity, lastActiveAt: new Date() },
        );

        const user = await User.findById(socket.data.userId).select('name');
        socket.to(`room:${data.roomId}`).emit('presence-updated', {
          userId: socket.data.userId,
          userName: user?.name || 'Unknown',
          currentActivity: data.activity,
          roomId: data.roomId,
        });
      } catch (err) {
        logger.error('Failed to update activity:', err);
      }
    });

    // ==================== NOTIFICATION EVENTS ====================

    socket.on(
      'send-notification',
      async (data: {
        targetUserId: string;
        title: string;
        message: string;
        type?: string;
        entityType?: string;
        entityId?: string;
      }) => {
        try {
          const notifModule = await import('../models/Notification.js');
          const Notification = notifModule.Notification;

          const notifType = (data.type || 'info') as 'info' | 'success' | 'warning' | 'error';
          const notifEntityType = data.entityType as
            'workspace' | 'room' | 'member' | 'invite' | 'activity' | undefined;

          const notification = await Notification.create({
            user: data.targetUserId,
            title: data.title,
            message: data.message,
            type: notifType,
            entityType: notifEntityType,
            entityId: data.entityId,
          });

          const notifDoc = notification as unknown as {
            _id: string;
            title: string;
            message: string;
            type: string;
            entityType?: string;
            entityId?: string;
            createdAt: Date;
          };

          io.to(`user:${data.targetUserId}`).emit('notification', {
            _id: notifDoc._id,
            title: notifDoc.title,
            message: notifDoc.message,
            type: notifDoc.type,
            entityType: notifDoc.entityType,
            entityId: notifDoc.entityId,
            isRead: false,
            createdAt: notifDoc.createdAt,
          });
        } catch (err) {
          logger.error('Failed to send notification:', err);
        }
      },
    );

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          handleLeaveRoom(socket, roomId);
        }
      });
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}

async function handleLeaveRoom(socket: Socket, roomId: string): Promise<void> {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  if (user) {
    try {
      const { RoomPresence } = await import('../models/RoomPresence.js');
      const { User } = await import('../models/User.js');

      const userData = await User.findById(socket.data.userId).select('name avatar');
      const userName = userData?.name || user.userName;

      await RoomPresence.findOneAndDelete({ room: roomId, user: socket.data.userId });

      socket.to(`room:${roomId}`).emit('user-left', {
        socketId: socket.id,
        userId: socket.data.userId,
        userName,
      });

      socket.to(`room:${roomId}`).emit('user-stopped-typing', {
        userId: socket.data.userId,
        roomId,
      });

      socket.to(`room:${roomId}`).emit('notification', {
        title: 'User Left',
        message: `${userName} left the room`,
        type: 'info',
        entityType: 'room',
        entityId: roomId,
      });
    } catch (err) {
      logger.error('Error in leave-room cleanup:', err);
      socket.to(`room:${roomId}`).emit('user-left', {
        socketId: socket.id,
        userId: socket.data.userId,
        userName: user.userName,
      });
    }

    room.users.delete(socket.id);

    socket.leave(`room:${roomId}`);
    socket.leave(`chat:${roomId}`);

    logger.info(`${user.userName} left room ${roomId}`);

    if (room.users.size === 0) {
      rooms.delete(roomId);
    }
  }
}
