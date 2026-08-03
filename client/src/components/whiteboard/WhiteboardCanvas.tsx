import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Text } from 'react-konva';
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
        if (clickedOnEmpty) {
          onSelect([]);
        }
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
          text: 'Double click to edit',
          stroke: strokeColor,
          fill: strokeColor,
          fontSize,
          fontFamily,
          opacity,
        };
        onDraw(newObj);
        setEditingTextId(id);
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

  const [isDrawingSmooth, setIsDrawingSmooth] = useState(false);
  const lastPointsRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const smoothedPointsRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const pressureHistoryRef = useRef<number[]>([]);

  const smoothPoints = useCallback((points: { x: number; y: number; time: number }[]) => {
    if (points.length < 3) return points;

    const minDistance = 0.5;
    const result: { x: number; y: number; time: number }[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (result.length === 0) {
        result.push(point);
        continue;
      }

      const lastAdded = result[result.length - 1];
      const dx = point.x - lastAdded.x;
      const dy = point.y - lastAdded.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= minDistance) {
        result.push(point);
      }
    }

    return result;
  }, []);

  const interpolatePoints = useCallback((points: { x: number; y: number; time: number }[]) => {
    if (points.length < 2) return [];

    const result: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const segments = Math.max(2, Math.min(8, Math.round(dist / 2)));

      result.push(p1.x, p1.y);

      for (let t = 1 / segments; t < 1; t += 1 / segments) {
        const interpolatedX = p1.x + dx * t;
        const interpolatedY = p1.y + dy * t;

        const curveX = interpolatedX - dx * t * 0.1;
        const curveY = interpolatedY - dy * t * 0.1;

        result.push(curveX, curveY);
      }
    }

    if (points.length >= 2) {
      const last = points[points.length - 1];
      result.push(last.x, last.y);
    }

    return result;
  }, []);

  const updateSmoothedPoints = useCallback(() => {
    if (lastPointsRef.current.length > 0 && !isDrawingSmooth) {
      setIsDrawingSmooth(true);
      const smoothed = smoothPoints(lastPointsRef.current);
      const interpolated = interpolatePoints(smoothed);
      smoothedPointsRef.current = interpolated;

      setCurrentObject((prev) => {
        if (!prev || prev.type !== 'line') return prev;

        const newStrokeWidth =
          pressureHistoryRef.current.length > 0
            ? Math.max(
                1,
                Math.min(8, 2 + pressureHistoryRef.current[pressureHistoryRef.current.length - 1]),
              )
            : prev.strokeWidth || 2;

        return {
          ...prev,
          points: interpolated,
          strokeWidth: newStrokeWidth,
          tension: 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        };
      });

      setIsDrawingSmooth(false);
      lastPointsRef.current = [];
      pressureHistoryRef.current = [];
    }
    animationFrameRef.current = null;
  }, [smoothPoints, interpolatePoints, isDrawingSmooth]);

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

    const now = performance.now();

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

      lastPointsRef.current.push({ x: pos.x, y: pos.y, time: now });
      pressureHistoryRef.current.push(Math.max(1, Math.min(8, 2 + distance / 5)));

      if (lastPointsRef.current.length > 1) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updateSmoothedPoints);
      }
    } else if (tool === 'line' || tool === 'arrow') {
      setCurrentObject({
        ...currentObject,
        points: [0, 0, pos.x - currentObject.x, pos.y - currentObject.y],
      });
    } else if (tool === 'rectangle') {
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
  }, [
    isPanning,
    isDrawing,
    currentObject,
    tool,
    lastPanPoint,
    getPointerPosition,
    onCursorMove,
    updateSmoothedPoints,
  ]);

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
          ((currentObject.radiusX || 0) > 2 || (currentObject.radiusY || 0) > 2));

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
        width: Math.max(5, (obj.width || 0) * scaleX),
        height: Math.max(5, (obj.height || 0) * scaleY),
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

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const obj = objects.find((o) => o.id === objectId);
      textarea.value = (obj?.text as string) || '';
      textarea.style.position = 'absolute';
      textarea.style.top = `${areaPosition.y}px`;
      textarea.style.left = `${areaPosition.x}px`;
      textarea.style.width = `${Math.max(150, (obj?.width as number) || 150)}px`;
      textarea.style.fontSize = `${(obj?.fontSize as number) || fontSize}px`;
      textarea.style.fontFamily = (obj?.fontFamily as string) || fontFamily;
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
        if (ke.key === 'Enter' && !ke.shiftKey) {
          textarea.blur();
        }
        if (ke.key === 'Escape') {
          textarea.blur();
        }
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

  const renderObject = (obj: WhiteboardObject) => {
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
      onDblClick: () => {
        if (obj.type === 'text') handleTextDblClick(obj.id);
      },
    };

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
            fill={(obj.fill as string) || obj.stroke || '#000'}
            onDblClick={() => handleTextDblClick(obj.id)}
          />
        );
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
      default:
        return null;
    }
  };

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
        className="bg-[var(--bg-primary)]"
      >
        <Layer>
          <Rect
            id="grid-bg"
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="transparent"
          />
          {objects.map((obj) => renderObject(obj))}
          {renderCurrentObject()}
        </Layer>
      </Stage>
    </div>
  );
}
