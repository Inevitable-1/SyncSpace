import type { WhiteboardUser } from '../../types';

interface CursorsOverlayProps {
  cursors: Map<string, WhiteboardUser>;
}

export default function CursorsOverlay({ cursors }: CursorsOverlayProps) {
  return (
    <>
      {Array.from(cursors.entries()).map(([socketId, cursor]) => (
        <div
          key={socketId}
          className="absolute pointer-events-none z-30 transition-transform duration-100"
          style={{
            transform: `translate(${cursor.x || 0}px, ${cursor.y || 40}px)`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-md">
            <path
              d="M2 2l7.07 16.97 2.51-7.39 7.39-2.51L2 2z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <span
            className="absolute top-5 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </span>
        </div>
      ))}
    </>
  );
}
