import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppDispatch } from './useAppDispatch';
import {
  addMessage,
  editMessage,
  removeMessage,
  addTypingUser,
  removeTypingUser,
} from '../features/chat/chatSlice';
import {
  addOnlineUser,
  removeOnlineUser,
  updatePresenceStatus,
  setOnlineUsers,
} from '../features/presence/presenceSlice';
import { addNotification } from '../features/notification/notificationSlice';
import type { ChatMessage, PresenceUser, ActivityLog, Notification } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface UseCollaborationSocketOptions {
  roomId: string;
  userName: string;
  enabled?: boolean;
}

export function useCollaborationSocket({
  roomId,
  userName,
  enabled = true,
}: UseCollaborationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

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
    if (!enabled || !roomId) return;

    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { roomId, userName });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room-joined', (data: { presence: PresenceUser[] }) => {
      if (data.presence) {
        dispatch(setOnlineUsers(data.presence));
      }
    });

    socket.on('user-joined', (data: { presence: PresenceUser }) => {
      if (data.presence) {
        dispatch(addOnlineUser(data.presence));
      }
    });

    socket.on('user-left', (data: { userId: string; userName: string }) => {
      dispatch(removeOnlineUser({ userId: data.userId }));
    });

    socket.on('receive-message', (message: ChatMessage) => {
      dispatch(addMessage(message));
    });

    socket.on(
      'message-edited',
      (data: { _id: string; content: string; edited: boolean; editedAt: string }) => {
        dispatch(editMessage(data));
      },
    );

    socket.on('message-deleted', (data: { messageId: string }) => {
      dispatch(removeMessage(data));
    });

    socket.on('user-typing', (data: { userId: string; userName: string; roomId: string }) => {
      dispatch(addTypingUser(data));
    });

    socket.on('user-stopped-typing', (data: { userId: string }) => {
      dispatch(removeTypingUser(data));
    });

    socket.on('presence-updated', (data: { userId: string; currentActivity: string }) => {
      dispatch(
        updatePresenceStatus({
          userId: data.userId,
          currentActivity: data.currentActivity,
        }),
      );
    });

    socket.on('notification', (notif: Notification) => {
      dispatch(addNotification(notif));
    });

    socket.on('activity', (activity: ActivityLog) => {
      setActivities((prev) => [activity, ...prev].slice(0, 50));
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName, enabled, getToken, dispatch]);

  const sendMessage = useCallback(
    (content: string, type?: string, replyTo?: string) => {
      socketRef.current?.emit('send-message', { roomId, content, type, replyTo });
    },
    [roomId],
  );

  const editMessageById = useCallback(
    (messageId: string, content: string) => {
      socketRef.current?.emit('edit-message', { messageId, content, roomId });
    },
    [roomId],
  );

  const deleteMessageById = useCallback(
    (messageId: string) => {
      socketRef.current?.emit('delete-message', { messageId, roomId });
    },
    [roomId],
  );

  const startTyping = useCallback(() => {
    socketRef.current?.emit('typing-start', { roomId });
  }, [roomId]);

  const stopTyping = useCallback(() => {
    socketRef.current?.emit('typing-stop', { roomId });
  }, [roomId]);

  const markSeen = useCallback(() => {
    socketRef.current?.emit('mark-seen', { roomId });
  }, [roomId]);

  const updateActivity = useCallback(
    (activity: string) => {
      socketRef.current?.emit('update-activity', { roomId, activity });
    },
    [roomId],
  );

  return {
    isConnected,
    activities,
    sendMessage,
    editMessageById,
    deleteMessageById,
    startTyping,
    stopTyping,
    markSeen,
    updateActivity,
  };
}
