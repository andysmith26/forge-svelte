import { ValidationError, ConflictError } from '$lib/domain/errors';

export type SignoutType = 'self' | 'manual' | 'auto' | 'session_end';

export type SignInProps = {
  readonly id: string;
  readonly sessionId: string;
  readonly personId: string;
  readonly signedInAt: Date;
  readonly signedOutAt: Date | null;
  readonly signedInById: string;
  readonly signedOutById: string | null;
  readonly signoutType: SignoutType | null;
};

export class SignInEntity {
  private constructor(private readonly props: SignInProps) {}

  get id(): string {
    return this.props.id;
  }
  get sessionId(): string {
    return this.props.sessionId;
  }
  get personId(): string {
    return this.props.personId;
  }
  get signedInAt(): Date {
    return this.props.signedInAt;
  }
  get signedOutAt(): Date | null {
    return this.props.signedOutAt;
  }
  get signedInById(): string {
    return this.props.signedInById;
  }
  get signedOutById(): string | null {
    return this.props.signedOutById;
  }
  get signoutType(): SignoutType | null {
    return this.props.signoutType;
  }

  static create(props: SignInProps): SignInEntity {
    SignInEntity.validateSessionId(props.sessionId);
    SignInEntity.validatePersonId(props.personId);
    SignInEntity.validateSignedInById(props.signedInById);

    return new SignInEntity(props);
  }

  static fromRecord(record: SignInProps): SignInEntity {
    return new SignInEntity(record);
  }

  static createSignIn(
    id: string,
    sessionId: string,
    personId: string,
    signedInById: string,
    signedInAt: Date = new Date()
  ): SignInEntity {
    return SignInEntity.create({
      id,
      sessionId,
      personId,
      signedInAt,
      signedOutAt: null,
      signedInById,
      signedOutById: null,
      signoutType: null
    });
  }

  static validateSessionId(sessionId: string): void {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new ValidationError('Session ID is required');
    }
  }

  static validatePersonId(personId: string): void {
    if (!personId || personId.trim().length === 0) {
      throw new ValidationError('Person ID is required');
    }
  }

  static validateSignedInById(signedInById: string): void {
    if (!signedInById || signedInById.trim().length === 0) {
      throw new ValidationError('Signed in by ID is required');
    }
  }

  static validateSignoutType(signoutType: string): void {
    const validTypes: SignoutType[] = ['self', 'manual', 'auto', 'session_end'];
    if (!validTypes.includes(signoutType as SignoutType)) {
      throw new ValidationError(`Invalid sign-out type: ${signoutType}`);
    }
  }

  isSignedIn(): boolean {
    return this.signedOutAt === null;
  }

  canSignOut(): boolean {
    return this.signedOutAt === null;
  }

  isSelfSignIn(): boolean {
    return this.signedInById === this.personId;
  }

  isSelfSignOut(): boolean {
    return this.signoutType === 'self';
  }

  getDurationMinutes(): number | null {
    if (!this.signedOutAt) {
      return null;
    }
    return Math.round((this.signedOutAt.getTime() - this.signedInAt.getTime()) / (1000 * 60));
  }

  signOut(
    signedOutById: string,
    signoutType: SignoutType,
    signedOutAt: Date = new Date()
  ): SignInEntity {
    if (!this.canSignOut()) {
      throw new ConflictError('Already signed out');
    }

    SignInEntity.validateSignoutType(signoutType);

    return new SignInEntity({
      ...this.props,
      signedOutAt,
      signedOutById,
      signoutType
    });
  }

  reSignIn(signedInById: string, signedInAt: Date = new Date()): SignInEntity {
    if (this.isSignedIn()) {
      throw new ConflictError('Already signed in');
    }

    return new SignInEntity({
      ...this.props,
      signedInAt,
      signedOutAt: null,
      signedInById,
      signedOutById: null,
      signoutType: null
    });
  }

  toObject(): SignInProps {
    return { ...this.props };
  }
}
