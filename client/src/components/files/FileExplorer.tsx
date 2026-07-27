import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchFiles,
  uploadFile,
  deleteFile,
  renameFile,
  fetchFolders,
} from '../../features/files/fileSlice';
import { fileService } from '../../services/fileService';
import type { UploadedFile } from '../../types';
import { useToast } from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import Dropdown from '../common/Dropdown';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
} from '../Icons';

interface FileExplorerProps {
  workspaceId?: string;
  roomId?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = parseFloat((bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1));
  return `${size} ${units[i]}`;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getFileIcon(mimeType: string, isFolder: boolean): string {
  if (isFolder) return '📁';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json'))
    return '💻';
  if (mimeType.includes('text/') || mimeType.includes('document')) return '📝';
  return '📦';
}

export default function FileExplorer({ workspaceId, roomId }: FileExplorerProps) {
  const dispatch = useAppDispatch();
  const { files, isLoading } = useAppSelector((state) => state.files);
  const { showToast } = useToast();

  const [currentFolder, setCurrentFolder] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingFile, setDeletingFile] = useState<UploadedFile | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [previewImage, setPreviewImage] = useState<UploadedFile | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    file: UploadedFile;
    x: number;
    y: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchFiles({ workspaceId, folder: currentFolder === '/' ? undefined : currentFolder }));
      dispatch(fetchFolders(workspaceId));
    }
  }, [dispatch, workspaceId, currentFolder]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(
      (f: UploadedFile) =>
        f.name.toLowerCase().includes(q) || f.originalName.toLowerCase().includes(q),
    );
  }, [files, searchQuery]);

  const breadcrumbs = useMemo(() => {
    const parts = currentFolder.split('/').filter(Boolean);
    const items = [{ label: 'Files', path: '/' }];
    let path = '';
    for (const part of parts) {
      path += `/${part}`;
      items.push({ label: part, path });
    }
    return items;
  }, [currentFolder]);

  const handleUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !workspaceId) return;
      for (const file of Array.from(fileList)) {
        const action = await dispatch(
          uploadFile({
            file,
            workspaceId,
            roomId,
            folder: currentFolder === '/' ? undefined : currentFolder,
          }),
        );
        if (action.meta.requestStatus === 'fulfilled') {
          showToast(`Uploaded ${file.name}`, 'success');
        } else {
          showToast(`Failed to upload ${file.name}`, 'error');
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [dispatch, workspaceId, roomId, currentFolder, showToast],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = (file: UploadedFile) => {
    dispatch(deleteFile(file._id)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast(`Deleted ${file.name}`, 'success');
      } else {
        showToast(`Failed to delete ${file.name}`, 'error');
      }
    });
    setDeletingFile(null);
  };

  const startRename = (file: UploadedFile) => {
    setEditingFileId(file._id);
    setEditingName(file.name);
  };

  const cancelRename = () => {
    setEditingFileId(null);
    setEditingName('');
  };

  const confirmRename = () => {
    if (!editingFileId || !editingName.trim()) return;
    dispatch(renameFile({ id: editingFileId, name: editingName.trim() })).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('File renamed', 'success');
      } else {
        showToast('Failed to rename file', 'error');
      }
    });
    setEditingFileId(null);
    setEditingName('');
  };

  const handleDownload = (file: UploadedFile) => {
    fileService.download(file._id, file.name).then(() => {
      showToast(`Downloading ${file.name}`, 'success');
    }).catch(() => {
      showToast(`Failed to download ${file.name}`, 'error');
    });
  };

  const handleFolderClick = (folder: string) => {
    setCurrentFolder(folder);
  };

  const handleContextMenu = (e: React.MouseEvent, file: UploadedFile) => {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const handleFileClick = (file: UploadedFile) => {
    if (file.mimeType.startsWith('image/')) {
      setPreviewImage(file);
    } else if (file.mimeType === 'application/pdf') {
      showToast('PDF preview coming soon', 'info');
    }
  };

  const getFileActions = (file: UploadedFile) => [
    {
      label: 'Rename',
      icon: <PencilIcon className="w-4 h-4" />,
      onClick: () => startRename(file),
    },
    {
      label: 'Download',
      icon: <ArrowUpIcon className="w-4 h-4" />,
      onClick: () => handleDownload(file),
    },
    {
      label: 'Delete',
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: () => setDeletingFile(file),
      danger: true,
    },
  ];

  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16" style={{ color: 'var(--text-tertiary)' }}>
        <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">Select a workspace to view files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-card)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Files
          </h2>
          <nav className="flex items-center space-x-1 text-sm min-w-0" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center min-w-0">
                {index > 0 && (
                  <span className="mx-1 text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    /
                  </span>
                )}
                {index < breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => handleFolderClick(crumb.path)}
                    className="hover:underline transition-colors truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-color)',
              }}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 animate-pulse"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg" style={{ background: 'var(--border-color)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded w-3/4" style={{ background: 'var(--border-color)' }} />
                    <div className="h-2 rounded w-1/2" style={{ background: 'var(--border-color)' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded w-full" style={{ background: 'var(--border-color)' }} />
                  <div className="h-2 rounded w-2/3" style={{ background: 'var(--border-color)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center py-16"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className={`flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed transition-colors w-full max-w-md ${
              isDragOver ? 'border-indigo-500 bg-indigo-500/5' : ''
            }`}
            style={{
              borderColor: isDragOver ? undefined : 'var(--border-color)',
              color: 'var(--text-tertiary)',
            }}
          >
            <FolderIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-base font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'No files found' : 'No files yet'}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Drag & drop files here or click to upload'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Upload Files
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex-1 overflow-auto p-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-indigo-600/10 backdrop-blur-sm pointer-events-none">
              <div className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                Drop files here to upload
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredFiles.map((file: UploadedFile, index: number) => {
                return (
                  <motion.div
                    key={file._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                    className="group rounded-xl border p-4 transition-all cursor-pointer"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                    }}
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: 'var(--bg-tertiary)' }}
                      >
                        {getFileIcon(file.mimeType, false)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingFileId === file._id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
                              style={{
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-color)',
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmRename();
                              }}
                              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors flex-shrink-0"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <CheckIcon className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <XIcon className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {file.name}
                          </p>
                        )}
                      </div>
                      <Dropdown
                        trigger={
                          <button
                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--text-tertiary)' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                              <circle cx="8" cy="3" r="1.5" />
                              <circle cx="8" cy="8" r="1.5" />
                              <circle cx="8" cy="13" r="1.5" />
                            </svg>
                          </button>
                        }
                        items={getFileActions(file)}
                        align="right"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{formatFileSize(file.size)}</span>
                      <span>{timeAgo(file.createdAt)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-xl border shadow-lg overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="py-1">
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => {
                startRename(contextMenu.file);
                setContextMenu(null);
              }}
            >
              <PencilIcon className="w-4 h-4" />
              Rename
            </button>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => {
                handleDownload(contextMenu.file);
                setContextMenu(null);
              }}
            >
              <ArrowUpIcon className="w-4 h-4" />
              Download
            </button>
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-red-600"
              onClick={() => {
                setDeletingFile(contextMenu.file);
                setContextMenu(null);
              }}
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <img
              src={`data:${previewImage.mimeType};base64,${(previewImage as UploadedFile & { thumbnailBase64?: string }).thumbnailBase64 || ''}`}
              alt={previewImage.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm font-medium">{previewImage.name}</p>
              <p className="text-white/70 text-xs">{formatFileSize(previewImage.size)}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingFile}
        onClose={() => setDeletingFile(null)}
        onConfirm={() => deletingFile && handleDelete(deletingFile)}
        title="Delete File"
        message={`Are you sure you want to delete "${deletingFile?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
