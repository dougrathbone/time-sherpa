import { JsonUserRepository } from '../jsonUserRepository';
import { User } from '../../interfaces/IUserRepository';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as encryption from '../../utils/encryption';

// Mock modules
jest.mock('fs/promises');
jest.mock('../../utils/encryption');

// Cast mocked modules
const mockFs = fs as jest.Mocked<typeof fs>;
const mockEncryption = encryption as jest.Mocked<typeof encryption>;

describe('JsonUserRepository', () => {
  let repository: JsonUserRepository;
  const testDataDir = '/tmp/test-data';
  const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockFs.access.mockRejectedValue({ code: 'ENOENT' });
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
    mockFs.writeFile.mockResolvedValue(undefined);
    
    // Setup encryption mock implementations
    mockEncryption.encrypt.mockImplementation((text: string) => `encrypted_${text}`);
    mockEncryption.decrypt.mockImplementation((text: string) => text.replace('encrypted_', ''));
    mockEncryption.setEncryptionKey.mockImplementation(() => {});
    
    repository = new JsonUserRepository(testDataDir, encryptionKey);
  });

  describe('initialize', () => {
    it('should create data directory if it does not exist', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      
      await repository.initialize();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
    });

    it('should load existing users from file', async () => {
      const mockUsers = [
        {
          googleId: 'user1',
          email: 'user1@example.com',
          encryptedRefreshToken: 'encrypted_token',
          preferences: { isSubscribed: true, frequency: 'daily' },
        },
      ];
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockUsers));
      
      await repository.initialize();
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
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
      
      expect(mockFs.writeFile).toHaveBeenCalled();
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