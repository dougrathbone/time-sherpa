import { Router } from 'express';
import passport from 'passport';
import { IUserRepository } from '../interfaces/IUserRepository';

export function createAuthRouter(userRepository: IUserRepository): Router {
  const router = Router();

  // Start Google OAuth flow
  router.get('/google', 
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
  router.get('/google/callback',
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
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Debug endpoint to check session
  router.get('/session-debug', (req: any, res: any) => {
    res.json({
      sessionID: req.sessionID,
      session: req.session,
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      cookies: req.headers.cookie,
    });
  });

  return router;
}

// Export the old authRoutes for backward compatibility
export const authRoutes = Router();
// This is a temporary placeholder, the actual router should be created with userRepository 