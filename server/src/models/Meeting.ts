import mongoose, { type Document, Schema } from 'mongoose';

export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface IMeetingDocument extends Document {
  name: string;
  description: string;
  workspace: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  scheduledAt: Date;
  duration: number;
  status: MeetingStatus;
  agenda: string;
  notes: string;
  meetingCode: string;
  endedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeetingDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30, min: 5 },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    agenda: { type: String, trim: true, maxlength: 500, default: '' },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },
    meetingCode: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    endedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

meetingSchema.index({ workspace: 1, status: 1 });
meetingSchema.index({ host: 1 });
meetingSchema.index({ scheduledAt: 1 });

export const Meeting = mongoose.model<IMeetingDocument>('Meeting', meetingSchema);
