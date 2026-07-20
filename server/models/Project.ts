import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  client?: string;
  status: 'active' | 'archived';
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    color: { type: String, default: '#3B82F6' },
    icon: { type: String },
    client: { type: String, trim: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
