import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import FileStore from 'session-file-store';
import passport from 'passport';

import { createAuthRouter } from './server/routes/auth';
import { createCalendarRouter } from './server/routes/calendar';
import { createSubscriptionRouter } from './server/routes/subscription';
import { setupGoogleStrategy } from './server/services/auth';
import { JsonUserRepository } from './server/repositories/JsonUserRepository';
import { createEmailService } from './server/services/email';
import { EmailScheduler } from './server/services/scheduler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

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

// Initialize session store
const SessionFileStore = FileStore(session);
const sessionStore = new SessionFileStore({
  path: path.join(__dirname, '..', 'sessions'),
  ttl: 86400, // 24 hours in seconds
  retries: 5,
  factor: 1,
  minTimeout: 50,
  maxTimeout: 100,
  reapInterval: 3600, // 1 hour cleanup interval
});

// Session configuration with persistent store
app.use(session({
  name: 'timesherpa.sid', // Custom session name
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-in-production',
  store: sessionStore,
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
  path.join(__dirname, '..', 'data'),
  encryptionKey || process.env.ENCRYPTION_KEY
);
userRepository.initialize().catch(err => {
  console.error('Failed to initialize user repository:', err);
});

// Initialize email service and scheduler
const emailService = createEmailService();
const dashboardUrl = process.env.DASHBOARD_URL || (isDevelopment ? 'http://localhost:3000' : process.env.CLIENT_URL || 'http://localhost:3001');
const emailScheduler = new EmailScheduler(userRepository, emailService, dashboardUrl);

// Start email scheduler
emailScheduler.start();

// API routes
app.use('/api/auth', createAuthRouter(userRepository));
app.use('/api/calendar', createCalendarRouter(userRepository));
app.use('/api/v1/subscription', createSubscriptionRouter(userRepository));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (!isDevelopment) {
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

// Start server
app.listen(PORT, () => {
  console.log(`TimeSherpa server running on port ${PORT}`);
  console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
}); 