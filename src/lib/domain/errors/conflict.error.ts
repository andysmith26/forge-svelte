import { DomainError, type DomainErrorOptions } from './base';

export class ConflictError extends DomainError {
  constructor(message: string = 'Conflict', options?: DomainErrorOptions) {
    super(message, options);
  }
}
