import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import epicRoutes from './routes/epicRoutes';
import sprintRoutes from './routes/sprintRoutes';
import ticketRoutes from './routes/ticketRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import noteRoutes from './routes/noteRoutes';
import labelRoutes from './routes/labelRoutes';
import uploadRoutes from './routes/uploadRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/epics', epicRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
