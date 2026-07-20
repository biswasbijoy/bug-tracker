import mongoose, { Document, Schema } from 'mongoose';

export interface IEpic extends Document {
  name: string;
  description?: string;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const EpicSchema = new Schema<IEpic>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model<IEpic>('Epic', EpicSchema);
