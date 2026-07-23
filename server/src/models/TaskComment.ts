import mongoose, { type Document, Schema } from 'mongoose';

export interface ITaskCommentDocument extends Document {
  task: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  edited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskCommentSchema = new Schema<ITaskCommentDocument>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Comment must be at most 2000 characters'],
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

taskCommentSchema.index({ task: 1, createdAt: -1 });

export const TaskComment = mongoose.model<ITaskCommentDocument>('TaskComment', taskCommentSchema);
