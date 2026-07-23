import mongoose, { type Document, Schema } from 'mongoose';

export interface IRoomPresenceDocument extends Document {
  room: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  socketId: string;
  status: 'online' | 'idle' | 'typing';
  currentActivity: string;
  joinedAt: Date;
  lastActiveAt: Date;
}

const roomPresenceSchema = new Schema<IRoomPresenceDocument>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    socketId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['online', 'idle', 'typing'],
      default: 'online',
    },
    currentActivity: {
      type: String,
      default: 'Viewing room',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

roomPresenceSchema.index({ room: 1, user: 1 }, { unique: true });
roomPresenceSchema.index({ room: 1, status: 1 });

export const RoomPresence = mongoose.model<IRoomPresenceDocument>(
  'RoomPresence',
  roomPresenceSchema,
);
