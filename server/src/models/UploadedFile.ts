import mongoose, { type Document, Schema } from 'mongoose';

export interface IUploadedFileDocument extends Document {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  workspace: mongoose.Types.ObjectId;
  room?: mongoose.Types.ObjectId;
  folder: string;
  uploader: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const uploadedFileSchema = new Schema<IUploadedFileDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
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
    folder: {
      type: String,
      default: '/',
    },
    uploader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

uploadedFileSchema.index({ workspace: 1, folder: 1 });
uploadedFileSchema.index({ workspace: 1, name: 'text' });
uploadedFileSchema.index({ uploader: 1 });

export const UploadedFile = mongoose.model<IUploadedFileDocument>(
  'UploadedFile',
  uploadedFileSchema,
);
