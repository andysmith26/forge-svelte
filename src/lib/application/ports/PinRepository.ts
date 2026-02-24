/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface PinRepository {
  findClassroomIdByDisplayCode(displayCode: string): Promise<string | null>;
  findLoginCandidates(classroomId: string): Promise<PinCandidate[]>;
  createPinSession(data: CreatePinSessionInput): Promise<PinSessionRecord>;
  getPinSessionByToken(token: string): Promise<PinSessionRecord | null>;
  deletePinSession(token: string): Promise<void>;
  updatePersonPinHash(personId: string, pinHash: string | null): Promise<void>;
  listStudentsWithPins(classroomId: string): Promise<StudentPinInfo[]>;
}

export interface PinCandidate {
  personId: string;
  pinHash: string;
}

export interface CreatePinSessionInput {
  token: string;
  personId: string;
  classroomId: string;
  expiresAt: Date;
}

export interface PinSessionRecord {
  id: string;
  token: string;
  personId: string;
  classroomId: string;
  expiresAt: Date;
  lastActivityAt: Date;
}

export interface StudentPinInfo {
  personId: string;
  displayName: string;
  hasPin: boolean;
}
