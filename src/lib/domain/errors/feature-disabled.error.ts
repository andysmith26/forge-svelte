import { DomainError, type DomainErrorOptions } from './base';

export class FeatureDisabledError extends DomainError {
  public readonly feature: string;
  public readonly classroomId: string;

  constructor(
    feature: string,
    classroomId: string,
    message?: string,
    options?: DomainErrorOptions
  ) {
    super(message ?? `The ${feature} feature is disabled for this classroom`, options);
    this.feature = feature;
    this.classroomId = classroomId;
  }
}
