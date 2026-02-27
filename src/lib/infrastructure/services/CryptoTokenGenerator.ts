import { randomBytes } from 'crypto';
import type { TokenGenerator } from '$lib/application/ports/TokenGenerator';

export class CryptoTokenGenerator implements TokenGenerator {
  generate(): string {
    return randomBytes(32).toString('hex');
  }
}
