import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { WhiteboardObject, WhiteboardUser } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface UseSocketOptions {
  roomId: string;
  userName: string;
  onObjectsUpdate: (
    objects: WhiteboardObject[] | ((prev: WhiteboardObject[]) => WhiteboardObject[]),
  ) => void;
  onUserJoined: (user: WhiteboardUser) => void;
  onUserLeft: (socketId: string) => void;
  onCursorUpdate: (cursor: WhiteboardUser) => void;
}

export function useSocket({
  roomId,
  userName,
  onObjectsUpdate,
  onUserJoined,
  onUserLeft,
  onCursorUpdate,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<WhiteboardUser[]>([]);

  const getToken = useCallback(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed?.state?.accessToken;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: getToken() }),
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { roomId, userName });
    });

    // Rejected handshake (e.g. the access token expired while the page was
    // open). socket.io auto-reconnects and, because `auth` is a function, each
    // new handshake re-reads the token from localStorage — so a freshly
    // refreshed token is used instead of failing repeatedly with a stale one.
    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room-joined', (data: { objects: WhiteboardObject[]; users: WhiteboardUser[] }) => {
      onObjectsUpdate(data.objects);
      setConnectedUsers(data.users);
    });

    socket.on('user-joined', (user: WhiteboardUser) => {
      onUserJoined(user);
      setConnectedUsers((prev) => [...prev, user]);
    });

    socket.on('user-left', (data: { socketId: string }) => {
      onUserLeft(data.socketId);
      setConnectedUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
    });

    socket.on('object-added', (data: { object: WhiteboardObject }) => {
      onObjectsUpdate((prev: WhiteboardObject[]) => [...prev, data.object]);
    });

    socket.on('object-updated', (data: { object: WhiteboardObject }) => {
      onObjectsUpdate((prev: WhiteboardObject[]) =>
        prev.map((o: WhiteboardObject) => (o.id === data.object.id ? data.object : o)),
      );
    });

    socket.on('object-deleted', (data: { objectId: string }) => {
      onObjectsUpdate((prev: WhiteboardObject[]) =>
        prev.filter((o: WhiteboardObject) => o.id !== data.objectId),
      );
    });

    socket.on('cursor-update', (cursor: WhiteboardUser) => {
      onCursorUpdate(cursor);
    });

    socket.on('canvas-state', (data: { objects: WhiteboardObject[] }) => {
      onObjectsUpdate(data.objects);
    });

    socket.on('canvas-cleared', () => {
      onObjectsUpdate([]);
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName, getToken, onObjectsUpdate, onUserJoined, onUserLeft, onCursorUpdate]);

  const emitDraw = useCallback(
    (object: WhiteboardObject) => {
      socketRef.current?.emit('draw', { roomId, object });
    },
    [roomId],
  );

  const emitUpdate = useCallback(
    (object: WhiteboardObject) => {
      socketRef.current?.emit('update-object', { roomId, object });
    },
    [roomId],
  );

  const emitDelete = useCallback(
    (objectId: string) => {
      socketRef.current?.emit('delete-object', { roomId, objectId });
    },
    [roomId],
  );

  const emitCursor = useCallback(
    (x: number, y: number) => {
      socketRef.current?.emit('cursor-move', { roomId, x, y });
    },
    [roomId],
  );

  const emitUndo = useCallback(() => {
    socketRef.current?.emit('undo', { roomId });
  }, [roomId]);

  const emitRedo = useCallback(() => {
    socketRef.current?.emit('redo', { roomId });
  }, [roomId]);

  const emitClear = useCallback(() => {
    socketRef.current?.emit('clear-canvas', { roomId });
  }, [roomId]);

  const emitSave = useCallback(() => {
    socketRef.current?.emit('save-whiteboard', { roomId });
  }, [roomId]);

  return {
    isConnected,
    connectedUsers,
    emitDraw,
    emitUpdate,
    emitDelete,
    emitCursor,
    emitUndo,
    emitRedo,
    emitClear,
    emitSave,
  };
}
