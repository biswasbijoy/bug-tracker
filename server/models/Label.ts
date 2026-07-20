import mongoose, { Document, Schema } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema = new Schema<ILabel>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6B7280' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILabel>('Label', LabelSchema);
