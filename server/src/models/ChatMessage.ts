import mongoose, { type Document, Schema } from 'mongoose';

export interface IChatMessageDocument extends Document {
  room: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'emoji' | 'system';
  replyTo?: mongoose.Types.ObjectId;
  edited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  seenBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [5000, 'Message must be at most 5000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'emoji', 'system'],
      default: 'text',
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'ChatMessage',
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
    deletedAt: {
      type: Date,
    },
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

export const ChatMessage = mongoose.model<IChatMessageDocument>('ChatMessage', chatMessageSchema);
