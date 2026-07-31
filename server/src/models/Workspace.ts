import mongoose, { type Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IWorkspaceDocument extends Document {
  name: string;
  description: string;
  color: string;
  icon: string;
  isPublic: boolean;
  inviteCode: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('hex');
}

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    inviteCode: {
      type: String,
      unique: true,
      default: generateInviteCode,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
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

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ members: 1 });

export const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', workspaceSchema);
