import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import Toolbar from '../components/whiteboard/Toolbar';
import PropertiesPanel from '../components/whiteboard/PropertiesPanel';
import StatusBar from '../components/whiteboard/StatusBar';
import CursorsOverlay from '../components/whiteboard/CursorsOverlay';
import { useSocket } from '../hooks/useSocket';
import { whiteboardService } from '../services/whiteboardService';
import { useToast } from '../components/common/Toast';
import type { RootState } from '../store';
import type { WhiteboardObject, WhiteboardUser, ToolType } from '../types';

export default function WhiteboardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  const [objects, setObjects] = useState<WhiteboardObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<ToolType>('pointer');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [zoom, setZoom] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState<Map<string, WhiteboardUser>>(new Map());
  const [undoStack, setUndoStack] = useState<WhiteboardObject[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardObject[][]>([]);

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectsRef = useRef<WhiteboardObject[]>(objects);
  objectsRef.current = objects;

  const handleObjectsUpdate = useCallback(
    (newObjects: WhiteboardObject[] | ((prev: WhiteboardObject[]) => WhiteboardObject[])) => {
      setObjects((prev) => {
        const next = typeof newObjects === 'function' ? newObjects(prev) : newObjects;
        setUndoStack((uPrev) => [...uPrev.slice(-50), prev]);
        setRedoStack([]);
        return next;
      });
    },
    [],
  );

  const handleUserJoined = useCallback(
    (user: WhiteboardUser) => {
      showToast(`${user.userName} joined the whiteboard`, 'info');
    },
    [showToast],
  );

  const handleUserLeft = useCallback((socketId: string) => {
    setCursors((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  const handleCursorUpdate = useCallback((cursor: WhiteboardUser) => {
    setCursors((prev) => {
      const next = new Map(prev);
      next.set(cursor.socketId, cursor);
      return next;
    });
  }, []);

  const {
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
  } = useSocket({
    roomId: roomId || '',
    userName: user?.name || 'Anonymous',
    onObjectsUpdate: handleObjectsUpdate,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onCursorUpdate: handleCursorUpdate,
  });

  useEffect(() => {
    if (!roomId) return;

    const loadWhiteboard = async () => {
      try {
        const data = await whiteboardService.getWhiteboard(roomId);
        if (data.objects && data.objects.length > 0) {
          setObjects(data.objects);
        }
      } catch {
        // Whiteboard will start empty
      }
    };

    loadWhiteboard();
  }, [roomId]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (roomId && objectsRef.current.length > 0) {
        emitSave();
        whiteboardService.saveWhiteboard(roomId, objectsRef.current).catch(() => {});
      }
    }, 10000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [roomId, emitSave]);

  const handleDraw = useCallback(
    (object: WhiteboardObject) => {
      setObjects((prev) => [...prev, object]);
      emitDraw(object);
    },
    [emitDraw],
  );

  const handleUpdate = useCallback(
    (object: WhiteboardObject) => {
      setObjects((prev) => prev.map((o) => (o.id === object.id ? object : o)));
      emitUpdate(object);
    },
    [emitUpdate],
  );

  const handleDelete = useCallback(
    (objectId: string) => {
      setObjects((prev) => prev.filter((o) => o.id !== objectId));
      emitDelete(objectId);
    },
    [emitDelete],
  );

  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      setMousePosition({ x, y });
      emitCursor(x, y);
    },
    [emitCursor],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, objects]);
    setObjects(prev);
    emitUndo();
  }, [undoStack, objects, emitUndo]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((u) => [...u, objects]);
    setObjects(next);
    emitRedo();
  }, [redoStack, objects, emitRedo]);

  const handleClear = useCallback(() => {
    setObjects([]);
    setUndoStack([]);
    setRedoStack([]);
    emitClear();
  }, [emitClear]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.2, 0.1));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
  }, []);

  const selectedObject = useMemo(() => {
    if (selectedIds.length !== 1) return null;
    return objects.find((o) => o.id === selectedIds[0]) || null;
  }, [selectedIds, objects]);

  const currentCursor = useMemo(() => {
    switch (tool) {
      case 'pointer':
        return 'default';
      case 'hand':
        return 'grab';
      case 'pencil':
      case 'line':
      case 'rectangle':
      case 'circle':
      case 'arrow':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'eraser':
        return 'pointer';
      default:
        return 'default';
    }
  }, [tool]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-12 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-4 z-30"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/rooms')}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="w-px h-6 bg-[var(--border-color)]" />
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Whiteboard</h1>
          <span className="text-xs text-[var(--text-tertiary)]">
            Room: {roomId?.slice(0, 8)}...
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {connectedUsers.slice(0, 5).map((u) => (
              <div
                key={u.socketId}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[var(--bg-card)]"
                style={{ backgroundColor: u.color }}
                title={u.userName}
              >
                {u.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {connectedUsers.length > 5 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-2 border-[var(--bg-card)]">
                +{connectedUsers.length - 5}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[var(--border-color)]" />

          <button
            onClick={() => {
              showToast('Saving...', 'info');
              emitSave();
              whiteboardService
                .saveWhiteboard(roomId || '', objects)
                .then(() => showToast('Saved!', 'success'))
                .catch(() => showToast('Save failed', 'error'));
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all"
          >
            Save
          </button>
        </div>
      </motion.div>

      <div className="flex-1 relative overflow-hidden" style={{ cursor: currentCursor }}>
        <WhiteboardCanvas
          objects={objects}
          tool={tool}
          strokeColor={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          fontSize={fontSize}
          fontFamily={fontFamily}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onDraw={handleDraw}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCursorMove={handleCursorMove}
          onZoomChange={setZoom}
        />

        <Toolbar
          activeTool={tool}
          onToolChange={setTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />

        <PropertiesPanel
          selectedObject={selectedObject}
          tool={tool}
          strokeColor={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          fontSize={fontSize}
          fontFamily={fontFamily}
          onStrokeColorChange={setStrokeColor}
          onFillColorChange={setFillColor}
          onStrokeWidthChange={setStrokeWidth}
          onOpacityChange={setOpacity}
          onFontSizeChange={setFontSize}
          onFontFamilyChange={setFontFamily}
        />

        <CursorsOverlay cursors={cursors} />

        <StatusBar
          zoom={zoom}
          mousePosition={mousePosition}
          connectedUsers={connectedUsers}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}
