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
// Two classrooms:
//   Period 3 (morning, 9:00–10:30, code DEMO01) — 10 students
//   Period 5 (afternoon, 1:00–2:30, code DEMO02) — 10 students
//   2 students attend both (flexible helpers)
//
// Ms. Ramirez teaches both classes.
// Projects are school-scoped — the same physical build gets worked on by
// morning and afternoon students. Handoffs flow across class periods.
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

// Period 3 only (morning)
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
  }
];

// Period 5 only (afternoon)
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
const P3_ALL = [...P3_STUDENTS, ...BOTH_STUDENTS]; // 10 students in Period 3
const P5_ALL = [...P5_STUDENTS, ...BOTH_STUDENTS]; // 10 students in Period 5

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
        profile: { enabled: true }
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
        profile: { enabled: true }
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
    { studentId: 'demo-student-017', ninjaDomainId: 'ninja-006' }
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
    { studentId: 'demo-student-018', ninjaDomainId: 'ninja-003-p5' }
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
  // SESSIONS — 12 per classroom (24 total), on matching MWF schedule
  // =========================================================================
  // Period 3 sessions: demo-session-p3-001 ... demo-session-p3-012 + active
  // Period 5 sessions: demo-session-p5-001 ... demo-session-p5-012 + active

  type SessionInfo = { id: string; daysAgo: number; num: number; classroomId: string };
  const sessions: SessionInfo[] = [];

  // Schedule: MWF over ~8 weeks = ~24 sessions per classroom
  // We pick 12 historical + 1 active = 13 each
  const sessionDays = [
    51, 49, 46, 44, 42, 39, 37, 35, 32, 28, 23, 21, 18, 16, 14, 11, 9, 7, 4, 2, 0
  ];
  // Use first 12 as historical, last one (0) as active for each classroom

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

  // Today's P3 session: 8 of 10 signed in
  const todayP3 = p3Sessions.find((s) => s.daysAgo === 0)!;
  for (const studentId of p3StudentIds.slice(0, 8)) {
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

  // Today's P5 session: 8 of 10 signed in
  const todayP5 = p5Sessions.find((s) => s.daysAgo === 0)!;
  for (const studentId of p5StudentIds.slice(0, 8)) {
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
  // PROJECTS — 6 school-scoped projects
  // =========================================================================

  // Project 1: "Robo-Falcon" — the flagship cross-classroom project
  // Worked on by morning students (Alex, Maya) and afternoon students (Ava, Tariq, Marcus)
  // Plus Nadia who attends both periods
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
  // Morning (P3) and afternoon (P5) students interleave handoffs

  // Week 2: Alex (P3 morning) starts
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

  // Same day afternoon: Ava (P5) reads Alex's handoff, picks up
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

  // Week 3: Maya (P3) works on code
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

  // Week 3: Marcus (P5) builds chassis
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

  // Week 4: Alex (P3) assembles
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

  // Week 5: Tariq (P5) wires it up
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

  // Week 5: Maya (P3) gets mirrored movement working
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

  // Week 6: Nadia (both) joins and works in P5
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

  // Week 6: Ava (P5) redesigns chassis
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

  // Week 7: Marcus (P5) assembles wings on new chassis
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

  // Week 7: Nadia (both) works in P3 morning
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

  // Week 8: Maya (P3) adds LED eyes and fixes right wing in code
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

  // Week 8: Alex (P3) paints
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

  // Project 2: "Weather Station" — mix of P3 and P5 students
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

  // Weather Station handoffs — Zoe (P3), Bella (P5), Ryan (both)
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

  // Project 3: "Mega Marble Run" — mostly P5 students
  const proj3 = 'demo-proj-003';
  store.projects.set(proj3, {
    id: proj3,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Mega Marble Run',
    description:
      'Giant marble run that spans two tables, with jumps, spirals, and a chain lift to bring marbles back to the top.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-005',
    createdAt: day(28)
  });

  for (const pid of ['demo-student-005', 'demo-student-009', 'demo-student-016']) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj3,
      personId: pid,
      isActive: true,
      joinedAt: day(28),
      leftAt: null
    });
  }

  seedHandoff(store, {
    projectId: proj3,
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
    projectId: proj3,
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
    projectId: proj3,
    authorId: 'demo-student-016',
    sessionId: 'demo-session-p5-014',
    daysAgo: 16,
    hour: 14,
    whatIDid:
      'Made side walls for all the curves using cardstock. No more fly-offs! Also drew a diagram of the full planned marble run path and taped it to the wall next to the build.',
    whatsNext:
      'Build the spiral section in the middle. Kai has an idea for using a paper towel tube.'
  });
  seedHandoff(store, {
    projectId: proj3,
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
    projectId: proj3,
    authorId: 'demo-student-009',
    sessionId: 'demo-session-p5-019',
    daysAgo: 4,
    hour: 14,
    whatIDid:
      'Rebuilt the spiral at a steeper angle — marble flows through smoothly now. Added the jump section after the spiral. The marble clears the gap about 70% of the time.',
    whatsNext:
      'Fine-tune the jump landing ramp angle. Start thinking about the chain lift mechanism.'
  });

  // Project 4: "LED Matrix Art" — P3 + P5 members
  const proj4 = 'demo-proj-004';
  store.projects.set(proj4, {
    id: proj4,
    schoolId: DEMO_SCHOOL_ID,
    name: 'LED Matrix Art',
    description:
      'An 8x8 LED matrix that displays animated pixel art patterns, controlled by a micro:bit.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-002',
    createdAt: day(14)
  });

  for (const pid of ['demo-student-002', 'demo-student-014']) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj4,
      personId: pid,
      isActive: true,
      joinedAt: day(14),
      leftAt: null
    });
  }

  seedHandoff(store, {
    projectId: proj4,
    authorId: 'demo-student-002',
    sessionId: 'demo-session-p3-015',
    daysAgo: 14,
    hour: 10,
    whatIDid:
      'Soldered the 8x8 LED matrix to the breakout board. Tested all 64 LEDs — 2 in the corner were dim, resoldered them and now they work.',
    whatsNext: 'Connect to the micro:bit and write code to light individual pixels.'
  });
  seedHandoff(store, {
    projectId: proj4,
    authorId: 'demo-student-014',
    sessionId: 'demo-session-p5-017',
    daysAgo: 9,
    hour: 14,
    whatIDid:
      'Drew pixel art patterns on graph paper — a heart, a star, a smiley face, and a simple animation of a bouncing ball (4 frames).',
    whatsNext: 'Convert the graph paper patterns to arrays in the code.',
    questions: 'Can we make the colors change? Or is this a single-color matrix?'
  });
  seedHandoff(store, {
    projectId: proj4,
    authorId: 'demo-student-002',
    sessionId: 'demo-session-p3-019',
    daysAgo: 4,
    hour: 10,
    whatIDid:
      'Wrote micro:bit code to display static patterns. The heart and star look great! The matrix is single color (red) but we can control brightness per pixel.',
    whatsNext:
      'Code the animation — cycle through the bouncing ball frames with a delay. Chloe has the frame designs.'
  });

  // Project 5: "Wearable LED Vest" — solo P3 project, stale
  const proj5 = 'demo-proj-005';
  store.projects.set(proj5, {
    id: proj5,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Wearable LED Vest',
    description: 'A safety vest with sewable LEDs that light up in patterns.',
    isArchived: false,
    visibility: 'members_only',
    createdById: 'demo-student-006',
    createdAt: day(21)
  });

  const pmId5 = uid('pm');
  store.projectMemberships.set(pmId5, {
    id: pmId5,
    projectId: proj5,
    personId: 'demo-student-006',
    isActive: true,
    joinedAt: day(21),
    leftAt: null
  });

  seedHandoff(store, {
    projectId: proj5,
    authorId: 'demo-student-006',
    sessionId: 'demo-session-p3-012',
    daysAgo: 21,
    hour: 10,
    whatIDid:
      'Planned the LED layout on the vest. Going with 12 sewable LEDs in a zigzag pattern across the back. Tested sewing conductive thread onto scrap fabric.',
    whatsNext: 'Start sewing the first row of LEDs onto the actual vest.'
  });
  seedHandoff(store, {
    projectId: proj5,
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

  // Project 6: "Desktop Catapult" — completed and archived
  const proj6 = 'demo-proj-006';
  store.projects.set(proj6, {
    id: proj6,
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
      projectId: proj6,
      personId: pid,
      isActive: true,
      joinedAt: day(51),
      leftAt: null
    });
  }

  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-007',
    sessionId: 'demo-session-p3-001',
    daysAgo: 51,
    hour: 10,
    whatIDid:
      'Built the base and arm from scrap wood pieces. Used wood glue and a rubber band for the launching force.',
    whatsNext: 'Need a hinge for the arm pivot. Also need to figure out the cup to hold the ball.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-003',
    sessionId: 'demo-session-p3-003',
    daysAgo: 46,
    hour: 10,
    whatIDid:
      'Made a hinge from a bolt and two brackets. Attached the arm to the base. It swings! Also glued a bottle cap on the end as the ball cup.',
    whatsNext: 'Test launch and adjust the rubber band tension.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-011',
    sessionId: 'demo-session-p5-003',
    daysAgo: 46,
    hour: 14,
    whatIDid:
      'Test launched about 20 times. Best distance was 2 meters! We found that 2 rubber bands work better than 1. Added a trigger pin made from a pencil.',
    whatsNext: 'Decorate it and do a final demo. Maybe add a target to aim at.'
  });
  seedHandoff(store, {
    projectId: proj6,
    authorId: 'demo-student-007',
    sessionId: 'demo-session-p3-005',
    daysAgo: 42,
    hour: 10,
    whatIDid:
      'Painted the catapult and made a target out of stacked cups. Demo went great — hit the target from 1.5m! We are calling this project done.',
    whatsNext: null
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
    projectId: proj4,
    personId: 'demo-student-014',
    lastReadAt: day(5)
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
      entityId: proj4,
      classroomId: null,
      sessionId: 'demo-session-p3-015',
      actorId: 'demo-student-002',
      daysAgo: 14,
      hour: 9,
      min: 20,
      payload: {
        projectId: proj4,
        schoolId: DEMO_SCHOOL_ID,
        name: 'LED Matrix Art',
        description: 'An 8x8 LED matrix that displays animated pixel art patterns.',
        visibility: 'browseable',
        createdBy: 'demo-student-002',
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
      type: 'PROJECT_ARCHIVED',
      entity: 'Project',
      entityId: proj6,
      classroomId: null,
      sessionId: 'demo-session-p3-005',
      actorId: TEACHER.id,
      daysAgo: 42,
      hour: 10,
      min: 20,
      payload: {
        projectId: proj6,
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
