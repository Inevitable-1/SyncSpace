import type { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';

interface EditorUser {
  userId: string;
  userName: string;
  color: string;
  cursor: { line: number; column: number } | null;
  selection: { startLine: number; startColumn: number; endLine: number; endColumn: number } | null;
  fileName: string;
}

interface EditorRoomState {
  documents: Map<string, string>;
  users: Map<string, EditorUser>;
}

const editorRooms = new Map<string, EditorRoomState>();

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
  '#F0B27A',
  '#AED6F1',
  '#A3E4D7',
];

function getEditorRoom(roomId: string): EditorRoomState {
  if (!editorRooms.has(roomId)) {
    editorRooms.set(roomId, {
      documents: new Map(),
      users: new Map(),
    });
  }
  return editorRooms.get(roomId)!;
}

export function initializeEditorHandlers(io: Server): void {
  io.on('connection', (socket) => {
    socket.on('editor-join', (data: { roomId: string; userName: string }) => {
      const { roomId, userName } = data;
      const userId = socket.data.userId as string;

      socket.join(`editor:${roomId}`);

      const room = getEditorRoom(roomId);
      const colorIndex = room.users.size % CURSOR_COLORS.length;
      const userColor = CURSOR_COLORS[colorIndex];

      const editorUser: EditorUser = {
        userId,
        userName,
        color: userColor,
        cursor: null,
        selection: null,
        fileName: '',
      };

      room.users.set(socket.id, editorUser);

      const existingDocs: Record<string, string> = {};
      room.documents.forEach((content, fileName) => {
        existingDocs[fileName] = content;
      });

      const usersList = Array.from(room.users.entries()).map(([id, u]) => ({
        socketId: id,
        ...u,
      }));

      socket.emit('editor-joined', {
        documents: existingDocs,
        users: usersList,
      });

      socket.to(`editor:${roomId}`).emit('editor-user-joined', {
        socketId: socket.id,
        ...editorUser,
      });

      logger.info(`${userName} joined editor room ${roomId}`);
    });

    socket.on('editor-leave', (data: { roomId: string }) => {
      const { roomId } = data;
      handleEditorLeave(socket, roomId);
    });

    socket.on(
      'code-change',
      (data: {
        roomId: string;
        fileName: string;
        content: string;
        cursor: { line: number; column: number };
      }) => {
        const { roomId, fileName, content, cursor } = data;
        const room = getEditorRoom(roomId);

        room.documents.set(fileName, content);

        const user = room.users.get(socket.id);
        if (user) {
          user.cursor = cursor;
          user.fileName = fileName;
        }

        socket.to(`editor:${roomId}`).emit('code-change', {
          socketId: socket.id,
          userId: socket.data.userId,
          fileName,
          content,
          cursor,
        });
      },
    );

    socket.on(
      'cursor-update',
      (data: { roomId: string; cursor: { line: number; column: number }; fileName: string }) => {
        const { roomId, cursor, fileName } = data;
        const room = getEditorRoom(roomId);
        const user = room.users.get(socket.id);

        if (user) {
          user.cursor = cursor;
          user.fileName = fileName;
        }

        socket.to(`editor:${roomId}`).emit('cursor-update', {
          socketId: socket.id,
          userId: socket.data.userId,
          userName: user?.userName || 'Unknown',
          color: user?.color || '#999',
          cursor,
          fileName,
        });
      },
    );

    socket.on(
      'selection-update',
      (data: {
        roomId: string;
        selection: { startLine: number; startColumn: number; endLine: number; endColumn: number };
        fileName: string;
      }) => {
        const { roomId, selection, fileName } = data;
        const room = getEditorRoom(roomId);
        const user = room.users.get(socket.id);

        if (user) {
          user.selection = selection;
          user.fileName = fileName;
        }

        socket.to(`editor:${roomId}`).emit('selection-update', {
          socketId: socket.id,
          userId: socket.data.userId,
          userName: user?.userName || 'Unknown',
          color: user?.color || '#999',
          selection,
          fileName,
        });
      },
    );

    socket.on(
      'save-document',
      async (data: { roomId: string; fileName: string; content: string }) => {
        const { roomId, fileName, content } = data;

        try {
          const { CodeDocument } = await import('../models/CodeDocument.js');

          const doc = await CodeDocument.findOne({
            room: roomId,
            path: fileName.startsWith('/') ? fileName : `/${fileName}`,
            isDeleted: { $ne: true },
          });

          if (doc) {
            doc.content = content;
            doc.lastEditedBy = socket.data.userId;
            doc.versionTimestamps.push(new Date());
            await doc.save();
          } else {
            const lastSlash = fileName.lastIndexOf('/');
            const dirPath = lastSlash > 0 ? fileName.substring(0, lastSlash) : '/';
            const baseName = lastSlash > 0 ? fileName.substring(lastSlash + 1) : fileName;

            await CodeDocument.create({
              name: baseName,
              path: fileName.startsWith('/') ? fileName : `/${fileName}`,
              content,
              room: roomId,
              workspace: (doc as unknown as { workspace?: string })?.workspace || roomId,
              createdBy: socket.data.userId,
              lastEditedBy: socket.data.userId,
              parentPath: dirPath,
              versionTimestamps: [new Date()],
            });
          }

          socket.emit('document-saved', {
            fileName,
            success: true,
            timestamp: new Date().toISOString(),
          });

          io.to(`editor:${roomId}`).emit('document-saved-notification', {
            fileName,
            savedBy: socket.data.userId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.error('Failed to save document:', error);
          socket.emit('document-saved', {
            fileName,
            success: false,
            error: 'Failed to save to database',
          });
        }
      },
    );

    socket.on('sync-document', (data: { roomId: string; fileName: string }) => {
      const { roomId, fileName } = data;
      const room = getEditorRoom(roomId);
      const content = room.documents.get(fileName) || '';

      socket.emit('sync-document', {
        fileName,
        content,
      });
    });

    socket.on('editor-disconnect', (data: { roomId: string }) => {
      handleEditorLeave(socket, data.roomId);
    });

    socket.on('disconnect', () => {
      editorRooms.forEach((_, roomId) => {
        if (socket.rooms.has(`editor:${roomId}`)) {
          handleEditorLeave(socket, roomId);
        }
      });
    });
  });
}

function handleEditorLeave(socket: Socket, roomId: string): void {
  const room = editorRooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  if (user) {
    socket.to(`editor:${roomId}`).emit('editor-user-left', {
      socketId: socket.id,
      userId: user.userId,
    });

    room.users.delete(socket.id);
    socket.leave(`editor:${roomId}`);

    logger.info(`${user.userName} left editor room ${roomId}`);

    if (room.users.size === 0) {
      editorRooms.delete(roomId);
    }
  }
}
