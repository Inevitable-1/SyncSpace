import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRooms } from '../../features/room/roomSlice';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import Spinner from '../../components/common/Spinner';
import type { RootState, AppDispatch } from '../../store';
import WhiteboardRoom from './WhiteboardRoom';
import CodeEditorRoom from './CodeEditorRoom';
import DocumentRoom from './DocumentRoom';

export default function RoomRouter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { rooms } = useSelector((state: RootState) => state.room);
  const { user } = useSelector((state: RootState) => state.auth);

  const room = rooms.find((r) => r._id === id);

  useEffect(() => {
    if (!room && id) {
      dispatch(fetchRooms(undefined));
    }
  }, [dispatch, room, id]);

  const { isConnected } = useCollaborationSocket({
    roomId: id || '',
    userName: user?.name || 'Anonymous',
    enabled: !!id,
  });

  if (!room) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  switch (room.type) {
    case 'whiteboard':
      return <WhiteboardRoom room={room} isConnected={isConnected} />;
    case 'code':
      return <CodeEditorRoom room={room} isConnected={isConnected} />;
    case 'document':
      return <DocumentRoom room={room} isConnected={isConnected} />;
    default:
      return (
        <div
          className="flex items-center justify-center h-full"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Unknown room type: {room.type}
            </p>
            <button
              onClick={() => navigate('/dashboard/rooms')}
              className="btn-primary text-sm mt-4"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      );
  }
}
