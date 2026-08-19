import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import Toolbar from '../components/whiteboard/Toolbar';
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
  const [strokeColor, setStrokeColor] = useState('#1E293B');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [zoom, setZoom] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState<Map<string, WhiteboardUser>>(new Map());
  const [undoStack, setUndoStack] = useState<WhiteboardObject[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardObject[][]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

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
      setSaveStatus('unsaved');
    },
    [],
  );

  const handleUserJoined = useCallback(
    (u: WhiteboardUser) => {
      showToast(`${u.userName} joined the whiteboard`, 'info');
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
        // empty board
      }
    };
    loadWhiteboard();
  }, [roomId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (roomId && objectsRef.current.length > 0) {
        setSaveStatus('saving');
        emitSave();
        whiteboardService
          .saveWhiteboard(roomId, objectsRef.current)
          .then(() => setSaveStatus('saved'))
          .catch(() => setSaveStatus('unsaved'));
      }
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [roomId, emitSave]);

  const handleDraw = useCallback(
    (object: WhiteboardObject) => {
      setObjects((prev) => {
        const next = [...prev, object];
        setUndoStack((uPrev) => [...uPrev.slice(-50), prev]);
        setRedoStack([]);
        return next;
      });
      emitDraw(object);
      setSaveStatus('unsaved');
    },
    [emitDraw],
  );

  const handleUpdate = useCallback(
    (object: WhiteboardObject) => {
      setObjects((prev) => {
        const next = prev.map((o) => (o.id === object.id ? object : o));
        setUndoStack((uPrev) => [...uPrev.slice(-50), prev]);
        setRedoStack([]);
        return next;
      });
      emitUpdate(object);
      setSaveStatus('unsaved');
    },
    [emitUpdate],
  );

  const handleDelete = useCallback(
    (objectId: string) => {
      setObjects((prev) => {
        const next = prev.filter((o) => o.id !== objectId);
        setUndoStack((uPrev) => [...uPrev.slice(-50), prev]);
        setRedoStack([]);
        return next;
      });
      emitDelete(objectId);
      setSaveStatus('unsaved');
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

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.2, 5)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.2, 0.1)), []);
  const handleResetView = useCallback(() => setZoom(1), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleUndo, handleRedo]);

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
      case 'triangle':
      case 'diamond':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'eraser':
        return 'pointer';
      default:
        return 'default';
    }
  }, [tool]);

  // Export helpers
  const getStageCanvas = useCallback(() => {
    const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
    return stageEl;
  }, []);

  const handleExportPNG = useCallback(() => {
    const canvas = getStageCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Exported as PNG', 'success');
  }, [getStageCanvas, showToast]);

  const handleExportJPG = useCallback(() => {
    const canvas = getStageCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'whiteboard.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Exported as JPG', 'success');
  }, [getStageCanvas, showToast]);

  const handleExportPDF = useCallback(() => {
    const canvas = getStageCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Whiteboard Export</title>
      <style>@page{size:landscape;margin:0}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;height:auto}</style>
      </head><body>
      <img src="${dataUrl}" onload="window.print();window.close()" />
      </body></html>
    `);
    win.document.close();
    showToast('PDF export opened', 'success');
  }, [getStageCanvas, showToast]);

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(objects, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'whiteboard.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Exported as JSON', 'success');
  }, [objects, showToast]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!roomId) return;
      try {
        const result = await whiteboardService.uploadImage(roomId, file);
        const img = new window.Image();
        img.onload = () => {
          const maxW = 400;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const newObj: WhiteboardObject = {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'image',
            x: 100,
            y: 100,
            width: img.width * scale,
            height: img.height * scale,
            src: result.url,
            opacity: 1,
          };
          handleDraw(newObj);
        };
        img.src = result.url;
        showToast('Image uploaded', 'success');
      } catch {
        showToast('Image upload failed', 'error');
      }
    },
    [roomId, handleDraw, showToast],
  );

  const handleManualSave = useCallback(() => {
    if (!roomId) return;
    setSaveStatus('saving');
    emitSave();
    whiteboardService
      .saveWhiteboard(roomId, objects)
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('unsaved'));
  }, [roomId, objects, emitSave]);

  const saveStatusText =
    saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : '';
  const saveStatusColor = saveStatus === 'saving' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none">
      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-10 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="text-sm font-semibold text-gray-800">Whiteboard</h1>
          <span className="text-[11px] text-gray-400">Room: {roomId?.slice(0, 8)}...</span>
          {saveStatusText && (
            <span className={`text-[11px] font-medium ${saveStatusColor}`}>{saveStatusText}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {connectedUsers.slice(0, 5).map((u) => (
              <div
                key={u.socketId}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white"
                style={{ backgroundColor: u.color }}
                title={u.userName}
              >
                {u.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {connectedUsers.length > 5 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-gray-500 bg-gray-100 border-2 border-white">
                +{connectedUsers.length - 5}
              </div>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <button
            onClick={handleManualSave}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
          >
            Save
          </button>
        </div>
      </motion.div>

      {/* Formatting Toolbar */}
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
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onUploadImage={handleUploadImage}
      />

      {/* Canvas Area */}
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
