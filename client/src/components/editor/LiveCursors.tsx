import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { CodeEditorUser } from '../../types';

interface LiveCursorsProps {
  users: CodeEditorUser[];
  currentUserId: string;
  currentFile: string;
}

export default function LiveCursors({ users, currentUserId, currentFile }: LiveCursorsProps) {
  const activeUsers = useMemo(
    () => users.filter((u) => u.userId !== currentUserId && u.fileName === currentFile),
    [users, currentUserId, currentFile],
  );

  if (activeUsers.length === 0) return null;

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
      {activeUsers.map((user) => (
        <motion.div
          key={user.socketId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium shadow-md"
          style={{
            background: user.color,
            color: '#fff',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          <span>{user.userName}</span>
          {user.cursor && (
            <span className="opacity-70">
              Ln {user.cursor.line}, Col {user.cursor.column}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
