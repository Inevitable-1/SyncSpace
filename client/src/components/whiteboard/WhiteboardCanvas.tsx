import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Arrow,
  Text,
  Group,
  Image as KonvaImage,
} from 'react-konva';
import type Konva from 'konva';
import type { WhiteboardObject, ToolType } from '../../types';

interface WhiteboardCanvasProps {
  objects: WhiteboardObject[];
  tool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onDraw: (object: WhiteboardObject) => void;
  onUpdate: (object: WhiteboardObject) => void;
  onDelete: (objectId: string) => void;
  onCursorMove: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
}

function useHtmlImage(src: string | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);
  return img;
}

function ImageObject({
  obj,
  isSelected,
  onDragEnd,
  onTransformEnd,
  onClick,
}: {
  obj: WhiteboardObject;
  isSelected: boolean;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: () => void;
  onClick: () => void;
}) {
  const img = useHtmlImage(obj.src as string);
  if (!img) return null;
  return (
    <KonvaImage
      id={obj.id}
      x={obj.x}
      y={obj.y}
      width={obj.width || 200}
      height={obj.height || 200}
      image={img}
      opacity={obj.opacity ?? 1}
      draggable
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      stroke={isSelected ? '#6366f1' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}

const STICKY_COLORS: Record<string, string> = {
  'sticky-yellow': '#FEF3C7',
  'sticky-green': '#D1FAE5',
  'sticky-blue': '#DBEAFE',
  'sticky-pink': '#FCE7F3',
};

const STICKY_TEXT_COLORS: Record<string, string> = {
  'sticky-yellow': '#92400E',
  'sticky-green': '#065F46',
  'sticky-blue': '#1E40AF',
  'sticky-pink': '#9D174D',
};

export default function WhiteboardCanvas({
  objects,
  tool,
  strokeColor,
  fillColor,
  strokeWidth,
  opacity,
  fontSize,
  fontFamily,
  selectedIds,
  onSelect,
  onDraw,
  onUpdate,
  onDelete,
  onCursorMove,
  onZoomChange,
}: WhiteboardCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [currentObject, setCurrentObject] = useState<WhiteboardObject | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stagePos.x) / zoom,
      y: (pointer.y - stagePos.y) / zoom,
    };
  }, [stagePos, zoom]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scaleBy = 1.1;
      const oldScale = zoom;
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };
      const direction = e.deltaY < 0 ? 1 : -1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.min(Math.max(newScale, 0.1), 5);
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      setZoom(clampedScale);
      setStagePos(newPos);
      onZoomChange(clampedScale);
    },
    [zoom, stagePos, onZoomChange],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const clickedOnEmpty =
        e.target === e.target.getStage() || e.target.getParent() === e.target.getStage();
      const pos = getPointerPosition();

      if (tool === 'hand') {
        setIsPanning(true);
        const pointer = stageRef.current?.getPointerPosition();
        if (pointer) setLastPanPoint(pointer);
        return;
      }

      if (tool === 'pointer') {
        if (clickedOnEmpty) onSelect([]);
        return;
      }

      if (tool === 'eraser') {
        const target = e.target;
        const objId = target.id();
        if (objId && objId !== 'grid-bg') {
          onDelete(objId);
        }
        return;
      }

      if (tool === 'text') {
        const id = `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newObj: WhiteboardObject = {
          id,
          type: 'text',
          x: pos.x,
          y: pos.y,
          text: 'Type here...',
          stroke: strokeColor,
          fill: strokeColor,
          fontSize,
          fontFamily,
          opacity,
          bold: false,
          italic: false,
          underline: false,
          align: 'left',
        };
        onDraw(newObj);
        setEditingTextId(id);
        return;
      }

      if (tool === 'image') return;

      if (tool.startsWith('sticky-')) {
        const id = `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newObj: WhiteboardObject = {
          id,
          type: 'sticky',
          x: pos.x - 75,
          y: pos.y - 75,
          width: 150,
          height: 150,
          fill: STICKY_COLORS[tool] || '#FEF3C7',
          text: 'Note',
          fontSize: 14,
          fontFamily: 'Inter',
          opacity: 1,
          stroke: 'transparent',
          strokeWidth: 0,
        };
        onDraw(newObj);
        return;
      }

      setIsDrawing(true);

      if (tool === 'pencil') {
        const id = `pencil-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'line',
          x: pos.x,
          y: pos.y,
          points: [0, 0],
          stroke: strokeColor,
          strokeWidth,
          opacity,
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        });
      } else if (tool === 'line') {
        const id = `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'line',
          x: pos.x,
          y: pos.y,
          points: [0, 0, 0, 0],
          stroke: strokeColor,
          strokeWidth,
          opacity,
        });
      } else if (tool === 'rectangle') {
        const id = `rect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'rect',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity,
        });
      } else if (tool === 'circle') {
        const id = `circle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'circle',
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity,
        });
      } else if (tool === 'arrow') {
        const id = `arrow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'arrow',
          x: pos.x,
          y: pos.y,
          points: [0, 0, 0, 0],
          stroke: strokeColor,
          strokeWidth,
          opacity,
          fill: strokeColor,
        });
      } else if (tool === 'triangle') {
        const id = `tri-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'triangle',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity,
        });
      } else if (tool === 'diamond') {
        const id = `dia-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCurrentObject({
          id,
          type: 'diamond',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity,
        });
      }
    },
    [
      tool,
      strokeColor,
      fillColor,
      strokeWidth,
      opacity,
      fontSize,
      fontFamily,
      getPointerPosition,
      onSelect,
      onDelete,
      onDraw,
    ],
  );

  const handleMouseMove = useCallback(() => {
    const pos = getPointerPosition();
    onCursorMove(pos.x, pos.y);

    if (isPanning) {
      const pointer = stageRef.current?.getPointerPosition();
      if (pointer) {
        const dx = pointer.x - lastPanPoint.x;
        const dy = pointer.y - lastPanPoint.y;
        setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPanPoint(pointer);
      }
      return;
    }

    if (!isDrawing || !currentObject) return;

    if (tool === 'pencil' && currentObject.type === 'line' && currentObject.points) {
      const lastPoint =
        currentObject.points.length >= 2
          ? [
              currentObject.points[currentObject.points.length - 2],
              currentObject.points[currentObject.points.length - 1],
            ]
          : [0, 0];
      const dx = pos.x - (currentObject.x + (lastPoint[0] as number));
      const dy = pos.y - (currentObject.y + (lastPoint[1] as number));
      const distance = Math.sqrt(dx * dx + dy * dy);

      setCurrentObject({
        ...currentObject,
        points: [...(currentObject.points || []), pos.x - currentObject.x, pos.y - currentObject.y],
        strokeWidth: Math.max(1, Math.min(8, 2 + distance / 5)),
      });
    } else if (tool === 'line' || tool === 'arrow') {
      setCurrentObject({
        ...currentObject,
        points: [0, 0, pos.x - currentObject.x, pos.y - currentObject.y],
      });
    } else if (tool === 'rectangle' || tool === 'triangle' || tool === 'diamond') {
      setCurrentObject({
        ...currentObject,
        width: pos.x - currentObject.x,
        height: pos.y - currentObject.y,
      });
    } else if (tool === 'circle') {
      setCurrentObject({
        ...currentObject,
        radiusX: Math.abs(pos.x - currentObject.x),
        radiusY: Math.abs(pos.y - currentObject.y),
      });
    }
  }, [isPanning, isDrawing, currentObject, tool, lastPanPoint, getPointerPosition, onCursorMove]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentObject) {
      const hasSize =
        (tool === 'pencil' && currentObject.points && currentObject.points.length > 2) ||
        (tool === 'line' && currentObject.points) ||
        (tool === 'arrow' && currentObject.points) ||
        (tool === 'rectangle' &&
          (Math.abs(currentObject.width || 0) > 2 || Math.abs(currentObject.height || 0) > 2)) ||
        (tool === 'circle' &&
          ((currentObject.radiusX || 0) > 2 || (currentObject.radiusY || 0) > 2)) ||
        (tool === 'triangle' &&
          (Math.abs(currentObject.width || 0) > 2 || Math.abs(currentObject.height || 0) > 2)) ||
        (tool === 'diamond' &&
          (Math.abs(currentObject.width || 0) > 2 || Math.abs(currentObject.height || 0) > 2));

      if (hasSize) {
        onDraw(currentObject);
      }
    }

    setIsDrawing(false);
    setCurrentObject(null);
  }, [isPanning, isDrawing, currentObject, tool, onDraw]);

  const handleObjectDragEnd = useCallback(
    (objectId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const obj = objects.find((o) => o.id === objectId);
      if (obj) {
        onUpdate({ ...obj, x: e.target.x(), y: e.target.y() });
      }
    },
    [objects, onUpdate],
  );

  const handleObjectTransformEnd = useCallback(
    (objectId: string) => {
      const stage = stageRef.current;
      if (!stage) return;
      const node = stage.findOne(`#${objectId}`);
      if (!node) return;
      const obj = objects.find((o) => o.id === objectId);
      if (!obj) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onUpdate({
        ...obj,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, (obj.width || 100) * scaleX),
        height: Math.max(5, (obj.height || 100) * scaleY),
      });
    },
    [objects, onUpdate],
  );

  const handleTextDblClick = useCallback(
    (objectId: string) => {
      const stage = stageRef.current;
      if (!stage) return;
      const textNode = stage.findOne(`#${objectId}`);
      if (!textNode) return;
      setEditingTextId(objectId);
      const textPosition = textNode.getAbsolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      const areaPosition = {
        x: stageBox.left + textPosition.x,
        y: stageBox.top + textPosition.y,
      };
      const obj = objects.find((o) => o.id === objectId);
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.value = (obj?.text as string) || '';
      textarea.style.position = 'absolute';
      textarea.style.top = `${areaPosition.y}px`;
      textarea.style.left = `${areaPosition.x}px`;
      textarea.style.width = `${Math.max(150, (obj?.width as number) || 150)}px`;
      textarea.style.fontSize = `${(obj?.fontSize as number) || fontSize}px`;
      textarea.style.fontFamily = (obj?.fontFamily as string) || fontFamily;
      textarea.style.fontWeight = obj?.bold ? 'bold' : 'normal';
      textarea.style.fontStyle = obj?.italic ? 'italic' : 'normal';
      textarea.style.textDecoration = obj?.underline ? 'underline' : 'none';
      textarea.style.textAlign = (obj?.align as string) || 'left';
      textarea.style.border = '2px solid #6366f1';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '4px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'white';
      textarea.style.color = (obj?.stroke as string) || strokeColor;
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.lineHeight = '1.2';
      textarea.style.zIndex = '1000';
      textarea.style.transformOrigin = 'left top';
      textarea.focus();
      const handleBlur = () => {
        const newText = textarea.value;
        if (newText !== obj?.text) {
          onUpdate({ ...obj!, text: newText } as WhiteboardObject);
        }
        document.body.removeChild(textarea);
        setEditingTextId(null);
      };
      textarea.addEventListener('blur', handleBlur);
      textarea.addEventListener('keydown', (ke) => {
        if (ke.key === 'Enter' && !ke.shiftKey) textarea.blur();
        if (ke.key === 'Escape') textarea.blur();
      });
    },
    [objects, fontSize, fontFamily, strokeColor, onUpdate],
  );

  const handleDeleteKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editingTextId) return;
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => onDelete(id));
          onSelect([]);
        }
      }
      if (e.key === 'Escape') {
        onSelect([]);
        setEditingTextId(null);
      }
    },
    [selectedIds, editingTextId, onDelete, onSelect],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleDeleteKey);
    return () => window.removeEventListener('keydown', handleDeleteKey);
  }, [handleDeleteKey]);

  const renderTriangle = (obj: WhiteboardObject, isPreview = false) => {
    const w = obj.width || 0;
    const h = obj.height || 0;
    const points = [w / 2, 0, w, h, 0, h];
    return (
      <Line
        key={obj.id}
        id={obj.id}
        x={obj.x}
        y={obj.y}
        points={points}
        closed
        stroke={obj.stroke || '#000'}
        fill={obj.fill === 'transparent' ? undefined : (obj.fill as string)}
        strokeWidth={obj.strokeWidth || 2}
        opacity={obj.opacity ?? 1}
        draggable={tool === 'pointer' && !isPreview}
        onClick={() => {
          if (tool === 'pointer') onSelect([obj.id]);
        }}
        onDragEnd={(e) => handleObjectDragEnd(obj.id, e)}
        onTransformEnd={() => handleObjectTransformEnd(obj.id)}
      />
    );
  };

  const renderDiamond = (obj: WhiteboardObject, isPreview = false) => {
    const w = obj.width || 0;
    const h = obj.height || 0;
    const points = [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2];
    return (
      <Line
        key={obj.id}
        id={obj.id}
        x={obj.x}
        y={obj.y}
        points={points}
        closed
        stroke={obj.stroke || '#000'}
        fill={obj.fill === 'transparent' ? undefined : (obj.fill as string)}
        strokeWidth={obj.strokeWidth || 2}
        opacity={obj.opacity ?? 1}
        draggable={tool === 'pointer' && !isPreview}
        onClick={() => {
          if (tool === 'pointer') onSelect([obj.id]);
        }}
        onDragEnd={(e) => handleObjectDragEnd(obj.id, e)}
        onTransformEnd={() => handleObjectTransformEnd(obj.id)}
      />
    );
  };

  const renderSticky = (obj: WhiteboardObject) => {
    return (
      <Group
        key={obj.id}
        id={obj.id}
        x={obj.x}
        y={obj.y}
        opacity={obj.opacity ?? 1}
        draggable={tool === 'pointer'}
        onClick={() => {
          if (tool === 'pointer') onSelect([obj.id]);
        }}
        onDragEnd={(e) => handleObjectDragEnd(obj.id, e)}
        onTransformEnd={() => handleObjectTransformEnd(obj.id)}
      >
        <Rect
          width={obj.width || 150}
          height={obj.height || 150}
          fill={obj.fill as string}
          cornerRadius={4}
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={8}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.3}
        />
        <Text
          text={(obj.text as string) || 'Note'}
          x={8}
          y={8}
          width={(obj.width || 150) - 16}
          height={(obj.height || 150) - 16}
          fontSize={obj.fontSize || 14}
          fontFamily={(obj.fontFamily as string) || 'Inter'}
          fill={STICKY_TEXT_COLORS[obj.fill as string] || '#374151'}
          align="left"
          onDblClick={() => handleTextDblClick(obj.id)}
        />
      </Group>
    );
  };

  const renderObject = (obj: WhiteboardObject) => {
    const isSelected = selectedIds.includes(obj.id);
    const commonProps = {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      opacity: obj.opacity ?? 1,
      draggable: tool === 'pointer',
      onClick: () => {
        if (tool === 'pointer') onSelect([obj.id]);
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleObjectDragEnd(obj.id, e),
      onTransformEnd: () => handleObjectTransformEnd(obj.id),
    };

    if (obj.type === 'sticky') return renderSticky(obj);

    if (obj.type === 'image') {
      return (
        <ImageObject
          key={obj.id}
          obj={obj}
          isSelected={isSelected}
          onDragEnd={(e) => handleObjectDragEnd(obj.id, e)}
          onTransformEnd={() => handleObjectTransformEnd(obj.id)}
          onClick={() => {
            if (tool === 'pointer') onSelect([obj.id]);
          }}
        />
      );
    }

    switch (obj.type) {
      case 'line':
        return (
          <Line
            key={obj.id}
            {...commonProps}
            points={obj.points as number[]}
            stroke={obj.stroke || '#000'}
            strokeWidth={obj.strokeWidth || 2}
            tension={obj.tension as number | undefined}
            lineCap={obj.lineCap as 'round' | 'butt' | 'square' | undefined}
            lineJoin={obj.lineJoin as 'round' | 'bevel' | 'miter' | undefined}
            hitStrokeWidth={20}
          />
        );
      case 'rect':
        return (
          <Rect
            key={obj.id}
            {...commonProps}
            width={obj.width || 0}
            height={obj.height || 0}
            stroke={obj.stroke || '#000'}
            fill={obj.fill === 'transparent' ? undefined : (obj.fill as string)}
            strokeWidth={obj.strokeWidth || 2}
            cornerRadius={4}
          />
        );
      case 'circle':
        return (
          <Circle
            key={obj.id}
            {...commonProps}
            radiusX={obj.radiusX || 0}
            radiusY={obj.radiusY || 0}
            stroke={obj.stroke || '#000'}
            fill={obj.fill === 'transparent' ? undefined : (obj.fill as string)}
            strokeWidth={obj.strokeWidth || 2}
          />
        );
      case 'arrow':
        return (
          <Arrow
            key={obj.id}
            {...commonProps}
            points={obj.points as number[]}
            stroke={obj.stroke || '#000'}
            fill={(obj.fill as string) || obj.stroke || '#000'}
            strokeWidth={obj.strokeWidth || 2}
            pointerLength={10}
            pointerWidth={10}
            hitStrokeWidth={20}
          />
        );
      case 'text':
        return (
          <Text
            key={obj.id}
            {...commonProps}
            text={(obj.text as string) || ''}
            fontSize={obj.fontSize || 16}
            fontFamily={(obj.fontFamily as string) || 'Inter'}
            fontStyle={`${obj.italic ? 'italic' : ''} ${obj.bold ? 'bold' : ''}`.trim() || 'normal'}
            fill={(obj.fill as string) || obj.stroke || '#000'}
            align={(obj.align as 'left' | 'center' | 'right') || 'left'}
            textDecoration={obj.underline ? 'underline' : ''}
            onDblClick={() => handleTextDblClick(obj.id)}
          />
        );
      case 'triangle':
        return renderTriangle(obj);
      case 'diamond':
        return renderDiamond(obj);
      default:
        return null;
    }
  };

  const renderCurrentObject = () => {
    if (!currentObject) return null;
    switch (currentObject.type) {
      case 'line':
        return (
          <Line
            points={currentObject.points as number[]}
            stroke={currentObject.stroke || '#000'}
            strokeWidth={currentObject.strokeWidth || 2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'rect':
        return (
          <Rect
            x={currentObject.x}
            y={currentObject.y}
            width={currentObject.width || 0}
            height={currentObject.height || 0}
            stroke={currentObject.stroke || '#000'}
            fill={currentObject.fill === 'transparent' ? undefined : (currentObject.fill as string)}
            strokeWidth={currentObject.strokeWidth || 2}
            cornerRadius={4}
          />
        );
      case 'circle':
        return (
          <Circle
            x={currentObject.x}
            y={currentObject.y}
            radiusX={currentObject.radiusX || 0}
            radiusY={currentObject.radiusY || 0}
            stroke={currentObject.stroke || '#000'}
            fill={currentObject.fill === 'transparent' ? undefined : (currentObject.fill as string)}
            strokeWidth={currentObject.strokeWidth || 2}
          />
        );
      case 'arrow':
        return (
          <Arrow
            x={currentObject.x}
            y={currentObject.y}
            points={currentObject.points as number[]}
            stroke={currentObject.stroke || '#000'}
            fill={(currentObject.fill as string) || currentObject.stroke || '#000'}
            strokeWidth={currentObject.strokeWidth || 2}
            pointerLength={10}
            pointerWidth={10}
          />
        );
      case 'triangle':
        return renderTriangle(currentObject, true);
      case 'diamond':
        return renderDiamond(currentObject, true);
      default:
        return null;
    }
  };

  const gridSize = 20;
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    const startX = -5000;
    const endX = 5000;
    const startY = -5000;
    const endY = 5000;
    for (let x = startX; x <= endX; x += gridSize) {
      gridLines.push(
        <Line
          key={`v${x}`}
          points={[x, startY, x, endY]}
          stroke="#E5E7EB"
          strokeWidth={0.5}
          listening={false}
        />,
      );
    }
    for (let y = startY; y <= endY; y += gridSize) {
      gridLines.push(
        <Line
          key={`h${y}`}
          points={[startX, y, endX, y]}
          stroke="#E5E7EB"
          strokeWidth={0.5}
          listening={false}
        />,
      );
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full" onWheel={handleWheel}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <Layer>
          <Rect id="grid-bg" x={-10000} y={-10000} width={20000} height={20000} fill="#FFFFFF" />
          {gridLines}
          {objects.map((obj) => renderObject(obj))}
          {renderCurrentObject()}
        </Layer>
      </Stage>
      <button
        onClick={() => setShowGrid(!showGrid)}
        className="absolute bottom-12 right-4 z-20 px-2 py-1 text-[10px] rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm"
      >
        {showGrid ? 'Hide Grid' : 'Show Grid'}
      </button>
    </div>
  );
}
