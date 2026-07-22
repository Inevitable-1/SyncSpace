import mongoose, { type Document, Schema } from 'mongoose';
import crypto from 'crypto';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type InviteRole = 'admin' | 'member';

export interface IInviteDocument extends Document {
  email: string;
  workspaceId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  role: InviteRole;
  status: InviteStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInviteDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
  },
);

inviteSchema.index({ email: 1, workspaceId: 1 });
inviteSchema.index({ workspaceId: 1, status: 1 });
inviteSchema.index({ token: 1 }, { unique: true });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invite = mongoose.model<IInviteDocument>('Invite', inviteSchema);
