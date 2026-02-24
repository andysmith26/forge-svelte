export type DomainErrorOptions = {
  cause?: unknown;
  metadata?: Record<string, unknown>;
};

export class DomainError extends Error {
  public readonly cause?: unknown;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, options: DomainErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.cause = options.cause;
    this.metadata = options.metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
