import { ValidationError } from '$lib/domain/errors';

export type HandoffProps = {
  readonly id: string;
  readonly projectId: string;
  readonly authorId: string;
  readonly sessionId: string | null;
  readonly whatIDid: string;
  readonly whatsNext: string | null;
  readonly blockers: string | null;
  readonly questions: string | null;
  readonly createdAt: Date;
};

export class HandoffEntity {
  private constructor(private readonly props: HandoffProps) {}

  get id(): string {
    return this.props.id;
  }
  get projectId(): string {
    return this.props.projectId;
  }
  get authorId(): string {
    return this.props.authorId;
  }
  get sessionId(): string | null {
    return this.props.sessionId;
  }
  get whatIDid(): string {
    return this.props.whatIDid;
  }
  get whatsNext(): string | null {
    return this.props.whatsNext;
  }
  get blockers(): string | null {
    return this.props.blockers;
  }
  get questions(): string | null {
    return this.props.questions;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(props: HandoffProps): HandoffEntity {
    HandoffEntity.validateWhatIDid(props.whatIDid);
    if (props.whatsNext !== null) HandoffEntity.validateWhatsNext(props.whatsNext);
    if (props.blockers !== null) HandoffEntity.validateBlockers(props.blockers);
    if (props.questions !== null) HandoffEntity.validateQuestions(props.questions);
    return new HandoffEntity(props);
  }

  static fromRecord(record: HandoffProps): HandoffEntity {
    return new HandoffEntity(record);
  }

  static validateWhatIDid(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('"What I did" is required');
    }
    if (text.trim().length < 20) {
      throw new ValidationError('"What I did" must be at least 20 characters');
    }
    if (text.length > 2000) {
      throw new ValidationError('"What I did" must be 2000 characters or less');
    }
  }

  static validateWhatsNext(text: string): void {
    if (text.length > 1000) {
      throw new ValidationError('"What\'s next" must be 1000 characters or less');
    }
  }

  static validateBlockers(text: string): void {
    if (text.length > 1000) {
      throw new ValidationError('Blockers must be 1000 characters or less');
    }
  }

  static validateQuestions(text: string): void {
    if (text.length > 1000) {
      throw new ValidationError('Questions must be 1000 characters or less');
    }
  }

  static validateResponseContent(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Response content is required');
    }
    if (text.length > 500) {
      throw new ValidationError('Response must be 500 characters or less');
    }
  }

  static validateResolutionNote(text: string): void {
    if (text.length > 500) {
      throw new ValidationError('Resolution note must be 500 characters or less');
    }
  }

  toObject(): HandoffProps {
    return { ...this.props };
  }
}
