import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'qa' | 'developer' | 'project-manager';
  avatar?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'qa', 'developer', 'project-manager'],
      default: 'qa',
    },
    avatar: { type: String },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
