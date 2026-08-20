/**
 * Hook for real-time collaboration via Socket.IO.
 *
 * Manages chat messaging, typing indicators, presence tracking, and notifications
 * for a specific room. Each room page creates its own instance of this hook
 * to maintain an independent socket connection.
 *
 * This hook dispatches socket events to Redux slices for state management:
 * - chatSlice: Messages, typing users
 * - presenceSlice: Online users, activity status
 * - notificationSlice: In-app notifications
 *
 * @param options - Configuration for the collaboration socket
 * @param options.roomId - Room identifier to join
 * @param options.userName - Display name for presence
 * @param options.enabled - Whether to establish the connection
 *
 * @returns Object containing connection state and action functions
 *
 * @example
 *   const { isConnected, sendMessage, startTyping } = useCollaborationSocket({
 *     roomId: 'abc123',
 *     userName: 'John',
 *   });
 */
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
  /** Recent activity log for the room (capped at 50 entries) */
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  /** Extracts the JWT access token from persisted auth state in localStorage */
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
      // Join the room — server will add us to room:${id} and chat:${id} Socket.IO rooms
      socket.emit('join-room', { roomId, userName });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    /** Initial presence list received when joining a room */
    socket.on('room-joined', (data: { presence: PresenceUser[] }) => {
      if (data.presence) {
        dispatch(setOnlineUsers(data.presence));
      }
    });

    /** A new user joined the room — add to presence list */
    socket.on('user-joined', (data: { presence: PresenceUser }) => {
      if (data.presence) {
        dispatch(addOnlineUser(data.presence));
      }
    });

    /** A user left the room — remove from presence list */
    socket.on('user-left', (data: { userId: string; userName: string }) => {
      dispatch(removeOnlineUser({ userId: data.userId }));
    });

    /** Received a new chat message — add to Redux store */
    socket.on('receive-message', (message: ChatMessage) => {
      dispatch(addMessage(message));
    });

    /** A message was edited by its sender */
    socket.on(
      'message-edited',
      (data: { _id: string; content: string; edited: boolean; editedAt: string }) => {
        dispatch(editMessage(data));
      },
    );

    /** A message was deleted by its sender */
    socket.on('message-deleted', (data: { messageId: string }) => {
      dispatch(removeMessage(data));
    });

    /** A user started typing — show typing indicator */
    socket.on('user-typing', (data: { userId: string; userName: string; roomId: string }) => {
      dispatch(addTypingUser(data));
    });

    /** A user stopped typing — hide typing indicator */
    socket.on('user-stopped-typing', (data: { userId: string }) => {
      dispatch(removeTypingUser(data));
    });

    /** A user's activity status changed (e.g., "Editing whiteboard") */
    socket.on('presence-updated', (data: { userId: string; currentActivity: string }) => {
      dispatch(
        updatePresenceStatus({
          userId: data.userId,
          currentActivity: data.currentActivity,
        }),
      );
    });

    /** Received an in-app notification (e.g., "You were invited to a workspace") */
    socket.on('notification', (notif: Notification) => {
      dispatch(addNotification(notif));
    });

    /** Received an activity event (e.g., "User sent a message") */
    socket.on('activity', (activity: ActivityLog) => {
      setActivities((prev) => [activity, ...prev].slice(0, 50));
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId, userName, enabled, getToken, dispatch]);

  /** Sends a chat message to all users in the room */
  const sendMessage = useCallback(
    (content: string, type?: string, replyTo?: string) => {
      socketRef.current?.emit('send-message', { roomId, content, type, replyTo });
    },
    [roomId],
  );

  /** Edits a message by ID — only the original sender can edit */
  const editMessageById = useCallback(
    (messageId: string, content: string) => {
      socketRef.current?.emit('edit-message', { messageId, content, roomId });
    },
    [roomId],
  );

  /** Deletes a message by ID — only the original sender can delete */
  const deleteMessageById = useCallback(
    (messageId: string) => {
      socketRef.current?.emit('delete-message', { messageId, roomId });
    },
    [roomId],
  );

  /** Broadcasts "typing" status to other users (show typing indicator) */
  const startTyping = useCallback(() => {
    socketRef.current?.emit('typing-start', { roomId });
  }, [roomId]);

  /** Broadcasts "stopped typing" status (hide typing indicator) */
  const stopTyping = useCallback(() => {
    socketRef.current?.emit('typing-stop', { roomId });
  }, [roomId]);

  /** Marks all messages in the room as seen by the current user */
  const markSeen = useCallback(() => {
    socketRef.current?.emit('mark-seen', { roomId });
  }, [roomId]);

  /** Updates the user's current activity display (e.g., "Editing document") */
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
