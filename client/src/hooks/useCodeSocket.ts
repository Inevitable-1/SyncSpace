/**
 * Hook for real-time collaborative code editing via Socket.IO.
 *
 * Manages a dedicated Socket.IO connection for code editor events including
 * code changes, cursor positions, language selection, and document saving.
 * Each code editor room gets its own socket connection to avoid event conflicts.
 *
 * @param options - Configuration for the code socket connection
 * @param options.roomId - Room identifier to join
 * @param options.userName - Display name for cursor sharing
 * @param options.userId - User ID for identification
 * @param options.enabled - Whether to establish the connection
 *
 * @returns Object containing connection state, remote state, and emit functions
 *
 * @example
 *   const { isConnected, emitCodeChange, remoteCode } = useCodeSocket({
 *     roomId: 'abc123',
 *     userName: 'John',
 *     userId: 'user123',
 *   });
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/** Represents a connected code editor user with their cursor color and status */
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
  /** Map of socketId → cursor position for rendering remote cursors */
  const [cursorPositions, setCursorPositions] = useState<
    Map<string, { line: number; column: number; userName: string; color: string }>
  >(new Map());

  /** Extracts the JWT access token from persisted auth state in localStorage */
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

    /** Received when joining a room — contains current code, language, and connected users */
    socket.on('code:joined', (data: { code: string; language: string; users: CodeUser[] }) => {
      setConnectedUsers(data.users);
      setRemoteCode(data.code);
      setRemoteLanguage(data.language);
    });

    /** A new user joined the code room */
    socket.on('code:user-joined', (user: CodeUser) => {
      setConnectedUsers((prev) => [...prev.filter((u) => u.socketId !== user.socketId), user]);
    });

    /** A user left the code room — remove from users and cursor positions */
    socket.on('code:user-left', (data: { socketId: string }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    });

    /** Received code changes from another user — update editor content and cursor */
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

    /** Received cursor position update from another user */
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

    /** Another user changed the language selection */
    socket.on('code:language', (data: { language: string }) => {
      setRemoteLanguage(data.language);
    });

    /** Document was saved to the database */
    socket.on('code:saved', (data: { savedBy: string; timestamp: string }) => {
      setLastSaved(data.timestamp);
    });

    return () => {
      socket.emit('code:leave', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName, userId, enabled, getToken]);

  /** Broadcasts code changes to all users in the room */
  const emitCodeChange = useCallback(
    (code: string, cursor?: { line: number; column: number }) => {
      socketRef.current?.emit('code:update', { roomId, code, cursor });
    },
    [roomId],
  );

  /** Broadcasts cursor position to all users in the room */
  const emitCursorMove = useCallback(
    (line: number, column: number) => {
      socketRef.current?.emit('code:cursor', { roomId, line, column });
    },
    [roomId],
  );

  /** Broadcasts language change to all users in the room */
  const emitLanguageChange = useCallback(
    (language: string) => {
      socketRef.current?.emit('code:language', { roomId, language });
    },
    [roomId],
  );

  /** Saves the current code to the database via the server */
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
