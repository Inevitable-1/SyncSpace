import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import {
  fetchFiles,
  uploadFile,
  deleteFile,
  renameFile,
  fetchFolders,
} from '../../features/files/fileSlice';
import { fileService } from '../../services/fileService';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';
import type { UploadedFile } from '../../types';

const FAVORITES_KEY = 'syncspace:favoriteFiles';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType: string): string {
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('markdown') || mimeType.includes('text')) return '📝';
  if (mimeType.includes('fig')) return '🎨';
  if (mimeType.includes('csv') || mimeType.includes('excel') || mimeType.includes('sheet'))
    return '📊';
  if (mimeType.includes('json')) return '🧾';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  return '📎';
}

function getFileColor(mimeType: string): string {
  if (mimeType.includes('image')) return 'from-pink-500 to-rose-600';
  if (mimeType.includes('pdf')) return 'from-red-500 to-red-700';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'from-amber-500 to-orange-600';
  if (mimeType.includes('text') || mimeType.includes('json')) return 'from-brand-500 to-brand-700';
  if (mimeType.includes('video')) return 'from-purple-500 to-purple-700';
  if (mimeType.includes('audio')) return 'from-emerald-500 to-emerald-700';
  if (mimeType.includes('sheet') || mimeType.includes('csv')) return 'from-green-500 to-green-700';
  return 'from-secondary-500 to-secondary-700';
}

function getUploaderName(file: UploadedFile): string {
  return typeof file.uploader === 'object' && file.uploader !== null
    ? (file.uploader as { name: string }).name
    : 'Member';
}

function folderLabel(folder: string): string {
  if (!folder || folder === '/') return 'Root';
  return folder.replace(/^\/+/, '');
}

type ViewFilter = 'all' | 'favorites' | 'recent';
type SortBy = 'date' | 'name' | 'size';

function isImageFile(file: UploadedFile): boolean {
  return file.mimeType.startsWith('image/');
}

interface UploadProgress {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

export default function FileManagerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { workspaces } = useSelector((state: RootState) => state.workspace);
  const { files, folders, isLoading, error } = useSelector((state: RootState) => state.files);

  const [workspaceId, setWorkspaceId] = useState('');
  const [folder, setFolder] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [isDragging, setIsDragging] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    if (workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchFolders(workspaceId));
      dispatch(fetchFiles({ workspaceId, folder: folder || undefined }));
    }
  }, [dispatch, workspaceId, folder]);

  useEffect(() => {
    if (!workspaceId) return;
    const timeout = setTimeout(() => {
      dispatch(
        fetchFiles({ workspaceId, folder: folder || undefined, search: search || undefined }),
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [dispatch, workspaceId, folder, search]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const activeWorkspace = workspaces.find((w) => w._id === workspaceId);

  const filtered = useMemo(() => {
    let list = files;
    if (viewFilter === 'favorites') list = list.filter((f) => favorites.has(f._id));
    else if (viewFilter === 'recent') {
      const cutoff = Date.now() - 7 * 86400000;
      list = list.filter((f) => Date.parse(f.createdAt) >= cutoff);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [files, search, viewFilter, favorites, sortBy]);

  const folderChips = useMemo(() => {
    const unique = new Set<string>();
    files.forEach((f) => unique.add(f.folder && f.folder !== '/' ? f.folder : ''));
    folders.forEach((fd) => unique.add(fd && fd !== '/' ? fd : ''));
    return Array.from(unique).sort();
  }, [files, folders]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !workspaceId) return;
    const newUploads: UploadProgress[] = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadId = newUploads[i].id;
      try {
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 50 } : u)));
        await dispatch(uploadFile({ file, workspaceId, folder: folder || undefined })).unwrap();
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u)),
        );
      } catch {
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: 'error' } : u)));
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }

    setTimeout(() => setUploads((prev) => prev.filter((u) => u.status === 'uploading')), 2000);
    showToast('Files uploaded', 'success');
  };

  const handleDelete = (file: UploadedFile) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    dispatch(deleteFile(file._id)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') showToast('File deleted', 'info');
      else showToast((action.payload as string) || 'Failed to delete', 'error');
    });
  };

  const handleRename = async (file: UploadedFile) => {
    if (!renameValue.trim() || renameValue.trim() === file.name) {
      setRenamingId(null);
      return;
    }
    const action = await dispatch(renameFile({ id: file._id, name: renameValue.trim() }));
    if (action.meta.requestStatus === 'fulfilled') showToast('File renamed', 'success');
    else showToast('Failed to rename', 'error');
    setRenamingId(null);
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      await fileService.download(file._id, file.originalName || file.name);
      showToast('Download started', 'info');
    } catch {
      showToast('Download failed', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const activeUploads = uploads.filter((u) => u.status === 'uploading');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            File Manager
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {isLoading && files.length === 0
              ? 'Loading files...'
              : `${filtered.length} file${filtered.length !== 1 ? 's' : ''}${activeWorkspace ? ` in ${activeWorkspace.name}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={workspaceId}
            onChange={(e) => {
              setWorkspaceId(e.target.value);
              setFolder('');
            }}
            className="input-base"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            {workspaces.map((ws) => (
              <option key={ws._id} value={ws._id}>
                {ws.name}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleUpload(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!workspaceId}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {activeUploads.length > 0 && (
        <div className="space-y-2">
          {activeUploads.map((u) => (
            <div key={u.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {u.name}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {u.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${u.progress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-secondary-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
            placeholder="Search files..."
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setFolder('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${folder === '' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
          >
            All
          </button>
          {folderChips.map((fd) => (
            <button
              key={fd || 'root'}
              onClick={() => setFolder(fd)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${folder === fd ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              {folderLabel(fd)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="input-base text-xs py-2 px-3 w-auto"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            <option value="date">Newest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
          <div
            className="flex rounded-xl overflow-hidden border shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 ${view === 'grid' ? 'bg-brand-600 text-white' : ''}`}
              style={view !== 'grid' ? { color: 'var(--text-tertiary)' } : undefined}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 ${view === 'list' ? 'bg-brand-600 text-white' : ''}`}
              style={view !== 'list' ? { color: 'var(--text-tertiary)' } : undefined}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-max" style={{ background: 'var(--bg-tertiary)' }}>
        {(
          [
            { value: 'all', label: 'All files' },
            { value: 'favorites', label: 'Favorites' },
            { value: 'recent', label: 'Recent (7d)' },
          ] as { value: ViewFilter; label: string }[]
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setViewFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewFilter === f.value ? 'bg-brand-600 text-white shadow' : ''}`}
            style={viewFilter !== f.value ? { color: 'var(--text-secondary)' } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed transition-all ${isDragging ? 'border-brand-500 bg-brand-500/5' : 'border-transparent'}`}
      >
        {isDragging && (
          <div className="p-12 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-brand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Drop files here to upload
            </p>
          </div>
        )}

        {!isDragging && isLoading && files.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4">
                <div className="h-10 w-10 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-4 w-3/4 bg-white/5 rounded mt-3 animate-pulse" />
                <div className="h-3 w-1/2 bg-white/5 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!isDragging && !isLoading && view === 'grid' && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((file, i) => (
              <motion.div
                key={file._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card-hover p-4 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="text-3xl transition-transform hover:scale-110"
                    title="Preview"
                  >
                    {getFileIcon(file.mimeType)}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1 rounded-lg hover:bg-white/5"
                      title="Download"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-brand-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleFavorite(file._id)}
                      className="p-1 rounded-lg hover:bg-white/5"
                    >
                      <svg
                        className={`w-4 h-4 ${favorites.has(file._id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                        viewBox="0 0 24 24"
                        fill={favorites.has(file._id) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-1 rounded-lg hover:bg-red-500/10"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {renamingId === file._id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRename(file);
                    }}
                    className="mb-1"
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(file)}
                      className="w-full px-2 py-1 text-sm rounded-lg border border-brand-500/50 bg-white/5 outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </form>
                ) : (
                  <p
                    className="text-sm font-semibold truncate mb-1 hover:text-brand-400 cursor-pointer transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => {
                      setRenamingId(file._id);
                      setRenameValue(file.name);
                    }}
                    title="Click to rename"
                  >
                    {file.name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatSize(file.size)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {folderLabel(file.folder)} · {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isDragging && view === 'list' && filtered.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Name
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Folder
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Uploaded by
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Size
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Date
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file, i) => (
                  <motion.tr
                    key={file._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b last:border-0 hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getFileColor(file.mimeType)} flex items-center justify-center text-sm flex-shrink-0`}
                        >
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="min-w-0">
                          {renamingId === file._id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleRename(file);
                              }}
                            >
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleRename(file)}
                                className="w-full px-2 py-1 text-sm rounded-lg border border-brand-500/50 bg-white/5 outline-none"
                                style={{ color: 'var(--text-primary)' }}
                              />
                            </form>
                          ) : (
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="text-sm font-medium truncate hover:text-brand-400 transition-colors text-left block max-w-full"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {file.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs hidden sm:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {folderLabel(file.folder)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs hidden md:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {getUploaderName(file)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs hidden md:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {formatSize(file.size)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs hidden lg:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          title="Download"
                        >
                          <svg
                            className="w-4 h-4 text-gray-400 hover:text-brand-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setRenamingId(file._id);
                            setRenameValue(file.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          title="Rename"
                        >
                          <svg
                            className="w-4 h-4 text-gray-400 hover:text-brand-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleFavorite(file._id)}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                        >
                          <svg
                            className={`w-4 h-4 ${favorites.has(file._id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                            viewBox="0 0 24 24"
                            fill={favorites.has(file._id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10"
                        >
                          <svg
                            className="w-4 h-4 text-gray-400 hover:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isDragging && !isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500/20 to-secondary-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {search ? 'No files match your search' : 'No files here yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Drag &amp; drop files here or click Upload
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="card p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {previewFile.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {getUploaderName(previewFile)} · {formatSize(previewFile.size)} ·{' '}
                    {folderLabel(previewFile.folder)}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-lg hover:bg-white/5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden aspect-video">
                {isImageFile(previewFile) ? (
                  <img
                    src={previewFile.path}
                    alt={previewFile.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="text-6xl mb-3">{getFileIcon(previewFile.mimeType)}</div>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Preview available for image files
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => {
                    handleDelete(previewFile);
                    setPreviewFile(null);
                  }}
                  className="btn-danger text-xs flex items-center gap-1.5"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
