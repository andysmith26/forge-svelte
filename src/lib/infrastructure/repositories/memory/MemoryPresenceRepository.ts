import type {
  PresenceRepository,
  SignInRecord,
  SignoutType,
  PersonPresence,
  SignInWithActors,
  CreateSignInInput,
  UpdateSignInInput,
  IdGenerator
} from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryPresenceRepository implements PresenceRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async getActiveSignIn(sessionId: string, personId: string): Promise<SignInRecord | null> {
    for (const s of this.store.signIns.values()) {
      if (s.sessionId === sessionId && s.personId === personId && s.signedOutAt === null) return s;
    }
    return null;
  }

  async createSignIn(input: CreateSignInInput): Promise<SignInRecord> {
    const id = this.idGen.generate();
    const record: SignInRecord = {
      id,
      sessionId: input.sessionId,
      personId: input.personId,
      signedInAt: input.signedInAt ?? new Date(),
      signedOutAt: null,
      signedInById: input.signedInById,
      signedOutById: null,
      signoutType: null
    };
    this.store.signIns.set(id, record);
    return record;
  }

  async updateSignIn(id: string, input: UpdateSignInInput): Promise<SignInRecord> {
    const record = this.store.signIns.get(id);
    if (!record) throw new Error(`SignIn ${id} not found`);
    const updated = { ...record, ...input };
    this.store.signIns.set(id, updated);
    return updated;
  }

  async listPresentPeople(sessionId: string): Promise<PersonPresence[]> {
    const result: PersonPresence[] = [];
    for (const s of this.store.signIns.values()) {
      if (s.sessionId === sessionId && s.signedOutAt === null) {
        const person = this.store.persons.get(s.personId);
        if (person) {
          result.push({
            id: person.id,
            displayName: person.displayName,
            pronouns: person.pronouns,
            askMeAbout: person.askMeAbout,
            themeColor: person.themeColor,
            currentlyWorkingOn: person.currentlyWorkingOn
          });
        }
      }
    }
    return result;
  }

  async listSignInsForSession(sessionId: string): Promise<SignInWithActors[]> {
    const result: SignInWithActors[] = [];
    for (const s of this.store.signIns.values()) {
      if (s.sessionId === sessionId) {
        const person = this.store.persons.get(s.personId);
        const signedInBy = this.store.persons.get(s.signedInById);
        const signedOutBy = s.signedOutById ? this.store.persons.get(s.signedOutById) : null;

        result.push({
          ...s,
          person: {
            id: s.personId,
            displayName: person?.displayName ?? 'Unknown',
            pronouns: person?.pronouns ?? null
          },
          signedInBy: {
            id: s.signedInById,
            displayName: signedInBy?.displayName ?? 'Unknown',
            pronouns: signedInBy?.pronouns ?? null
          },
          signedOutBy: signedOutBy
            ? {
                id: signedOutBy.id,
                displayName: signedOutBy.displayName,
                pronouns: signedOutBy.pronouns
              }
            : null
        });
      }
    }
    return result;
  }

  async signOutAll(
    sessionId: string,
    signedOutAt: Date,
    signoutType: SignoutType
  ): Promise<number> {
    let count = 0;
    for (const [id, s] of this.store.signIns.entries()) {
      if (s.sessionId === sessionId && s.signedOutAt === null) {
        this.store.signIns.set(id, { ...s, signedOutAt, signoutType });
        count++;
      }
    }
    return count;
  }
}
