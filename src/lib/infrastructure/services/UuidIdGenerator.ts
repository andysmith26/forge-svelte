import { randomUUID } from 'crypto';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
