import type { PrismaClient } from '@prisma/client';
import type {
  PinRepository,
  PinCandidate,
  PinSessionRecord,
  CreatePinSessionInput,
  PersonPinRecord,
  PersonPinSummary
} from '$lib/application/ports';

export class PrismaPinRepository implements PinRepository {
  constructor(private readonly db: PrismaClient) {}

  async findClassroomIdByDisplayCode(code: string): Promise<string | null> {
    const classroom = await this.db.classroom.findUnique({
      where: { displayCode: code },
      select: { id: true }
    });
    return classroom?.id ?? null;
  }

  async findLoginCandidates(classroomId: string): Promise<PinCandidate[]> {
    const memberships = await this.db.classroomMembership.findMany({
      where: {
        classroomId,
        role: 'student',
        isActive: true,
        person: { pinHash: { not: null }, isActive: true }
      },
      select: {
        person: { select: { id: true, pinHash: true } }
      }
    });

    return memberships
      .filter((m) => m.person.pinHash !== null)
      .map((m) => ({ personId: m.person.id, pinHash: m.person.pinHash! }));
  }

  async createPinSession(input: CreatePinSessionInput): Promise<PinSessionRecord> {
    const session = await this.db.pinSession.create({
      data: {
        token: input.token,
        personId: input.personId,
        classroomId: input.classroomId,
        expiresAt: input.expiresAt
      },
      include: {
        person: { select: { displayName: true } }
      }
    });

    return {
      id: session.id,
      token: session.token,
      personId: session.personId,
      classroomId: session.classroomId,
      displayName: session.person.displayName,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt
    };
  }

  async getPinSessionByToken(token: string): Promise<PinSessionRecord | null> {
    const session = await this.db.pinSession.findUnique({
      where: { token },
      include: {
        person: { select: { id: true, displayName: true } }
      }
    });

    if (!session) return null;

    return {
      id: session.id,
      token: session.token,
      personId: session.personId,
      classroomId: session.classroomId,
      displayName: session.person.displayName,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt
    };
  }

  async touchPinSession(token: string, lastActivityAt: Date): Promise<void> {
    await this.db.pinSession.update({
      where: { token },
      data: { lastActivityAt }
    });
  }

  async deletePinSession(token: string): Promise<void> {
    await this.db.pinSession.delete({ where: { token } }).catch(() => {
      // Ignore if already deleted
    });
  }

  async deletePinSessionsForPerson(personId: string): Promise<number> {
    const result = await this.db.pinSession.deleteMany({ where: { personId } });
    return result.count;
  }

  async updatePersonPinHash(personId: string, pinHash: string | null): Promise<void> {
    await this.db.person.update({
      where: { id: personId },
      data: { pinHash }
    });
  }

  async updatePersonLastLogin(personId: string, lastLoginAt: Date): Promise<void> {
    await this.db.person.update({
      where: { id: personId },
      data: { lastLoginAt }
    });
  }

  async getPersonPinSummary(personId: string): Promise<PersonPinSummary | null> {
    const person = await this.db.person.findUnique({
      where: { id: personId },
      select: {
        pinHash: true,
        memberships: {
          where: { isActive: true },
          select: {
            classroom: { select: { id: true, name: true, displayCode: true } }
          }
        }
      }
    });

    if (!person) return null;

    return {
      hasPin: !!person.pinHash,
      classrooms: person.memberships.map((m) => m.classroom)
    };
  }

  async listStudentsWithPins(classroomId: string): Promise<PersonPinRecord[]> {
    const memberships = await this.db.classroomMembership.findMany({
      where: { classroomId, role: 'student', isActive: true },
      include: {
        person: { select: { id: true, displayName: true, email: true, pinHash: true } }
      },
      orderBy: { person: { displayName: 'asc' } }
    });

    return memberships.map((m) => ({
      id: m.person.id,
      displayName: m.person.displayName,
      email: m.person.email,
      hasPin: !!m.person.pinHash
    }));
  }

  async listStudentIdsWithoutPins(classroomId: string): Promise<string[]> {
    const memberships = await this.db.classroomMembership.findMany({
      where: {
        classroomId,
        role: 'student',
        isActive: true,
        person: { pinHash: null }
      },
      select: { person: { select: { id: true } } }
    });
    return memberships.map((m) => m.person.id);
  }

  async getMembership(personId: string, classroomId: string): Promise<{ id: string } | null> {
    return this.db.classroomMembership.findFirst({
      where: { personId, classroomId, isActive: true },
      select: { id: true }
    });
  }

  async getPersonPinHash(personId: string): Promise<string | null> {
    const person = await this.db.person.findUnique({
      where: { id: personId },
      select: { pinHash: true }
    });
    return person?.pinHash ?? null;
  }
}
