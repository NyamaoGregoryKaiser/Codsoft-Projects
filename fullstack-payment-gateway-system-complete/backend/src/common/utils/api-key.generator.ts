import { randomBytes } from 'crypto';

export function generateApiKeys() {
  const apiKey = 'pk_' + randomBytes(16).toString('hex'); // Public key prefix
  const apiSecret = 'sk_' + randomBytes(32).toString('hex'); // Secret key prefix
  return { apiKey, apiSecret };
}