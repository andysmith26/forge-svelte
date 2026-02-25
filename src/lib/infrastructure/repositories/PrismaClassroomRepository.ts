import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  ClassroomRepository,
  ClassroomRecord,
  ClassroomMembership,
  ClassroomMembershipWithClassroom,
  ClassroomMemberProfile
} from '$lib/application/ports';

export class PrismaClassroomRepository implements ClassroomRepository {
  constructor(private readonly db: PrismaClient) {}

  async getById(id: string): Promise<ClassroomRecord | null> {
    return this.db.classroom.findUnique({ where: { id } });
  }

  async getByDisplayCode(code: string): Promise<ClassroomRecord | null> {
    return this.db.classroom.findUnique({ where: { displayCode: code } });
  }

  async listMembershipsForPerson(personId: string): Promise<ClassroomMembershipWithClassroom[]> {
    return this.db.classroomMembership.findMany({
      where: { personId, isActive: true },
      include: { classroom: true }
    });
  }

  async listMembers(classroomId: string): Promise<ClassroomMemberProfile[]> {
    const memberships = await this.db.classroomMembership.findMany({
      where: { classroomId, isActive: true },
      include: {
        person: {
          select: { id: true, displayName: true, pronouns: true, gradeLevel: true }
        }
      },
      orderBy: { person: { displayName: 'asc' } }
    });

    return memberships.map((m) => ({
      ...m.person,
      role: m.role
    }));
  }

  async getMembership(
    personId: string,
    classroomId: string
  ): Promise<ClassroomMembership | null> {
    return this.db.classroomMembership.findFirst({
      where: { personId, classroomId, isActive: true }
    });
  }

  async updateSettings(classroomId: string, settings: unknown): Promise<void> {
    await this.db.classroom.update({
      where: { id: classroomId },
      data: { settings: settings as Prisma.InputJsonValue }
    });
  }
}
