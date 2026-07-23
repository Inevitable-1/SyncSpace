import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchFiles, uploadFile, deleteFile } from '../../features/files/fileSlice';
import type { UploadedFile } from '../../types';
import Button from '../common/Button';
import SearchInput from '../common/SearchInput';
import ConfirmDialog from '../common/ConfirmDialog';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon, FolderIcon } from '../Icons';

interface FileExplorerProps {
  workspaceId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = parseFloat((bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1));
  return `${size} ${units[i]}`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType === 'application/pdf') return '📄';
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('xml')
  )
    return '💻';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text'))
    return '📝';
  return '📎';
}

export default function FileExplorer({ workspaceId }: FileExplorerProps) {
  const dispatch = useAppDispatch();
  const { files, isLoading } = useAppSelector((state) => state.files);
  const { user } = useAppSelector((state) => state.auth);

  const [currentFolder, setCurrentFolder] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingFile, setDeletingFile] = useState<UploadedFile | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(
      fetchFiles({ workspaceId, folder: currentFolder === '/' ? undefined : currentFolder }),
    );
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    Array.from(selectedFiles).forEach((file) => {
      dispatch(
        uploadFile({
          name: file.name,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          workspaceId,
          folder: currentFolder === '/' ? undefined : currentFolder,
        }),
      );
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (file: UploadedFile) => {
    dispatch(deleteFile(file._id));
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

  const handleRename = () => {
    setEditingFileId(null);
    setEditingName('');
  };

  const handleFolderClick = (folder: string) => {
    setCurrentFolder(folder);
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    /
                  </span>
                )}
                {index < breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => handleFolderClick(crumb.path)}
                    className="hover:text-indigo-600 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <SearchInput
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />}
          title={searchQuery ? 'No files found' : 'No files yet'}
          description={
            searchQuery
              ? 'Try adjusting your search query'
              : 'Upload files to get started with your workspace'
          }
          action={
            !searchQuery ? (
              <Button
                size="sm"
                leftIcon={<PlusIcon className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Files
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b text-xs font-medium uppercase tracking-wider"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-tertiary)',
                }}
              >
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4 w-28">Size</th>
                <th className="text-left py-3 px-4 w-32">Type</th>
                <th className="text-left py-3 px-4 w-36">Uploaded By</th>
                <th className="text-left py-3 px-4 w-32">Date</th>
                <th className="text-right py-3 px-4 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredFiles.map((file: UploadedFile, index: number) => (
                  <motion.tr
                    key={file._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b transition-colors"
                    style={{
                      borderColor: 'var(--border-light)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">{getFileIcon(file.mimeType)}</span>
                        {editingFileId === file._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2 py-1 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-color)',
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                            />
                            <button
                              onClick={handleRename}
                              className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <CheckIcon className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={cancelRename}
                              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <XIcon className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {file.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatFileSize(file.size)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {file.mimeType.split('/').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {typeof file.uploader === 'object'
                          ? file.uploader.name
                          : user?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {editingFileId !== file._id && (
                          <button
                            onClick={() => startRename(file)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                'var(--bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                            title="Rename"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingFile(file)}
                          className="p-1.5 rounded-lg transition-colors text-red-500"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              'var(--bg-tertiary)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

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
