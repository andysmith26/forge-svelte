export type SignoutType = 'self' | 'manual' | 'auto' | 'session_end';

export type SignInRecord = {
  id: string;
  sessionId: string;
  personId: string;
  signedInAt: Date;
  signedOutAt: Date | null;
  signedInById: string;
  signedOutById: string | null;
  signoutType: SignoutType | null;
};

export type PersonPresence = {
  id: string;
  displayName: string;
  pronouns: string | null;
  askMeAbout: string[];
};

export type SignInWithActors = SignInRecord & {
  person: { id: string; displayName: string; pronouns: string | null };
  signedInBy: { id: string; displayName: string; pronouns: string | null };
  signedOutBy: { id: string; displayName: string; pronouns: string | null } | null;
};

export type CreateSignInInput = {
  sessionId: string;
  personId: string;
  signedInById: string;
  signedInAt?: Date;
};

export type UpdateSignInInput = {
  signedInAt?: Date;
  signedOutAt?: Date | null;
  signedInById?: string;
  signedOutById?: string | null;
  signoutType?: SignoutType | null;
};

export interface PresenceRepository {
  getActiveSignIn(sessionId: string, personId: string): Promise<SignInRecord | null>;
  createSignIn(input: CreateSignInInput): Promise<SignInRecord>;
  updateSignIn(id: string, input: UpdateSignInInput): Promise<SignInRecord>;
  listPresentPeople(sessionId: string): Promise<PersonPresence[]>;
  listSignInsForSession(sessionId: string): Promise<SignInWithActors[]>;
  signOutAll(sessionId: string, signedOutAt: Date, signoutType: SignoutType): Promise<number>;
}
