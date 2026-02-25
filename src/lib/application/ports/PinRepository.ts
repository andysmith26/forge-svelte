export type PinCandidate = {
  personId: string;
  pinHash: string;
};

export type PinSessionRecord = {
  id: string;
  token: string;
  personId: string;
  classroomId: string;
  displayName: string;
  expiresAt: Date;
  lastActivityAt: Date;
};

export type CreatePinSessionInput = {
  token: string;
  personId: string;
  classroomId: string;
  expiresAt: Date;
};

export type PersonPinRecord = {
  id: string;
  displayName: string;
  email: string | null;
  hasPin: boolean;
};

export type PersonPinSummary = {
  hasPin: boolean;
  classrooms: { id: string; name: string; displayCode: string }[];
};

export interface PinRepository {
  findClassroomIdByDisplayCode(code: string): Promise<string | null>;
  findLoginCandidates(classroomId: string): Promise<PinCandidate[]>;
  createPinSession(input: CreatePinSessionInput): Promise<PinSessionRecord>;
  getPinSessionByToken(token: string): Promise<PinSessionRecord | null>;
  touchPinSession(token: string, lastActivityAt: Date): Promise<void>;
  deletePinSession(token: string): Promise<void>;
  deletePinSessionsForPerson(personId: string): Promise<number>;
  updatePersonPinHash(personId: string, pinHash: string | null): Promise<void>;
  updatePersonLastLogin(personId: string, lastLoginAt: Date): Promise<void>;
  getPersonPinSummary(personId: string): Promise<PersonPinSummary | null>;
  listStudentsWithPins(classroomId: string): Promise<PersonPinRecord[]>;
  listStudentIdsWithoutPins(classroomId: string): Promise<string[]>;
  getMembership(personId: string, classroomId: string): Promise<{ id: string } | null>;
}
