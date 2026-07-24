import { useRef, useEffect, useCallback } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateDocumentContent } from '../../features/editor/editorSlice';
import { useToast } from '../common/Toast';
import type { RootState } from '../../store';
import type { EditorCursor, EditorSelection } from '../../types';
import type { editor } from 'monaco-editor';

interface MonacoEditorProps {
  cursors: Map<string, EditorCursor>;
  selections: Map<string, EditorSelection>;
  onCodeChange: (
    fileName: string,
    content: string,
    cursor: { line: number; column: number },
  ) => void;
  onCursorChange: (cursor: { line: number; column: number }, fileName: string) => void;
  onSelectionChange: (
    selection: {
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    },
    fileName: string,
  ) => void;
  onSave: (fileName: string, content: string) => void;
}

export default function MonacoEditor({
  cursors,
  onCodeChange,
  onCursorChange,
  onSelectionChange,
  onSave,
}: MonacoEditorProps) {
  const dispatch = useAppDispatch();
  const { currentFile, settings } = useSelector((state: RootState) => state.editor);
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const cursorWidgetsRef = useRef<Map<string, editor.IContentWidget>>(new Map());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const contentRef = useRef<string>('');

  const handleEditorMount: OnMount = useCallback(
    (ed, monaco) => {
      editorRef.current = ed;
      monacoRef.current = monaco;

      ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (currentFile) {
          const content = ed.getValue();
          onSave(currentFile.path, content);
          dispatch(updateDocumentContent({ id: currentFile._id, content }));
          showToast('Document saved', 'success');
        }
      });

      ed.onDidChangeCursorPosition((e) => {
        if (currentFile) {
          onCursorChange(
            { line: e.position.lineNumber, column: e.position.column },
            currentFile.path,
          );
        }
      });

      ed.onDidChangeCursorSelection((e) => {
        if (currentFile && !e.selection.isEmpty()) {
          const sel = e.selection;
          onSelectionChange(
            {
              startLine: sel.startLineNumber,
              startColumn: sel.startColumn,
              endLine: sel.endLineNumber,
              endColumn: sel.endColumn,
            },
            currentFile.path,
          );
        }
      });
    },
    [currentFile, onCursorChange, onSelectionChange, onSave, dispatch, showToast],
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (!currentFile || value === undefined) return;
      contentRef.current = value;

      onCodeChange(currentFile.path, value, { line: 1, column: 1 });

      if (settings.autoSave) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          onSave(currentFile.path, value);
          dispatch(updateDocumentContent({ id: currentFile._id, content: value }));
        }, 2000);
      }
    },
    [currentFile, settings.autoSave, onCodeChange, onSave, dispatch],
  );

  useEffect(() => {
    const ed = editorRef.current;
    if (ed && currentFile) {
      const currentContent = ed.getValue();
      if (currentContent !== currentFile.content) {
        ed.setValue(currentFile.content || '');
      }
      contentRef.current = currentFile.content || '';
    }
  }, [currentFile]);

  useEffect(() => {
    const ed = editorRef.current;
    if (ed) {
      ed.updateOptions({
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap,
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers ? 'on' : 'off',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (!currentFile) return;

    const monaco = monacoRef.current;
    const ed = editorRef.current;

    if (!monaco || !ed) return;

    const existingModel = ed.getModel();
    if (existingModel) {
      existingModel.dispose();
    }

    const lang = currentFile.language || 'plaintext';
    const model = monaco.editor.createModel(currentFile.content || '', lang);
    ed.setModel(model);

    ed.updateOptions({
      fontSize: settings.fontSize,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap,
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers ? 'on' : 'off',
    });
  }, [currentFile?._id]);

  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;

    if (!ed || !monaco || !currentFile) return;

    const newDecorations: editor.IModelDeltaDecoration[] = [];

    cursors.forEach((cursorData, socketId) => {
      if (cursorData.fileName !== currentFile.path) return;
      if (cursorData.userId === user?.id) return;

      const line = cursorData.cursor.line;
      const col = cursorData.cursor.column;

      newDecorations.push({
        range: new monaco.Range(line, col, line, col + 1),
        options: {
          className: `remote-cursor-${socketId}`,
          afterContentClassName: `remote-cursor-label-${socketId}`,
          hoverMessage: { value: `**${cursorData.userName}** is editing here` },
        },
      });

      const labelId = `cursor-label-${socketId}`;
      const existingWidget = cursorWidgetsRef.current.get(labelId);
      if (existingWidget) {
        ed.removeContentWidget(existingWidget);
      }

      const widget: editor.IContentWidget = {
        getId: () => labelId,
        getDomNode: () => {
          let node = document.getElementById(labelId);
          if (!node) {
            node = document.createElement('div');
            node.id = labelId;
            node.style.background = cursorData.color;
            node.style.color = '#fff';
            node.style.fontSize = '11px';
            node.style.padding = '1px 6px';
            node.style.borderRadius = '3px';
            node.style.whiteSpace = 'nowrap';
            node.style.position = 'absolute';
            node.style.zIndex = '100';
            node.style.pointerEvents = 'none';
            node.style.fontFamily = 'Inter, sans-serif';
            node.style.fontWeight = '600';
          }
          node.textContent = cursorData.userName;
          return node;
        },
        getPosition: () => ({
          position: { lineNumber: line, column: col + 1 },
          preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
        }),
      };

      ed.addContentWidget(widget);
      cursorWidgetsRef.current.set(labelId, widget);
    });

    decorationsRef.current = ed.deltaDecorations(decorationsRef.current, newDecorations);
  }, [cursors, currentFile, user]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;

    return () => {
      cursorWidgetsRef.current.forEach((widget) => {
        ed.removeContentWidget(widget);
      });
      cursorWidgetsRef.current.clear();
    };
  }, []);

  if (!currentFile) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ background: '#1e1e1e' }}
      >
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: '#2d2d2d' }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: '#666' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m17.25 6.75 2.25 2.25-2.25 2.25m-10.5 0L2.25 9l2.25-2.25m7.5 3 4.5 2.25-4.5 2.25m0 0-2.25-4.5m2.25 4.5v-1.5" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#999' }}>
            No file open
          </p>
          <p className="text-xs" style={{ color: '#666' }}>
            Select a file from the explorer to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" style={{ background: '#1e1e1e' }}>
      <style>{`
        ${Array.from(cursors.values())
          .filter((c) => c.userId !== user?.id)
          .map(
            (c) => `
            .remote-cursor-${c.socketId} {
              border-left: 2px solid ${c.color};
              margin-left: -1px;
            }
            .remote-cursor-label-${c.socketId}::after {
              content: '';
            }
          `,
          )
          .join('')}
      `}</style>
      <Editor
        key={currentFile._id}
        height="100%"
        language={currentFile.language || 'plaintext'}
        theme={settings.theme}
        value={currentFile.content || ''}
        onMount={handleEditorMount}
        onChange={handleChange}
        options={{
          fontSize: settings.fontSize,
          tabSize: settings.tabSize,
          wordWrap: settings.wordWrap,
          minimap: { enabled: settings.minimap },
          lineNumbers: settings.lineNumbers ? 'on' : 'off',
          padding: { top: 12 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderLineHighlight: 'gutter',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          folding: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
          fontLigatures: true,
        }}
        loading={
          <div
            className="flex items-center justify-center h-full"
            style={{ background: '#1e1e1e' }}
          >
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      />
    </div>
  );
}
