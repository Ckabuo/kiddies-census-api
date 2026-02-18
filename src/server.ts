import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import censusRoutes from './routes/censusRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS: allow frontend origin(s). Use comma-separated list for multiple (e.g. Netlify + localhost).
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. Postman, curl)
    if (!origin) return cb(null, true);
    if (frontendOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/census', censusRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kiddies API is running' });
});

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
