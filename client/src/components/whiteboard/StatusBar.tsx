import type { WhiteboardUser } from '../../types';

interface StatusBarProps {
  zoom: number;
  mousePosition: { x: number; y: number };
  connectedUsers: WhiteboardUser[];
  isConnected: boolean;
}

export default function StatusBar({
  zoom,
  mousePosition,
  connectedUsers,
  isConnected,
}: StatusBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-8 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-between px-4 text-xs text-[var(--text-secondary)]">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span>
          {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span>
          x: {Math.round(mousePosition.x)}, y: {Math.round(mousePosition.y)}
        </span>
        <span className="font-medium">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
