import mongoose, { type Document, Schema } from 'mongoose';

export type ActivityAction =
  | 'created workspace'
  | 'updated workspace'
  | 'deleted workspace'
  | 'restored workspace'
  | 'created room'
  | 'updated room'
  | 'deleted room'
  | 'restored room'
  | 'joined room'
  | 'left room'
  | 'added member'
  | 'added member to workspace'
  | 'removed member'
  | 'updated member role'
  | 'suspended member'
  | 'reactivated member'
  | 'sent invite'
  | 'accepted invite'
  | 'declined invite'
  | 'revoked invite'
  | 'regenerated invite code'
  | 'joined workspace'
  | 'joined workspace via invite'
  | 'logged in'
  | 'logged out'
  | 'registered';

export interface IActivityDocument extends Document {
  user: mongoose.Types.ObjectId;
  action: ActivityAction;
  entityType: 'workspace' | 'room' | 'member' | 'invite' | 'auth';
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
      enum: ['workspace', 'room', 'member', 'invite', 'auth'],
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
