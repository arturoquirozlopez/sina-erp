import { randomBytes } from 'crypto';
export function generateSecureToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}
