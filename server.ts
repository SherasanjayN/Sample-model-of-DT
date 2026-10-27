import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes';
import userRoutes from './server/routes/userRoutes';
import groupRoutes from './server/routes/groupRoutes';
import loanRoutes from './server/routes/loanRoutes';
import messageRoutes from './server/routes/messageRoutes';
import announcementRoutes from './server/routes/announcementRoutes';
import emailRoutes from './server/routes/emailRoutes';
import sosRoutes from './server/routes/sosRoutes';
import meetingRoutes from './server/routes/meetingRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups', messageRoutes); // Mounts /api/groups/:id/messages
app.use('/api/loans', loanRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/meetings', meetingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Magalir Kuzhu Management System',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Magalir Kuzhu] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Magalir Kuzhu] Failed to start server:', err);
  process.exit(1);
});
