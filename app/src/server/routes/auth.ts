import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Start Google OAuth flow
router.get('/google', 
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/?error=auth_failed' 
      : '/?error=auth_failed'
  }),
  (req: any, res: any) => {
    // Successful authentication
    const redirectUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/dashboard'
      : '/dashboard';
    res.redirect(redirectUrl);
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

export { router as authRoutes }; 