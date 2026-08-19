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
  radiusX?: number;
  radiusY?: number;
  tension?: number;
  lineCap?: string;
  lineJoin?: string;
  src?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: string;
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
    radiusX: { type: Number },
    radiusY: { type: Number },
    tension: { type: Number },
    lineCap: { type: String },
    lineJoin: { type: String },
    src: { type: String },
    bold: { type: Boolean },
    italic: { type: Boolean },
    underline: { type: Boolean },
    align: { type: String },
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
