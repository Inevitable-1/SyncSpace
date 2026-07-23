import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchTasks, updateTask, createTask, deleteTask } from '../../features/task/taskSlice';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import Avatar from '../common/Avatar';
import { PlusIcon, XIcon, TrashIcon, CheckIcon } from '../Icons';

interface KanbanBoardProps {
  workspaceId: string;
}

const COLUMNS: { id: TaskStatus; title: string; headerColor: string; dotColor: string }[] = [
  { id: 'todo', title: 'Todo', headerColor: 'bg-gray-500', dotColor: 'bg-gray-400' },
  { id: 'in-progress', title: 'In Progress', headerColor: 'bg-blue-500', dotColor: 'bg-blue-400' },
  { id: 'review', title: 'Review', headerColor: 'bg-yellow-500', dotColor: 'bg-yellow-400' },
  { id: 'completed', title: 'Completed', headerColor: 'bg-green-500', dotColor: 'bg-green-400' },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  },
};

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  feature: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  improvement: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  documentation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  backend: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  frontend: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  testing: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
};

function getLabelColor(label: string): string {
  const key = label.toLowerCase();
  if (LABEL_COLORS[key]) return LABEL_COLORS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ];
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAssigneeName(assignee: Task['assignee']): string {
  if (!assignee) return '';
  if (typeof assignee === 'string') return assignee;
  return assignee.name || '';
}

function getAssigneeAvatar(assignee: Task['assignee']): string {
  if (!assignee) return '';
  if (typeof assignee === 'string') return '';
  return assignee.avatar || '';
}

function TaskCard({
  task,
  onOpenModal,
  onDragStart,
}: {
  task: Task;
  onOpenModal: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}) {
  const priority = PRIORITY_CONFIG[task.priority];
  const assigneeName = getAssigneeName(task.assignee);
  const assigneeAvatar = getAssigneeAvatar(task.assignee);
  const checkedCount = task.checklist.filter((c) => c.done).length;
  const totalChecklist = task.checklist.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task)}
      onClick={() => onOpenModal(task)}
      className="rounded-xl p-3.5 cursor-pointer transition-all duration-200 border group"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
      whileHover={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        y: -1,
      }}
    >
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.labels.map((label) => (
            <span
              key={label}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getLabelColor(label)}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <h4
        className="text-sm font-medium leading-snug mb-2 line-clamp-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {task.title}
      </h4>

      <div className="flex items-center gap-1.5 mb-2">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${priority.className}`}>
          {priority.label}
        </span>
        {task.dueDate && (
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {totalChecklist > 0 && (
            <div className="flex items-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {checkedCount}/{totalChecklist}
              </span>
            </div>
          )}
        </div>
        {assigneeName && <Avatar src={assigneeAvatar} name={assigneeName} size="xs" />}
      </div>
    </motion.div>
  );
}

function TaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      checklist?: { text: string; done: boolean }[];
    },
  ) => void;
  onDelete: (taskId: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [comment, setComment] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setChecklist([...task.checklist]);
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!task) return;
    onSave(task._id, {
      title,
      description,
      status,
      priority,
      checklist,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task._id);
    onClose();
  };

  const toggleCheckItem = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item)),
    );
  };

  const addCheckItem = () => {
    if (newCheckItem.trim()) {
      setChecklist((prev) => [...prev, { text: newCheckItem.trim(), done: false }]);
      setNewCheckItem('');
    }
  };

  const removeCheckItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const assigneeName = task ? getAssigneeName(task.assignee) : '';
  const assigneeAvatar = task ? getAssigneeAvatar(task.assignee) : '';

  return (
    <AnimatePresence>
      {isOpen && task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border shadow-xl scrollbar-thin"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between p-5 border-b backdrop-blur-md"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
            >
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Task Details
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Title
                </label>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all resize-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Add a description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {assigneeName && (
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Assignee
                  </label>
                  <div
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Avatar src={assigneeAvatar} name={assigneeName} size="sm" />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {assigneeName}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Checklist
                </label>
                <div className="space-y-1.5">
                  {checklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg group/item transition-colors"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <button
                        onClick={() => toggleCheckItem(i)}
                        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          item.done
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        {item.done && <CheckIcon className="w-3 h-3" />}
                      </button>
                      <span
                        className={`flex-1 text-sm ${item.done ? 'line-through opacity-50' : ''}`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeCheckItem(i)}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded transition-opacity"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                    placeholder="Add checklist item..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    onClick={addCheckItem}
                    disabled={!newCheckItem.trim()}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Add Comment
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    disabled={!comment.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            <div
              className="sticky bottom-0 flex items-center justify-between p-5 border-t backdrop-blur-md"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
            >
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ColumnAddInput({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="p-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onCancel();
          }}
          onBlur={() => {
            if (!value.trim()) onCancel();
          }}
          placeholder="Enter task title..."
          className="w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
      </div>
    </motion.div>
  );
}

export default function KanbanBoard({ workspaceId }: KanbanBoardProps) {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const isLoading = useAppSelector((state) => state.tasks.isLoading);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchTasks(workspaceId));
    }
  }, [workspaceId, dispatch]);

  const getTasksByStatus = useCallback(
    (status: TaskStatus): Task[] =>
      tasks
        .filter((t: Task) => t.status === status && !t.isDeleted)
        .sort((a: Task, b: Task) => a.order - b.order),
    [tasks],
  );

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task._id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== targetStatus) {
      dispatch(
        updateTask({
          taskId: draggedTask._id,
          data: { status: targetStatus },
        }),
      );
    }
    setDraggedTask(null);
  };

  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      checklist?: { text: string; done: boolean }[];
    },
  ) => {
    dispatch(updateTask({ taskId, data }));
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch(deleteTask(taskId));
  };

  const handleAddTask = (status: TaskStatus, title: string) => {
    dispatch(
      createTask({
        title,
        workspace: workspaceId,
        status,
        priority: 'medium',
      }),
    );
    setAddingToColumn(null);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin h-full min-h-0">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 flex flex-col rounded-2xl transition-colors duration-200"
              style={{
                background: isOver ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: isOver ? '2px dashed #6366f1' : '2px solid transparent',
              }}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {column.title}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingToColumn(addingToColumn === column.id ? null : column.id)}
                  className="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 scrollbar-thin min-h-[100px]">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onOpenModal={handleOpenModal}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {addingToColumn === column.id && (
                    <ColumnAddInput
                      onAdd={(title) => handleAddTask(column.id, title)}
                      onCancel={() => setAddingToColumn(null)}
                    />
                  )}
                </AnimatePresence>

                {columnTasks.length === 0 && addingToColumn !== column.id && (
                  <div
                    className="flex flex-col items-center justify-center py-8 text-center"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <p className="text-xs font-medium">No tasks yet</p>
                    <p className="text-[11px] mt-0.5 opacity-60">Drop tasks here or click +</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
}
