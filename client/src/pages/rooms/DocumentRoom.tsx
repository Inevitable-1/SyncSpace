import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import { documentService } from '../../services/documentService';
import ChatPanel from '../../components/chat/ChatPanel';
import Spinner from '../../components/common/Spinner';
import type { Room, CodeDocument } from '../../types';
import type { RootState } from '../../store';

interface DocumentRoomProps {
  room: Room;
}

export default function DocumentRoom({ room }: DocumentRoomProps) {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { isConnected, startTyping, stopTyping, sendMessage, editMessageById, deleteMessageById } =
    useCollaborationSocket({
      roomId: room._id,
      userName: user?.name || 'Anonymous',
      enabled: true,
    });

  const [documents, setDocuments] = useState<CodeDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [docName, setDocName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await documentService.getByRoom(room._id);
        setDocuments(docs);
        if (docs.length > 0) {
          setActiveDocId(docs[0]._id);
          setContent(docs[0].content);
          setDocName(docs[0].name);
        }
      } catch {
        console.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };
    loadDocs();
  }, [room._id]);

  const activeDoc = documents.find((d) => d._id === activeDocId);

  const handleSelectDoc = useCallback((doc: CodeDocument) => {
    setActiveDocId(doc._id);
    setContent(doc.content);
    setDocName(doc.name);
  }, []);

  const handleCreateDoc = useCallback(async () => {
    const wsId =
      typeof room.workspace === 'object' ? room.workspace._id : (room.workspace as string);
    try {
      const doc = await documentService.create({
        name: 'Untitled Document',
        roomId: room._id,
        workspaceId: wsId,
      });
      setDocuments((prev) => [doc, ...prev]);
      setActiveDocId(doc._id);
      setContent(doc.content);
      setDocName(doc.name);
    } catch {
      console.error('Failed to create document');
    }
  }, [room._id, room.workspace]);

  const handleSave = useCallback(async () => {
    if (!activeDocId) return;
    setIsSaving(true);
    try {
      const updated = await documentService.update(activeDocId, { content, name: docName });
      setDocuments((prev) => prev.map((d) => (d._id === activeDocId ? updated : d)));
    } catch {
      console.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [activeDocId, content, docName]);

  const handleDeleteDoc = useCallback(
    async (docId: string) => {
      try {
        await documentService.delete(docId);
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        if (activeDocId === docId) {
          const remaining = documents.filter((d) => d._id !== docId);
          if (remaining.length > 0) {
            setActiveDocId(remaining[0]._id);
            setContent(remaining[0].content);
            setDocName(remaining[0].name);
          } else {
            setActiveDocId(null);
            setContent('');
            setDocName('');
          }
        }
      } catch {
        console.error('Failed to delete document');
      }
    },
    [activeDocId, documents],
  );

  useEffect(() => {
    if (!activeDocId) return;
    const timeout = setTimeout(handleSave, 2000);
    return () => clearTimeout(timeout);
  }, [content, docName, activeDocId, handleSave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeDocId) {
        documentService.update(activeDocId, { content, name: docName }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeDocId, content, docName]);

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div
        className="w-80 flex-shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
      >
        <div
          className="p-3 border-b flex items-center gap-2"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {room.name}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>
              Documents
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel
            roomId={room._id}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
            sendMessage={sendMessage}
            onEditMessage={editMessageById}
            onDeleteMessage={deleteMessageById}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={handleCreateDoc}
              className="px-2 py-1 rounded text-[11px] font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              + New Document
            </button>
            {documents.map((doc) => (
              <button
                key={doc._id}
                onClick={() => handleSelectDoc(doc)}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${activeDocId === doc._id ? 'text-white' : ''}`}
                style={{
                  background: activeDocId === doc._id ? 'var(--primary)' : 'transparent',
                  color: activeDocId === doc._id ? 'white' : 'var(--text-tertiary)',
                }}
              >
                {doc.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                Saving...
              </span>
            )}
            {activeDocId && (
              <button
                onClick={() => handleDeleteDoc(activeDocId)}
                className="text-[11px] px-2 py-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : !activeDoc ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                No documents yet
              </p>
              <button onClick={handleCreateDoc} className="btn-primary text-sm">
                Create Document
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm font-semibold mb-3 bg-transparent"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
              }}
              placeholder="Document name..."
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full px-4 py-3 rounded-lg border text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                fontFamily: "'Inter', sans-serif",
              }}
              placeholder="Start writing..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
