import fs from 'fs/promises';
import * as path from 'path';
import { IUserRepository, User } from '../interfaces/IUserRepository';
import { encrypt, decrypt, setEncryptionKey } from '../utils/encryption';

interface StoredUser extends Omit<User, 'refreshToken'> {
  encryptedRefreshToken: string;
}

export class JsonUserRepository implements IUserRepository {
  private filePath: string;
  private users: Map<string, StoredUser> = new Map();
  private isInitialized = false;

  constructor(dataDirectory: string = './data', encryptionKey?: string) {
    this.filePath = path.join(dataDirectory, 'users.json');
    if (encryptionKey) {
      setEncryptionKey(encryptionKey);
    }
  }

  private async ensureDataDirectoryExists(): Promise<void> {
    const dataDir = path.dirname(this.filePath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.ensureDataDirectoryExists();

    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      
      // Handle empty file
      if (!data || data.trim() === '') {
        this.users.clear();
        return;
      }
      
      const usersArray: StoredUser[] = JSON.parse(data);
      
      this.users.clear();
      for (const user of usersArray) {
        this.users.set(user.googleId, user);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, start with empty users
        this.users.clear();
      } else {
        throw new Error(`Failed to load users: ${error.message}`);
      }
    }

    this.isInitialized = true;
  }

  private async loadUsers(): Promise<void> {
    await this.initialize();
  }

  private async saveUsers(): Promise<void> {
    await this.ensureDataDirectoryExists();
    
    const usersArray = Array.from(this.users.values());
    await fs.writeFile(this.filePath, JSON.stringify(usersArray, null, 2));
  }

  private storedUserToUser(storedUser: StoredUser): User {
    return {
      ...storedUser,
      refreshToken: decrypt(storedUser.encryptedRefreshToken),
    };
  }

  private userToStoredUser(user: User): StoredUser {
    return {
      ...user,
      encryptedRefreshToken: encrypt(user.refreshToken),
    };
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    await this.loadUsers();
    
    const storedUser = this.users.get(googleId);
    if (!storedUser) {
      return null;
    }

    return this.storedUserToUser(storedUser);
  }

  async save(user: User): Promise<void> {
    await this.loadUsers();
    
    const storedUser = this.userToStoredUser(user);
    this.users.set(user.googleId, storedUser);
    
    await this.saveUsers();
  }

  async findSubscribedUsersByFrequency(frequency: 'daily' | 'weekly'): Promise<User[]> {
    await this.loadUsers();
    
    const subscribedUsers: User[] = [];
    
    for (const storedUser of this.users.values()) {
      if (storedUser.preferences.isSubscribed && storedUser.preferences.frequency === frequency) {
        subscribedUsers.push(this.storedUserToUser(storedUser));
      }
    }
    
    return subscribedUsers;
  }
} 