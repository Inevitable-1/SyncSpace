import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export interface CodeUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  status: 'editing' | 'viewing' | 'typing';
}

interface UseCodeSocketOptions {
  roomId: string;
  userName: string;
  userId: string;
  enabled?: boolean;
}

export function useCodeSocket({ roomId, userName, userId, enabled = true }: UseCodeSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<CodeUser[]>([]);
  const [remoteCode, setRemoteCode] = useState<string | null>(null);
  const [remoteLanguage, setRemoteLanguage] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [cursorPositions, setCursorPositions] = useState<
    Map<string, { line: number; column: number; userName: string; color: string }>
  >(new Map());

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
      socket.emit('code:join', { roomId, userName, userId });
    });

    socket.on('connect_error', () => setIsConnected(false));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('code:joined', (data: { code: string; language: string; users: CodeUser[] }) => {
      setConnectedUsers(data.users);
      setRemoteCode(data.code);
      setRemoteLanguage(data.language);
    });

    socket.on('code:user-joined', (user: CodeUser) => {
      setConnectedUsers((prev) => [...prev.filter((u) => u.socketId !== user.socketId), user]);
    });

    socket.on('code:user-left', (data: { socketId: string }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    });

    socket.on(
      'code:update',
      (data: {
        socketId: string;
        code: string;
        cursor?: { line: number; column: number };
        userName?: string;
        color?: string;
      }) => {
        setRemoteCode(data.code);
        if (data.cursor) {
          setCursorPositions((prev) => {
            const next = new Map(prev);
            next.set(data.socketId, {
              line: data.cursor!.line,
              column: data.cursor!.column,
              userName: data.userName || 'Unknown',
              color: data.color || '#999',
            });
            return next;
          });
        }
      },
    );

    socket.on(
      'code:cursor',
      (data: {
        socketId: string;
        userName: string;
        color: string;
        line: number;
        column: number;
      }) => {
        setCursorPositions((prev) => {
          const next = new Map(prev);
          next.set(data.socketId, {
            line: data.line,
            column: data.column,
            userName: data.userName,
            color: data.color,
          });
          return next;
        });
      },
    );

    socket.on('code:language', (data: { language: string }) => {
      setRemoteLanguage(data.language);
    });

    socket.on('code:saved', (data: { savedBy: string; timestamp: string }) => {
      setLastSaved(data.timestamp);
    });

    return () => {
      socket.emit('code:leave', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName, userId, enabled, getToken]);

  const emitCodeChange = useCallback(
    (code: string, cursor?: { line: number; column: number }) => {
      socketRef.current?.emit('code:update', { roomId, code, cursor });
    },
    [roomId],
  );

  const emitCursorMove = useCallback(
    (line: number, column: number) => {
      socketRef.current?.emit('code:cursor', { roomId, line, column });
    },
    [roomId],
  );

  const emitLanguageChange = useCallback(
    (language: string) => {
      socketRef.current?.emit('code:language', { roomId, language });
    },
    [roomId],
  );

  const emitSave = useCallback(
    (code: string, language: string) => {
      socketRef.current?.emit('code:save', { roomId, code, language });
    },
    [roomId],
  );

  return {
    isConnected,
    connectedUsers,
    remoteCode,
    remoteLanguage,
    lastSaved,
    cursorPositions,
    emitCodeChange,
    emitCursorMove,
    emitLanguageChange,
    emitSave,
  };
}
