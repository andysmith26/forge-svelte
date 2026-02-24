import { DomainError, type DomainErrorOptions } from './base';

export type ValidationIssue = {
  path?: string;
  message: string;
};

export class ValidationError extends DomainError {
  public readonly issues: ValidationIssue[];

  constructor(
    message: string = 'Validation failed',
    issues: ValidationIssue[] = [],
    options?: DomainErrorOptions
  ) {
    super(message, options);
    this.issues = issues;
  }
}
