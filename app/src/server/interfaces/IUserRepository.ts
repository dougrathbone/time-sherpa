import { WorkweekSettings } from '../../shared/types';

export interface SubscriptionPreferences {
  isSubscribed: boolean;
  frequency: 'daily' | 'weekly' | null;
  workweek?: WorkweekSettings;
}

export interface User {
  googleId: string;
  email: string;
  refreshToken: string; // Encrypted
  preferences: SubscriptionPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserRepository {
  /**
   * Finds a user by their Google ID.
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Creates or updates a user's record.
   */
  save(user: User): Promise<void>;

  /**
   * Retrieves all users with an active subscription for a given frequency.
   */
  findSubscribedUsersByFrequency(frequency: 'daily' | 'weekly'): Promise<User[]>;
} 