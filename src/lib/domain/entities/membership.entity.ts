import { ValidationError, ConflictError } from '$lib/domain/errors';
import type { Role } from '$lib/domain/types/roles';

export type MembershipProps = {
  readonly id: string;
  readonly classroomId: string;
  readonly personId: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly joinedAt: Date;
  readonly leftAt: Date | null;
};

export class MembershipEntity {
  private constructor(private readonly props: MembershipProps) {}

  get id(): string {
    return this.props.id;
  }
  get classroomId(): string {
    return this.props.classroomId;
  }
  get personId(): string {
    return this.props.personId;
  }
  get role(): Role {
    return this.props.role;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get joinedAt(): Date {
    return this.props.joinedAt;
  }
  get leftAt(): Date | null {
    return this.props.leftAt;
  }

  static create(props: MembershipProps): MembershipEntity {
    MembershipEntity.validateClassroomId(props.classroomId);
    MembershipEntity.validatePersonId(props.personId);
    MembershipEntity.validateRole(props.role);

    return new MembershipEntity(props);
  }

  static fromRecord(record: MembershipProps): MembershipEntity {
    return new MembershipEntity(record);
  }

  static createMembership(
    id: string,
    classroomId: string,
    personId: string,
    role: Role,
    joinedAt: Date = new Date()
  ): MembershipEntity {
    return MembershipEntity.create({
      id,
      classroomId,
      personId,
      role,
      isActive: true,
      joinedAt,
      leftAt: null
    });
  }

  static validateClassroomId(classroomId: string): void {
    if (!classroomId || classroomId.trim().length === 0) {
      throw new ValidationError('Classroom ID is required');
    }
  }

  static validatePersonId(personId: string): void {
    if (!personId || personId.trim().length === 0) {
      throw new ValidationError('Person ID is required');
    }
  }

  static validateRole(role: string): void {
    const validRoles: Role[] = ['student', 'teacher', 'volunteer'];
    if (!validRoles.includes(role as Role)) {
      throw new ValidationError(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }
  }

  isTeacher(): boolean {
    return this.role === 'teacher';
  }

  isStudent(): boolean {
    return this.role === 'student';
  }

  isVolunteer(): boolean {
    return this.role === 'volunteer';
  }

  hasElevatedPrivileges(): boolean {
    return this.isTeacher() || this.isVolunteer();
  }

  isCurrentlyActive(): boolean {
    return this.isActive && this.leftAt === null;
  }

  canSignInOthers(): boolean {
    return this.isCurrentlyActive() && this.isTeacher();
  }

  canManageSessions(): boolean {
    return this.isCurrentlyActive() && this.isTeacher();
  }

  canManageNinjas(): boolean {
    return this.isCurrentlyActive() && this.isTeacher();
  }

  canManageStudents(): boolean {
    return this.isCurrentlyActive() && this.isTeacher();
  }

  canClaimHelpRequests(): boolean {
    return this.isCurrentlyActive() && this.hasElevatedPrivileges();
  }

  canLeave(): boolean {
    return this.isActive && this.leftAt === null;
  }

  canRejoin(): boolean {
    return !this.isActive || this.leftAt !== null;
  }

  changeRole(newRole: Role): MembershipEntity {
    MembershipEntity.validateRole(newRole);

    return new MembershipEntity({
      ...this.props,
      role: newRole
    });
  }

  leave(leftAt: Date = new Date()): MembershipEntity {
    if (!this.canLeave()) {
      throw new ConflictError('Membership is already inactive');
    }

    return new MembershipEntity({
      ...this.props,
      isActive: false,
      leftAt
    });
  }

  rejoin(joinedAt: Date = new Date()): MembershipEntity {
    if (!this.canRejoin()) {
      throw new ConflictError('Membership is already active');
    }

    return new MembershipEntity({
      ...this.props,
      isActive: true,
      joinedAt,
      leftAt: null
    });
  }

  getDurationDays(): number {
    const endTime = this.leftAt ?? new Date();
    const milliseconds = endTime.getTime() - this.joinedAt.getTime();
    return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  }

  toObject(): MembershipProps {
    return { ...this.props };
  }
}
