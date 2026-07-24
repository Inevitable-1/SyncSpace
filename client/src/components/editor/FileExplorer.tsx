import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  createDocument,
  deleteDocument,
  renameDocument,
  setCurrentFile,
} from '../../features/editor/editorSlice';
import type { RootState } from '../../store';
import type { CodeDocument } from '../../types';

interface FileExplorerProps {
  roomId: string;
  workspaceId: string;
}

interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: FileNode[];
  document?: CodeDocument;
}

function getFileIcon(name: string, isFolder: boolean): string {
  if (isFolder) return '';
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
    c: '#555555',
    cpp: '#555555',
    html: '#e34f26',
    css: '#1572b6',
    json: '#999',
    md: '#083fa1',
  };
  return colorMap[ext] || 'var(--text-tertiary)';
}

function buildFileTree(documents: CodeDocument[]): FileNode[] {
  const root: FileNode[] = [];
  const sorted = [...documents].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const doc of sorted) {
    const parts = doc.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        if (isLast) {
          existing.document = doc;
        }
        current = existing.children;
      } else {
        const node: FileNode = {
          name: part,
          path: doc.path,
          isFolder: isLast ? doc.isFolder : true,
          children: [],
          document: isLast ? doc : undefined,
        };
        current.push(node);
        current = node.children;
      }
    }
  }

  return root;
}

function FileNodeItem({
  node,
  depth,
  expandedFolders,
  onToggle,
  onSelect,
  onContextMenu,
  selectedPath,
}: {
  node: FileNode;
  depth: number;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  selectedPath: string;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <>
      <div
        className={`flex items-center gap-1.5 px-2 py-[3px] cursor-pointer text-xs rounded-md mx-1 transition-colors ${
          isSelected ? 'bg-indigo-500/15 text-indigo-400' : 'hover:bg-[var(--bg-hover)]'
        }`}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          color: isSelected ? undefined : 'var(--text-secondary)',
        }}
        onClick={() => {
          if (node.isFolder) onToggle(node.path);
          else onSelect(node);
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {node.isFolder ? (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'} />
          </svg>
        ) : (
          <span
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[8px] font-bold rounded"
            style={{ color: getFileColor(node.name) }}
          >
            {getFileIcon(node.name, false)}
          </span>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.isFolder && isExpanded && (
        <div>
          {node.children.map((child) => (
            <FileNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function FileExplorer({ roomId, workspaceId }: FileExplorerProps) {
  const dispatch = useAppDispatch();
  const { documents, currentFile } = useSelector((state: RootState) => state.editor);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [parentPathForNew, setParentPathForNew] = useState('/');

  const fileTree = useMemo(() => buildFileTree(documents), [documents]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleSelectFile = useCallback(
    (node: FileNode) => {
      if (node.document && !node.isFolder) {
        dispatch(setCurrentFile(node.document));
      }
    },
    [dispatch],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleNewFile = useCallback(async () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const isFolder = name.endsWith('/');
    const cleanName = isFolder ? name.slice(0, -1) : name;

    await dispatch(
      createDocument({
        name: cleanName,
        roomId,
        workspaceId,
        parentPath: parentPathForNew,
        isFolder,
      }),
    );
    setNewFileName('');
    setShowNewFileInput(false);

    if (parentPathForNew !== '/') {
      setExpandedFolders((prev) => new Set(prev).add(parentPathForNew));
    }
  }, [newFileName, roomId, workspaceId, parentPathForNew, dispatch]);

  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const doc = documents.find((d) => d.path === renameTarget);
    if (doc) {
      await dispatch(renameDocument({ id: doc._id, name: renameValue.trim() }));
    }
    setRenameTarget(null);
    setRenameValue('');
  }, [renameTarget, renameValue, documents, dispatch]);

  const handleDelete = useCallback(
    async (node: FileNode) => {
      if (node.document) {
        await dispatch(deleteDocument(node.document._id));
      }
      setContextMenu(null);
    },
    [dispatch],
  );

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', width: 240 }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setParentPathForNew('/');
              setShowNewFileInput(true);
            }}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title="New File"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {showNewFileInput && (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewFile();
                if (e.key === 'Escape') setShowNewFileInput(false);
              }}
              onBlur={() => {
                if (newFileName.trim()) handleNewFile();
                else setShowNewFileInput(false);
              }}
              placeholder="filename.ext or folder/"
              className="w-full px-2 py-1 text-xs rounded border outline-none"
              style={{
                background: 'var(--bg-primary)',
                borderColor: '#6366f1',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}

        {documents.length === 0 && !showNewFileInput && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <svg
              className="w-8 h-8 mb-2"
              style={{ color: 'var(--text-tertiary)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No files yet
            </p>
            <button
              onClick={() => setShowNewFileInput(true)}
              className="mt-2 text-xs text-indigo-500 hover:text-indigo-400"
            >
              Create a file
            </button>
          </div>
        )}

        {fileTree.map((node) => (
          <FileNodeItem
            key={node.path}
            node={node}
            depth={0}
            expandedFolders={expandedFolders}
            onToggle={toggleFolder}
            onSelect={handleSelectFile}
            onContextMenu={handleContextMenu}
            selectedPath={currentFile?.path || ''}
          />
        ))}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 py-1 rounded-lg border shadow-lg min-w-[160px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              {!contextMenu.node.isFolder && (
                <button
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => {
                    if (contextMenu.node.document) {
                      dispatch(setCurrentFile(contextMenu.node.document));
                    }
                    setContextMenu(null);
                  }}
                >
                  Open
                </button>
              )}
              <button
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => {
                  setRenameTarget(contextMenu.node.path);
                  setRenameValue(contextMenu.node.name);
                  setContextMenu(null);
                }}
              >
                Rename
              </button>
              {contextMenu.node.isFolder && (
                <button
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => {
                    setParentPathForNew(contextMenu.node.path);
                    setShowNewFileInput(true);
                    setContextMenu(null);
                  }}
                >
                  New File Inside
                </button>
              )}
              <button
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/10 text-red-500"
                onClick={() => handleDelete(contextMenu.node)}
              >
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="p-4 rounded-xl border shadow-lg w-80"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Rename
            </p>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setRenameTarget(null);
              }}
              className="input-base text-sm mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenameTarget(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleRename} className="btn-primary text-xs">
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
