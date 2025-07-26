import { JsonUserRepository } from '../repositories/JsonUserRepository';
import { WorkweekSettings } from '../../shared/types';
import { defaultWorkweek } from './workweekUtils';
import path from 'path';

let userRepository: JsonUserRepository | null = null;

export function getUserRepository(): JsonUserRepository {
  if (!userRepository) {
    const encryptionKey = process.env.ENCRYPTION_KEY || 
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // Default for dev
    
    userRepository = new JsonUserRepository(
      path.join(__dirname, '..', '..', 'data'),
      encryptionKey
    );
  }
  return userRepository;
}

export async function getUserWorkweek(googleId: string): Promise<WorkweekSettings> {
  try {
    const repo = getUserRepository();
    const user = await repo.findByGoogleId(googleId);
    
    return user?.preferences?.workweek || defaultWorkweek;
  } catch (error) {
    console.error('Error fetching user workweek:', error);
    return defaultWorkweek;
  }
}