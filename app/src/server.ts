import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

import { createAuthRouter } from './server/routes/auth';
import { calendarRoutes } from './server/routes/calendar';
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

// Session configuration
app.use(session({
  name: 'timesherpa.sid', // Custom session name
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false in development to work with HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Allow cookies to be sent with top-level navigations
    path: '/', // Explicitly set path
  },
}));

// Debug middleware for development
if (isDevelopment) {
  app.use((req: any, res, next) => {
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
app.use('/api/calendar', calendarRoutes);
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