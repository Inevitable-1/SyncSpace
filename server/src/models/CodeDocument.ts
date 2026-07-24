import mongoose, { type Document, Schema } from 'mongoose';

export interface ICodeDocument extends Document {
  name: string;
  path: string;
  content: string;
  language: string;
  room: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  parentPath?: string;
  isFolder: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  versionTimestamps: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const codeDocumentSchema = new Schema<ICodeDocument>(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'Name must be at most 255 characters'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'plaintext',
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentPath: {
      type: String,
      default: '/',
    },
    isFolder: {
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
    versionTimestamps: [
      {
        type: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

codeDocumentSchema.index({ room: 1, path: 1 }, { unique: true });
codeDocumentSchema.index({ room: 1, parentPath: 1 });
codeDocumentSchema.index({ workspace: 1 });

export const CodeDocument = mongoose.model<ICodeDocument>('CodeDocument', codeDocumentSchema);
