import mongoose, { Document, Schema } from 'mongoose';

export interface ISprint extends Document {
  name: string;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'planned';
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    name: { type: String, required: true, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'planned'], default: 'planned' },
  },
  { timestamps: true }
);

export default mongoose.model<ISprint>('Sprint', SprintSchema);
