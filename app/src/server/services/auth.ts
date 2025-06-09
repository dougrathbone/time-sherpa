import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import fs from 'fs';
import path from 'path';

interface GoogleCredentials {
  web: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}

export function setupGoogleStrategy(): void {
  try {
    // Read Google OAuth credentials
    const credentialsPath = path.join(process.cwd(), 'client_secret.json');
    const credentials: GoogleCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const clientId = credentials.web.client_id;
    const clientSecret = credentials.web.client_secret;
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001/api/auth/google/callback'
      : credentials.web.redirect_uris[0];

    console.log('Google OAuth redirect URI:', redirectUri);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    passport.use(new GoogleStrategy({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: redirectUri,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.readonly'
      ]
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user: User = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          picture: profile.photos?.[0]?.value,
          accessToken,
          refreshToken
        };
        
        return done(null, user);
      } catch (error) {
        console.error('Error in Google strategy:', error);
        return done(error, null);
      }
    }));

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    // Deserialize user from session
    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });

  } catch (error) {
    console.error('Error setting up Google OAuth strategy:', error);
    throw error;
  }
}

export function ensureAuthenticated(req: any, res: any, next: any): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
} 