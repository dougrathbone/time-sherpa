import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

import { createAuthRouter } from './routes/auth';
import { createCalendarRouter } from './routes/calendar';
import { createSubscriptionRouter } from './routes/subscription';
import { setupGoogleStrategy } from './services/auth';
import { JsonUserRepository } from './repositories/JsonUserRepository';
import { createEmailService } from './services/email';
import { EmailScheduler } from './services/scheduler';

// Load environment variables
dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://generativelanguage.googleapis.com"],
    },
  },
}));

// CORS configuration - must be before session middleware
app.use(cors({
  origin: isDevelopment ? 'http://localhost:3000' : process.env.CLIENT_URL || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Trust proxy for secure cookies behind reverse proxies
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
// On Vercel (serverless), use the default in-memory store since the filesystem is ephemeral.
// For traditional deployments, use session-file-store for persistence.
let sessionStore: session.Store | undefined;

if (!isVercel) {
  try {
    const FileStore = require('session-file-store')(session);
    sessionStore = new FileStore({
      path: path.join(__dirname, '..', 'sessions'),
      ttl: 86400, // 24 hours in seconds
      retries: 5,
      factor: 1,
      minTimeout: 50,
      maxTimeout: 100,
      reapInterval: 3600, // 1 hour cleanup interval
    });
  } catch (err) {
    console.warn('session-file-store not available, using in-memory session store');
  }
}

app.use(session({
  name: 'timesherpa.sid', // Custom session name
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-in-production',
  ...(sessionStore ? { store: sessionStore } : {}),
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: !isDevelopment, // Use secure cookies in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for persistent login
    sameSite: isDevelopment ? 'lax' : 'none', // Allow cross-site cookies in production
    path: '/',
  },
}));

// Debug middleware for development
if (isDevelopment) {
  app.use((req: any, _res, next) => {
    console.log(`[${req.method}] ${req.path}`, {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated?.(),
      user: req.user?.email,
    });
    next();
  });
}

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication strategy
setupGoogleStrategy();

// Initialize user repository
const encryptionKey = process.env.ENCRYPTION_KEY;
if (!encryptionKey) {
  console.warn('WARNING: ENCRYPTION_KEY not set. Using default key for development.');
  // Generate a default key for development only
  const defaultKey = isDevelopment 
    ? '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    : null;
  
  if (!defaultKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }
  
  process.env.ENCRYPTION_KEY = defaultKey;
}

const userRepository = new JsonUserRepository(
  isVercel
    ? '/tmp/data'  // On Vercel, /tmp is the only writable location in serverless
    : path.join(__dirname, '..', 'data'),
  encryptionKey || process.env.ENCRYPTION_KEY
);

userRepository.initialize().catch((err: Error) => {
  console.error('Failed to initialize user repository:', err);
});

// Initialize email service and scheduler (skip on Vercel -- cron jobs don't run in serverless)
if (!isVercel) {
  const emailService = createEmailService();
  const dashboardUrl = process.env.DASHBOARD_URL || (isDevelopment ? 'http://localhost:3000' : process.env.CLIENT_URL || 'http://localhost:3001');
  const emailScheduler = new EmailScheduler(userRepository, emailService, dashboardUrl);
  emailScheduler.start();
}

// API routes
app.use('/api/auth', createAuthRouter(userRepository));
app.use('/api/calendar', createCalendarRouter(userRepository));
app.use('/api/v1/subscription', createSubscriptionRouter(userRepository));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production (non-Vercel only -- Vercel serves static files separately)
if (!isDevelopment && !isVercel) {
  const clientPath = path.join(__dirname, 'client');
  app.use(express.static(clientPath));
  
  // Handle client-side routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: isDevelopment ? err.message : 'Internal server error',
  });
});

export default app;
