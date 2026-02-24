/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface PresenceRepository {
  getSignIn(sessionId: string, personId: string): Promise<SignInRecord | null>;
  createSignIn(data: CreateSignInInput): Promise<SignInRecord>;
  updateSignIn(id: string, data: Partial<SignInRecord>): Promise<SignInRecord>;
  listPresentPeople(sessionId: string): Promise<PresentPerson[]>;
  listSignInsForSession(sessionId: string): Promise<SignInRecord[]>;
  signOutAll(sessionId: string, data: BulkSignOutInput): Promise<number>;
}

export interface SignInRecord {
  id: string;
  sessionId: string;
  personId: string;
  signedInAt: Date;
  signedOutAt: Date | null;
  signedInById: string;
  signedOutById: string | null;
  signoutType: 'self' | 'manual' | 'auto' | 'session_end' | null;
}

export interface CreateSignInInput {
  sessionId: string;
  personId: string;
  signedInById: string;
}

export interface BulkSignOutInput {
  signedOutById: string;
  signoutType: 'session_end';
}

export interface PresentPerson {
  signIn: SignInRecord;
  person: {
    id: string;
    displayName: string;
    legalName: string;
    askMeAbout: string[];
  };
}
