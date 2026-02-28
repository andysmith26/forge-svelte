import type { PrismaClient } from '@prisma/client';
import type {
  PresenceRepository,
  SignInRecord,
  PersonPresence,
  SignInWithActors,
  CreateSignInInput,
  UpdateSignInInput,
  SignoutType
} from '$lib/application/ports';

export class PrismaPresenceRepository implements PresenceRepository {
  constructor(private readonly db: PrismaClient) {}

  async getActiveSignIn(sessionId: string, personId: string): Promise<SignInRecord | null> {
    return this.db.signIn.findFirst({
      where: { sessionId, personId, signedOutAt: null }
    });
  }

  async createSignIn(input: CreateSignInInput): Promise<SignInRecord> {
    return this.db.signIn.create({
      data: {
        sessionId: input.sessionId,
        personId: input.personId,
        signedInById: input.signedInById,
        signedInAt: input.signedInAt
      }
    });
  }

  async updateSignIn(id: string, input: UpdateSignInInput): Promise<SignInRecord> {
    return this.db.signIn.update({
      where: { id },
      data: {
        signedInAt: input.signedInAt,
        signedOutAt: input.signedOutAt,
        signedInById: input.signedInById,
        signedOutById: input.signedOutById,
        signoutType: input.signoutType
      }
    });
  }

  async listPresentPeople(sessionId: string): Promise<PersonPresence[]> {
    const signIns = await this.db.signIn.findMany({
      where: { sessionId, signedOutAt: null },
      include: {
        person: {
          select: { id: true, displayName: true, pronouns: true, askMeAbout: true }
        }
      },
      orderBy: { signedInAt: 'asc' }
    });

    return signIns.map((s) => s.person);
  }

  async listSignInsForSession(sessionId: string): Promise<SignInWithActors[]> {
    return this.db.signIn.findMany({
      where: { sessionId },
      include: {
        person: { select: { id: true, displayName: true, pronouns: true } },
        signedInBy: { select: { id: true, displayName: true, pronouns: true } },
        signedOutBy: { select: { id: true, displayName: true, pronouns: true } }
      },
      orderBy: { signedInAt: 'asc' }
    });
  }

  async signOutAll(
    sessionId: string,
    signedOutAt: Date,
    signoutType: SignoutType
  ): Promise<number> {
    const result = await this.db.signIn.updateMany({
      where: { sessionId, signedOutAt: null },
      data: { signedOutAt, signoutType }
    });
    return result.count;
  }
}
