import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { createAuthRouter } from '../auth';
import { IUserRepository } from '../../interfaces/IUserRepository';

// Mock passport
jest.mock('passport');

describe('Auth Routes', () => {
  let app: express.Application;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    
    // Setup middleware
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));

    // Mock passport middleware
    (passport.initialize as jest.Mock).mockReturnValue((req: any, _res: any, next: any) => {
      req._passport = { instance: passport };
      next();
    });
    
    (passport.session as jest.Mock).mockReturnValue((_req: any, _res: any, next: any) => {
      next();
    });

    // Mock passport.authenticate to always return a middleware function
    (passport.authenticate as jest.Mock).mockImplementation((strategy: string, _options: any) => {
      return (req: any, res: any, next: any) => {
        if (strategy === 'google' && !req.path.includes('callback')) {
          // Simulate redirect to Google
          res.redirect('https://accounts.google.com/oauth/authorize');
        } else if (strategy === 'google' && req.path.includes('callback')) {
          // Simulate successful callback
          req.user = {
            id: 'test-google-id',
            email: 'test@example.com',
            name: 'Test User',
            refreshToken: 'test-refresh-token',
          };
          next();
        } else {
          next();
        }
      };
    });

    app.use(passport.initialize());
    app.use(passport.session());

    // Mock user repository
    mockUserRepository = {
      findByGoogleId: jest.fn(),
      save: jest.fn(),
      findSubscribedUsersByFrequency: jest.fn(),
    };

    // Add isAuthenticated middleware before routes
    app.use((req: any, _res, next) => {
      req.isAuthenticated = () => !!req.session?.passport?.user;
      req.user = req.session?.passport?.user;
      req.logout = (callback: any) => {
        delete req.session.passport;
        if (callback) callback();
      };
      next();
    });

    // Mount auth routes
    app.use('/api/auth', createAuthRouter(mockUserRepository));

    // Add test helper route
    app.post('/api/test/login', (req: any, res) => {
      req.session.passport = { user: req.body.user };
      req.session.save(() => {
        res.json({ success: true });
      });
    });
  });

  describe('GET /api/auth/user', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(401);

      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should return user data when authenticated', async () => {
      const agent = request.agent(app);
      
      // Simulate authenticated session
      await agent
        .post('/api/test/login')
        .send({ user: {
          id: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
        }});

      const response = await agent
        .get('/api/auth/user')
        .expect(200);

      expect(response.body.user).toEqual({
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
      });
    });
  });

  describe('GET /api/auth/google', () => {
    it('should initiate Google OAuth flow', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .expect(302);

      expect(response.headers.location).toBe('https://accounts.google.com/oauth/authorize');
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar.readonly'
        ],
        accessType: 'offline',
        prompt: 'consent'
      });
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should handle successful OAuth callback', async () => {
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(302);

      // In test environment, it should redirect to /dashboard
      expect(response.headers.location).toBe('/dashboard');
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        googleId: 'test-google-id',
        email: 'test@example.com',
        refreshToken: 'test-refresh-token',
        preferences: {
          isSubscribed: false,
          frequency: null,
        },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/api/test/login')
        .send({ user: { id: 'test-id', email: 'test@example.com' }});

      const response = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('GET /api/auth/session-debug', () => {
    it('should return session debug info', async () => {
      const response = await request(app)
        .get('/api/auth/session-debug')
        .set('Cookie', 'test-cookie=value')
        .expect(200);

      expect(response.body).toHaveProperty('sessionID');
      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('isAuthenticated', false);
      expect(response.body.cookies).toBe('test-cookie=value');
    });
  });
}); 