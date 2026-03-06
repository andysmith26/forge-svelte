import bcrypt from 'bcryptjs';
import type { MemoryStore } from '$lib/infrastructure/repositories/memory';
import type { MemoryPinRepository } from '$lib/infrastructure/repositories/memory/MemoryPinRepository';

export const DEMO_SCHOOL_ID = 'demo-school-001';
export const DEMO_CLASSROOM_ID = 'demo-classroom-001';
export const DEMO_CLASSROOM_ID_2 = 'demo-classroom-002';
export const DEMO_TEACHER_PERSON_ID = 'demo-teacher-001';
export const DEMO_CLASSROOM_CODE = 'DEMO01';
export const DEMO_CLASSROOM_CODE_2 = 'DEMO02';

// ---------------------------------------------------------------------------
// Scenario: "Falcon Forge" school, 8 weeks into the semester.
// Two classrooms, same school:
//   Period 3 (morning, 9:00–10:30, code DEMO01) — 16 students
//   Period 5 (afternoon, 1:00–2:30, code DEMO02) — 16 students
//   2 students attend both (flexible helpers)
//
// Ms. Ramirez teaches both classes.
// Projects are school-scoped — the same physical build gets worked on by
// morning and afternoon students. Handoffs flow across class periods.
//
// Project variety:
//   - Stable group projects (consistent team, long-running)
//   - Solo projects (one kid working independently)
//   - Loose/fluid groups (people float in and out)
//   - One completed/archived project
//   - One stale project (no recent handoffs)
// ---------------------------------------------------------------------------

// --- Helpers ---------------------------------------------------------------

/** Returns a Date at the given hour:minute on a specific day offset from today. */
function day(daysAgo: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

let _counter = 0;
function uid(prefix: string): string {
  return `${prefix}-${String(++_counter).padStart(4, '0')}`;
}

// --- People ----------------------------------------------------------------

const TEACHER = {
  id: DEMO_TEACHER_PERSON_ID,
  name: 'Ms. Ramirez',
  email: 'ramirez@falconforge.example',
  pronouns: 'she/her',
  themeColor: '#6366f1'
};

// Period 3 only (morning) — 14 students + 2 BOTH = 16
const P3_STUDENTS = [
  {
    id: 'demo-student-001',
    name: 'Alex Chen',
    display: 'Alex',
    grade: '5',
    pin: '1234',
    pronouns: 'he/him',
    theme: '#ef4444',
    askMe: ['3D printing', 'Scratch'],
    workingOn: 'Robo-Falcon arm assembly'
  },
  {
    id: 'demo-student-002',
    name: 'Jordan Rivera',
    display: 'Jordan',
    grade: '5',
    pin: '5678',
    pronouns: 'they/them',
    theme: '#f59e0b',
    askMe: ['circuits', 'soldering'],
    workingOn: 'LED matrix wiring'
  },
  {
    id: 'demo-student-003',
    name: 'Sam Patel',
    display: 'Sam',
    grade: '4',
    pin: '9012',
    pronouns: 'he/him',
    theme: '#10b981',
    askMe: ['Lego Technic'],
    workingOn: null
  },
  {
    id: 'demo-student-004',
    name: 'Maya Johnson',
    display: 'Maya',
    grade: '5',
    pin: '3456',
    pronouns: 'she/her',
    theme: '#8b5cf6',
    askMe: ['Python', 'micro:bit'],
    workingOn: 'Robo-Falcon code'
  },
  {
    id: 'demo-student-005',
    name: 'Kai Williams',
    display: 'Kai',
    grade: '4',
    pin: '7890',
    pronouns: 'he/him',
    theme: '#06b6d4',
    askMe: [],
    workingOn: 'Marble run ramps'
  },
  {
    id: 'demo-student-006',
    name: 'Priya Sharma',
    display: 'Priya',
    grade: '5',
    pin: '1111',
    pronouns: 'she/her',
    theme: '#ec4899',
    askMe: ['sewing', 'textiles'],
    workingOn: 'Wearable LED vest'
  },
  {
    id: 'demo-student-007',
    name: "Liam O'Brien",
    display: 'Liam',
    grade: '5',
    pin: '2222',
    pronouns: 'he/him',
    theme: '#14b8a6',
    askMe: ['woodworking'],
    workingOn: null
  },
  {
    id: 'demo-student-008',
    name: 'Zoe Martinez',
    display: 'Zoe',
    grade: '5',
    pin: '3333',
    pronouns: 'she/her',
    theme: '#f97316',
    askMe: ['Arduino', 'sensors'],
    workingOn: 'Weather station sensors'
  },
  {
    id: 'demo-student-019',
    name: 'Haruto Tanaka',
    display: 'Haruto',
    grade: '4',
    pin: '5050',
    pronouns: 'he/him',
    theme: '#0369a1',
    askMe: ['Lego', 'building'],
    workingOn: 'Marble run chain lift'
  },
  {
    id: 'demo-student-020',
    name: 'Fatima Al-Rashid',
    display: 'Fatima',
    grade: '5',
    pin: '6060',
    pronouns: 'she/her',
    theme: '#be185d',
    askMe: ['micro:bit', 'coding'],
    workingOn: 'Sound-reactive LED panel'
  },
  {
    id: 'demo-student-021',
    name: 'Diego Morales',
    display: 'Diego',
    grade: '4',
    pin: '7070',
    pronouns: 'he/him',
    theme: '#059669',
    askMe: [],
    workingOn: null
  },
  {
    id: 'demo-student-022',
    name: 'Anya Petrov',
    display: 'Anya',
    grade: '5',
    pin: '8080',
    pronouns: 'she/her',
    theme: '#7c3aed',
    askMe: ['drawing', 'painting'],
    workingOn: 'Mini greenhouse sensor box'
  },
  {
    id: 'demo-student-023',
    name: 'Jayden Brooks',
    display: 'Jayden',
    grade: '5',
    pin: '9090',
    pronouns: 'he/him',
    theme: '#dc2626',
    askMe: ['woodworking', 'tools'],
    workingOn: 'Pinball machine'
  },
  {
    id: 'demo-student-024',
    name: 'Mila Kowalczyk',
    display: 'Mila',
    grade: '4',
    pin: '1122',
    pronouns: 'she/her',
    theme: '#0891b2',
    askMe: [],
    workingOn: null
  }
];

// Period 5 only (afternoon) — 14 students + 2 BOTH = 16
const P5_STUDENTS = [
  {
    id: 'demo-student-009',
    name: 'Ethan Park',
    display: 'Ethan',
    grade: '4',
    pin: '4444',
    pronouns: 'he/him',
    theme: '#3b82f6',
    askMe: [],
    workingOn: 'Marble run supports'
  },
  {
    id: 'demo-student-010',
    name: 'Ava Thompson',
    display: 'Ava',
    grade: '5',
    pin: '5555',
    pronouns: 'she/her',
    theme: '#a855f7',
    askMe: ['design', 'Tinkercad'],
    workingOn: 'Robo-Falcon chassis redesign'
  },
  {
    id: 'demo-student-011',
    name: 'Noah Kim',
    display: 'Noah',
    grade: '4',
    pin: '6666',
    pronouns: 'he/him',
    theme: '#22c55e',
    askMe: ['Lego EV3'],
    workingOn: null
  },
  {
    id: 'demo-student-012',
    name: 'Isabella Cruz',
    display: 'Bella',
    grade: '5',
    pin: '7777',
    pronouns: 'she/her',
    theme: '#e11d48',
    askMe: ['coding', 'debugging'],
    workingOn: 'Weather station code'
  },
  {
    id: 'demo-student-013',
    name: 'Marcus Washington',
    display: 'Marcus',
    grade: '5',
    pin: '8888',
    pronouns: 'he/him',
    theme: '#0ea5e9',
    askMe: ['mechanics', 'gears'],
    workingOn: null
  },
  {
    id: 'demo-student-014',
    name: 'Chloe Nguyen',
    display: 'Chloe',
    grade: '4',
    pin: '9999',
    pronouns: 'she/her',
    theme: '#d946ef',
    askMe: [],
    workingOn: 'LED matrix pattern design'
  },
  {
    id: 'demo-student-015',
    name: 'Tariq Hassan',
    display: 'Tariq',
    grade: '5',
    pin: '1010',
    pronouns: 'he/him',
    theme: '#64748b',
    askMe: ['electronics', 'wiring'],
    workingOn: 'Robo-Falcon wiring'
  },
  {
    id: 'demo-student-016',
    name: 'Luna Davis',
    display: 'Luna',
    grade: '5',
    pin: '2020',
    pronouns: 'she/her',
    theme: '#f43f5e',
    askMe: ['drawing'],
    workingOn: null
  },
  {
    id: 'demo-student-025',
    name: 'Obi Adeyemi',
    display: 'Obi',
    grade: '5',
    pin: '3344',
    pronouns: 'he/him',
    theme: '#b45309',
    askMe: ['electronics', 'Arduino'],
    workingOn: 'Automatic plant waterer'
  },
  {
    id: 'demo-student-026',
    name: 'Sofia Reyes',
    display: 'Sofia',
    grade: '4',
    pin: '4455',
    pronouns: 'she/her',
    theme: '#9333ea',
    askMe: [],
    workingOn: 'Cardboard pinball bumpers'
  },
  {
    id: 'demo-student-027',
    name: 'Amir Johal',
    display: 'Amir',
    grade: '5',
    pin: '5566',
    pronouns: 'he/him',
    theme: '#16a34a',
    askMe: ['3D printing'],
    workingOn: 'Custom phone stand'
  },
  {
    id: 'demo-student-028',
    name: 'Iris Chang',
    display: 'Iris',
    grade: '5',
    pin: '6677',
    pronouns: 'she/her',
    theme: '#ea580c',
    askMe: ['sewing', 'circuits'],
    workingOn: null
  },
  {
    id: 'demo-student-029',
    name: 'Theo Larsson',
    display: 'Theo',
    grade: '4',
    pin: '7788',
    pronouns: 'he/him',
    theme: '#0284c7',
    askMe: [],
    workingOn: 'Marble run testing'
  },
  {
    id: 'demo-student-030',
    name: 'Wren Nakamura',
    display: 'Wren',
    grade: '5',
    pin: '8899',
    pronouns: 'they/them',
    theme: '#c026d3',
    askMe: ['design', 'laser cutter'],
    workingOn: 'Wooden puzzle box'
  }
];

// Students who attend BOTH classrooms (flexible helpers)
const BOTH_STUDENTS = [
  {
    id: 'demo-student-017',
    name: 'Nadia Okonkwo',
    display: 'Nadia',
    grade: '5',
    pin: '3030',
    pronouns: 'she/her',
    theme: '#0d9488',
    askMe: ['3D printing', 'design'],
    workingOn: 'Robo-Falcon right arm'
  },
  {
    id: 'demo-student-018',
    name: 'Ryan Kowalski',
    display: 'Ryan',
    grade: '5',
    pin: '4040',
    pronouns: 'he/him',
    theme: '#7c3aed',
    askMe: ['micro:bit', 'MakeCode'],
    workingOn: 'Weather station data logging'
  }
];

const ALL_STUDENTS = [...P3_STUDENTS, ...P5_STUDENTS, ...BOTH_STUDENTS];

// Students in each classroom
const P3_ALL = [...P3_STUDENTS, ...BOTH_STUDENTS]; // 16 students in Period 3
const P5_ALL = [...P5_STUDENTS, ...BOTH_STUDENTS]; // 16 students in Period 5

// ---------------------------------------------------------------------------
// seedData
// ---------------------------------------------------------------------------

export async function seedDemoData(
  store: MemoryStore,
  pinRepo: MemoryPinRepository
): Promise<void> {
  // Reset counter
  _counter = 0;

  // =========================================================================
  // SCHOOL + CLASSROOMS
  // =========================================================================

  store.classrooms.set(DEMO_CLASSROOM_ID, {
    id: DEMO_CLASSROOM_ID,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Period 3 — Morning Makers',
    slug: 'period-3',
    description: 'Morning maker-space class for 4th and 5th graders',
    displayCode: DEMO_CLASSROOM_CODE,
    isActive: true,
    settings: {
      modules: {
        presence: { enabled: true },
        help: { enabled: true },
        ninja: { enabled: true },
        projects: { enabled: true },
        profile: { enabled: true },
        chores: { enabled: true }
      }
    }
  });

  store.classrooms.set(DEMO_CLASSROOM_ID_2, {
    id: DEMO_CLASSROOM_ID_2,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Period 5 — Afternoon Builders',
    slug: 'period-5',
    description: 'Afternoon maker-space class for 4th and 5th graders',
    displayCode: DEMO_CLASSROOM_CODE_2,
    isActive: true,
    settings: {
      modules: {
        presence: { enabled: true },
        help: { enabled: true },
        ninja: { enabled: true },
        projects: { enabled: true },
        profile: { enabled: true },
        chores: { enabled: true }
      }
    }
  });

  // =========================================================================
  // PEOPLE — teacher + students
  // =========================================================================

  // Teacher
  store.persons.set(TEACHER.id, {
    id: TEACHER.id,
    schoolId: DEMO_SCHOOL_ID,
    displayName: TEACHER.name,
    legalName: TEACHER.name,
    pronouns: TEACHER.pronouns,
    gradeLevel: null,
    askMeAbout: [],
    themeColor: TEACHER.themeColor,
    currentlyWorkingOn: null,
    helpQueueVisible: true,
    smartboardVisible: true,
    isActive: true,
    email: TEACHER.email
  });

  // Teacher membership in both classrooms
  for (const crId of [DEMO_CLASSROOM_ID, DEMO_CLASSROOM_ID_2]) {
    const mId = uid('mem');
    store.memberships.set(mId, {
      id: mId,
      classroomId: crId,
      personId: TEACHER.id,
      role: 'teacher',
      isActive: true,
      joinedAt: day(55),
      leftAt: null
    });
  }

  // Students
  for (const s of ALL_STUDENTS) {
    store.persons.set(s.id, {
      id: s.id,
      schoolId: DEMO_SCHOOL_ID,
      displayName: s.display,
      legalName: s.name,
      pronouns: s.pronouns,
      gradeLevel: s.grade,
      askMeAbout: s.askMe,
      themeColor: s.theme,
      currentlyWorkingOn: s.workingOn,
      helpQueueVisible: true,
      smartboardVisible: true,
      isActive: true,
      email: null
    });

    store.personCreatedAt.set(s.id, day(55));

    const hash = await bcrypt.hash(s.pin, 10);
    pinRepo.setPinHash(s.id, hash);
    store.plaintextPins.set(s.id, s.pin);
  }

  // P3 memberships
  for (const s of P3_ALL) {
    const mId = uid('mem');
    store.memberships.set(mId, {
      id: mId,
      classroomId: DEMO_CLASSROOM_ID,
      personId: s.id,
      role: 'student',
      isActive: true,
      joinedAt: day(55),
      leftAt: null
    });
  }

  // P5 memberships
  for (const s of P5_ALL) {
    const mId = uid('mem');
    store.memberships.set(mId, {
      id: mId,
      classroomId: DEMO_CLASSROOM_ID_2,
      personId: s.id,
      role: 'student',
      isActive: true,
      joinedAt: day(55),
      leftAt: null
    });
  }

  // =========================================================================
  // NINJA DOMAINS — same domains for both classrooms, assignments from each
  // =========================================================================

  const ninjaDomains = [
    { id: 'ninja-001', name: '3D Printing', emoji: '🖨️' },
    { id: 'ninja-002', name: 'Soldering', emoji: '🔥' },
    { id: 'ninja-003', name: 'Coding', emoji: '💻' },
    { id: 'ninja-004', name: 'Woodworking', emoji: '🪵' },
    { id: 'ninja-005', name: 'Circuits', emoji: '⚡' },
    { id: 'ninja-006', name: 'Design', emoji: '🎨' },
    { id: 'ninja-007', name: 'Safety', emoji: '🦺' }
  ];

  for (const d of ninjaDomains) {
    store.ninjaDomains.set(d.id, {
      id: d.id,
      classroomId: DEMO_CLASSROOM_ID,
      name: d.name,
      description: null,
      displayOrder: ninjaDomains.indexOf(d),
      isActive: true
    });
  }

  // Also add domains for P5
  for (const d of ninjaDomains) {
    const p5Id = `${d.id}-p5`;
    store.ninjaDomains.set(p5Id, {
      id: p5Id,
      classroomId: DEMO_CLASSROOM_ID_2,
      name: d.name,
      description: null,
      displayOrder: ninjaDomains.indexOf(d),
      isActive: true
    });
  }

  // Ninja assignments — P3
  const p3NinjaAssignments = [
    { studentId: 'demo-student-001', ninjaDomainId: 'ninja-001' },
    { studentId: 'demo-student-002', ninjaDomainId: 'ninja-002' },
    { studentId: 'demo-student-002', ninjaDomainId: 'ninja-005' },
    { studentId: 'demo-student-004', ninjaDomainId: 'ninja-003' },
    { studentId: 'demo-student-008', ninjaDomainId: 'ninja-005' },
    { studentId: 'demo-student-007', ninjaDomainId: 'ninja-004' },
    { studentId: 'demo-student-017', ninjaDomainId: 'ninja-001' },
    { studentId: 'demo-student-017', ninjaDomainId: 'ninja-006' },
    { studentId: 'demo-student-020', ninjaDomainId: 'ninja-003' },
    { studentId: 'demo-student-023', ninjaDomainId: 'ninja-004' },
    { studentId: 'demo-student-022', ninjaDomainId: 'ninja-006' }
  ];
  for (const a of p3NinjaAssignments) {
    const id = uid('na');
    store.ninjaAssignments.set(id, {
      id,
      ninjaDomainId: a.ninjaDomainId,
      personId: a.studentId,
      assignedById: TEACHER.id,
      isActive: true,
      assignedAt: day(42),
      revokedAt: null
    });
  }

  // Ninja assignments — P5
  const p5NinjaAssignments = [
    { studentId: 'demo-student-010', ninjaDomainId: 'ninja-006-p5' },
    { studentId: 'demo-student-012', ninjaDomainId: 'ninja-003-p5' },
    { studentId: 'demo-student-013', ninjaDomainId: 'ninja-004-p5' },
    { studentId: 'demo-student-015', ninjaDomainId: 'ninja-005-p5' },
    { studentId: 'demo-student-015', ninjaDomainId: 'ninja-002-p5' },
    { studentId: 'demo-student-018', ninjaDomainId: 'ninja-003-p5' },
    { studentId: 'demo-student-025', ninjaDomainId: 'ninja-005-p5' },
    { studentId: 'demo-student-027', ninjaDomainId: 'ninja-001-p5' },
    { studentId: 'demo-student-030', ninjaDomainId: 'ninja-006-p5' }
  ];
  for (const a of p5NinjaAssignments) {
    const id = uid('na');
    store.ninjaAssignments.set(id, {
      id,
      ninjaDomainId: a.ninjaDomainId,
      personId: a.studentId,
      assignedById: TEACHER.id,
      isActive: true,
      assignedAt: day(42),
      revokedAt: null
    });
  }

  // =========================================================================
  // HELP CATEGORIES — per classroom
  // =========================================================================

  const helpCategoryDefs = [
    { name: '3D Printing', emoji: '🖨️' },
    { name: 'Electronics', emoji: '⚡' },
    { name: 'Coding Help', emoji: '💻' },
    { name: 'Safety Issue', emoji: '🦺' },
    { name: 'Supplies Needed', emoji: '📦' },
    { name: 'Design Review', emoji: '🎨' },
    { name: 'General Help', emoji: '🤝' }
  ];

  // P3 help categories
  const helpCats: string[] = [];
  for (let i = 0; i < helpCategoryDefs.length; i++) {
    const id = `help-cat-${String(i + 1).padStart(3, '0')}`;
    helpCats.push(id);
    store.helpCategories.set(id, {
      id,
      classroomId: DEMO_CLASSROOM_ID,
      name: helpCategoryDefs[i].name,
      description: null,
      ninjaDomainId: null,
      displayOrder: i,
      isActive: true
    });
  }

  // P5 help categories
  const helpCatsP5: string[] = [];
  for (let i = 0; i < helpCategoryDefs.length; i++) {
    const id = `help-cat-p5-${String(i + 1).padStart(3, '0')}`;
    helpCatsP5.push(id);
    store.helpCategories.set(id, {
      id,
      classroomId: DEMO_CLASSROOM_ID_2,
      name: helpCategoryDefs[i].name,
      description: null,
      ninjaDomainId: null,
      displayOrder: i,
      isActive: true
    });
  }

  // =========================================================================
  // SESSIONS — 21 per classroom, on matching MWF schedule
  // =========================================================================

  type SessionInfo = { id: string; daysAgo: number; num: number; classroomId: string };
  const sessions: SessionInfo[] = [];

  const sessionDays = [
    51, 49, 46, 44, 42, 39, 37, 35, 32, 28, 23, 21, 18, 16, 14, 11, 9, 7, 4, 2, 0
  ];

  // P3 sessions (morning: 9:00–10:30)
  for (let i = 0; i < sessionDays.length; i++) {
    const dAgo = sessionDays[i];
    const sessionNum = i + 1;
    const id = `demo-session-p3-${String(sessionNum).padStart(3, '0')}`;
    const isToday = dAgo === 0;
    const scheduledDate = day(dAgo, 0, 0);
    const startTime = day(dAgo, 9, 0);
    const endTime = day(dAgo, 10, 30);

    store.sessions.set(id, {
      id,
      classroomId: DEMO_CLASSROOM_ID,
      name: `Session ${sessionNum}`,
      sessionType: 'structured',
      scheduledDate,
      startTime,
      endTime,
      actualStartAt: isToday ? day(0, 9, 2) : day(dAgo, 9, Math.floor(Math.random() * 5)),
      actualEndAt: isToday ? null : day(dAgo, 10, 28 + Math.floor(Math.random() * 4)),
      status: isToday ? 'active' : 'ended'
    });

    sessions.push({ id, daysAgo: dAgo, num: sessionNum, classroomId: DEMO_CLASSROOM_ID });
  }

  // P5 sessions (afternoon: 1:00–2:30)
  for (let i = 0; i < sessionDays.length; i++) {
    const dAgo = sessionDays[i];
    const sessionNum = i + 1;
    const id = `demo-session-p5-${String(sessionNum).padStart(3, '0')}`;
    const isToday = dAgo === 0;
    const scheduledDate = day(dAgo, 0, 0);
    const startTime = day(dAgo, 13, 0);
    const endTime = day(dAgo, 14, 30);

    store.sessions.set(id, {
      id,
      classroomId: DEMO_CLASSROOM_ID_2,
      name: `Session ${sessionNum}`,
      sessionType: 'structured',
      scheduledDate,
      startTime,
      endTime,
      actualStartAt: isToday ? day(0, 13, 2) : day(dAgo, 13, Math.floor(Math.random() * 5)),
      actualEndAt: isToday ? null : day(dAgo, 14, 28 + Math.floor(Math.random() * 4)),
      status: isToday ? 'active' : 'ended'
    });

    sessions.push({ id, daysAgo: dAgo, num: sessionNum, classroomId: DEMO_CLASSROOM_ID_2 });
  }

  // =========================================================================
  // SIGN-INS
  // =========================================================================

  const p3StudentIds = P3_ALL.map((s) => s.id);
  const p5StudentIds = P5_ALL.map((s) => s.id);

  const p3Sessions = sessions.filter((s) => s.classroomId === DEMO_CLASSROOM_ID);
  const p5Sessions = sessions.filter((s) => s.classroomId === DEMO_CLASSROOM_ID_2);

  // Historical sign-ins (~85% attendance)
  for (const sess of [...p3Sessions, ...p5Sessions]) {
    if (sess.daysAgo === 0) continue;
    const studentIds = sess.classroomId === DEMO_CLASSROOM_ID ? p3StudentIds : p5StudentIds;
    const isAfternoon = sess.classroomId === DEMO_CLASSROOM_ID_2;
    const baseHour = isAfternoon ? 13 : 9;

    for (const studentId of studentIds) {
      const hash = simpleHash(`${sess.id}-${studentId}`);
      if (hash % 100 < 15) continue;

      const signInId = uid('signin');
      const signInMinute = 1 + (hash % 8);
      const signOutMinute = 85 + (hash % 5);

      store.signIns.set(signInId, {
        id: signInId,
        sessionId: sess.id,
        personId: studentId,
        signedInAt: day(sess.daysAgo, baseHour, signInMinute),
        signedOutAt: day(sess.daysAgo, baseHour + 1, signOutMinute - 60),
        signedInById: studentId,
        signedOutById: studentId,
        signoutType: 'self'
      });
    }
  }

  // Today's P3 session: 13 of 16 signed in
  const todayP3 = p3Sessions.find((s) => s.daysAgo === 0)!;
  for (const studentId of p3StudentIds.slice(0, 13)) {
    const signInId = uid('signin');
    const minute = 1 + (simpleHash(studentId) % 7);
    store.signIns.set(signInId, {
      id: signInId,
      sessionId: todayP3.id,
      personId: studentId,
      signedInAt: day(0, 9, minute),
      signedOutAt: null,
      signedInById: studentId,
      signedOutById: null,
      signoutType: null
    });
  }

  // Today's P5 session: 14 of 16 signed in
  const todayP5 = p5Sessions.find((s) => s.daysAgo === 0)!;
  for (const studentId of p5StudentIds.slice(0, 14)) {
    const signInId = uid('signin');
    const minute = 1 + (simpleHash(studentId) % 7);
    store.signIns.set(signInId, {
      id: signInId,
      sessionId: todayP5.id,
      personId: studentId,
      signedInAt: day(0, 13, minute),
      signedOutAt: null,
      signedInById: studentId,
      signedOutById: null,
      signoutType: null
    });
  }

  // =========================================================================
  // PROJECTS — 11 school-scoped projects with varied structures
  // =========================================================================
  //
  // STABLE GROUPS (consistent teams):
  //   1. Robo-Falcon — 6 members, cross-classroom flagship (Alex, Maya, Ava, Marcus, Tariq, Nadia)
  //   2. Weather Station — 3 members, P3+P5 (Zoe, Bella, Ryan)
  //   3. Pinball Machine — 3 members, P3+P5 (Jayden, Sofia, Liam)
  //
  // SOLO PROJECTS:
  //   4. Wearable LED Vest — Priya solo, stale (no handoffs for 11 days)
  //   5. Custom Phone Stand — Amir solo P5, active and progressing
  //   6. Wooden Puzzle Box — Wren solo P5, members_only
  //
  // FLUID/FLOATING groups (people drift in and out):
  //   7. Mega Marble Run — started as Kai+Ethan, Haruto joined, Theo drifts in/out
  //   8. LED Matrix Art — Jordan started solo, Chloe joined, Fatima helped for a while then left
  //   9. Mini Greenhouse — Anya started, Diego helped briefly, now Anya+Iris
  //
  // COMPLETED:
  //  10. Desktop Catapult — archived, was Liam+Sam+Noah
  //
  // NO PROJECT YET:
  //  Mila (P3), Luna (P5), Obi (P5 — just started his own thing not formalized),
  //  Diego (P3 — floated through greenhouse, currently unattached)

  // -----------------------------------------------------------------------
  // Project 1: "Robo-Falcon" — STABLE GROUP, cross-classroom flagship
  // -----------------------------------------------------------------------
  const proj1 = 'demo-proj-001';
  store.projects.set(proj1, {
    id: proj1,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Robo-Falcon',
    description:
      'A robotic falcon with movable wings and LED eyes. Competition entry for the district robotics fair.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-001',
    createdAt: day(46)
  });

  const proj1Members = [
    'demo-student-001', // Alex (P3) — creator
    'demo-student-004', // Maya (P3) — code
    'demo-student-010', // Ava (P5) — design
    'demo-student-013', // Marcus (P5) — mechanics
    'demo-student-015', // Tariq (P5) — wiring
    'demo-student-017' // Nadia (both) — joined later
  ];
  for (const pid of proj1Members) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj1,
      personId: pid,
      isActive: true,
      joinedAt: pid === 'demo-student-017' ? day(21) : day(46),
      leftAt: null
    });
  }

  // Robo-Falcon subsystems
  const sub1a = 'demo-sub-001';
  const sub1b = 'demo-sub-002';
  const sub1c = 'demo-sub-003';
  store.subsystems.set(sub1a, {
    id: sub1a,
    projectId: proj1,
    name: 'Chassis',
    displayOrder: 1,
    isActive: true
  });
  store.subsystems.set(sub1b, {
    id: sub1b,
    projectId: proj1,
    name: 'Wing mechanism',
    displayOrder: 2,
    isActive: true
  });
  store.subsystems.set(sub1c, {
    id: sub1c,
    projectId: proj1,
    name: 'Code & control',
    displayOrder: 3,
    isActive: true
  });

  // Robo-Falcon handoffs — CROSS-CLASSROOM timeline
  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-001',
    sessionId: 'demo-session-p3-003',
    daysAgo: 46,
    hour: 10,
    whatIDid:
      'Sketched out the basic falcon shape and made a list of materials we need. Decided on cardboard for prototyping before we use wood.',
    whatsNext: 'Need to cut the body pieces from the big cardboard sheet.',
    subsystems: [sub1a]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-010',
    sessionId: 'demo-session-p5-003',
    daysAgo: 46,
    hour: 14,
    whatIDid:
      "Made a Tinkercad model of the chassis based on Alex's sketch. Exported measurements for cutting.",
    whatsNext: 'Print the wing joint brackets on the 3D printer.',
    subsystems: [sub1a]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-004',
    sessionId: 'demo-session-p3-005',
    daysAgo: 42,
    hour: 10,
    whatIDid:
      'Started the micro:bit code for wing movement. Got the servo to sweep 0–180 degrees with button A/B.',
    whatsNext: 'Figure out how to make both wings move at the same time but mirror each other.',
    subsystems: [sub1c]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-013',
    sessionId: 'demo-session-p5-005',
    daysAgo: 42,
    hour: 14,
    whatIDid:
      'Cut all the chassis pieces from MDF using the scroll saw. Sanded the edges. The falcon body is about 30cm long.',
    whatsNext:
      'Need to drill holes for the wing pivot points. Ask Ava about gear placement from her Tinkercad model.',
    subsystems: [sub1a]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-001',
    sessionId: 'demo-session-p3-008',
    daysAgo: 35,
    hour: 10,
    whatIDid:
      "Printed wing brackets from Ava's Tinkercad design. They fit! Drilled the pivot holes in the chassis and test-fit everything.",
    whatsNext: 'Attach the servos to the brackets. We need 2 micro servos from the parts bin.',
    blockers: 'Only found 1 micro servo — need to check if Ms. Ramirez can order another.',
    subsystems: [sub1a, sub1b]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-015',
    sessionId: 'demo-session-p5-008',
    daysAgo: 35,
    hour: 14,
    whatIDid:
      'Crimped connectors onto the servo wires and ran them through the chassis. Tested with one servo — smooth movement!',
    whatsNext:
      'Wire up the second servo once it arrives. Plan the cable routing inside the body so nothing gets pinched.',
    subsystems: [sub1b, sub1c]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-004',
    sessionId: 'demo-session-p3-010',
    daysAgo: 28,
    hour: 10,
    whatIDid:
      'Got mirrored wing movement working! Used a function that maps servo2 angle to (180 - servo1 angle). Also added a slow flap mode and a fast flap mode.',
    whatsNext:
      'Need to test with actual servos once they are mounted. Tariq said the wiring is ready.',
    subsystems: [sub1c]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-017',
    sessionId: 'demo-session-p5-010',
    daysAgo: 28,
    hour: 14,
    whatIDid:
      "Joined the project today! Started on the right arm assembly — mirroring the left arm design from Ava's Tinkercad model.",
    whatsNext: 'Print the right arm brackets and test-fit them.',
    subsystems: [sub1b]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-010',
    sessionId: 'demo-session-p5-012',
    daysAgo: 21,
    hour: 14,
    whatIDid:
      'Redesigned the chassis in Tinkercad to add channels for wire routing and a battery compartment underneath. Printed a new bottom plate.',
    whatsNext: 'Transfer the wing mechanism to the new chassis. The screw holes should line up.',
    subsystems: [sub1a]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-013',
    sessionId: 'demo-session-p5-015',
    daysAgo: 14,
    hour: 14,
    whatIDid:
      'Assembled the wing mechanism with both servos on the new chassis. Left wing flaps smoothly. Right wing has a grinding noise at full extension.',
    whatsNext:
      'Debug the right wing grinding — might need to sand the bracket or adjust the stop angle in code.',
    blockers:
      "Right wing grinding noise — don't force it past the sticking point or the gear might strip.",
    subsystems: [sub1b]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-017',
    sessionId: 'demo-session-p3-015',
    daysAgo: 14,
    hour: 10,
    whatIDid:
      'Sanded the right wing bracket to fix binding. Tested manually — moves freely now. Marcus should test with the servo this afternoon.',
    whatsNext:
      'Wait for Marcus to test the servo fit. If it still grinds, we may need to reprint the bracket.',
    subsystems: [sub1b]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-004',
    sessionId: 'demo-session-p3-019',
    daysAgo: 4,
    hour: 10,
    whatIDid:
      'Added LED eye code — they glow red when flapping and blue when idle. Fixed the right wing by limiting its range to 0–160 degrees instead of 180. No more grinding!',
    whatsNext: 'Start on the radio control so we can trigger flapping remotely for the demo.',
    questions: 'Should we add sound effects? We have a small speaker in the parts bin.',
    subsystems: [sub1b, sub1c]
  });

  seedHandoff(store, {
    projectId: proj1,
    authorId: 'demo-student-001',
    sessionId: 'demo-session-p3-020',
    daysAgo: 2,
    hour: 10,
    whatIDid:
      'Painted the chassis with acrylic paint — dark blue body, gold accents on the wings. Looks awesome. Used masking tape to get clean lines.',
    whatsNext:
      'Let the paint cure overnight, then reassemble everything. Be careful not to scratch the paint when mounting the wings.',
    subsystems: [sub1a]
  });

  // -----------------------------------------------------------------------
  // Project 2: "Weather Station" — STABLE GROUP, P3+P5 mix
  // -----------------------------------------------------------------------
  const proj2 = 'demo-proj-002';
  store.projects.set(proj2, {
    id: proj2,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Weather Station',
    description:
      'Arduino-based weather station that measures temperature, humidity, and barometric pressure. Displays on a small LCD.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-008',
    createdAt: day(35)
  });

  for (const pid of ['demo-student-008', 'demo-student-012', 'demo-student-018']) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj2,
      personId: pid,
      isActive: true,
      joinedAt: day(35),
      leftAt: null
    });
  }

  const sub2a = 'demo-sub-004';
  const sub2b = 'demo-sub-005';
  store.subsystems.set(sub2a, {
    id: sub2a,
    projectId: proj2,
    name: 'Sensors',
    displayOrder: 1,
    isActive: true
  });
  store.subsystems.set(sub2b, {
    id: sub2b,
    projectId: proj2,
    name: 'Display & code',
    displayOrder: 2,
    isActive: true
  });

  seedHandoff(store, {
    projectId: proj2,
    authorId: 'demo-student-008',
    sessionId: 'demo-session-p3-008',
    daysAgo: 35,
    hour: 10,
    whatIDid:
      'Got the DHT22 temperature/humidity sensor working on the Arduino breadboard. Readings look accurate compared to the classroom thermometer.',
    whatsNext: 'Add the BMP280 pressure sensor. It uses I2C so we need to figure out the wiring.',
    subsystems: [sub2a]
  });
  seedHandoff(store, {
    projectId: proj2,
    authorId: 'demo-student-012',
    sessionId: 'demo-session-p5-010',
    daysAgo: 28,
    hour: 14,
    whatIDid:
      'Wrote the Arduino sketch to read both sensors. Temperature and pressure print to serial monitor. Had to install the Adafruit BMP280 library.',
    whatsNext: 'Hook up the LCD display and show the readings there instead of serial.',
    subsystems: [sub2b]
  });
  seedHandoff(store, {
    projectId: proj2,
    authorId: 'demo-student-018',
    sessionId: 'demo-session-p5-012',
    daysAgo: 21,
    hour: 14,
    whatIDid:
      'Wired the 16x2 LCD using an I2C adapter so it only needs 4 wires. Got "Hello World" showing on it.',
    whatsNext: 'Bella needs to update the code to send readings to the LCD instead of serial.',
    subsystems: [sub2a, sub2b]
  });
  seedHandoff(store, {
    projectId: proj2,
    authorId: 'demo-student-012',
    sessionId: 'demo-session-p5-015',
    daysAgo: 14,
    hour: 14,
    whatIDid:
      'Updated code to show temp and humidity on LCD line 1, pressure on line 2. Readings refresh every 2 seconds. Found a bug where the LCD flickers — added a check to only update when values change.',
    whatsNext: 'Design and build the enclosure. Maybe 3D print a box with holes for the sensors.',
    subsystems: [sub2b]
  });
  seedHandoff(store, {
    projectId: proj2,
    authorId: 'demo-student-008',
    sessionId: 'demo-session-p3-018',
    daysAgo: 7,
    hour: 10,
    whatIDid:
      'Started designing the enclosure in Tinkercad. Box with ventilation slots for the sensors and a window for the LCD. Printed a test piece to check dimensions.',
    whatsNext:
      'Print the full enclosure. The test piece was a little tight — need to add 2mm tolerance.',
    blockers: '3D printer had a clog. Alex cleared it but it might happen again.',
    subsystems: [sub2a]
  });

  // -----------------------------------------------------------------------
  // Project 3: "Pinball Machine" — STABLE GROUP, P3+P5
  // -----------------------------------------------------------------------
  const proj3 = 'demo-proj-003';
  store.projects.set(proj3, {
    id: proj3,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Pinball Machine',
    description:
      'A tabletop pinball machine made from wood and cardboard with rubber band flippers, LED scoring, and handmade bumpers.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-023',
    createdAt: day(35)
  });

  const sub3a = 'demo-sub-006';
  const sub3b = 'demo-sub-007';
  const sub3c = 'demo-sub-008';
  store.subsystems.set(sub3a, {
    id: sub3a,
    projectId: proj3,
    name: 'Frame & playfield',
    displayOrder: 1,
    isActive: true
  });
  store.subsystems.set(sub3b, {
    id: sub3b,
    projectId: proj3,
    name: 'Flippers & launcher',
    displayOrder: 2,
    isActive: true
  });
  store.subsystems.set(sub3c, {
    id: sub3c,
    projectId: proj3,
    name: 'Bumpers & scoring',
    displayOrder: 3,
    isActive: true
  });

  for (const pid of ['demo-student-023', 'demo-student-026', 'demo-student-007']) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj3,
      personId: pid,
      isActive: true,
      joinedAt: pid === 'demo-student-007' ? day(28) : day(35),
      leftAt: null
    });
  }

  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-023',
    sessionId: 'demo-session-p3-008',
    daysAgo: 35,
    hour: 10,
    whatIDid:
      'Built the frame from scrap plywood — about 60cm x 30cm. Cut side rails and a back wall. Tilted the board with a wooden wedge so the ball rolls down.',
    whatsNext: 'Need to add the playfield surface. Thinking smooth cardboard or poster board.',
    subsystems: [sub3a]
  });
  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-026',
    sessionId: 'demo-session-p5-008',
    daysAgo: 35,
    hour: 14,
    whatIDid:
      'Made bumper prototypes from bottle caps and foam. They bounce the marble okay but not great. Need something springier.',
    whatsNext: 'Try rubber bands wrapped around dowel pegs for bouncier bumpers.',
    subsystems: [sub3c]
  });
  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-007',
    sessionId: 'demo-session-p3-010',
    daysAgo: 28,
    hour: 10,
    whatIDid:
      'Joined the project! Built the flipper mechanism — two popsicle sticks on pivots with rubber bands to snap them back. They flip when you press the side levers.',
    whatsNext: 'The flippers need stronger rubber bands. Also need to add a ball launcher.',
    subsystems: [sub3b]
  });
  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-023',
    sessionId: 'demo-session-p3-013',
    daysAgo: 18,
    hour: 10,
    whatIDid:
      'Glued poster board to the playfield for a smooth surface. Drew lane guides with markers. Added three bumper pegs with rubber bands — the marble really bounces off them now!',
    whatsNext: 'Build the ball launcher chute on the right side.',
    subsystems: [sub3a, sub3c]
  });
  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-007',
    sessionId: 'demo-session-p3-016',
    daysAgo: 11,
    hour: 10,
    whatIDid:
      'Built the ball launcher from a spring and a dowel inside a cardboard tube. Pull back and release — launches the marble up the chute nicely.',
    whatsNext:
      'Add a ball return channel along the bottom so the marble comes back to the launcher.',
    subsystems: [sub3b]
  });
  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-026',
    sessionId: 'demo-session-p5-017',
    daysAgo: 9,
    hour: 14,
    whatIDid:
      'Made the ball return channel from folded cardboard. Works great — marble rolls all the way back to the launcher. Also added 2 more bumpers and a slingshot near the flippers.',
    whatsNext:
      'Jayden wants to add LED scoring. We need to figure out how to detect when the ball hits a bumper.',
    subsystems: [sub3a, sub3c]
  });
  seedHandoff(store, {
    projectId: proj3,
    authorId: 'demo-student-023',
    sessionId: 'demo-session-p3-019',
    daysAgo: 4,
    hour: 10,
    whatIDid:
      'Wired up a micro:bit with 3 aluminum foil contact pads behind the bumpers. When the marble hits, it completes the circuit and the micro:bit counts the score. Display on the micro:bit LED grid.',
    whatsNext: 'Decorate the playfield with paint and maybe add a ramp or loop.',
    subsystems: [sub3c]
  });

  // -----------------------------------------------------------------------
  // Project 4: "Wearable LED Vest" — SOLO, stale (Priya)
  // -----------------------------------------------------------------------
  const proj4 = 'demo-proj-004';
  store.projects.set(proj4, {
    id: proj4,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Wearable LED Vest',
    description: 'A safety vest with sewable LEDs that light up in patterns.',
    isArchived: false,
    visibility: 'members_only',
    createdById: 'demo-student-006',
    createdAt: day(21)
  });

  const pmId4 = uid('pm');
  store.projectMemberships.set(pmId4, {
    id: pmId4,
    projectId: proj4,
    personId: 'demo-student-006',
    isActive: true,
    joinedAt: day(21),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj4,
    authorId: 'demo-student-006',
    sessionId: 'demo-session-p3-012',
    daysAgo: 21,
    hour: 10,
    whatIDid:
      'Planned the LED layout on the vest. Going with 12 sewable LEDs in a zigzag pattern across the back. Tested sewing conductive thread onto scrap fabric.',
    whatsNext: 'Start sewing the first row of LEDs onto the actual vest.'
  });
  seedHandoff(store, {
    projectId: proj4,
    authorId: 'demo-student-006',
    sessionId: 'demo-session-p3-016',
    daysAgo: 11,
    hour: 10,
    whatIDid:
      'Sewed 6 LEDs onto the vest back. The conductive thread is tricky — it keeps tangling. Two LEDs light up, four dont. Debugging the connections.',
    whatsNext:
      'Check all the thread connections with a multimeter. Probably have a break somewhere.',
    blockers: 'Need the multimeter — Ms. Ramirez said there is one in the electronics cabinet.'
  });
  // No handoffs for 11 days — stale

  // -----------------------------------------------------------------------
  // Project 5: "Custom Phone Stand" — SOLO, active (Amir, P5)
  // -----------------------------------------------------------------------
  const proj5 = 'demo-proj-005';
  store.projects.set(proj5, {
    id: proj5,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Custom Phone Stand',
    description:
      'A 3D-printed adjustable phone stand with cable management groove. Designed in Tinkercad.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-027',
    createdAt: day(18)
  });

  const pmId5 = uid('pm');
  store.projectMemberships.set(pmId5, {
    id: pmId5,
    projectId: proj5,
    personId: 'demo-student-027',
    isActive: true,
    joinedAt: day(18),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj5,
    authorId: 'demo-student-027',
    sessionId: 'demo-session-p5-013',
    daysAgo: 18,
    hour: 14,
    whatIDid:
      'Designed the first version in Tinkercad. Simple angled stand that holds a phone upright. Printed a small test piece to check the angle — 65 degrees feels right.',
    whatsNext:
      'Print the full-size version. Takes about 2 hours so I will start it at the beginning of next class.'
  });
  seedHandoff(store, {
    projectId: proj5,
    authorId: 'demo-student-027',
    sessionId: 'demo-session-p5-015',
    daysAgo: 14,
    hour: 14,
    whatIDid:
      'Full print finished! But the phone slides off — the lip at the bottom is too short. Also the stand wobbles because the base is too narrow.',
    whatsNext:
      'Redesign with a deeper lip (8mm instead of 3mm) and a wider base. Maybe add a groove for the charging cable.',
    questions: 'Should I try PETG instead of PLA? Tariq says it is stronger.'
  });
  seedHandoff(store, {
    projectId: proj5,
    authorId: 'demo-student-027',
    sessionId: 'demo-session-p5-017',
    daysAgo: 9,
    hour: 14,
    whatIDid:
      'Redesigned with wider base, deeper lip, and a channel for the cable. Printed v2 in PLA. It holds the phone perfectly and the cable fits through the back!',
    whatsNext:
      'Want to add a hinge so the angle is adjustable. Need to figure out how to print a snap-fit hinge.'
  });
  seedHandoff(store, {
    projectId: proj5,
    authorId: 'demo-student-027',
    sessionId: 'demo-session-p5-019',
    daysAgo: 4,
    hour: 14,
    whatIDid:
      'Printed a test hinge piece — a pin-and-socket joint. It clicks into 3 positions (45, 65, 80 degrees). Pretty stiff but it holds. Printing the final version now.',
    whatsNext: 'Assemble the final version and maybe print one for Ms. Ramirez as a thank-you gift.'
  });

  // -----------------------------------------------------------------------
  // Project 6: "Wooden Puzzle Box" — SOLO, members_only (Wren, P5)
  // -----------------------------------------------------------------------
  const proj6 = 'demo-proj-006';
  store.projects.set(proj6, {
    id: proj6,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Wooden Puzzle Box',
    description:
      'A small wooden box with hidden sliding panels that must be opened in the right sequence. Inspired by Japanese puzzle boxes.',
    isArchived: false,
    visibility: 'members_only',
    createdById: 'demo-student-030',
    createdAt: day(28)
  });

  const pmId6 = uid('pm');
  store.projectMemberships.set(pmId6, {
    id: pmId6,
    projectId: proj6,
    personId: 'demo-student-030',
    isActive: true,
    joinedAt: day(28),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-030',
    sessionId: 'demo-session-p5-010',
    daysAgo: 28,
    hour: 14,
    whatIDid:
      'Sketched the design — a cube with 3 sliding panels. You have to slide panel A before panel B will move, and panel B before C. Measured and cut the first set of pieces from basswood.',
    whatsNext: 'Cut the grooves for the sliding panels using the scroll saw.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-030',
    sessionId: 'demo-session-p5-013',
    daysAgo: 18,
    hour: 14,
    whatIDid:
      'Cut grooves in the side panels. Panel A slides smoothly but panel B is too tight. Sanded the groove wider. Glued the bottom and two sides together.',
    whatsNext:
      'Attach the top and remaining side. Need to leave the right side open until the internal blocking piece is positioned.',
    blockers: 'Wood glue needs 24 hours to cure so I cant finish assembly until next session.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-030',
    sessionId: 'demo-session-p5-015',
    daysAgo: 14,
    hour: 14,
    whatIDid:
      'Glued the blocking mechanism inside — a small wooden peg that stops panel B until panel A moves out of the way. All three panels slide in sequence now! Glued the last side on.',
    whatsNext:
      'Sand the outside smooth and apply wood finish. Maybe add a design on top with the laser cutter.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-030',
    sessionId: 'demo-session-p5-018',
    daysAgo: 7,
    hour: 14,
    whatIDid:
      'Sanded all surfaces to 220 grit. Applied first coat of tung oil finish. The wood grain looks beautiful! Let it dry.',
    whatsNext:
      'Apply second coat of finish. Design an engraving pattern for the lid on the computer.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-030',
    sessionId: 'demo-session-p5-020',
    daysAgo: 2,
    hour: 14,
    whatIDid:
      'Second coat of oil done. Designed a geometric pattern in Inkscape and laser-engraved it on the lid. It looks incredible — the burnt lines contrast with the oiled wood.',
    whatsNext:
      'Done! Going to challenge classmates to open it. Nobody has solved it yet in under 2 minutes.',
    questions: 'Could I make a version with 4 panels? Would need to rethink the blocking mechanism.'
  });

  // -----------------------------------------------------------------------
  // Project 7: "Mega Marble Run" — FLUID GROUP (Kai, Ethan, Haruto joins, Theo floats)
  // -----------------------------------------------------------------------
  const proj7 = 'demo-proj-007';
  store.projects.set(proj7, {
    id: proj7,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Mega Marble Run',
    description:
      'Giant marble run that spans two tables, with jumps, spirals, and a chain lift to bring marbles back to the top.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-005',
    createdAt: day(28)
  });

  // Kai — original member, active
  const pmMR1 = uid('pm');
  store.projectMemberships.set(pmMR1, {
    id: pmMR1,
    projectId: proj7,
    personId: 'demo-student-005',
    isActive: true,
    joinedAt: day(28),
    leftAt: null
  });
  // Ethan — original member, active
  const pmMR2 = uid('pm');
  store.projectMemberships.set(pmMR2, {
    id: pmMR2,
    projectId: proj7,
    personId: 'demo-student-009',
    isActive: true,
    joinedAt: day(28),
    leftAt: null
  });
  // Haruto — joined week 5, active
  const pmMR3 = uid('pm');
  store.projectMemberships.set(pmMR3, {
    id: pmMR3,
    projectId: proj7,
    personId: 'demo-student-019',
    isActive: true,
    joinedAt: day(16),
    leftAt: null
  });
  // Theo — drifted in week 5 to help, drifted out, came back recently
  const pmMR4a = uid('pm');
  store.projectMemberships.set(pmMR4a, {
    id: pmMR4a,
    projectId: proj7,
    personId: 'demo-student-029',
    isActive: false,
    joinedAt: day(16),
    leftAt: day(9)
  });
  const pmMR4b = uid('pm');
  store.projectMemberships.set(pmMR4b, {
    id: pmMR4b,
    projectId: proj7,
    personId: 'demo-student-029',
    isActive: true,
    joinedAt: day(4),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-005',
    sessionId: 'demo-session-p3-010',
    daysAgo: 28,
    hour: 10,
    whatIDid:
      'Built the main support structure out of cardboard tubes and hot glue. It is about 1 meter tall. Started the first ramp from the top.',
    whatsNext:
      'Build more ramps to connect the top to the bottom. We need smooth cardboard for the track.'
  });
  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-009',
    sessionId: 'demo-session-p5-012',
    daysAgo: 21,
    hour: 14,
    whatIDid:
      'Added three ramp sections and a funnel at the top. The marble makes it about halfway down before falling off the track at the curve.',
    whatsNext:
      'Fix the curve — needs side walls so the marble does not fly off. Try bending cardstock.',
    questions: 'Should we add a loop-de-loop section? Worried the marble wont have enough speed.'
  });
  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-019',
    sessionId: 'demo-session-p3-014',
    daysAgo: 16,
    hour: 10,
    whatIDid:
      'Just joined the project! Made side walls for all the curves using cardstock. No more fly-offs! Also drew a diagram of the full planned marble run path and taped it to the wall.',
    whatsNext:
      'Build the spiral section in the middle. Kai has an idea for using a paper towel tube.'
  });
  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-029',
    sessionId: 'demo-session-p5-014',
    daysAgo: 16,
    hour: 14,
    whatIDid:
      'Helped Ethan extend the run onto the second table. Built a bridge section between the two tables using a long cardboard tube reinforced with popsicle sticks.',
    whatsNext: 'The bridge sags a little in the middle. Need to add a support underneath.'
  });
  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-005',
    sessionId: 'demo-session-p3-017',
    daysAgo: 9,
    hour: 10,
    whatIDid:
      'Built the spiral section from a cut paper towel tube — marble goes around 3 times! But the exit angle is wrong and the marble stalls.',
    whatsNext:
      'Tilt the spiral more so gravity keeps the marble moving. Might need to rebuild it steeper.',
    blockers: 'Running low on hot glue sticks.'
  });
  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-009',
    sessionId: 'demo-session-p5-019',
    daysAgo: 4,
    hour: 14,
    whatIDid:
      'Rebuilt the spiral at a steeper angle — marble flows through smoothly now. Added the jump section after the spiral. The marble clears the gap about 70% of the time.',
    whatsNext:
      'Fine-tune the jump landing ramp angle. Start thinking about the chain lift mechanism.'
  });
  seedHandoff(store, {
    projectId: proj7,
    authorId: 'demo-student-029',
    sessionId: 'demo-session-p5-020',
    daysAgo: 2,
    hour: 14,
    whatIDid:
      'Came back to the project! Reinforced the bridge support and added a new section with two parallel tracks that merge into one. Marble picks a random path each time.',
    whatsNext:
      'Haruto is working on the chain lift idea — I will help him with the crank mechanism.'
  });

  // -----------------------------------------------------------------------
  // Project 8: "LED Matrix Art" — FLUID GROUP
  //   Jordan started solo, Chloe joined permanently, Fatima helped then left
  // -----------------------------------------------------------------------
  const proj8 = 'demo-proj-008';
  store.projects.set(proj8, {
    id: proj8,
    schoolId: DEMO_SCHOOL_ID,
    name: 'LED Matrix Art',
    description:
      'An 8x8 LED matrix that displays animated pixel art patterns, controlled by a micro:bit.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-002',
    createdAt: day(21)
  });

  // Jordan — creator, active
  const pmLM1 = uid('pm');
  store.projectMemberships.set(pmLM1, {
    id: pmLM1,
    projectId: proj8,
    personId: 'demo-student-002',
    isActive: true,
    joinedAt: day(21),
    leftAt: null
  });
  // Chloe — joined week 5, active
  const pmLM2 = uid('pm');
  store.projectMemberships.set(pmLM2, {
    id: pmLM2,
    projectId: proj8,
    personId: 'demo-student-014',
    isActive: true,
    joinedAt: day(14),
    leftAt: null
  });
  // Fatima — helped for 2 sessions, then went back to her own thing
  const pmLM3 = uid('pm');
  store.projectMemberships.set(pmLM3, {
    id: pmLM3,
    projectId: proj8,
    personId: 'demo-student-020',
    isActive: false,
    joinedAt: day(14),
    leftAt: day(7)
  });

  seedHandoff(store, {
    projectId: proj8,
    authorId: 'demo-student-002',
    sessionId: 'demo-session-p3-012',
    daysAgo: 21,
    hour: 10,
    whatIDid:
      'Soldered the 8x8 LED matrix to the breakout board. Tested all 64 LEDs — 2 in the corner were dim, resoldered them and now they work.',
    whatsNext: 'Connect to the micro:bit and write code to light individual pixels.'
  });
  seedHandoff(store, {
    projectId: proj8,
    authorId: 'demo-student-014',
    sessionId: 'demo-session-p5-015',
    daysAgo: 14,
    hour: 14,
    whatIDid:
      'Joined the project! Drew pixel art patterns on graph paper — a heart, a star, a smiley face, and a simple animation of a bouncing ball (4 frames).',
    whatsNext: 'Convert the graph paper patterns to arrays in the code.',
    questions: 'Can we make the colors change? Or is this a single-color matrix?'
  });
  seedHandoff(store, {
    projectId: proj8,
    authorId: 'demo-student-020',
    sessionId: 'demo-session-p3-015',
    daysAgo: 14,
    hour: 10,
    whatIDid:
      'Helped Jordan write the micro:bit code to address individual pixels. Got the heart pattern displaying! The matrix uses I2C so we had to figure out the address.',
    whatsNext: 'Add the other patterns and a button to cycle through them.'
  });
  seedHandoff(store, {
    projectId: proj8,
    authorId: 'demo-student-020',
    sessionId: 'demo-session-p3-017',
    daysAgo: 9,
    hour: 10,
    whatIDid:
      'Added button A to cycle through patterns and button B to toggle animation mode. The bouncing ball animation works but is a bit fast — need to add a delay.',
    whatsNext:
      'Jordan can tweak the animation speed. I am going to focus on my sound-reactive panel project now.'
  });
  seedHandoff(store, {
    projectId: proj8,
    authorId: 'demo-student-002',
    sessionId: 'demo-session-p3-019',
    daysAgo: 4,
    hour: 10,
    whatIDid:
      'Slowed down the animation to 200ms per frame — looks much better. Added brightness control with the A+B buttons together. The matrix is single color (red) but brightness variation makes it look cool.',
    whatsNext:
      'Chloe has new pattern designs. Code the animation — cycle through the bouncing ball frames with a delay.'
  });

  // -----------------------------------------------------------------------
  // Project 9: "Mini Greenhouse" — FLUID GROUP
  //   Anya started solo, Diego helped briefly, now Anya+Iris
  // -----------------------------------------------------------------------
  const proj9 = 'demo-proj-009';
  store.projects.set(proj9, {
    id: proj9,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Mini Greenhouse',
    description:
      'A small greenhouse with an Arduino soil moisture sensor that sends alerts when plants need water. Made from a plastic container and balsa wood frame.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-022',
    createdAt: day(21)
  });

  const sub9a = 'demo-sub-009';
  const sub9b = 'demo-sub-010';
  store.subsystems.set(sub9a, {
    id: sub9a,
    projectId: proj9,
    name: 'Structure',
    displayOrder: 1,
    isActive: true
  });
  store.subsystems.set(sub9b, {
    id: sub9b,
    projectId: proj9,
    name: 'Sensor & code',
    displayOrder: 2,
    isActive: true
  });

  // Anya — creator, active
  const pmGH1 = uid('pm');
  store.projectMemberships.set(pmGH1, {
    id: pmGH1,
    projectId: proj9,
    personId: 'demo-student-022',
    isActive: true,
    joinedAt: day(21),
    leftAt: null
  });
  // Diego — helped for a couple sessions, then left
  const pmGH2 = uid('pm');
  store.projectMemberships.set(pmGH2, {
    id: pmGH2,
    projectId: proj9,
    personId: 'demo-student-021',
    isActive: false,
    joinedAt: day(16),
    leftAt: day(11)
  });
  // Iris — joined recently, active
  const pmGH3 = uid('pm');
  store.projectMemberships.set(pmGH3, {
    id: pmGH3,
    projectId: proj9,
    personId: 'demo-student-028',
    isActive: true,
    joinedAt: day(9),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj9,
    authorId: 'demo-student-022',
    sessionId: 'demo-session-p3-012',
    daysAgo: 21,
    hour: 10,
    whatIDid:
      'Built the greenhouse frame from balsa wood sticks and hot glue. Used a clear plastic container as the base. Cut ventilation holes in the top.',
    whatsNext: 'Cover the frame with plastic wrap to trap humidity. Plant some seeds!',
    subsystems: [sub9a]
  });
  seedHandoff(store, {
    projectId: proj9,
    authorId: 'demo-student-021',
    sessionId: 'demo-session-p3-014',
    daysAgo: 16,
    hour: 10,
    whatIDid:
      'Helped Anya add the plastic wrap walls. We planted bean seeds in small pots inside. Also poked drainage holes in the bottom of the pots.',
    whatsNext: 'Need to figure out the soil moisture sensor wiring.',
    subsystems: [sub9a]
  });
  seedHandoff(store, {
    projectId: proj9,
    authorId: 'demo-student-022',
    sessionId: 'demo-session-p3-016',
    daysAgo: 11,
    hour: 10,
    whatIDid:
      'Wired the soil moisture sensor to an Arduino Nano. It reads values from 0 (dry) to 1023 (wet). The serial monitor shows about 650 when the soil is moist. Bean sprouts are coming up!',
    whatsNext: 'Add a buzzer or LED that goes off when the soil gets too dry (below 400).',
    subsystems: [sub9b]
  });
  seedHandoff(store, {
    projectId: proj9,
    authorId: 'demo-student-028',
    sessionId: 'demo-session-p5-017',
    daysAgo: 9,
    hour: 14,
    whatIDid:
      'Joined the project! Added an LED that turns red when soil is dry and green when moist. Also sewed a small fabric cover for the sensor wires so they look nicer.',
    whatsNext:
      'Want to add a small water reservoir with a tube so it can self-water. Need to figure out a valve.',
    subsystems: [sub9b]
  });
  seedHandoff(store, {
    projectId: proj9,
    authorId: 'demo-student-022',
    sessionId: 'demo-session-p3-019',
    daysAgo: 4,
    hour: 10,
    whatIDid:
      'Bean plants are 10cm tall! Added a second sensor for a different pot. The code now tracks both pots independently. Painted the frame green and added a sign that says "Anya & Iris Garden."',
    whatsNext:
      'Iris is working on the auto-watering system. I want to add a temperature sensor too.',
    subsystems: [sub9a, sub9b]
  });
  seedHandoff(store, {
    projectId: proj9,
    authorId: 'demo-student-028',
    sessionId: 'demo-session-p5-020',
    daysAgo: 2,
    hour: 14,
    whatIDid:
      'Built a gravity-fed water reservoir from a water bottle mounted upside down. Used a small aquarium valve to control flow. When I open the valve, water drips slowly into the pot. Not automated yet but way easier than hand-watering.',
    whatsNext:
      'Want to connect the valve to a servo so the Arduino can open it automatically when soil is dry.',
    subsystems: [sub9a, sub9b]
  });

  // -----------------------------------------------------------------------
  // Project 10: "Desktop Catapult" — COMPLETED + ARCHIVED
  // -----------------------------------------------------------------------
  const proj10 = 'demo-proj-010';
  store.projects.set(proj10, {
    id: proj10,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Desktop Catapult',
    description:
      'A small wooden catapult that launches ping pong balls. First project of the semester!',
    isArchived: true,
    visibility: 'browseable',
    createdById: 'demo-student-007',
    createdAt: day(51)
  });

  for (const pid of ['demo-student-007', 'demo-student-003', 'demo-student-011']) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj10,
      personId: pid,
      isActive: true,
      joinedAt: day(51),
      leftAt: null
    });
  }

  seedHandoff(store, {
    projectId: proj10,
    authorId: 'demo-student-007',
    sessionId: 'demo-session-p3-001',
    daysAgo: 51,
    hour: 10,
    whatIDid:
      'Built the base and arm from scrap wood pieces. Used wood glue and a rubber band for the launching force.',
    whatsNext: 'Need a hinge for the arm pivot. Also need to figure out the cup to hold the ball.'
  });
  seedHandoff(store, {
    projectId: proj10,
    authorId: 'demo-student-003',
    sessionId: 'demo-session-p3-003',
    daysAgo: 46,
    hour: 10,
    whatIDid:
      'Made a hinge from a bolt and two brackets. Attached the arm to the base. It swings! Also glued a bottle cap on the end as the ball cup.',
    whatsNext: 'Test launch and adjust the rubber band tension.'
  });
  seedHandoff(store, {
    projectId: proj10,
    authorId: 'demo-student-011',
    sessionId: 'demo-session-p5-003',
    daysAgo: 46,
    hour: 14,
    whatIDid:
      'Test launched about 20 times. Best distance was 2 meters! We found that 2 rubber bands work better than 1. Added a trigger pin made from a pencil.',
    whatsNext: 'Decorate it and do a final demo. Maybe add a target to aim at.'
  });
  seedHandoff(store, {
    projectId: proj10,
    authorId: 'demo-student-007',
    sessionId: 'demo-session-p3-005',
    daysAgo: 42,
    hour: 10,
    whatIDid:
      'Painted the catapult and made a target out of stacked cups. Demo went great — hit the target from 1.5m! We are calling this project done.',
    whatsNext: null
  });

  // -----------------------------------------------------------------------
  // Project 11: "Sound-Reactive LED Panel" — Fatima SOLO (P3)
  //   She helped on LED Matrix Art then started her own spin-off
  // -----------------------------------------------------------------------
  const proj11 = 'demo-proj-011';
  store.projects.set(proj11, {
    id: proj11,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Sound-Reactive LED Panel',
    description:
      'An LED strip that reacts to music and sounds using a microphone module. The lights pulse and change pattern with the beat.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-020',
    createdAt: day(7)
  });

  const pmSR1 = uid('pm');
  store.projectMemberships.set(pmSR1, {
    id: pmSR1,
    projectId: proj11,
    personId: 'demo-student-020',
    isActive: true,
    joinedAt: day(7),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj11,
    authorId: 'demo-student-020',
    sessionId: 'demo-session-p3-018',
    daysAgo: 7,
    hour: 10,
    whatIDid:
      'Got the sound sensor module working with the micro:bit. It outputs an analog value that goes up when there is loud noise. Tested by clapping — the reading jumps from ~100 to ~800.',
    whatsNext:
      'Connect the NeoPixel LED strip and write code to map sound level to number of lit LEDs.'
  });
  seedHandoff(store, {
    projectId: proj11,
    authorId: 'demo-student-020',
    sessionId: 'demo-session-p3-020',
    daysAgo: 2,
    hour: 10,
    whatIDid:
      'Wired up 30 NeoPixels. Wrote code that lights LEDs from bottom to top based on sound level — like a VU meter! Green at bottom, yellow in middle, red at top. Tested with music from my phone — it looks really cool.',
    whatsNext:
      'Mount everything on a board and add a mode button to switch between VU meter and color-pulse patterns.',
    questions:
      'Jordan said I could borrow ideas from the LED Matrix code for the patterns. Should I join that project or keep this separate?'
  });

  // =========================================================================
  // HANDOFF READ STATUSES
  // =========================================================================

  // Ava read Robo-Falcon 5 days ago (has unread from days 4 and 2)
  store.handoffReadStatuses.set(uid('hrs'), {
    id: uid('hrs'),
    projectId: proj1,
    personId: 'demo-student-010',
    lastReadAt: day(5)
  });
  // Marcus read Robo-Falcon 10 days ago (has several unread)
  store.handoffReadStatuses.set(uid('hrs'), {
    id: uid('hrs'),
    projectId: proj1,
    personId: 'demo-student-013',
    lastReadAt: day(10)
  });
  // Chloe read LED Matrix 5 days ago (has unread from day 4)
  store.handoffReadStatuses.set(uid('hrs'), {
    id: uid('hrs'),
    projectId: proj8,
    personId: 'demo-student-014',
    lastReadAt: day(5)
  });
  // Ethan read Marble Run 3 days ago (has unread from day 2)
  store.handoffReadStatuses.set(uid('hrs'), {
    id: uid('hrs'),
    projectId: proj7,
    personId: 'demo-student-009',
    lastReadAt: day(3)
  });
  // Iris read Greenhouse 3 days ago (up to date)
  store.handoffReadStatuses.set(uid('hrs'), {
    id: uid('hrs'),
    projectId: proj9,
    personId: 'demo-student-028',
    lastReadAt: day(1)
  });

  // =========================================================================
  // HELP REQUESTS — per-classroom (P3 and P5 have their own queues)
  // =========================================================================

  // --- P3 resolved ---
  store.helpRequests.set('demo-help-001', {
    id: 'demo-help-001',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-p3-005',
    requesterId: 'demo-student-004',
    categoryId: helpCats[2],
    description: 'My micro:bit code compiles but the servo does not move at all.',
    whatITried:
      'Checked the wiring twice and tried a different pin. Also tried the servo test example from the website.',
    hypothesis: 'Maybe the pin is not configured for PWM output?',
    topic: 'Robo-Falcon',
    urgency: 'blocked',
    status: 'resolved',
    claimedById: 'demo-student-002',
    claimedAt: day(42, 9, 15),
    resolvedAt: day(42, 9, 28),
    cancelledAt: null,
    resolutionNotes:
      'The pin was set to digital instead of analog. Changed to pin 0 which supports PWM.',
    cancellationReason: null,
    createdAt: day(42, 9, 12)
  });

  store.helpRequests.set('demo-help-002', {
    id: 'demo-help-002',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-p3-008',
    requesterId: 'demo-student-005',
    categoryId: helpCats[6],
    description: 'Hot glue gun is not heating up. The light is on but no glue comes out.',
    whatITried: 'Unplugged and replugged it. Tried pushing glue stick in harder.',
    hypothesis: null,
    topic: 'Marble Run',
    urgency: 'blocked',
    status: 'resolved',
    claimedById: TEACHER.id,
    claimedAt: day(35, 9, 20),
    resolvedAt: day(35, 9, 25),
    cancelledAt: null,
    resolutionNotes: 'Glue gun needed a new nozzle. Swapped it out from the supply closet.',
    cancellationReason: null,
    createdAt: day(35, 9, 18)
  });

  store.helpRequests.set('demo-help-003', {
    id: 'demo-help-003',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-p3-017',
    requesterId: 'demo-student-001',
    categoryId: helpCats[0],
    description:
      'The 3D printer is making a weird clicking noise and the filament is not coming out.',
    whatITried:
      'Tried pulling the filament out and reinserting. Checked the nozzle temperature — it says 200 which should be right for PLA.',
    hypothesis: 'I think the nozzle might be clogged.',
    topic: null,
    urgency: 'blocked',
    status: 'resolved',
    claimedById: TEACHER.id,
    claimedAt: day(9, 9, 15),
    resolvedAt: day(9, 9, 35),
    cancelledAt: null,
    resolutionNotes:
      'Partial clog. Heated to 230 and pushed filament through manually. Working now.',
    cancellationReason: null,
    createdAt: day(9, 9, 10)
  });

  // --- P5 resolved ---
  store.helpRequests.set('demo-help-004', {
    id: 'demo-help-004',
    classroomId: DEMO_CLASSROOM_ID_2,
    sessionId: 'demo-session-p5-010',
    requesterId: 'demo-student-012',
    categoryId: helpCatsP5[2],
    description: 'My Arduino LCD shows garbled characters instead of text.',
    whatITried:
      'Checked the I2C address (0x27). Tried lcd.begin(16,2) and lcd.init(). Swapped LCD modules.',
    hypothesis: 'Maybe the contrast potentiometer on the I2C adapter needs adjusting?',
    topic: 'Weather Station',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-015',
    claimedAt: day(28, 13, 32),
    resolvedAt: day(28, 13, 45),
    cancelledAt: null,
    resolutionNotes:
      'Contrast pot was turned all the way up. Adjusted it with a small screwdriver.',
    cancellationReason: null,
    createdAt: day(28, 13, 30)
  });

  store.helpRequests.set('demo-help-005', {
    id: 'demo-help-005',
    classroomId: DEMO_CLASSROOM_ID_2,
    sessionId: 'demo-session-p5-015',
    requesterId: 'demo-student-009',
    categoryId: helpCatsP5[5],
    description: 'Can someone help me figure out the angle for the marble run jump section?',
    whatITried:
      'Built a ramp at 30 degrees and 45 degrees. 30 was too flat, 45 the marble goes too high.',
    hypothesis: 'Maybe 35-40 degrees? Or maybe I need a curved ramp instead of straight?',
    topic: 'Marble Run',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-010',
    claimedAt: day(14, 13, 25),
    resolvedAt: day(14, 13, 50),
    cancelledAt: null,
    resolutionNotes:
      'Ava suggested a curved ramp like a ski jump. We cut a curve from cardboard and it works much better.',
    cancellationReason: null,
    createdAt: day(14, 13, 22)
  });

  store.helpRequests.set('demo-help-006', {
    id: 'demo-help-006',
    classroomId: DEMO_CLASSROOM_ID_2,
    sessionId: 'demo-session-p5-019',
    requesterId: 'demo-student-014',
    categoryId: helpCatsP5[2],
    description:
      'How do I make an array of arrays in MakeCode? I want to store the pixel patterns for the LED matrix animation.',
    whatITried:
      'Tried making a list of lists but MakeCode blocks dont seem to support nested arrays.',
    hypothesis: null,
    topic: 'LED Matrix',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-018',
    claimedAt: day(4, 13, 42),
    resolvedAt: day(4, 14, 5),
    cancelledAt: null,
    resolutionNotes:
      'Ryan showed me how to switch to JavaScript mode in MakeCode where you can use regular arrays.',
    cancellationReason: null,
    createdAt: day(4, 13, 40)
  });

  // --- P3 cancelled ---
  store.helpRequests.set('demo-help-007', {
    id: 'demo-help-007',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-p3-013',
    requesterId: 'demo-student-006',
    categoryId: helpCats[1],
    description: 'Conductive thread connections keep coming loose when I sew.',
    whatITried:
      'Made tighter stitches around the LED pads. Tried wrapping the thread multiple times.',
    hypothesis: null,
    topic: 'LED Vest',
    urgency: 'question',
    status: 'cancelled',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: day(18, 9, 50),
    resolutionNotes: null,
    cancellationReason: 'Figured it out! Jordan showed me a knot stitch technique during break.',
    createdAt: day(18, 9, 38)
  });

  // --- P5 cancelled ---
  store.helpRequests.set('demo-help-008', {
    id: 'demo-help-008',
    classroomId: DEMO_CLASSROOM_ID_2,
    sessionId: 'demo-session-p5-018',
    requesterId: 'demo-student-018',
    categoryId: helpCatsP5[1],
    description:
      'Weather station LCD shows wrong temperature — reads 45°C but classroom is not that hot.',
    whatITried: 'Checked the sensor wiring. The humidity reading looks correct though.',
    hypothesis: 'Maybe the sensor is too close to the Arduino and picking up heat from the board?',
    topic: 'Weather Station',
    urgency: 'question',
    status: 'cancelled',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: day(7, 13, 50),
    resolutionNotes: null,
    cancellationReason:
      'Figured it out! The code was reading Fahrenheit and displaying it as Celsius.',
    createdAt: day(7, 13, 42)
  });

  // --- Today's active P3 requests ---
  store.helpRequests.set('demo-help-009', {
    id: 'demo-help-009',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: todayP3.id,
    requesterId: 'demo-student-005',
    categoryId: helpCats[5],
    description:
      'Need help designing the chain lift mechanism for the marble run. How do we get marbles from the bottom back to the top automatically?',
    whatITried:
      'Watched a YouTube video about marble machines. They use a rotating wheel with cups but we dont have a motor.',
    hypothesis: 'Maybe we could use a hand crank instead of a motor?',
    topic: 'Marble Run',
    urgency: 'question',
    status: 'pending',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: null,
    resolutionNotes: null,
    cancellationReason: null,
    createdAt: day(0, 9, 22)
  });

  store.helpRequests.set('demo-help-010', {
    id: 'demo-help-010',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: todayP3.id,
    requesterId: 'demo-student-017',
    categoryId: helpCats[0],
    description: 'My Tinkercad model exports as STL but the slicer says it has non-manifold edges.',
    whatITried:
      'Tried exporting again. Checked the model in Tinkercad and it looks fine. Also tried PrusaSlicer instead of Cura.',
    hypothesis: 'Maybe two of my shapes are not fully overlapping and leaving a tiny gap?',
    topic: 'Robo-Falcon',
    urgency: 'blocked',
    status: 'claimed',
    claimedById: 'demo-student-001',
    claimedAt: day(0, 9, 35),
    resolvedAt: null,
    cancelledAt: null,
    resolutionNotes: null,
    cancellationReason: null,
    createdAt: day(0, 9, 30)
  });

  store.helpRequests.set('demo-help-012', {
    id: 'demo-help-012',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: todayP3.id,
    requesterId: 'demo-student-022',
    categoryId: helpCats[1],
    description:
      'My soil moisture sensor stopped reading — just shows 0 all the time even when I stick it in water.',
    whatITried:
      'Checked the wiring. Swapped to a different analog pin. The Arduino LED still blinks so it has power.',
    hypothesis: 'Maybe the sensor corroded? It has been sitting in wet soil for two weeks.',
    topic: 'Mini Greenhouse',
    urgency: 'blocked',
    status: 'pending',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: null,
    resolutionNotes: null,
    cancellationReason: null,
    createdAt: day(0, 9, 40)
  });

  // --- Today's active P5 requests ---
  store.helpRequests.set('demo-help-011', {
    id: 'demo-help-011',
    classroomId: DEMO_CLASSROOM_ID_2,
    sessionId: todayP5.id,
    requesterId: 'demo-student-012',
    categoryId: helpCatsP5[2],
    description:
      'Can someone look at my weather station code? I added data logging to save readings every 5 minutes but I am not sure the SD card write is working.',
    whatITried: 'The serial output shows the data but the file on the SD card shows 0 bytes.',
    hypothesis:
      'Maybe I need to close the file after each write? Or maybe the SD card format is wrong.',
    topic: 'Weather Station',
    urgency: 'check_work',
    status: 'pending',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: null,
    resolutionNotes: null,
    cancellationReason: null,
    createdAt: day(0, 13, 45)
  });

  // =========================================================================
  // CHORES — school-scoped shared responsibilities
  // =========================================================================

  const choreCleanBench = uid('chore');
  store.chores.set(choreCleanBench, {
    id: choreCleanBench,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Clean workbench',
    description:
      'Wipe down workbench surfaces, sweep underneath, and organize loose parts into bins.',
    size: 'medium',
    estimatedMinutes: 15,
    recurrence: 'daily',
    verificationType: 'peer',
    location: 'Workshop area',
    isActive: true,
    createdById: TEACHER.id,
    createdAt: day(30)
  });

  const choreOrganizeTools = uid('chore');
  store.chores.set(choreOrganizeTools, {
    id: choreOrganizeTools,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Organize tool wall',
    description:
      'Return all tools to their labeled spots on the pegboard. Report any missing tools.',
    size: 'small',
    estimatedMinutes: 5,
    recurrence: 'daily',
    verificationType: 'self',
    location: 'Tool wall',
    isActive: true,
    createdById: TEACHER.id,
    createdAt: day(30)
  });

  const choreWhiteboards = uid('chore');
  store.chores.set(choreWhiteboards, {
    id: choreWhiteboards,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Wipe whiteboards',
    description:
      'Erase all whiteboards and replace dried-out markers with fresh ones from the supply drawer.',
    size: 'small',
    estimatedMinutes: 5,
    recurrence: 'weekly',
    verificationType: 'teacher',
    location: null,
    isActive: true,
    createdById: TEACHER.id,
    createdAt: day(28)
  });

  const choreRecycling = uid('chore');
  store.chores.set(choreRecycling, {
    id: choreRecycling,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Empty recycling bins',
    description:
      'Collect all recycling bins, take to the main recycling area, and return empty bins.',
    size: 'medium',
    estimatedMinutes: 10,
    recurrence: 'weekly',
    verificationType: 'peer',
    location: null,
    isActive: true,
    createdById: TEACHER.id,
    createdAt: day(28)
  });

  // Instances in various states
  // Available instance
  const inst1 = uid('chore-inst');
  store.choreInstances.set(inst1, {
    id: inst1,
    choreId: choreCleanBench,
    sessionId: null,
    status: 'available',
    dueDate: null,
    claimedById: null,
    claimedAt: null,
    completedAt: null,
    completionNotes: null,
    createdAt: day(1)
  });

  // Claimed instance
  const inst2 = uid('chore-inst');
  store.choreInstances.set(inst2, {
    id: inst2,
    choreId: choreOrganizeTools,
    sessionId: null,
    status: 'claimed',
    dueDate: null,
    claimedById: 'demo-student-003',
    claimedAt: day(0, 9, 30),
    completedAt: null,
    completionNotes: null,
    createdAt: day(1)
  });

  // Completed (waiting for verification)
  const inst3 = uid('chore-inst');
  store.choreInstances.set(inst3, {
    id: inst3,
    choreId: choreWhiteboards,
    sessionId: null,
    status: 'completed',
    dueDate: null,
    claimedById: 'demo-student-005',
    claimedAt: day(1, 9, 15),
    completedAt: day(1, 9, 45),
    completionNotes: 'All whiteboards wiped. Replaced 3 markers.',
    createdAt: day(2)
  });

  // Verified instance
  const inst4 = uid('chore-inst');
  store.choreInstances.set(inst4, {
    id: inst4,
    choreId: choreRecycling,
    sessionId: null,
    status: 'verified',
    dueDate: null,
    claimedById: 'demo-student-001',
    claimedAt: day(3, 9, 20),
    completedAt: day(3, 10, 0),
    completionNotes: null,
    createdAt: day(4)
  });

  const verif1 = uid('chore-verif');
  store.choreVerifications.set(verif1, {
    id: verif1,
    choreInstanceId: inst4,
    verifierId: 'demo-student-002',
    decision: 'approved',
    feedback: 'Looks great!',
    verifiedAt: day(3, 10, 5),
    createdAt: day(3, 10, 5)
  });

  // Redo requested instance
  const inst5 = uid('chore-inst');
  store.choreInstances.set(inst5, {
    id: inst5,
    choreId: choreCleanBench,
    sessionId: null,
    status: 'redo_requested',
    dueDate: null,
    claimedById: 'demo-student-007',
    claimedAt: day(2, 9, 10),
    completedAt: day(2, 9, 40),
    completionNotes: 'Wiped down surfaces.',
    createdAt: day(3)
  });

  const verif2 = uid('chore-verif');
  store.choreVerifications.set(verif2, {
    id: verif2,
    choreInstanceId: inst5,
    verifierId: 'demo-student-004',
    decision: 'redo_requested',
    feedback: 'Still some sawdust under bench 3, and screws not sorted into bins.',
    verifiedAt: day(2, 9, 50),
    createdAt: day(2, 9, 50)
  });

  // Another available instance for recycling
  const inst6 = uid('chore-inst');
  store.choreInstances.set(inst6, {
    id: inst6,
    choreId: choreRecycling,
    sessionId: null,
    status: 'available',
    dueDate: null,
    claimedById: null,
    claimedAt: null,
    completedAt: null,
    completionNotes: null,
    createdAt: day(0)
  });

  // =========================================================================
  // DOMAIN EVENTS — representative sampling
  // =========================================================================

  const events = [
    {
      type: 'SESSION_STARTED',
      entity: 'Session',
      entityId: todayP3.id,
      classroomId: DEMO_CLASSROOM_ID,
      sessionId: todayP3.id,
      actorId: TEACHER.id,
      daysAgo: 0,
      hour: 9,
      min: 2,
      payload: {
        sessionId: todayP3.id,
        classroomId: DEMO_CLASSROOM_ID,
        startedBy: TEACHER.id,
        byTeacher: true
      }
    },
    {
      type: 'SESSION_STARTED',
      entity: 'Session',
      entityId: todayP5.id,
      classroomId: DEMO_CLASSROOM_ID_2,
      sessionId: todayP5.id,
      actorId: TEACHER.id,
      daysAgo: 0,
      hour: 13,
      min: 2,
      payload: {
        sessionId: todayP5.id,
        classroomId: DEMO_CLASSROOM_ID_2,
        startedBy: TEACHER.id,
        byTeacher: true
      }
    },
    {
      type: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: proj1,
      classroomId: null,
      sessionId: 'demo-session-p3-003',
      actorId: 'demo-student-001',
      daysAgo: 46,
      hour: 9,
      min: 20,
      payload: {
        projectId: proj1,
        schoolId: DEMO_SCHOOL_ID,
        name: 'Robo-Falcon',
        description: 'A robotic falcon with movable wings and LED eyes.',
        visibility: 'browseable',
        createdBy: 'demo-student-001',
        byTeacher: false
      }
    },
    {
      type: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: proj8,
      classroomId: null,
      sessionId: 'demo-session-p3-012',
      actorId: 'demo-student-002',
      daysAgo: 21,
      hour: 9,
      min: 20,
      payload: {
        projectId: proj8,
        schoolId: DEMO_SCHOOL_ID,
        name: 'LED Matrix Art',
        description: 'An 8x8 LED matrix that displays animated pixel art patterns.',
        visibility: 'browseable',
        createdBy: 'demo-student-002',
        byTeacher: false
      }
    },
    {
      type: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: proj11,
      classroomId: null,
      sessionId: 'demo-session-p3-018',
      actorId: 'demo-student-020',
      daysAgo: 7,
      hour: 9,
      min: 15,
      payload: {
        projectId: proj11,
        schoolId: DEMO_SCHOOL_ID,
        name: 'Sound-Reactive LED Panel',
        description: 'An LED strip that reacts to music and sounds.',
        visibility: 'browseable',
        createdBy: 'demo-student-020',
        byTeacher: false
      }
    },
    {
      type: 'HANDOFF_SUBMITTED',
      entity: 'Handoff',
      entityId: 'event-handoff-ref',
      classroomId: null,
      sessionId: 'demo-session-p3-020',
      actorId: 'demo-student-001',
      daysAgo: 2,
      hour: 10,
      min: 10,
      payload: {
        projectId: proj1,
        schoolId: DEMO_SCHOOL_ID,
        sessionId: 'demo-session-p3-020',
        authorId: 'demo-student-001',
        whatIDid: 'Painted the chassis',
        byTeacher: false,
        subsystemIds: [sub1a]
      }
    },
    {
      type: 'HELP_REQUESTED',
      entity: 'HelpRequest',
      entityId: 'demo-help-009',
      classroomId: DEMO_CLASSROOM_ID,
      sessionId: todayP3.id,
      actorId: 'demo-student-005',
      daysAgo: 0,
      hour: 9,
      min: 22,
      payload: {
        requestId: 'demo-help-009',
        sessionId: todayP3.id,
        classroomId: DEMO_CLASSROOM_ID,
        requesterId: 'demo-student-005',
        urgency: 'question',
        categoryId: helpCats[5],
        description: 'Need help designing the chain lift mechanism',
        byTeacher: false
      }
    },
    {
      type: 'HELP_CLAIMED',
      entity: 'HelpRequest',
      entityId: 'demo-help-010',
      classroomId: DEMO_CLASSROOM_ID,
      sessionId: todayP3.id,
      actorId: 'demo-student-001',
      daysAgo: 0,
      hour: 9,
      min: 35,
      payload: {
        requestId: 'demo-help-010',
        sessionId: todayP3.id,
        classroomId: DEMO_CLASSROOM_ID,
        requesterId: 'demo-student-017',
        claimedById: 'demo-student-001',
        byTeacher: false
      }
    },
    {
      type: 'PERSON_SIGNED_IN',
      entity: 'SignIn',
      entityId: 'event-signin-ref',
      classroomId: DEMO_CLASSROOM_ID,
      sessionId: todayP3.id,
      actorId: 'demo-student-001',
      daysAgo: 0,
      hour: 9,
      min: 3,
      payload: {
        sessionId: todayP3.id,
        classroomId: DEMO_CLASSROOM_ID,
        personId: 'demo-student-001',
        signedInBy: 'demo-student-001',
        isSelfSignIn: true,
        byTeacher: false
      }
    },
    {
      type: 'PROJECT_MEMBER_ADDED',
      entity: 'ProjectMembership',
      entityId: 'event-pm-ref',
      classroomId: null,
      sessionId: 'demo-session-p5-010',
      actorId: 'demo-student-017',
      daysAgo: 28,
      hour: 14,
      min: 10,
      payload: {
        projectId: proj1,
        schoolId: DEMO_SCHOOL_ID,
        personId: 'demo-student-017',
        addedBy: 'demo-student-017',
        byTeacher: false
      }
    },
    {
      type: 'PROJECT_MEMBER_ADDED',
      entity: 'ProjectMembership',
      entityId: 'event-pm-ref-2',
      classroomId: null,
      sessionId: 'demo-session-p5-017',
      actorId: 'demo-student-028',
      daysAgo: 9,
      hour: 14,
      min: 5,
      payload: {
        projectId: proj9,
        schoolId: DEMO_SCHOOL_ID,
        personId: 'demo-student-028',
        addedBy: 'demo-student-028',
        byTeacher: false
      }
    },
    {
      type: 'PROJECT_MEMBER_REMOVED',
      entity: 'ProjectMembership',
      entityId: 'event-pm-ref-3',
      classroomId: null,
      sessionId: 'demo-session-p3-017',
      actorId: 'demo-student-020',
      daysAgo: 9,
      hour: 10,
      min: 25,
      payload: {
        projectId: proj8,
        schoolId: DEMO_SCHOOL_ID,
        personId: 'demo-student-020',
        removedBy: 'demo-student-020',
        byTeacher: false
      }
    },
    {
      type: 'PROJECT_ARCHIVED',
      entity: 'Project',
      entityId: proj10,
      classroomId: null,
      sessionId: 'demo-session-p3-005',
      actorId: TEACHER.id,
      daysAgo: 42,
      hour: 10,
      min: 20,
      payload: {
        projectId: proj10,
        schoolId: DEMO_SCHOOL_ID,
        archivedBy: TEACHER.id,
        byTeacher: true
      }
    },
    {
      type: 'HELP_RESOLVED',
      entity: 'HelpRequest',
      entityId: 'demo-help-001',
      classroomId: DEMO_CLASSROOM_ID,
      sessionId: 'demo-session-p3-005',
      actorId: 'demo-student-002',
      daysAgo: 42,
      hour: 9,
      min: 28,
      payload: {
        requestId: 'demo-help-001',
        sessionId: 'demo-session-p3-005',
        classroomId: DEMO_CLASSROOM_ID,
        requesterId: 'demo-student-004',
        resolverId: 'demo-student-002',
        resolutionNotes: 'Pin was set to digital instead of analog.',
        byTeacher: false
      }
    },
    {
      type: 'SESSION_ENDED',
      entity: 'Session',
      entityId: 'demo-session-p3-020',
      classroomId: DEMO_CLASSROOM_ID,
      sessionId: 'demo-session-p3-020',
      actorId: TEACHER.id,
      daysAgo: 2,
      hour: 10,
      min: 30,
      payload: {
        sessionId: 'demo-session-p3-020',
        classroomId: DEMO_CLASSROOM_ID,
        endedBy: TEACHER.id,
        byTeacher: true
      }
    }
  ];

  for (const e of events) {
    store.domainEvents.push({
      id: uid('evt'),
      schoolId: DEMO_SCHOOL_ID,
      classroomId: e.classroomId ?? null,
      sessionId: e.sessionId,
      eventType: e.type,
      entityType: e.entity,
      entityId: e.entityId,
      actorId: e.actorId,
      payload: e.payload,
      createdAt: day(e.daysAgo, e.hour, e.min)
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedHandoff(
  store: MemoryStore,
  opts: {
    projectId: string;
    authorId: string;
    sessionId: string;
    daysAgo: number;
    hour?: number;
    whatIDid: string;
    whatsNext?: string | null;
    blockers?: string | null;
    questions?: string | null;
    subsystems?: string[];
  }
): void {
  const id = uid('handoff');
  const hour = opts.hour ?? 10;
  store.handoffs.set(id, {
    id,
    projectId: opts.projectId,
    authorId: opts.authorId,
    sessionId: opts.sessionId,
    whatIDid: opts.whatIDid,
    whatsNext: opts.whatsNext ?? null,
    blockers: opts.blockers ?? null,
    questions: opts.questions ?? null,
    createdAt: day(opts.daysAgo, hour, 10 + Math.floor(Math.random() * 15))
  });
  if (opts.subsystems) {
    for (const subId of opts.subsystems) {
      store.handoffSubsystems.push({ handoffId: id, subsystemId: subId });
    }
  }
}

/** Simple deterministic hash for consistent "random" attendance. */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Public helpers (used by /api/demo/students)
// ---------------------------------------------------------------------------

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
