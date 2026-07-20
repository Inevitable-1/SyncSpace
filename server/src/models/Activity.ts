import mongoose, { type Document, Schema } from 'mongoose';

export interface IActivityDocument extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  entityType: 'workspace' | 'room' | 'member' | 'auth';
  entityId?: mongoose.Types.ObjectId;
  entityName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivityDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: ['workspace', 'room', 'member', 'auth'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    entityName: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });

export const Activity = mongoose.model<IActivityDocument>('Activity', activitySchema);
