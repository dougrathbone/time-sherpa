import { Router } from 'express';
import { IUserRepository } from '../interfaces/IUserRepository';

export function createSubscriptionRouter(userRepository: IUserRepository): Router {
  const router = Router();

  // GET /api/v1/subscription - Get current user's subscription preferences
  router.get('/', async (req: any, res: any) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user from session
      const sessionUser = req.user;
      const googleId = sessionUser.googleId || sessionUser.id;

      if (!googleId) {
        return res.status(400).json({ error: 'Invalid user session' });
      }

      // Find user in repository
      const user = await userRepository.findByGoogleId(googleId);

      if (!user) {
        // User not found, return default preferences
        return res.json({
          isSubscribed: false,
          frequency: null,
        });
      }

      // Return user's subscription preferences
      res.json({
        isSubscribed: user.preferences.isSubscribed,
        frequency: user.preferences.frequency,
      });
    } catch (error) {
      console.error('Error getting subscription preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/v1/subscription - Update user's subscription preferences
  router.put('/', async (req: any, res: any) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate request body
      const { isSubscribed, frequency } = req.body;

      if (typeof isSubscribed !== 'boolean') {
        return res.status(400).json({ error: 'isSubscribed must be a boolean' });
      }

      if (isSubscribed && !['daily', 'weekly'].includes(frequency)) {
        return res.status(400).json({ error: 'frequency must be "daily" or "weekly" when subscribed' });
      }

      // Get user from session
      const sessionUser = req.user;
      const googleId = sessionUser.googleId || sessionUser.id;
      const email = sessionUser.emails?.[0]?.value || sessionUser.email;

      if (!googleId || !email) {
        return res.status(400).json({ error: 'Invalid user session' });
      }

      // Get refresh token from session
      const refreshToken = sessionUser.refreshToken || '';

      // Find or create user
      let user = await userRepository.findByGoogleId(googleId);

      if (!user) {
        // Create new user
        user = {
          googleId,
          email,
          refreshToken,
          preferences: {
            isSubscribed: false,
            frequency: null,
          },
        };
      }

      // Update preferences
      user.preferences = {
        isSubscribed,
        frequency: isSubscribed ? frequency : null,
      };

      // Update refresh token if available
      if (refreshToken) {
        user.refreshToken = refreshToken;
      }

      // Save user
      await userRepository.save(user);

      res.json({ 
        message: 'Subscription preferences updated successfully',
        preferences: user.preferences,
      });
    } catch (error) {
      console.error('Error updating subscription preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
} 