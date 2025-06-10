import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { IUserRepository, User } from '../interfaces/IUserRepository';

export class JsonUserRepository implements IUserRepository {
  private readonly filePath: string;
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';
  private users: Map<string, User> = new Map();

  constructor(dataDirectory: string, encryptionKey?: string) {
    this.filePath = path.join(dataDirectory, 'users.json');
    // Use provided key or generate from environment variable
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY || this.generateKey();
    this.ensureDataDirectory(dataDirectory);
  }

  private generateKey(): string {
    // Generate a random key if none is provided
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('Generated new encryption key. Set ENCRYPTION_KEY environment variable for production.');
    return key;
  }

  private async ensureDataDirectory(directory: string): Promise<void> {
    try {
      await fs.mkdir(directory, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const users = JSON.parse(data) as User[];
      
      // Decrypt refresh tokens and rebuild the map
      for (const user of users) {
        if (user.refreshToken) {
          try {
            user.refreshToken = this.decrypt(user.refreshToken);
          } catch (error) {
            console.error(`Failed to decrypt refresh token for user ${user.googleId}:`, error);
            // Skip users with corrupted tokens
            continue;
          }
        }
        this.users.set(user.googleId, user);
      }
    } catch (error) {
      // File doesn't exist yet, that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error loading users file:', error);
      }
    }
  }

  private async persist(): Promise<void> {
    const usersArray = Array.from(this.users.values()).map(user => ({
      ...user,
      refreshToken: user.refreshToken ? this.encrypt(user.refreshToken) : '',
    }));

    await fs.writeFile(
      this.filePath,
      JSON.stringify(usersArray, null, 2),
      'utf-8'
    );
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.get(googleId) || null;
  }

  async save(user: User): Promise<void> {
    const now = new Date();
    const existingUser = this.users.get(user.googleId);
    
    const userToSave: User = {
      ...user,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };

    this.users.set(user.googleId, userToSave);
    await this.persist();
  }

  async findSubscribedUsersByFrequency(frequency: 'daily' | 'weekly'): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.preferences.isSubscribed && user.preferences.frequency === frequency
    );
  }
} 