import bcrypt from 'bcryptjs';
import type { HashService } from '$lib/application/ports/HashService';

const BCRYPT_ROUNDS = 10;

export class BcryptHashService implements HashService {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, BCRYPT_ROUNDS);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
