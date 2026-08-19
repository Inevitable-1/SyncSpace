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
    <div className="absolute bottom-0 left-0 right-0 z-20 h-7 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-[11px] text-gray-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
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
