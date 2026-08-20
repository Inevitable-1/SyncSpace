import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setCurrentRoom } from '../../features/room/roomSlice';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import { useSelector } from 'react-redux';
import { whiteboardService } from '../../services/whiteboardService';
import WhiteboardCanvas from '../../components/whiteboard/WhiteboardCanvas';
import Toolbar from '../../components/whiteboard/Toolbar';
import StatusBar from '../../components/whiteboard/StatusBar';
import CursorsOverlay from '../../components/whiteboard/CursorsOverlay';
import ShapeEditorPanel from '../../components/whiteboard/ShapeEditorPanel';
import ChatPanel from '../../components/chat/ChatPanel';
import type { Room, ToolType, WhiteboardObject, WhiteboardUser } from '../../types';
import type { RootState } from '../../store';

interface WhiteboardRoomProps {
  room: Room;
}

export default function WhiteboardRoom({ room }: WhiteboardRoomProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const { isConnected, startTyping, stopTyping, sendMessage, editMessageById, deleteMessageById } =
    useCollaborationSocket({
      roomId: room._id,
      userName: user?.name || 'Anonymous',
      enabled: true,
    });

  const [objects, setObjects] = useState<WhiteboardObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<ToolType>('pointer');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [zoom, setZoom] = useState(1);
  const [cursors] = useState<Map<string, WhiteboardUser>>(new Map());
  const [undoStack, setUndoStack] = useState<WhiteboardObject[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardObject[][]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const loadWhiteboard = useCallback(async () => {
    try {
      const wb = await whiteboardService.getWhiteboard(room._id);
      if (wb) {
        setObjects(wb.objects as WhiteboardObject[]);
        setUndoStack([wb.objects as WhiteboardObject[]]);
        setRedoStack([]);
        dispatch(setCurrentRoom({ _id: room._id, whiteboard: wb } as never));
      }
    } catch (err) {
      console.error('Failed to load whiteboard:', err);
    }
  }, [room._id, dispatch]);

  useEffect(() => {
    loadWhiteboard();
  }, [loadWhiteboard]);

  const saveWhiteboard = useCallback(async () => {
    try {
      await whiteboardService.saveWhiteboard(room._id, objects);
    } catch (err) {
      console.error('Failed to save whiteboard:', err);
    }
  }, [room._id, objects]);

  useEffect(() => {
    const timeoutId = setTimeout(saveWhiteboard, 2000);
    return () => clearTimeout(timeoutId);
  }, [objects, saveWhiteboard]);

  const pushUndo = useCallback(
    (newObjects: WhiteboardObject[]) => {
      setUndoStack((prev) => [...prev.slice(-49), objects]);
      setRedoStack([]);
      setObjects(newObjects);
    },
    [objects],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, objects]);
    setObjects(prev);
  }, [undoStack, objects]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, objects]);
    setObjects(next);
  }, [redoStack, objects]);

  const handleClear = useCallback(() => {
    pushUndo([]);
    setSelectedIds([]);
  }, [pushUndo]);

  const handleDraw = useCallback(
    (obj: WhiteboardObject) => {
      pushUndo([...objects, obj]);
    },
    [objects, pushUndo],
  );

  const handleUpdate = useCallback((updatedObj: WhiteboardObject) => {
    setObjects((prev) => prev.map((o) => (o.id === updatedObj.id ? updatedObj : o)));
  }, []);

  const handleDelete = useCallback(
    (idsOrId: string[] | string) => {
      const ids = Array.isArray(idsOrId) ? idsOrId : [idsOrId];
      pushUndo(objects.filter((o) => !ids.includes(o.id)));
      setSelectedIds([]);
    },
    [objects, pushUndo],
  );

  const handleCursorMove = useCallback(() => {}, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleExportPNG = useCallback(() => {
    const stage = stageRef.current?.querySelector('canvas');
    if (!stage) return;
    const link = document.createElement('a');
    link.download = `${room.name}-whiteboard.png`;
    link.href = stage.toDataURL('image/png');
    link.click();
  }, [room.name]);

  const handleExportJPG = useCallback(() => {
    const stage = stageRef.current?.querySelector('canvas');
    if (!stage) return;
    const link = document.createElement('a');
    link.download = `${room.name}-whiteboard.jpg`;
    link.href = stage.toDataURL('image/jpeg', 0.9);
    link.click();
  }, [room.name]);

  const handleExportSVG = useCallback(() => {}, []);
  const handleExportPDF = useCallback(() => {}, []);

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(objects, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${room.name}-whiteboard.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [objects, room.name]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        const result = await whiteboardService.uploadImage(room._id, file);
        const img: WhiteboardObject = {
          id: `img-${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: 300,
          height: 200,
          src: result.url,
          opacity: 1,
        };
        pushUndo([...objects, img]);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [room._id, objects, pushUndo],
  );

  const handleLoadTemplate = useCallback((_templateId: string) => {}, []);

  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));

  const handleShapeUpdate = useCallback((updatedObj: WhiteboardObject) => {
    setObjects((prev) => prev.map((o) => (o.id === updatedObj.id ? updatedObj : o)));
  }, []);

  const handleBringForward = useCallback(
    (id: string) => {
      const idx = objects.findIndex((o) => o.id === id);
      if (idx < objects.length - 1) {
        const newObjects = [...objects];
        [newObjects[idx], newObjects[idx + 1]] = [newObjects[idx + 1], newObjects[idx]];
        setObjects(newObjects);
      }
    },
    [objects],
  );

  const handleSendBackward = useCallback(
    (id: string) => {
      const idx = objects.findIndex((o) => o.id === id);
      if (idx > 0) {
        const newObjects = [...objects];
        [newObjects[idx], newObjects[idx - 1]] = [newObjects[idx - 1], newObjects[idx]];
        setObjects(newObjects);
      }
    },
    [objects],
  );

  const handleBringToFront = useCallback(
    (id: string) => {
      const idx = objects.findIndex((o) => o.id === id);
      if (idx >= 0) {
        const newObjects = [...objects];
        const [item] = newObjects.splice(idx, 1);
        newObjects.push(item);
        setObjects(newObjects);
      }
    },
    [objects],
  );

  const handleSendToBack = useCallback(
    (id: string) => {
      const idx = objects.findIndex((o) => o.id === id);
      if (idx >= 0) {
        const newObjects = [...objects];
        const [item] = newObjects.splice(idx, 1);
        newObjects.unshift(item);
        setObjects(newObjects);
      }
    },
    [objects],
  );

  const handleSelect = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    setShowPanel(ids.length > 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)
        return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key === 'a') {
          e.preventDefault();
          setSelectedIds(objects.map((o) => o.id));
          return;
        }
      }

      const keyToolMap: Record<string, ToolType> = {
        v: 'pointer',
        h: 'hand',
        p: 'pencil',
        l: 'line',
        r: 'rectangle',
        c: 'circle',
        a: 'arrow',
        t: 'text',
        e: 'eraser',
      };
      if (keyToolMap[e.key]) {
        setTool(keyToolMap[e.key]);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        handleDelete(selectedIds);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setShowPanel(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [objects, selectedIds, handleUndo, handleRedo, handleDelete]);

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
              Whiteboard
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
        <Toolbar
          activeTool={tool}
          onToolChange={setTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(z * 1.2, 5))}
          onZoomOut={() => setZoom((z) => Math.max(z / 1.2, 0.1))}
          onResetView={() => setZoom(1)}
          strokeColor={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          fontSize={fontSize}
          fontFamily={fontFamily}
          onStrokeColorChange={setStrokeColor}
          onFillColorChange={setFillColor}
          onStrokeWidthChange={setStrokeWidth}
          onFontSizeChange={setFontSize}
          onFontFamilyChange={setFontFamily}
          onExportPNG={handleExportPNG}
          onExportJPG={handleExportJPG}
          onExportSVG={handleExportSVG}
          onExportPDF={handleExportPDF}
          onExportJSON={handleExportJSON}
          onUploadImage={handleUploadImage}
          onLoadTemplate={handleLoadTemplate}
        />
        <div className="relative flex-1 min-h-0 overflow-hidden" ref={stageRef}>
          <WhiteboardCanvas
            objects={objects}
            tool={tool}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
            opacity={1}
            fontSize={fontSize}
            fontFamily={fontFamily}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onDraw={handleDraw}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCursorMove={handleCursorMove}
            onZoomChange={handleZoomChange}
            zoom={zoom}
          />
          <CursorsOverlay cursors={cursors} />
          {showPanel && selectedObjects.length > 0 && (
            <ShapeEditorPanel
              selectedObjects={selectedObjects}
              onUpdate={handleShapeUpdate}
              onClose={() => {
                setShowPanel(false);
                setSelectedIds([]);
              }}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
            />
          )}
          <StatusBar
            zoom={zoom}
            mousePosition={{ x: 0, y: 0 }}
            connectedUsers={[]}
            isConnected={true}
          />
        </div>
      </div>
    </div>
  );
}
