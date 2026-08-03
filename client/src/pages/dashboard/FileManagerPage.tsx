import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchWorkspaces } from '../../features/workspace/workspaceSlice';
import { fetchFiles, uploadFile, deleteFile, fetchFolders } from '../../features/files/fileSlice';
import { useToast } from '../../components/common/Toast';
import type { RootState, AppDispatch } from '../../store';
import type { UploadedFile } from '../../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType: string): string {
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip')) return '📦';
  if (mimeType.includes('markdown') || mimeType.includes('text')) return '📝';
  if (mimeType.includes('fig')) return '🎨';
  if (mimeType.includes('csv') || mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
  if (mimeType.includes('json')) return '🧾';
  return '📎';
}

function getUploaderName(file: UploadedFile): string {
  return typeof file.uploader === 'object' && file.uploader !== null ? file.uploader.name : 'Member';
}

function folderLabel(folder: string): string {
  if (!folder || folder === '/') return 'Root';
  return folder.replace(/^\/+/, '');
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
  const [isDragging, setIsDragging] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
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
      dispatch(fetchFiles({ workspaceId, folder: folder || undefined, search: search || undefined }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [dispatch, workspaceId, folder, search]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const activeWorkspace = workspaces.find((w) => w._id === workspaceId);

  const filtered = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

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
      return next;
    });
  };

  const handleUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !workspaceId) return;
    setUploading(true);
    const queue = Array.from(fileList);
    const next = () => {
      const f = queue.shift();
      if (!f) {
        setUploading(false);
        showToast('Files uploaded', 'success');
        return;
      }
      dispatch(
        uploadFile({ file: f, workspaceId, folder: folder || undefined }),
      ).then((action) => {
        if (action.meta.requestStatus !== 'fulfilled') {
          showToast((action.payload as string) || 'Upload failed', 'error');
        }
        next();
      });
    };
    next();
  };

  const handleDelete = (file: UploadedFile) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    dispatch(deleteFile(file._id)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        showToast('File deleted', 'info');
      } else {
        showToast((action.payload as string) || 'Failed to delete file', 'error');
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

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
              : `${filtered.length} file${filtered.length !== 1 ? 's' : ''}${
                  activeWorkspace ? ` in ${activeWorkspace.name}` : ''
                }`}
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
            disabled={!workspaceId || uploading}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
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
            )}
            Upload
          </button>
        </div>
      </div>

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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${
              folder === ''
                ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                : 'border-white/10 text-gray-400 hover:bg-white/5'
            }`}
          >
            All
          </button>
          {folderChips.map((fd) => (
            <button
              key={fd || 'root'}
              onClick={() => setFolder(fd)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${
                folder === fd
                  ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              {folderLabel(fd)}
            </button>
          ))}
        </div>

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
                  <div className="text-3xl">{getFileIcon(file.mimeType)}</div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
                <p
                  className="text-sm font-semibold truncate mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {file.name}
                </p>
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
                        <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {file.name}
                        </span>
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
            <div className="text-4xl mb-4">📂</div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {search ? 'No files match your search' : 'No files here yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Drag &amp; drop files here or click Upload
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
