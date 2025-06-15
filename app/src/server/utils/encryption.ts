import crypto from 'crypto';

let encryptionKey: string | null = null;

export function setEncryptionKey(key: string): void {
  if (key.length !== 64) {
    throw new Error('Encryption key must be 64 characters (32 bytes) long');
  }
  encryptionKey = key;
}

export function encrypt(text: string): string {
  if (!encryptionKey) {
    throw new Error('Encryption key not set. Call setEncryptionKey() first.');
  }
  
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  if (!encryptionKey) {
    throw new Error('Encryption key not set. Call setEncryptionKey() first.');
  }
  
  const algorithm = 'aes-256-gcm';
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
} 