import mongoose, { type Document, Schema } from 'mongoose';

export interface IWhiteboardObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  closed?: boolean;
  [key: string]: unknown;
}

export interface IWhiteboardDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  objects: IWhiteboardObject[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const whiteboardObjectSchema = new Schema<IWhiteboardObject>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    points: [{ type: Number }],
    text: { type: String },
    stroke: { type: String },
    fill: { type: String },
    strokeWidth: { type: Number },
    opacity: { type: Number },
    fontSize: { type: Number },
    fontFamily: { type: String },
    rotation: { type: Number },
    scaleX: { type: Number },
    scaleY: { type: Number },
    closed: { type: Boolean },
  },
  { _id: false, strict: false },
);

const whiteboardSchema = new Schema<IWhiteboardDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      unique: true,
      index: true,
    },
    objects: [whiteboardObjectSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Whiteboard = mongoose.model<IWhiteboardDocument>('Whiteboard', whiteboardSchema);
