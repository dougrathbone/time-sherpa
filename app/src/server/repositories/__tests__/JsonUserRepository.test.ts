import { JsonUserRepository } from '../JsonUserRepository';
import { User } from '../../interfaces/IUserRepository';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');

describe('JsonUserRepository', () => {
  let repository: JsonUserRepository;
  const testDataDir = '/tmp/test-data';
  const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    repository = new JsonUserRepository(testDataDir, encryptionKey);
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create data directory if it does not exist', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      
      await repository.initialize();
      
      expect(fs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
    });

    it('should load existing users from file', async () => {
      const mockUsers = [
        {
          googleId: 'user1',
          email: 'user1@example.com',
          refreshToken: 'encrypted_token',
          preferences: { isSubscribed: true, frequency: 'daily' },
        },
      ];
      
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockUsers));
      
      await repository.initialize();
      
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(testDataDir, 'users.json'),
        'utf-8'
      );
    });
  });

  describe('findByGoogleId', () => {
    it('should return null for non-existent user', async () => {
      const user = await repository.findByGoogleId('non-existent');
      expect(user).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a new user', async () => {
      const newUser: User = {
        googleId: 'user1',
        email: 'user1@example.com',
        refreshToken: 'test_token',
        preferences: { isSubscribed: false, frequency: null },
      };
      
      await repository.save(newUser);
      
      expect(fs.writeFile).toHaveBeenCalled();
      const savedUser = await repository.findByGoogleId('user1');
      expect(savedUser).toBeTruthy();
      expect(savedUser?.email).toBe('user1@example.com');
    });

    it('should update existing user', async () => {
      const user: User = {
        googleId: 'user1',
        email: 'user1@example.com',
        refreshToken: 'test_token',
        preferences: { isSubscribed: false, frequency: null },
      };
      
      await repository.save(user);
      
      // Update the user
      user.preferences = { isSubscribed: true, frequency: 'weekly' };
      await repository.save(user);
      
      const updatedUser = await repository.findByGoogleId('user1');
      expect(updatedUser?.preferences.isSubscribed).toBe(true);
      expect(updatedUser?.preferences.frequency).toBe('weekly');
    });
  });

  describe('findSubscribedUsersByFrequency', () => {
    it('should return users with matching frequency', async () => {
      const users: User[] = [
        {
          googleId: 'user1',
          email: 'user1@example.com',
          refreshToken: 'token1',
          preferences: { isSubscribed: true, frequency: 'daily' },
        },
        {
          googleId: 'user2',
          email: 'user2@example.com',
          refreshToken: 'token2',
          preferences: { isSubscribed: true, frequency: 'weekly' },
        },
        {
          googleId: 'user3',
          email: 'user3@example.com',
          refreshToken: 'token3',
          preferences: { isSubscribed: false, frequency: 'daily' },
        },
      ];
      
      for (const user of users) {
        await repository.save(user);
      }
      
      const dailyUsers = await repository.findSubscribedUsersByFrequency('daily');
      expect(dailyUsers).toHaveLength(1);
      expect(dailyUsers[0].googleId).toBe('user1');
      
      const weeklyUsers = await repository.findSubscribedUsersByFrequency('weekly');
      expect(weeklyUsers).toHaveLength(1);
      expect(weeklyUsers[0].googleId).toBe('user2');
    });
  });
}); 