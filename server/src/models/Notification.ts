import mongoose, { type Document, Schema } from 'mongoose';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationEntityType =
  'workspace' | 'room' | 'member' | 'invite' | 'activity' | 'meeting' | 'file';

export interface INotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: NotificationEntityType;
  entityId?: string;
  workspaceId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Message must be at most 500 characters'],
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    entityType: {
      type: String,
      enum: ['workspace', 'room', 'member', 'invite', 'activity', 'meeting', 'file'],
    },
    entityId: {
      type: String,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ workspaceId: 1 });

export const Notification = mongoose.model<INotificationDocument>(
  'Notification',
  notificationSchema,
);
