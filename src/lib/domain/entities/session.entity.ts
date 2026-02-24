import { ValidationError, ConflictError } from '$lib/domain/errors';
import type { SessionStatus } from '$lib/domain/types/session-status';

export type SessionType = 'structured' | 'drop_in';

export type SessionProps = {
  readonly id: string;
  readonly classroomId: string;
  readonly name: string | null;
  readonly sessionType: SessionType;
  readonly scheduledDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly actualStartAt: Date | null;
  readonly actualEndAt: Date | null;
  readonly status: SessionStatus;
};

export class SessionEntity {
  private constructor(private readonly props: SessionProps) {}

  get id(): string {
    return this.props.id;
  }
  get classroomId(): string {
    return this.props.classroomId;
  }
  get name(): string | null {
    return this.props.name;
  }
  get sessionType(): SessionType {
    return this.props.sessionType;
  }
  get scheduledDate(): Date {
    return this.props.scheduledDate;
  }
  get startTime(): Date {
    return this.props.startTime;
  }
  get endTime(): Date {
    return this.props.endTime;
  }
  get actualStartAt(): Date | null {
    return this.props.actualStartAt;
  }
  get actualEndAt(): Date | null {
    return this.props.actualEndAt;
  }
  get status(): SessionStatus {
    return this.props.status;
  }

  static create(props: SessionProps): SessionEntity {
    SessionEntity.validateClassroomId(props.classroomId);
    SessionEntity.validateTimes(props.startTime, props.endTime);
    SessionEntity.validateSessionType(props.sessionType);

    return new SessionEntity(props);
  }

  static fromRecord(record: SessionProps): SessionEntity {
    return new SessionEntity(record);
  }

  static validateClassroomId(classroomId: string): void {
    if (!classroomId || classroomId.trim().length === 0) {
      throw new ValidationError('Classroom ID is required');
    }
  }

  static validateTimes(startTime: Date, endTime: Date): void {
    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }
  }

  static validateSessionType(sessionType: string): void {
    if (sessionType !== 'structured' && sessionType !== 'drop_in') {
      throw new ValidationError("Session type must be 'structured' or 'drop_in'");
    }
  }

  canStart(): boolean {
    return this.status === 'scheduled';
  }

  canEnd(): boolean {
    return this.status === 'active';
  }

  canCancel(): boolean {
    return this.status === 'scheduled';
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  hasEnded(): boolean {
    return this.status === 'ended' || this.status === 'cancelled';
  }

  allowsSignIn(): boolean {
    return this.status === 'active';
  }

  start(startedAt: Date = new Date()): SessionEntity {
    if (!this.canStart()) {
      throw new ConflictError(`Cannot start session in '${this.status}' status`);
    }

    return new SessionEntity({
      ...this.props,
      status: 'active',
      actualStartAt: startedAt
    });
  }

  end(endedAt: Date = new Date()): SessionEntity {
    if (!this.canEnd()) {
      throw new ConflictError(`Cannot end session in '${this.status}' status`);
    }

    return new SessionEntity({
      ...this.props,
      status: 'ended',
      actualEndAt: endedAt
    });
  }

  cancel(): SessionEntity {
    if (!this.canCancel()) {
      throw new ConflictError(`Cannot cancel session in '${this.status}' status`);
    }

    return new SessionEntity({
      ...this.props,
      status: 'cancelled'
    });
  }

  getScheduledDurationMinutes(): number {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }

  getActualDurationMinutes(): number | null {
    if (!this.actualStartAt || !this.actualEndAt) {
      return null;
    }
    return Math.round((this.actualEndAt.getTime() - this.actualStartAt.getTime()) / (1000 * 60));
  }

  toObject(): SessionProps {
    return { ...this.props };
  }
}
