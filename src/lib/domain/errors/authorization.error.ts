import { DomainError, type DomainErrorOptions } from './base';

export class NotAuthorizedError extends DomainError {
  constructor(message: string = 'Not authorized', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden', options?: DomainErrorOptions) {
    super(message, options);
  }
}
