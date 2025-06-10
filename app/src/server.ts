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

// CORS configuration
app.use(cors({
  origin: isDevelopment ? 'http://localhost:3000' : process.env.CLIENT_URL || false,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !isDevelopment,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication strategy
setupGoogleStrategy();

// Initialize user repository
const userRepository = new JsonUserRepository(path.join(__dirname, '..', 'data'));
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