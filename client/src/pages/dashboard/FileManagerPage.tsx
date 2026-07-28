import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { UploadedFile } from '../../types';

const mockFiles: UploadedFile[] = [
  {
    _id: '1',
    name: 'design-system.fig',
    originalName: 'design-system.fig',
    mimeType: 'application/fig',
    size: 2400000,
    path: '/',
    workspace: 'w1',
    folder: '/',
    uploader: 'user1' as UploadedFile['uploader'],
    isDeleted: false,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
  },
  {
    _id: '2',
    name: 'meeting-notes.md',
    originalName: 'meeting-notes.md',
    mimeType: 'text/markdown',
    size: 15000,
    path: '/',
    workspace: 'w1',
    folder: '/',
    uploader: 'user1' as UploadedFile['uploader'],
    isDeleted: false,
    createdAt: '2026-07-22T14:30:00Z',
    updatedAt: '2026-07-22T14:30:00Z',
  },
  {
    _id: '3',
    name: 'api-docs.pdf',
    originalName: 'api-docs.pdf',
    mimeType: 'application/pdf',
    size: 890000,
    path: '/',
    workspace: 'w1',
    folder: '/',
    uploader: 'user1' as UploadedFile['uploader'],
    isDeleted: false,
    createdAt: '2026-07-24T09:15:00Z',
    updatedAt: '2026-07-24T09:15:00Z',
  },
  {
    _id: '4',
    name: 'screenshot.png',
    originalName: 'screenshot.png',
    mimeType: 'image/png',
    size: 540000,
    path: '/',
    workspace: 'w1',
    folder: '/',
    uploader: 'user1' as UploadedFile['uploader'],
    isDeleted: false,
    createdAt: '2026-07-25T16:45:00Z',
    updatedAt: '2026-07-25T16:45:00Z',
  },
  {
    _id: '5',
    name: 'project-backup.zip',
    originalName: 'project-backup.zip',
    mimeType: 'application/zip',
    size: 12000000,
    path: '/',
    workspace: 'w1',
    folder: '/',
    uploader: 'user1' as UploadedFile['uploader'],
    isDeleted: false,
    createdAt: '2026-07-26T11:00:00Z',
    updatedAt: '2026-07-26T11:00:00Z',
  },
];

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
  return '📎';
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<UploadedFile[]>(mockFiles);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '3']));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            File Manager
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {files.length} files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const newFiles: UploadedFile[] = Array.from(e.target.files).map((f) => ({
                  _id: Math.random().toString(36).slice(2),
                  name: f.name,
                  originalName: f.name,
                  mimeType: f.type || 'application/octet-stream',
                  size: f.size,
                  path: '/',
                  workspace: 'w1',
                  folder: '/',
                  uploader: 'user1' as UploadedFile['uploader'],
                  isDeleted: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }));
                setFiles((prev) => [...newFiles, ...prev]);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2"
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

      <div className="flex items-center gap-3">
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
        <div
          className="flex rounded-xl overflow-hidden border"
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
              Drop files here
            </p>
          </div>
        )}

        {!isDragging && view === 'grid' && (
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
                  <button
                    onClick={() => toggleFavorite(file._id)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isDragging && view === 'list' && (
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
                    Size
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
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
                      {formatSize(file.size)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs hidden md:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleFavorite(file._id)}>
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
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isDragging && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              No files yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Drag & drop files here or click Upload
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
