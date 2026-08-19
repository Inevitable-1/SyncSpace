import mongoose, { type Document, Schema } from 'mongoose';

export interface IRoomDocument extends Document {
  name: string;
  description: string;
  type: 'whiteboard' | 'code' | 'document';
  workspace?: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  inviteCode: string;
  isActive: boolean;
  participants: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoomDocument>(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
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
    type: {
      type: String,
      enum: ['whiteboard', 'code', 'document'],
      default: 'whiteboard',
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

roomSchema.index({ workspace: 1 });
roomSchema.index({ owner: 1 });

roomSchema.pre('save', function () {
  if (!this.inviteCode) {
    this.inviteCode = new mongoose.Types.ObjectId().toString();
  }
});

export const Room = mongoose.model<IRoomDocument>('Room', roomSchema);
