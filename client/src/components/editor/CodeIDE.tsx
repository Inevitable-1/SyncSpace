import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useEditorSocket } from '../../hooks/useEditorSocket';
import { fetchDocuments, setCurrentFile, closeFile } from '../../features/editor/editorSlice';
import { useToast } from '../common/Toast';
import CodeFileExplorer from './CodeFileExplorer';
import MonacoEditor from './MonacoEditor';
import LiveCursors from './LiveCursors';
import TerminalPanel from './TerminalPanel';
import OutputPanel from './OutputPanel';
import CodeSettings from './CodeSettings';
import type { RootState } from '../../store';

interface CodeIDEProps {
  roomId: string;
  workspaceId: string;
  workspaceName: string;
}

type BottomPanel = 'terminal' | 'output' | null;

export default function CodeIDE({ roomId, workspaceId, workspaceName }: CodeIDEProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { documents, currentFile, openFiles, settings } = useSelector(
    (state: RootState) => state.editor,
  );

  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>(null);

  const {
    isConnected,
    connectedUsers,
    cursors,
    emitCodeChange,
    emitCursorUpdate,
    emitSelectionUpdate,
    emitSaveDocument,
  } = useEditorSocket({
    roomId,
    userName: user?.name || 'Anonymous',
    enabled: !!roomId,
  });

  useEffect(() => {
    if (roomId) {
      void dispatch(fetchDocuments(roomId));
    }
  }, [roomId, dispatch]);

  const handleCodeChange = useCallback(
    (fileName: string, content: string, cursor: { line: number; column: number }) => {
      emitCodeChange(fileName, content, cursor);
    },
    [emitCodeChange],
  );

  const handleCursorChange = useCallback(
    (cursor: { line: number; column: number }, fileName: string) => {
      emitCursorUpdate(cursor, fileName);
    },
    [emitCursorUpdate],
  );

  const handleSelectionChange = useCallback(
    (
      selection: { startLine: number; startColumn: number; endLine: number; endColumn: number },
      fileName: string,
    ) => {
      emitSelectionUpdate(selection, fileName);
    },
    [emitSelectionUpdate],
  );

  const handleSave = useCallback(
    (fileName: string, content: string) => {
      emitSaveDocument(fileName, content);
      showToast('Saved', 'success');
    },
    [emitSaveDocument, showToast],
  );

  const handleTabClick = useCallback(
    (path: string) => {
      const doc = documents.find((d) => d.path === path);
      if (doc) {
        dispatch(setCurrentFile(doc));
      }
    },
    [documents, dispatch],
  );

  const handleTabClose = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      dispatch(closeFile(path));
    },
    [dispatch],
  );

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ background: '#252526', borderColor: '#333' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={`p-1.5 rounded transition-colors ${showFileExplorer ? 'bg-white/10' : 'hover:bg-white/5'}`}
            style={{ color: '#ccc' }}
            title="Toggle Explorer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </button>
          <span className="text-xs font-medium text-gray-400">{workspaceName}</span>
          <div
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-[10px] text-gray-500">{connectedUsers.length} online</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBottomPanel(bottomPanel === 'terminal' ? null : 'terminal')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${bottomPanel === 'terminal' ? 'bg-white/10 text-gray-300' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Terminal
          </button>
          <button
            onClick={() => setBottomPanel(bottomPanel === 'output' ? null : 'output')}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${bottomPanel === 'output' ? 'bg-white/10 text-gray-300' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Output
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-white/10' : 'hover:bg-white/5'}`}
            style={{ color: '#ccc' }}
            title="Settings"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {showFileExplorer && <CodeFileExplorer roomId={roomId} workspaceId={workspaceId} />}

        <div className="flex-1 flex flex-col min-w-0">
          {openFiles.length > 0 && (
            <div
              className="flex items-center border-b overflow-x-auto scrollbar-thin"
              style={{ background: '#252526', borderColor: '#333' }}
            >
              {openFiles.map((path) => {
                const doc = documents.find((d) => d.path === path);
                const isActive = currentFile?.path === path;
                return (
                  <div
                    key={path}
                    onClick={() => handleTabClick(path)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1e1e1e] text-white'
                        : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#383838]'
                    }`}
                    style={{ borderColor: '#333' }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: doc ? getFileColor(doc.name) : '#999' }}
                    >
                      {doc ? getFileIcon(doc.name) : '◇'}
                    </span>
                    <span>{doc?.name || path.split('/').pop()}</span>
                    <button
                      onClick={(e) => handleTabClose(e, path)}
                      className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 relative min-h-0">
            <MonacoEditor
              cursors={cursors}
              selections={new Map()}
              onCodeChange={handleCodeChange}
              onCursorChange={handleCursorChange}
              onSelectionChange={handleSelectionChange}
              onSave={handleSave}
            />
            {currentFile && (
              <LiveCursors
                users={connectedUsers}
                currentUserId={user?.id || ''}
                currentFile={currentFile.path}
              />
            )}
          </div>

          {(bottomPanel === 'terminal' || bottomPanel === 'output') && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 200 }}
              exit={{ height: 0 }}
              className="flex-shrink-0"
            >
              {bottomPanel === 'terminal' && <TerminalPanel isVisible={true} />}
              {bottomPanel === 'output' && <OutputPanel isVisible={true} />}
            </motion.div>
          )}
        </div>

        <CodeSettings isVisible={showSettings} onClose={() => setShowSettings(false)} />
      </div>

      <div
        className="flex items-center justify-between px-3 py-1 text-[10px] border-t"
        style={{ background: '#007acc', borderColor: '#007acc' }}
      >
        <div className="flex items-center gap-3 text-white/80">
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <span>
            Ln {cursors.values().next().value?.cursor?.line || 1}, Col{' '}
            {cursors.values().next().value?.cursor?.column || 1}
          </span>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <span>{currentFile?.language || 'Plain Text'}</span>
          <span>UTF-8</span>
          <span>Spaces: {settings.tabSize}</span>
        </div>
      </div>
    </div>
  );
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    ts: 'TS',
    tsx: 'TX',
    js: 'JS',
    jsx: 'JX',
    py: 'PY',
    java: 'JV',
    c: 'C',
    cpp: 'CP',
    html: 'HT',
    css: 'CS',
    json: '{ }',
    md: 'MD',
  };
  return iconMap[ext] || '◇';
}

function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const colorMap: Record<string, string> = {
    ts: '#3178c6',
    tsx: '#3178c6',
    js: '#f7df1e',
    jsx: '#f7df1e',
    py: '#3776ab',
    java: '#ed8b00',
    c: '#555',
    cpp: '#555',
    html: '#e34f26',
    css: '#1572b6',
    json: '#999',
    md: '#083fa1',
  };
  return colorMap[ext] || '#999';
}
