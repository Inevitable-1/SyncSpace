import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { CodeEditorUser, EditorCursor } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface UseEditorSocketOptions {
  roomId: string;
  userName: string;
  enabled?: boolean;
}

export function useEditorSocket({ roomId, userName, enabled = true }: UseEditorSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<CodeEditorUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, EditorCursor>>(new Map());

  const getToken = useCallback(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        return JSON.parse(stored)?.state?.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: getToken() }),
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('editor-join', { roomId, userName });
    });

    socket.on('connect_error', () => setIsConnected(false));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on(
      'editor-joined',
      (data: { documents: Record<string, string>; users: CodeEditorUser[] }) => {
        setConnectedUsers(data.users);
      },
    );

    socket.on('editor-user-joined', (user: CodeEditorUser) => {
      setConnectedUsers((prev) => [...prev.filter((u) => u.socketId !== user.socketId), user]);
    });

    socket.on('editor-user-left', (data: { socketId: string }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    });

    socket.on(
      'cursor-update',
      (data: {
        socketId: string;
        userId: string;
        userName: string;
        color: string;
        cursor: { line: number; column: number };
        fileName: string;
      }) => {
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(data.socketId, {
            socketId: data.socketId,
            userId: data.userId,
            userName: data.userName,
            color: data.color,
            cursor: data.cursor,
            fileName: data.fileName,
          });
          return next;
        });
      },
    );

    socket.on(
      'selection-update',
      (data: {
        socketId: string;
        userId: string;
        userName: string;
        color: string;
        selection: { startLine: number; startColumn: number; endLine: number; endColumn: number };
        fileName: string;
      }) => {
        setCursors((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.socketId);
          if (existing) {
            next.set(data.socketId, {
              ...existing,
              selection: data.selection,
              fileName: data.fileName,
            });
          }
          return next;
        });
      },
    );

    return () => {
      socket.emit('editor-leave', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName, enabled, getToken]);

  const emitCodeChange = useCallback(
    (fileName: string, content: string, cursor: { line: number; column: number }) => {
      socketRef.current?.emit('code-change', { roomId, fileName, content, cursor });
    },
    [roomId],
  );

  const emitCursorUpdate = useCallback(
    (cursor: { line: number; column: number }, fileName: string) => {
      socketRef.current?.emit('cursor-update', { roomId, cursor, fileName });
    },
    [roomId],
  );

  const emitSelectionUpdate = useCallback(
    (
      selection: { startLine: number; startColumn: number; endLine: number; endColumn: number },
      fileName: string,
    ) => {
      socketRef.current?.emit('selection-update', { roomId, selection, fileName });
    },
    [roomId],
  );

  const emitSaveDocument = useCallback(
    (fileName: string, content: string) => {
      socketRef.current?.emit('save-document', { roomId, fileName, content });
    },
    [roomId],
  );

  const emitSyncDocument = useCallback(
    (fileName: string) => {
      socketRef.current?.emit('sync-document', { roomId, fileName });
    },
    [roomId],
  );

  return {
    isConnected,
    connectedUsers,
    cursors,
    emitCodeChange,
    emitCursorUpdate,
    emitSelectionUpdate,
    emitSaveDocument,
    emitSyncDocument,
  };
}
