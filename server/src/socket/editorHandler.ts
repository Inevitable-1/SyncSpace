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
  code: string;
  language: string;
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
      code: '',
      language: 'java',
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

    // ========== Code Editor Events ==========

    socket.on('code:join', (data: { roomId: string; userName: string; userId: string }) => {
      const { roomId, userName, userId } = data;

      socket.join(`code:${roomId}`);

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

      const usersList = Array.from(room.users.entries()).map(([id, u]) => ({
        socketId: id,
        ...u,
        status: 'editing' as const,
      }));

      socket.emit('code:joined', {
        code: room.code,
        language: room.language,
        users: usersList,
      });

      socket.to(`code:${roomId}`).emit('code:user-joined', {
        socketId: socket.id,
        ...editorUser,
        status: 'editing',
      });

      logger.info(`${userName} joined code room ${roomId}`);
    });

    socket.on('code:leave', (data: { roomId: string }) => {
      handleCodeLeave(socket, data.roomId);
    });

    socket.on(
      'code:update',
      (data: { roomId: string; code: string; cursor?: { line: number; column: number } }) => {
        const { roomId, code, cursor } = data;
        const room = getEditorRoom(roomId);

        room.code = code;

        const user = room.users.get(socket.id);
        if (user && cursor) {
          user.cursor = cursor;
        }

        const userName = user?.userName || 'Unknown';
        const color = user?.color || '#999';

        socket.to(`code:${roomId}`).emit('code:update', {
          socketId: socket.id,
          code,
          cursor,
          userName,
          color,
        });
      },
    );

    socket.on('code:cursor', (data: { roomId: string; line: number; column: number }) => {
      const { roomId, line, column } = data;
      const room = getEditorRoom(roomId);
      const user = room.users.get(socket.id);

      if (user) {
        user.cursor = { line, column };
      }

      socket.to(`code:${roomId}`).emit('code:cursor', {
        socketId: socket.id,
        userName: user?.userName || 'Unknown',
        color: user?.color || '#999',
        line,
        column,
      });
    });

    socket.on('code:language', (data: { roomId: string; language: string }) => {
      const { roomId, language } = data;
      const room = getEditorRoom(roomId);
      room.language = language;

      socket.to(`code:${roomId}`).emit('code:language', { language });
    });

    socket.on('code:save', async (data: { roomId: string; code: string; language: string }) => {
      const { roomId, code, language } = data;

      try {
        const { CodeDocument } = await import('../models/CodeDocument.js');

        const langExt: Record<string, string> = {
          java: '.java',
          python: '.py',
          c: '.c',
          cpp: '.cpp',
        };
        const ext = langExt[language] || '.txt';
        const fileName = `Main${ext}`;
        const filePath = `/${fileName}`;

        const doc = await CodeDocument.findOne({
          room: roomId,
          path: filePath,
          isDeleted: { $ne: true },
        });

        if (doc) {
          doc.content = code;
          doc.language = language;
          doc.lastEditedBy = socket.data.userId;
          doc.versionTimestamps.push(new Date());
          await doc.save();
        } else {
          await CodeDocument.create({
            name: fileName,
            path: filePath,
            content: code,
            language,
            room: roomId,
            workspace: roomId,
            createdBy: socket.data.userId,
            lastEditedBy: socket.data.userId,
            parentPath: '/',
            isFolder: false,
            versionTimestamps: [new Date()],
          });
        }

        io.to(`code:${roomId}`).emit('code:saved', {
          savedBy: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to save code:', error);
        socket.emit('code:save-error', { error: 'Failed to save' });
      }
    });

    socket.on('disconnect', () => {
      editorRooms.forEach((_, roomId) => {
        if (socket.rooms.has(`editor:${roomId}`)) {
          handleEditorLeave(socket, roomId);
        }
        if (socket.rooms.has(`code:${roomId}`)) {
          handleCodeLeave(socket, roomId);
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

function handleCodeLeave(socket: Socket, roomId: string): void {
  const room = editorRooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  if (user) {
    socket.to(`code:${roomId}`).emit('code:user-left', {
      socketId: socket.id,
      userId: user.userId,
    });

    room.users.delete(socket.id);
    socket.leave(`code:${roomId}`);

    logger.info(`${user.userName} left code room ${roomId}`);

    if (room.users.size === 0) {
      editorRooms.delete(roomId);
    }
  }
}
