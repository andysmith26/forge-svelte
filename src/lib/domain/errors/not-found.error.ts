import { DomainError, type DomainErrorOptions } from './base';

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found', options?: DomainErrorOptions) {
    super(message, options);
  }
}
