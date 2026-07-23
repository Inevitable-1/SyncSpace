import mongoose, { type Document, Schema } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed';

export interface ITaskDocument extends Document {
  title: string;
  description: string;
  workspace: mongoose.Types.ObjectId;
  room?: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  dueDate?: Date;
  checklist: { text: string; done: boolean }[];
  order: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description must be at most 5000 characters'],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
    },
    checklist: [
      {
        text: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, assignee: 1 });
taskSchema.index({ creator: 1 });

export const Task = mongoose.model<ITaskDocument>('Task', taskSchema);
