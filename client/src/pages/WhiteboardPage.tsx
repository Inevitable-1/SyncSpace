import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setCurrentRoom } from '../features/room/roomSlice';
import { whiteboardService } from '../services/whiteboardService';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import Toolbar from '../components/whiteboard/Toolbar';
import StatusBar from '../components/whiteboard/StatusBar';
import CursorsOverlay from '../components/whiteboard/CursorsOverlay';
import ShapeEditorPanel from '../components/whiteboard/ShapeEditorPanel';
import type { ToolType, WhiteboardObject, WhiteboardUser } from '../types';

const TEMPLATES: Record<string, WhiteboardObject[]> = {
  flowchart: [
    {
      id: 'tmpl-start-1',
      type: 'rectangle',
      x: 250,
      y: 30,
      width: 200,
      height: 50,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 25,
    },
    {
      id: 'tmpl-decision-1',
      type: 'diamond',
      x: 275,
      y: 120,
      width: 150,
      height: 100,
      stroke: '#F59E0B',
      fill: '#FFFBEB',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-process-1',
      type: 'rect',
      x: 150,
      y: 270,
      width: 180,
      height: 60,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 4,
    },
    {
      id: 'tmpl-process-2',
      type: 'rect',
      x: 420,
      y: 270,
      width: 180,
      height: 60,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 4,
    },
    {
      id: 'tmpl-end-1',
      type: 'rectangle',
      x: 250,
      y: 380,
      width: 200,
      height: 50,
      stroke: '#EF4444',
      fill: '#FEF2F2',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 25,
    },
    {
      id: 'tmpl-text-start',
      type: 'text',
      x: 295,
      y: 43,
      text: 'Start',
      stroke: '#000',
      fill: '#000',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-text-decision',
      type: 'text',
      x: 310,
      y: 158,
      text: 'Valid?',
      stroke: '#000',
      fill: '#000',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-text-yes',
      type: 'text',
      x: 195,
      y: 285,
      text: 'Yes',
      stroke: '#22C55E',
      fill: '#22C55E',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-text-no',
      type: 'text',
      x: 475,
      y: 285,
      text: 'No',
      stroke: '#EF4444',
      fill: '#EF4444',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-text-end',
      type: 'text',
      x: 310,
      y: 393,
      text: 'End',
      stroke: '#000',
      fill: '#000',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
  ],
  mindmap: [
    {
      id: 'tmpl-center',
      type: 'mindmap',
      x: 300,
      y: 180,
      width: 180,
      height: 70,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-branch-1',
      type: 'mindmap',
      x: 60,
      y: 50,
      width: 140,
      height: 50,
      stroke: '#22C55E',
      fill: '#F0FDF4',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-branch-2',
      type: 'mindmap',
      x: 60,
      y: 310,
      width: 140,
      height: 50,
      stroke: '#F59E0B',
      fill: '#FFFBEB',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-branch-3',
      type: 'mindmap',
      x: 540,
      y: 50,
      width: 140,
      height: 50,
      stroke: '#EF4444',
      fill: '#FEF2F2',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-branch-4',
      type: 'mindmap',
      x: 540,
      y: 310,
      width: 140,
      height: 50,
      stroke: '#8B5CF6',
      fill: '#F5F3FF',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-center-text',
      type: 'text',
      x: 355,
      y: 202,
      text: 'Main Idea',
      stroke: '#000',
      fill: '#000',
      fontSize: 16,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-b1-text',
      type: 'text',
      x: 93,
      y: 68,
      text: 'Topic 1',
      stroke: '#000',
      fill: '#000',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-b2-text',
      type: 'text',
      x: 93,
      y: 328,
      text: 'Topic 2',
      stroke: '#000',
      fill: '#000',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-b3-text',
      type: 'text',
      x: 573,
      y: 68,
      text: 'Topic 3',
      stroke: '#000',
      fill: '#000',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-b4-text',
      type: 'text',
      x: 573,
      y: 328,
      text: 'Topic 4',
      stroke: '#000',
      fill: '#000',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-line-1',
      type: 'arrow',
      x: 300,
      y: 215,
      points: [0, 0, -120, -110],
      stroke: '#22C55E',
      strokeWidth: 2,
      opacity: 1,
      fill: '#22C55E',
    },
    {
      id: 'tmpl-line-2',
      type: 'arrow',
      x: 300,
      y: 250,
      points: [0, 0, -120, 100],
      stroke: '#F59E0B',
      strokeWidth: 2,
      opacity: 1,
      fill: '#F59E0B',
    },
    {
      id: 'tmpl-line-3',
      type: 'arrow',
      x: 480,
      y: 215,
      points: [0, 0, 120, -110],
      stroke: '#EF4444',
      strokeWidth: 2,
      opacity: 1,
      fill: '#EF4444',
    },
    {
      id: 'tmpl-line-4',
      type: 'arrow',
      x: 480,
      y: 250,
      points: [0, 0, 120, 100],
      stroke: '#8B5CF6',
      strokeWidth: 2,
      opacity: 1,
      fill: '#8B5CF6',
    },
  ],
  scrum: [
    {
      id: 'tmpl-backlog',
      type: 'rect',
      x: 20,
      y: 20,
      width: 200,
      height: 350,
      stroke: '#D1D5DB',
      fill: '#F9FAFB',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-todo',
      type: 'rect',
      x: 240,
      y: 20,
      width: 200,
      height: 350,
      stroke: '#D1D5DB',
      fill: '#F9FAFB',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-progress',
      type: 'rect',
      x: 460,
      y: 20,
      width: 200,
      height: 350,
      stroke: '#D1D5DB',
      fill: '#F9FAFB',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-done',
      type: 'rect',
      x: 680,
      y: 20,
      width: 200,
      height: 350,
      stroke: '#D1D5DB',
      fill: '#F9FAFB',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-h-backlog',
      type: 'text',
      x: 80,
      y: 32,
      text: 'Backlog',
      stroke: '#6B7280',
      fill: '#6B7280',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-h-todo',
      type: 'text',
      x: 305,
      y: 32,
      text: 'To Do',
      stroke: '#6B7280',
      fill: '#6B7280',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-h-progress',
      type: 'text',
      x: 505,
      y: 32,
      text: 'In Progress',
      stroke: '#6B7280',
      fill: '#6B7280',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-h-done',
      type: 'text',
      x: 745,
      y: 32,
      text: 'Done',
      stroke: '#6B7280',
      fill: '#6B7280',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-card-1',
      type: 'rectangle',
      x: 35,
      y: 65,
      width: 170,
      height: 50,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 6,
    },
    {
      id: 'tmpl-card-1t',
      type: 'text',
      x: 45,
      y: 80,
      text: 'Task: Design login',
      stroke: '#000',
      fill: '#000',
      fontSize: 11,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
  ],
  brainstorm: [
    {
      id: 'tmpl-bc-center',
      type: 'circle',
      x: 300,
      y: 150,
      radiusX: 80,
      radiusY: 80,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-bc-text',
      type: 'text',
      x: 335,
      y: 185,
      text: 'Ideas',
      stroke: '#000',
      fill: '#000',
      fontSize: 18,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-bc-idea1',
      type: 'cloud',
      x: 60,
      y: 40,
      width: 140,
      height: 80,
      stroke: '#22C55E',
      fill: '#F0FDF4',
      strokeWidth: 1.5,
      opacity: 1,
    },
    {
      id: 'tmpl-bc-idea1t',
      type: 'text',
      x: 95,
      y: 72,
      text: 'Idea 1',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-bc-idea2',
      type: 'cloud',
      x: 560,
      y: 40,
      width: 140,
      height: 80,
      stroke: '#F59E0B',
      fill: '#FFFBEB',
      strokeWidth: 1.5,
      opacity: 1,
    },
    {
      id: 'tmpl-bc-idea2t',
      type: 'text',
      x: 595,
      y: 72,
      text: 'Idea 2',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-bc-idea3',
      type: 'cloud',
      x: 60,
      y: 280,
      width: 140,
      height: 80,
      stroke: '#EF4444',
      fill: '#FEF2F2',
      strokeWidth: 1.5,
      opacity: 1,
    },
    {
      id: 'tmpl-bc-idea3t',
      type: 'text',
      x: 95,
      y: 312,
      text: 'Idea 3',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-bc-idea4',
      type: 'cloud',
      x: 560,
      y: 280,
      width: 140,
      height: 80,
      stroke: '#8B5CF6',
      fill: '#F5F3FF',
      strokeWidth: 1.5,
      opacity: 1,
    },
    {
      id: 'tmpl-bc-idea4t',
      type: 'text',
      x: 595,
      y: 312,
      text: 'Idea 4',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
  ],
  meeting: [
    {
      id: 'tmpl-m-title',
      type: 'rect',
      x: 20,
      y: 20,
      width: 760,
      height: 50,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 1.5,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-m-title-t',
      type: 'text',
      x: 300,
      y: 33,
      text: 'Meeting Notes',
      stroke: '#000',
      fill: '#000',
      fontSize: 18,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-m-date',
      type: 'rect',
      x: 20,
      y: 80,
      width: 200,
      height: 30,
      stroke: '#D1D5DB',
      fill: '#F9FAFB',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 4,
    },
    {
      id: 'tmpl-m-date-t',
      type: 'text',
      x: 30,
      y: 88,
      text: 'Date: ___________',
      stroke: '#6B7280',
      fill: '#6B7280',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect1',
      type: 'rect',
      x: 20,
      y: 130,
      width: 370,
      height: 200,
      stroke: '#D1D5DB',
      fill: '#FFFFFF',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 6,
    },
    {
      id: 'tmpl-m-sect1-h',
      type: 'text',
      x: 35,
      y: 140,
      text: 'Discussion Points',
      stroke: '#06B6D4',
      fill: '#06B6D4',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect1-1',
      type: 'text',
      x: 35,
      y: 165,
      text: '1. _______________',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect1-2',
      type: 'text',
      x: 35,
      y: 190,
      text: '2. _______________',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect1-3',
      type: 'text',
      x: 35,
      y: 215,
      text: '3. _______________',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect2',
      type: 'rect',
      x: 410,
      y: 130,
      width: 370,
      height: 200,
      stroke: '#D1D5DB',
      fill: '#FFFFFF',
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 6,
    },
    {
      id: 'tmpl-m-sect2-h',
      type: 'text',
      x: 425,
      y: 140,
      text: 'Action Items',
      stroke: '#F59E0B',
      fill: '#F59E0B',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect2-1',
      type: 'text',
      x: 425,
      y: 165,
      text: '[ ] _______________',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect2-2',
      type: 'text',
      x: 425,
      y: 190,
      text: '[ ] _______________',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'tmpl-m-sect2-3',
      type: 'text',
      x: 425,
      y: 215,
      text: '[ ] _______________',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
  ],
  architecture: [
    {
      id: 'tmpl-arch-client',
      type: 'rectangle',
      x: 20,
      y: 30,
      width: 180,
      height: 60,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-arch-client-t',
      type: 'text',
      x: 60,
      y: 52,
      text: 'Client App',
      stroke: '#000',
      fill: '#000',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-api',
      type: 'rectangle',
      x: 300,
      y: 30,
      width: 180,
      height: 60,
      stroke: '#22C55E',
      fill: '#F0FDF4',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-arch-api-t',
      type: 'text',
      x: 345,
      y: 52,
      text: 'API Gateway',
      stroke: '#000',
      fill: '#000',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-auth',
      type: 'rectangle',
      x: 580,
      y: 30,
      width: 180,
      height: 60,
      stroke: '#F59E0B',
      fill: '#FFFBEB',
      strokeWidth: 2,
      opacity: 1,
      cornerRadius: 8,
    },
    {
      id: 'tmpl-arch-auth-t',
      type: 'text',
      x: 625,
      y: 52,
      text: 'Auth Service',
      stroke: '#000',
      fill: '#000',
      fontSize: 14,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-be1',
      type: 'rectangle',
      x: 120,
      y: 170,
      width: 160,
      height: 55,
      stroke: '#8B5CF6',
      fill: '#F5F3FF',
      strokeWidth: 1.5,
      opacity: 1,
      cornerRadius: 6,
    },
    {
      id: 'tmpl-arch-be1-t',
      type: 'text',
      x: 155,
      y: 190,
      text: 'User Service',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-be2',
      type: 'rectangle',
      x: 340,
      y: 170,
      width: 160,
      height: 55,
      stroke: '#EF4444',
      fill: '#FEF2F2',
      strokeWidth: 1.5,
      opacity: 1,
      cornerRadius: 6,
    },
    {
      id: 'tmpl-arch-be2-t',
      type: 'text',
      x: 375,
      y: 190,
      text: 'Data Service',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-be3',
      type: 'rectangle',
      x: 560,
      y: 170,
      width: 160,
      height: 55,
      stroke: '#06B6D4',
      fill: '#ECFEFF',
      strokeWidth: 1.5,
      opacity: 1,
      cornerRadius: 6,
    },
    {
      id: 'tmpl-arch-be3-t',
      type: 'text',
      x: 595,
      y: 190,
      text: 'Notification Svc',
      stroke: '#000',
      fill: '#000',
      fontSize: 12,
      fontFamily: 'Inter',
      opacity: 1,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-db',
      type: 'database',
      x: 280,
      y: 290,
      width: 220,
      height: 70,
      stroke: '#6B7280',
      fill: '#F9FAFB',
      strokeWidth: 2,
      opacity: 1,
    },
    {
      id: 'tmpl-arch-db-t',
      type: 'text',
      x: 340,
      y: 315,
      text: 'Database',
      stroke: '#000',
      fill: '#000',
      fontSize: 13,
      fontFamily: 'Inter',
      opacity: 1,
      bold: true,
      italic: false,
      underline: false,
      align: 'center',
    },
    {
      id: 'tmpl-arch-arrow1',
      type: 'arrow',
      x: 200,
      y: 60,
      points: [0, 0, 100, 0],
      stroke: '#6B7280',
      strokeWidth: 2,
      opacity: 1,
      fill: '#6B7280',
    },
    {
      id: 'tmpl-arch-arrow2',
      type: 'arrow',
      x: 480,
      y: 60,
      points: [0, 0, 100, 0],
      stroke: '#6B7280',
      strokeWidth: 2,
      opacity: 1,
      fill: '#6B7280',
    },
    {
      id: 'tmpl-arch-arrow3',
      type: 'arrow',
      x: 390,
      y: 90,
      points: [0, 0, -100, 80],
      stroke: '#8B5CF6',
      strokeWidth: 1.5,
      opacity: 1,
      fill: '#8B5CF6',
    },
    {
      id: 'tmpl-arch-arrow4',
      type: 'arrow',
      x: 390,
      y: 90,
      points: [0, 0, 0, 80],
      stroke: '#EF4444',
      strokeWidth: 1.5,
      opacity: 1,
      fill: '#EF4444',
    },
    {
      id: 'tmpl-arch-arrow5',
      type: 'arrow',
      x: 390,
      y: 90,
      points: [0, 0, 100, 80],
      stroke: '#06B6D4',
      strokeWidth: 1.5,
      opacity: 1,
      fill: '#06B6D4',
    },
  ],
};

export default function WhiteboardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const dispatch = useAppDispatch();

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
    if (!roomId) return;
    try {
      const wb = await whiteboardService.getWhiteboard(roomId);
      if (wb) {
        setObjects(wb.objects as WhiteboardObject[]);
        setUndoStack([wb.objects as WhiteboardObject[]]);
        setRedoStack([]);
      }
      if (wb) {
        dispatch(setCurrentRoom({ _id: roomId, whiteboard: wb } as never));
      }
    } catch (err) {
      console.error('Failed to load whiteboard:', err);
    }
  }, [roomId, dispatch]);

  useEffect(() => {
    loadWhiteboard();
  }, [loadWhiteboard]);

  const saveWhiteboard = useCallback(async () => {
    if (!roomId) return;
    try {
      await whiteboardService.saveWhiteboard(roomId, objects);
    } catch (err) {
      console.error('Failed to save whiteboard:', err);
    }
  }, [roomId, objects]);

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
        const newObjects = objects.filter((o) => !selectedIds.includes(o.id));
        pushUndo(newObjects);
        setSelectedIds([]);
        return;
      }

      if (e.key === 'Escape') {
        setSelectedIds([]);
        setShowPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [objects, selectedIds, handleUndo, handleRedo, pushUndo]);

  const handleDraw = useCallback(
    (obj: WhiteboardObject) => {
      pushUndo([...objects, obj]);
    },
    [objects, pushUndo],
  );

  const handleUpdate = useCallback(
    (updated: WhiteboardObject) => {
      const newObjects = objects.map((o) => (o.id === updated.id ? updated : o));
      setObjects(newObjects);
    },
    [objects],
  );

  const handleDelete = useCallback(
    (objectId: string) => {
      const newObjects = objects.filter((o) => o.id !== objectId);
      pushUndo(newObjects);
    },
    [objects, pushUndo],
  );

  const handleClear = useCallback(() => {
    if (objects.length === 0) return;
    pushUndo([]);
  }, [objects, pushUndo]);

  const handleCursorMove = useCallback((_x: number, _y: number) => {}, []);

  const handleZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const handleExportPNG = useCallback(() => {
    const stage = document.querySelector('.konva-stage') as HTMLDivElement;
    if (!stage) return;
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleExportJPG = useCallback(() => {
    const stage = document.querySelector('.konva-stage') as HTMLDivElement;
    if (!stage) return;
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  }, []);

  const handleExportSVG = useCallback(() => {
    const svgParts: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">',
    ];
    for (const obj of objects) {
      const s = obj.stroke || '#000';
      const f = obj.fill === 'transparent' ? 'none' : (obj.fill as string) || 'none';
      const sw = obj.strokeWidth || 2;
      const op = obj.opacity ?? 1;
      switch (obj.type) {
        case 'rect':
        case 'process':
          svgParts.push(
            `<rect x="${obj.x}" y="${obj.y}" width="${obj.width || 0}" height="${obj.height || 0}" rx="${obj.cornerRadius || 0}" fill="${f}" stroke="${s}" stroke-width="${sw}" opacity="${op}"${obj.dashed ? ` stroke-dasharray="8 4"` : ''}/>`,
          );
          break;
        case 'circle':
        case 'ellipse':
          svgParts.push(
            `<ellipse cx="${obj.x + (obj.radiusX || 0)}" cy="${obj.y + (obj.radiusY || 0)}" rx="${obj.radiusX || 0}" ry="${obj.radiusY || 0}" fill="${f}" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`,
          );
          break;
        case 'line':
          if (obj.points && obj.points.length >= 4) {
            svgParts.push(
              `<line x1="${obj.x + obj.points[0]}" y1="${obj.y + obj.points[1]}" x2="${obj.x + obj.points[2]}" y2="${obj.y + obj.points[3]}" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`,
            );
          }
          break;
        case 'arrow':
          if (obj.points && obj.points.length >= 4) {
            svgParts.push(
              `<defs><marker id="arrowhead-${obj.id}" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${s}"/></marker></defs>`,
            );
            svgParts.push(
              `<line x1="${obj.x + obj.points[0]}" y1="${obj.y + obj.points[1]}" x2="${obj.x + obj.points[2]}" y2="${obj.y + obj.points[3]}" stroke="${s}" stroke-width="${sw}" opacity="${op}" marker-end="url(#arrowhead-${obj.id})"/>`,
            );
          }
          break;
        case 'text':
          svgParts.push(
            `<text x="${obj.x}" y="${obj.y + 16}" font-size="${obj.fontSize || 16}" font-family="${obj.fontFamily || 'Inter'}" fill="${f === 'none' ? s : f}" font-weight="${obj.bold ? 'bold' : 'normal'}" font-style="${obj.italic ? 'italic' : 'normal'}" text-decoration="${obj.underline ? 'underline' : ''}" text-anchor="${obj.align === 'center' ? 'middle' : obj.align === 'right' ? 'end' : 'start'}" opacity="${op}">${obj.text || ''}</text>`,
          );
          break;
        case 'triangle':
          if (obj.width && obj.height) {
            svgParts.push(
              `<polygon points="${obj.x + obj.width / 2},${obj.y} ${obj.x + obj.width},${obj.y + obj.height} ${obj.x},${obj.y + obj.height}" fill="${f}" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`,
            );
          }
          break;
        case 'diamond':
        case 'decision':
          if (obj.width && obj.height) {
            svgParts.push(
              `<polygon points="${obj.x + obj.width / 2},${obj.y} ${obj.x + obj.width},${obj.y + obj.height / 2} ${obj.x + obj.width / 2},${obj.y + obj.height} ${obj.x},${obj.y + obj.height / 2}" fill="${f}" stroke="${s}" stroke-width="${sw}" opacity="${op}"/>`,
            );
          }
          break;
      }
    }
    svgParts.push('</svg>');
    const blob = new Blob([svgParts.join('\n')], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [objects]);

  const handleExportPDF = useCallback(() => {
    const stage = document.querySelector('.konva-stage') as HTMLDivElement;
    if (!stage) return;
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify(objects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [objects]);

  const handleUploadImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 300;
          const ratio = Math.min(maxDim / img.width, maxDim / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const newObj: WhiteboardObject = {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'image',
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            width: w,
            height: h,
            src: e.target?.result as string,
            opacity: 1,
          };
          pushUndo([...objects, newObj]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [objects, pushUndo],
  );

  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const templateObjects = TEMPLATES[templateId];
      if (!templateObjects) return;
      const offset = Math.random() * 50;
      const newObjects = templateObjects.map((obj) => ({
        ...obj,
        id: `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${obj.id}`,
        x: (obj.x || 0) + offset,
        y: (obj.y || 0) + offset,
      }));
      pushUndo([...objects, ...newObjects]);
    },
    [objects, pushUndo],
  );

  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));

  const handleShapeUpdate = useCallback(
    (updated: WhiteboardObject) => {
      const newObjects = objects.map((o) => (o.id === updated.id ? updated : o));
      setObjects(newObjects);
    },
    [objects],
  );

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

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
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
        onResetView={() => {
          setZoom(1);
        }}
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
  );
}
