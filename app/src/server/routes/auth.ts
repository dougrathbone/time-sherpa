import { Router } from 'express';
import passport from 'passport';
import { IUserRepository } from '../interfaces/IUserRepository';
import { WorkweekSettings } from '../../shared/types';
import { isGoogleAuthConfigured } from '../services/auth';

export function createAuthRouter(userRepository: IUserRepository): Router {
  const router = Router();

  // Start Google OAuth flow
  router.get('/google', (req: any, res: any, next: any) => {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({
        error: 'Google OAuth is not configured. Place client_secret.json in the app/ directory.'
      });
    }
    next();
  },
    passport.authenticate('google', {
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
      accessType: 'offline',
      prompt: 'consent'
    })
  );

  // Google OAuth callback
  router.get('/google/callback', (req: any, res: any, next: any) => {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({
        error: 'Google OAuth is not configured. Place client_secret.json in the app/ directory.'
      });
    }
    next();
  },
    passport.authenticate('google', { 
      failureRedirect: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/?error=auth_failed' 
        : '/?error=auth_failed'
    }),
    async (req: any, res: any) => {
      try {
        // Save user information including refresh token
        if (req.user) {
          const sessionUser = req.user;
          const googleId = sessionUser.id;
          const email = sessionUser.email;
          const refreshToken = sessionUser.refreshToken;

          if (googleId && email && refreshToken) {
            let user = await userRepository.findByGoogleId(googleId);
            
            if (!user) {
              // Create new user with default preferences
              user = {
                googleId,
                email,
                refreshToken,
                preferences: {
                  isSubscribed: false,
                  frequency: null,
                },
              };
            } else {
              // Update refresh token
              user.refreshToken = refreshToken;
            }

            await userRepository.save(user);
          }
        }

        // Ensure session is saved before redirect
        req.session.save((err: any) => {
          if (err) {
            console.error('Error saving session:', err);
          }
          
          // Successful authentication
          const redirectUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/dashboard'
            : '/dashboard';
          
          res.redirect(redirectUrl);
        });
      } catch (error) {
        console.error('Error saving user after authentication:', error);
        // Still redirect to dashboard even if save fails
        const redirectUrl = process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000/dashboard'
          : '/dashboard';
        res.redirect(redirectUrl);
      }
    }
  );

  // Get current user
  router.get('/user', (req: any, res: any) => {
    if (req.isAuthenticated()) {
      res.json({
        user: {
          id: req.user?.id,
          email: req.user?.email,
          name: req.user?.name,
          picture: req.user?.picture,
        }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Logout
  router.post('/logout', (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      // Destroy session to ensure complete logout
      req.session.destroy((sessionErr: any) => {
        if (sessionErr) {
          console.error('Session destruction error:', sessionErr);
        }
        res.clearCookie('timesherpa.sid'); // Clear session cookie
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Debug endpoint to check session
  router.get('/session-debug', (req: any, res: any) => {
    // Modify session to force persistence
    req.session.lastAccess = new Date().toISOString();
    
    req.session.save((err: any) => {
      if (err) {
        console.error('Session save error:', err);
      }
      
      res.json({
        sessionID: req.sessionID,
        session: req.session,
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        cookies: req.headers.cookie,
      });
    });
  });

  // Get user preferences including workweek settings
  router.get('/preferences', async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = await userRepository.findByGoogleId(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        preferences: user.preferences
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // Update workweek settings
  router.put('/workweek', async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { workweek }: { workweek: WorkweekSettings } = req.body;
      
      if (!workweek) {
        return res.status(400).json({ error: 'Workweek settings are required' });
      }

      // Validate workweek settings
      const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of requiredDays) {
        if (typeof workweek[day as keyof WorkweekSettings] !== 'boolean') {
          return res.status(400).json({ error: `Invalid value for ${day}` });
        }
      }

      const user = await userRepository.findByGoogleId(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user preferences
      user.preferences = {
        ...user.preferences,
        workweek
      };

      await userRepository.save(user);

      res.json({
        message: 'Workweek settings updated successfully',
        workweek
      });
    } catch (error) {
      console.error('Error updating workweek settings:', error);
      res.status(500).json({ error: 'Failed to update workweek settings' });
    }
  });

  return router;
}

// Export the old authRoutes for backward compatibility
export const authRoutes = Router();
// This is a temporary placeholder, the actual router should be created with userRepository 