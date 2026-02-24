import { ValidationError, ConflictError } from '$lib/domain/errors';
import type { HelpUrgency } from '$lib/domain/types/help-urgency';

export type HelpStatus = 'pending' | 'claimed' | 'resolved' | 'cancelled';

export type HelpRequestProps = {
  readonly id: string;
  readonly classroomId: string;
  readonly sessionId: string;
  readonly requesterId: string;
  readonly categoryId: string | null;
  readonly description: string;
  readonly whatITried: string;
  readonly urgency: HelpUrgency;
  readonly status: HelpStatus;
  readonly claimedById: string | null;
  readonly claimedAt: Date | null;
  readonly resolvedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly resolutionNotes: string | null;
  readonly cancellationReason: string | null;
  readonly createdAt: Date;
};

export class HelpRequestEntity {
  private constructor(private readonly props: HelpRequestProps) {}

  get id(): string {
    return this.props.id;
  }
  get classroomId(): string {
    return this.props.classroomId;
  }
  get sessionId(): string {
    return this.props.sessionId;
  }
  get requesterId(): string {
    return this.props.requesterId;
  }
  get categoryId(): string | null {
    return this.props.categoryId;
  }
  get description(): string {
    return this.props.description;
  }
  get whatITried(): string {
    return this.props.whatITried;
  }
  get urgency(): HelpUrgency {
    return this.props.urgency;
  }
  get status(): HelpStatus {
    return this.props.status;
  }
  get claimedById(): string | null {
    return this.props.claimedById;
  }
  get claimedAt(): Date | null {
    return this.props.claimedAt;
  }
  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }
  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }
  get resolutionNotes(): string | null {
    return this.props.resolutionNotes;
  }
  get cancellationReason(): string | null {
    return this.props.cancellationReason;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(props: HelpRequestProps): HelpRequestEntity {
    HelpRequestEntity.validateDescription(props.description);
    HelpRequestEntity.validateWhatITried(props.whatITried);
    HelpRequestEntity.validateRequesterId(props.requesterId);
    HelpRequestEntity.validateUrgency(props.urgency);

    return new HelpRequestEntity(props);
  }

  static fromRecord(record: HelpRequestProps): HelpRequestEntity {
    return new HelpRequestEntity(record);
  }

  static validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new ValidationError('Description is required');
    }
    if (description.length > 1000) {
      throw new ValidationError('Description must be 1000 characters or less');
    }
  }

  static validateWhatITried(whatITried: string): void {
    if (!whatITried || whatITried.trim().length === 0) {
      throw new ValidationError('What I tried is required');
    }
    if (whatITried.length > 1000) {
      throw new ValidationError('What I tried must be 1000 characters or less');
    }
  }

  static validateRequesterId(requesterId: string): void {
    if (!requesterId || requesterId.trim().length === 0) {
      throw new ValidationError('Requester ID is required');
    }
  }

  static validateUrgency(urgency: string): void {
    const validUrgencies = ['blocked', 'question', 'check_work'];
    if (!validUrgencies.includes(urgency)) {
      throw new ValidationError(`Invalid urgency: ${urgency}`);
    }
  }

  canClaim(): boolean {
    return this.status === 'pending';
  }

  canUnclaim(): boolean {
    return this.status === 'claimed';
  }

  canResolve(): boolean {
    return this.status === 'claimed';
  }

  canCancel(): boolean {
    return this.status === 'pending' || this.status === 'claimed';
  }

  isOpen(): boolean {
    return this.status === 'pending' || this.status === 'claimed';
  }

  isClosed(): boolean {
    return this.status === 'resolved' || this.status === 'cancelled';
  }

  claim(claimedById: string, claimedAt: Date = new Date()): HelpRequestEntity {
    if (!this.canClaim()) {
      throw new ConflictError(`Cannot claim request in '${this.status}' status`);
    }

    return new HelpRequestEntity({
      ...this.props,
      status: 'claimed',
      claimedById,
      claimedAt
    });
  }

  unclaim(): HelpRequestEntity {
    if (!this.canUnclaim()) {
      throw new ConflictError(`Cannot unclaim request in '${this.status}' status`);
    }

    return new HelpRequestEntity({
      ...this.props,
      status: 'pending',
      claimedById: null,
      claimedAt: null
    });
  }

  resolve(
    resolutionNotes: string | null = null,
    resolvedAt: Date = new Date()
  ): HelpRequestEntity {
    if (!this.canResolve()) {
      throw new ConflictError(`Cannot resolve request in '${this.status}' status`);
    }

    return new HelpRequestEntity({
      ...this.props,
      status: 'resolved',
      resolvedAt,
      resolutionNotes
    });
  }

  cancel(
    cancellationReason: string | null = null,
    cancelledAt: Date = new Date()
  ): HelpRequestEntity {
    if (!this.canCancel()) {
      throw new ConflictError(`Cannot cancel request in '${this.status}' status`);
    }

    return new HelpRequestEntity({
      ...this.props,
      status: 'cancelled',
      cancelledAt,
      cancellationReason
    });
  }

  canRequesterCancel(personId: string): boolean {
    return this.requesterId === personId && this.canCancel();
  }

  getWaitTimeMinutes(now: Date = new Date()): number {
    const endTime = this.claimedAt ?? now;
    return Math.round((endTime.getTime() - this.createdAt.getTime()) / (1000 * 60));
  }

  getResolutionTimeMinutes(): number | null {
    if (!this.claimedAt || !this.resolvedAt) {
      return null;
    }
    return Math.round((this.resolvedAt.getTime() - this.claimedAt.getTime()) / (1000 * 60));
  }

  toObject(): HelpRequestProps {
    return { ...this.props };
  }
}
