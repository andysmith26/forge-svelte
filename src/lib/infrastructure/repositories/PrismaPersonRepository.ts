import type { PrismaClient } from '@prisma/client';
import type {
  PersonRepository,
  PersonRecord,
  PersonProfile,
  StudentSummary,
  CreatePersonInput,
  UpdatePersonInput,
  UpdateProfileInput,
  CreateMembershipInput,
  UpdateMembershipInput,
  ClassroomMembership
} from '$lib/application/ports';

export class PrismaPersonRepository implements PersonRepository {
  constructor(private readonly db: PrismaClient) {}

  async getById(id: string): Promise<PersonRecord | null> {
    return this.db.person.findUnique({ where: { id } });
  }

  private static readonly profileSelect = {
    id: true,
    displayName: true,
    legalName: true,
    pronouns: true,
    askMeAbout: true,
    themeColor: true,
    currentlyWorkingOn: true,
    helpQueueVisible: true,
    email: true
  } as const;

  async getProfile(id: string): Promise<PersonProfile | null> {
    return this.db.person.findUnique({
      where: { id },
      select: PrismaPersonRepository.profileSelect
    });
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PersonProfile> {
    return this.db.person.update({
      where: { id },
      data: {
        displayName: input.displayName,
        pronouns: input.pronouns,
        askMeAbout: input.askMeAbout,
        themeColor: input.themeColor,
        currentlyWorkingOn: input.currentlyWorkingOn,
        helpQueueVisible: input.helpQueueVisible
      },
      select: PrismaPersonRepository.profileSelect
    });
  }

  async findByEmail(email: string): Promise<PersonRecord | null> {
    return this.db.person.findUnique({ where: { email } });
  }

  async createPerson(input: CreatePersonInput): Promise<PersonRecord> {
    return this.db.person.create({
      data: {
        schoolId: input.schoolId,
        email: input.email ?? null,
        legalName: input.legalName,
        displayName: input.displayName,
        gradeLevel: input.gradeLevel ?? null
      }
    });
  }

  async updatePerson(id: string, input: UpdatePersonInput): Promise<PersonRecord> {
    return this.db.person.update({
      where: { id },
      data: {
        email: input.email,
        legalName: input.legalName,
        displayName: input.displayName,
        pronouns: input.pronouns,
        gradeLevel: input.gradeLevel,
        askMeAbout: input.askMeAbout
      }
    });
  }

  async listStudents(classroomId: string): Promise<StudentSummary[]> {
    const memberships = await this.db.classroomMembership.findMany({
      where: { classroomId, role: 'student', isActive: true },
      include: {
        person: {
          select: { id: true, displayName: true, email: true, gradeLevel: true, createdAt: true }
        }
      },
      orderBy: { person: { displayName: 'asc' } }
    });

    return memberships.map((m) => m.person);
  }

  async getMembership(
    personId: string,
    classroomId: string,
    options: { includeInactive?: boolean } = {}
  ): Promise<ClassroomMembership | null> {
    return this.db.classroomMembership.findFirst({
      where: {
        personId,
        classroomId,
        ...(options.includeInactive ? {} : { isActive: true })
      }
    });
  }

  async createMembership(input: CreateMembershipInput): Promise<ClassroomMembership> {
    return this.db.classroomMembership.create({
      data: {
        classroomId: input.classroomId,
        personId: input.personId,
        role: input.role
      }
    });
  }

  async updateMembership(id: string, input: UpdateMembershipInput): Promise<ClassroomMembership> {
    return this.db.classroomMembership.update({
      where: { id },
      data: {
        role: input.role,
        isActive: input.isActive,
        leftAt: input.leftAt
      }
    });
  }
}
