import bcrypt from 'bcryptjs';
import type { MemoryStore } from '$lib/infrastructure/repositories/memory';
import type { MemoryPinRepository } from '$lib/infrastructure/repositories/memory/MemoryPinRepository';

export const DEMO_SCHOOL_ID = 'demo-school-001';
export const DEMO_CLASSROOM_ID = 'demo-classroom-001';
export const DEMO_TEACHER_PERSON_ID = 'demo-teacher-001';
export const DEMO_CLASSROOM_CODE = 'DEMO01';

const DEMO_STUDENTS = [
  { id: 'demo-student-001', name: 'Alex Chen', grade: '5', pin: '1234' },
  { id: 'demo-student-002', name: 'Jordan Rivera', grade: '5', pin: '5678' },
  { id: 'demo-student-003', name: 'Sam Patel', grade: '4', pin: '9012' },
  { id: 'demo-student-004', name: 'Maya Johnson', grade: '5', pin: '3456' },
  { id: 'demo-student-005', name: 'Kai Williams', grade: '4', pin: '7890' }
];

export function seedDemoData(store: MemoryStore, pinRepo: MemoryPinRepository): void {
  store.clear();
  pinRepo.clearPinHashes();

  const now = new Date();

  // Teacher
  store.persons.set(DEMO_TEACHER_PERSON_ID, {
    id: DEMO_TEACHER_PERSON_ID,
    schoolId: DEMO_SCHOOL_ID,
    email: 'demo-teacher@example.com',
    legalName: 'Demo Teacher',
    displayName: 'Demo Teacher',
    pronouns: null,
    gradeLevel: null,
    askMeAbout: [],
    themeColor: null,
    currentlyWorkingOn: null,
    helpQueueVisible: true,
    isActive: true
  });
  store.personCreatedAt.set(DEMO_TEACHER_PERSON_ID, now);

  // Classroom
  store.classrooms.set(DEMO_CLASSROOM_ID, {
    id: DEMO_CLASSROOM_ID,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Demo Classroom',
    slug: 'demo-classroom',
    description: 'A demo classroom for testing Forge features',
    displayCode: DEMO_CLASSROOM_CODE,
    settings: {
      modules: {
        presence: true,
        help: true,
        ninja: true
      }
    },
    isActive: true
  });

  // Teacher membership
  store.memberships.set('demo-membership-teacher', {
    id: 'demo-membership-teacher',
    classroomId: DEMO_CLASSROOM_ID,
    personId: DEMO_TEACHER_PERSON_ID,
    role: 'teacher',
    isActive: true,
    joinedAt: now,
    leftAt: null
  });

  // Students
  for (const student of DEMO_STUDENTS) {
    store.persons.set(student.id, {
      id: student.id,
      schoolId: DEMO_SCHOOL_ID,
      email: null,
      legalName: student.name,
      displayName: student.name,
      pronouns: null,
      gradeLevel: student.grade,
      askMeAbout: [],
      themeColor: null,
      currentlyWorkingOn: null,
      helpQueueVisible: true,
      isActive: true
    });
    store.personCreatedAt.set(student.id, now);

    store.memberships.set(`demo-membership-${student.id}`, {
      id: `demo-membership-${student.id}`,
      classroomId: DEMO_CLASSROOM_ID,
      personId: student.id,
      role: 'student',
      isActive: true,
      joinedAt: now,
      leftAt: null
    });

    // Store bcrypt hash for loginWithPin compatibility
    const pinHash = bcrypt.hashSync(student.pin, 10);
    pinRepo.setPinHash(student.id, pinHash);
    store.plaintextPins.set(student.id, student.pin);
  }
}

export function getDemoStudents(store: MemoryStore): { name: string; pin: string }[] {
  const result: { name: string; pin: string }[] = [];
  for (const [personId, pin] of store.plaintextPins.entries()) {
    const person = store.persons.get(personId);
    if (person) {
      result.push({ name: person.displayName, pin });
    }
  }
  return result;
}
