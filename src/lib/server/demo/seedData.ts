import bcrypt from 'bcryptjs';
import type { MemoryStore } from '$lib/infrastructure/repositories/memory';
import type { MemoryPinRepository } from '$lib/infrastructure/repositories/memory/MemoryPinRepository';

export const DEMO_SCHOOL_ID = 'demo-school-001';
export const DEMO_CLASSROOM_ID = 'demo-classroom-001';
export const DEMO_TEACHER_PERSON_ID = 'demo-teacher-001';
export const DEMO_CLASSROOM_CODE = 'DEMO01';

// ---------------------------------------------------------------------------
// Scenario: "Falcon Forge" — a 5th-grade maker-space class, 8 weeks into
// the semester. 16 students, 1 teacher. Mix of ongoing projects at various
// stages, a history of sessions with attendance, help requests across the
// spectrum, ninja domains with peer experts, and rich handoff timelines.
// The "current" session (Session 24) is active right now.
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

const STUDENTS = [
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
    name: 'Liam O\'Brien',
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
    name: 'Diego Flores',
    display: 'Diego',
    grade: '5',
    pin: '1010',
    pronouns: 'he/him',
    theme: '#84cc16',
    askMe: ['electronics', 'batteries'],
    workingOn: null
  },
  {
    id: 'demo-student-016',
    name: 'Ruby Chang',
    display: 'Ruby',
    grade: '4',
    pin: '2020',
    pronouns: 'she/her',
    theme: '#fb923c',
    askMe: ['drawing', 'documentation'],
    workingOn: 'Marble run documentation'
  }
];

// --- Seed function ---------------------------------------------------------

export function seedDemoData(store: MemoryStore, pinRepo: MemoryPinRepository): void {
  store.clear();
  pinRepo.clearPinHashes();

  const semesterStart = day(56); // ~8 weeks ago

  // =========================================================================
  // SCHOOL
  // =========================================================================
  // (MemoryStore doesn't store schools directly — only schoolId on records)

  // =========================================================================
  // TEACHER
  // =========================================================================
  store.persons.set(TEACHER.id, {
    id: TEACHER.id,
    schoolId: DEMO_SCHOOL_ID,
    email: TEACHER.email,
    legalName: TEACHER.name,
    displayName: TEACHER.name,
    pronouns: TEACHER.pronouns,
    gradeLevel: null,
    askMeAbout: [],
    themeColor: TEACHER.themeColor,
    currentlyWorkingOn: null,
    helpQueueVisible: true,
    smartboardVisible: true,
    isActive: true
  });
  store.personCreatedAt.set(TEACHER.id, semesterStart);

  // =========================================================================
  // CLASSROOM — "Falcon Forge" with all modules enabled
  // =========================================================================
  store.classrooms.set(DEMO_CLASSROOM_ID, {
    id: DEMO_CLASSROOM_ID,
    schoolId: DEMO_SCHOOL_ID,
    name: 'Falcon Forge',
    slug: 'falcon-forge',
    description: 'Ms. Ramirez\u2019s 4th/5th grade maker-space — building, coding, creating',
    displayCode: DEMO_CLASSROOM_CODE,
    settings: {
      modules: {
        presence: true,
        help: true,
        ninja: true,
        projects: true
      }
    },
    isActive: true
  });

  // Teacher membership
  store.memberships.set('demo-membership-teacher', {
    id: 'demo-membership-teacher',
    classroomId: DEMO_CLASSROOM_ID,
    personId: TEACHER.id,
    role: 'teacher',
    isActive: true,
    joinedAt: semesterStart,
    leftAt: null
  });

  // =========================================================================
  // STUDENTS — 16 students with profiles, PINs, and classroom memberships
  // =========================================================================
  for (const s of STUDENTS) {
    store.persons.set(s.id, {
      id: s.id,
      schoolId: DEMO_SCHOOL_ID,
      email: null,
      legalName: s.name,
      displayName: s.display,
      pronouns: s.pronouns,
      gradeLevel: s.grade,
      askMeAbout: s.askMe,
      themeColor: s.theme,
      currentlyWorkingOn: s.workingOn,
      helpQueueVisible: true,
      smartboardVisible: true,
      isActive: true
    });
    store.personCreatedAt.set(s.id, semesterStart);

    store.memberships.set(`demo-mem-${s.id}`, {
      id: `demo-mem-${s.id}`,
      classroomId: DEMO_CLASSROOM_ID,
      personId: s.id,
      role: 'student',
      isActive: true,
      joinedAt: semesterStart,
      leftAt: null
    });

    const pinHash = bcrypt.hashSync(s.pin, 10);
    pinRepo.setPinHash(s.id, pinHash);
    store.plaintextPins.set(s.id, s.pin);
  }

  // =========================================================================
  // NINJA DOMAINS & ASSIGNMENTS — peer expertise areas
  // =========================================================================
  const ninjaDomains = [
    { id: 'ninja-dom-001', name: '3D Printing', desc: 'Tinkercad, slicing, printer operation', order: 1 },
    { id: 'ninja-dom-002', name: 'Circuits', desc: 'Breadboards, components, basic electronics', order: 2 },
    { id: 'ninja-dom-003', name: 'Coding', desc: 'Scratch, Python, micro:bit', order: 3 },
    { id: 'ninja-dom-004', name: 'Woodworking', desc: 'Measuring, cutting, joining', order: 4 },
    { id: 'ninja-dom-005', name: 'Soldering', desc: 'Through-hole soldering, safety', order: 5 },
    { id: 'ninja-dom-006', name: 'Design', desc: 'Sketching, CAD, planning builds', order: 6 }
  ];

  for (const nd of ninjaDomains) {
    store.ninjaDomains.set(nd.id, {
      id: nd.id,
      classroomId: DEMO_CLASSROOM_ID,
      name: nd.name,
      description: nd.desc,
      displayOrder: nd.order,
      isActive: true
    });
  }

  // Ninja assignments — peer experts
  const ninjaAssignments: { person: string; domain: string }[] = [
    { person: 'demo-student-001', domain: 'ninja-dom-001' }, // Alex → 3D Printing
    { person: 'demo-student-002', domain: 'ninja-dom-002' }, // Jordan → Circuits
    { person: 'demo-student-002', domain: 'ninja-dom-005' }, // Jordan → Soldering
    { person: 'demo-student-004', domain: 'ninja-dom-003' }, // Maya → Coding
    { person: 'demo-student-007', domain: 'ninja-dom-004' }, // Liam → Woodworking
    { person: 'demo-student-008', domain: 'ninja-dom-002' }, // Zoe → Circuits
    { person: 'demo-student-010', domain: 'ninja-dom-006' }, // Ava → Design
    { person: 'demo-student-010', domain: 'ninja-dom-001' }, // Ava → 3D Printing
    { person: 'demo-student-012', domain: 'ninja-dom-003' }, // Bella → Coding
    { person: 'demo-student-013', domain: 'ninja-dom-004' }, // Marcus → Woodworking
    { person: 'demo-student-015', domain: 'ninja-dom-002' }  // Diego → Circuits
  ];

  for (const na of ninjaAssignments) {
    const id = uid('ninja-assign');
    store.ninjaAssignments.set(id, {
      id,
      personId: na.person,
      ninjaDomainId: na.domain,
      assignedById: TEACHER.id,
      isActive: true,
      assignedAt: day(42), // assigned a few weeks in
      revokedAt: null
    });
  }

  // =========================================================================
  // HELP CATEGORIES — linked to ninja domains
  // =========================================================================
  const helpCategories = [
    { id: 'help-cat-001', name: '3D Printing', domainId: 'ninja-dom-001', order: 1 },
    { id: 'help-cat-002', name: 'Circuits & Electronics', domainId: 'ninja-dom-002', order: 2 },
    { id: 'help-cat-003', name: 'Coding', domainId: 'ninja-dom-003', order: 3 },
    { id: 'help-cat-004', name: 'Woodworking', domainId: 'ninja-dom-004', order: 4 },
    { id: 'help-cat-005', name: 'Soldering', domainId: 'ninja-dom-005', order: 5 },
    { id: 'help-cat-006', name: 'Design & Planning', domainId: 'ninja-dom-006', order: 6 },
    { id: 'help-cat-007', name: 'General', domainId: null, order: 7 }
  ];

  for (const hc of helpCategories) {
    store.helpCategories.set(hc.id, {
      id: hc.id,
      classroomId: DEMO_CLASSROOM_ID,
      name: hc.name,
      description: null,
      ninjaDomainId: hc.domainId,
      displayOrder: hc.order,
      isActive: true
    });
  }

  // =========================================================================
  // SESSIONS — 24 sessions over 8 weeks (MWF schedule), session 24 is active
  // =========================================================================
  // The class meets Mon/Wed/Fri, 9:00–10:30 AM
  // We generate sessions going backwards from today

  const sessionDaysAgo = [
    // Week 8 (current week)
    0,    // Session 24 — today, active now
    2,    // Session 23 — 2 days ago
    4,    // Session 22 — 4 days ago
    // Week 7
    7,    // Session 21
    9,    // Session 20
    11,   // Session 19
    // Week 6
    14,   // Session 18
    16,   // Session 17
    18,   // Session 16
    // Week 5
    21,   // Session 15
    23,   // Session 14
    25,   // Session 13
    // Week 4
    28,   // Session 12
    30,   // Session 11
    32,   // Session 10
    // Week 3
    35,   // Session 9
    37,   // Session 8
    39,   // Session 7
    // Week 2
    42,   // Session 6
    44,   // Session 5
    46,   // Session 4
    // Week 1
    49,   // Session 3
    51,   // Session 2
    53    // Session 1
  ];

  const sessions: { id: string; daysAgo: number; num: number }[] = [];

  for (let i = 0; i < sessionDaysAgo.length; i++) {
    const sessionNum = sessionDaysAgo.length - i; // 24 down to 1
    const dAgo = sessionDaysAgo[i];
    const id = `demo-session-${String(sessionNum).padStart(3, '0')}`;
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
      actualStartAt: isToday ? day(0, 9, 2) : day(dAgo, 9, 0 + Math.floor(Math.random() * 5)),
      actualEndAt: isToday ? null : day(dAgo, 10, 28 + Math.floor(Math.random() * 4)),
      status: isToday ? 'active' : 'ended'
    });

    sessions.push({ id, daysAgo: dAgo, num: sessionNum });
  }

  // =========================================================================
  // SIGN-INS — attendance records across all sessions
  // =========================================================================
  // Today's active session: some students are signed in, some not yet
  // Historical sessions: most students attended, with realistic absences

  const allStudentIds = STUDENTS.map((s) => s.id);

  // Historical sessions (1–23): each student attends ~85% of sessions
  for (const sess of sessions) {
    if (sess.daysAgo === 0) continue; // handle today separately

    for (const studentId of allStudentIds) {
      // ~85% attendance, but deterministic based on IDs
      const hash = simpleHash(`${sess.id}-${studentId}`);
      if (hash % 100 < 15) continue; // absent

      const signInId = uid('signin');
      const signInMinute = 1 + (hash % 8); // arrive 1-8 min after start
      const signOutMinute = 85 + (hash % 5); // leave 85-89 min after start

      store.signIns.set(signInId, {
        id: signInId,
        sessionId: sess.id,
        personId: studentId,
        signedInAt: day(sess.daysAgo, 9, signInMinute),
        signedOutAt: day(sess.daysAgo, 10, signOutMinute - 60),
        signedInById: studentId,
        signedOutById: studentId,
        signoutType: 'self'
      });
    }
  }

  // Today's session (Session 24): 12 students signed in, 4 not yet
  const todaySession = sessions[0];
  const signedInToday = allStudentIds.slice(0, 12);
  for (const studentId of signedInToday) {
    const signInId = uid('signin');
    const minute = 1 + (simpleHash(studentId) % 7);
    store.signIns.set(signInId, {
      id: signInId,
      sessionId: todaySession.id,
      personId: studentId,
      signedInAt: day(0, 9, minute),
      signedOutAt: null, // still here
      signedInById: studentId,
      signedOutById: null,
      signoutType: null
    });
  }

  // =========================================================================
  // PROJECTS — 6 projects in various states
  // =========================================================================

  // Project 1: "Robo-Falcon" — the flagship, very active, 5 members
  const proj1 = 'demo-proj-001';
  store.projects.set(proj1, {
    id: proj1,
    classroomId: DEMO_CLASSROOM_ID,
    name: 'Robo-Falcon',
    description: 'A robotic falcon with movable wings and LED eyes. Competition entry for the district robotics fair.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-001',
    createdAt: day(46) // created in week 2
  });

  const proj1Members = [
    'demo-student-001', // Alex — creator
    'demo-student-004', // Maya
    'demo-student-010', // Ava
    'demo-student-013', // Marcus
    'demo-student-002'  // Jordan — joined later
  ];
  for (const pid of proj1Members) {
    const pmId = uid('pm');
    store.projectMemberships.set(pmId, {
      id: pmId,
      projectId: proj1,
      personId: pid,
      isActive: true,
      joinedAt: pid === 'demo-student-002' ? day(21) : day(46),
      leftAt: null
    });
  }

  // Robo-Falcon subsystems
  const sub1a = 'demo-sub-001';
  const sub1b = 'demo-sub-002';
  const sub1c = 'demo-sub-003';
  store.subsystems.set(sub1a, {
    id: sub1a, projectId: proj1, name: 'Chassis', displayOrder: 1, isActive: true
  });
  store.subsystems.set(sub1b, {
    id: sub1b, projectId: proj1, name: 'Wing mechanism', displayOrder: 2, isActive: true
  });
  store.subsystems.set(sub1c, {
    id: sub1c, projectId: proj1, name: 'Code & control', displayOrder: 3, isActive: true
  });

  // Robo-Falcon handoffs — rich history
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-001', sessionId: 'demo-session-004',
    daysAgo: 46,
    whatIDid: 'Sketched out the basic falcon shape and made a list of materials we need. Decided on cardboard for prototyping before we use wood.',
    whatsNext: 'Need to cut the body pieces from the big cardboard sheet.',
    subsystems: [sub1a]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-010', sessionId: 'demo-session-006',
    daysAgo: 42,
    whatIDid: 'Made a Tinkercad model of the chassis based on Alex\'s sketch. Exported measurements for cutting.',
    whatsNext: 'Print the wing joint brackets on the 3D printer.',
    subsystems: [sub1a]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-004', sessionId: 'demo-session-008',
    daysAgo: 37,
    whatIDid: 'Started the micro:bit code for wing movement. Got the servo to sweep 0–180 degrees with button A/B.',
    whatsNext: 'Figure out how to make both wings move at the same time but mirror each other.',
    subsystems: [sub1c]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-013', sessionId: 'demo-session-010',
    daysAgo: 32,
    whatIDid: 'Cut all the chassis pieces from MDF using the scroll saw. Sanded the edges. The falcon body is about 30cm long.',
    whatsNext: 'Need to drill holes for the wing pivot points. Ask Marcus about gear placement.',
    subsystems: [sub1a]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-001', sessionId: 'demo-session-012',
    daysAgo: 28,
    whatIDid: 'Printed wing brackets from Tinkercad. They fit! Drilled the pivot holes in the chassis and test-fit everything.',
    whatsNext: 'Attach the servos to the brackets. We need 2 micro servos from the parts bin.',
    blockers: 'Only found 1 micro servo — need to check if Ms. Ramirez can order another.',
    subsystems: [sub1a, sub1b]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-004', sessionId: 'demo-session-014',
    daysAgo: 23,
    whatIDid: 'Got mirrored wing movement working! Used a function that maps servo2 angle to (180 - servo1 angle). Also added a slow flap mode and a fast flap mode.',
    whatsNext: 'Need to test with actual servos once they are mounted.',
    subsystems: [sub1c]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-002', sessionId: 'demo-session-016',
    daysAgo: 18,
    whatIDid: 'Joined the project today! Soldered header pins onto the servo driver board and wired it to the micro:bit breakout. Tested with one servo — works great.',
    whatsNext: 'Wire up both servos once the second one arrives. Need to plan the wire routing inside the body.',
    subsystems: [sub1b, sub1c]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-010', sessionId: 'demo-session-018',
    daysAgo: 14,
    whatIDid: 'Redesigned the chassis in Tinkercad to add channels for wire routing and a battery compartment underneath. Printed a new bottom plate.',
    whatsNext: 'Transfer the wing mechanism to the new chassis. The screw holes should line up.',
    subsystems: [sub1a]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-013', sessionId: 'demo-session-020',
    daysAgo: 9,
    whatIDid: 'Assembled the wing mechanism with both servos on the new chassis. Left wing flaps smoothly. Right wing has a grinding noise at full extension.',
    whatsNext: 'Debug the right wing grinding — might need to sand the bracket or adjust the stop angle in code.',
    blockers: 'Right wing grinding noise — don\'t force it past the sticking point or the gear might strip.',
    subsystems: [sub1b]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-004', sessionId: 'demo-session-022',
    daysAgo: 4,
    whatIDid: 'Added LED eye code — they glow red when flapping and blue when idle. Fixed the right wing by limiting its range to 0–160 degrees instead of 180. No more grinding!',
    whatsNext: 'Start on the radio control so we can trigger flapping remotely for the demo.',
    questions: 'Should we add sound effects? We have a small speaker in the parts bin.',
    subsystems: [sub1b, sub1c]
  });
  seedHandoff(store, {
    projectId: proj1, authorId: 'demo-student-001', sessionId: 'demo-session-023',
    daysAgo: 2,
    whatIDid: 'Painted the chassis with acrylic paint — dark blue body, gold accents on the wings. Looks awesome. Used masking tape to get clean lines.',
    whatsNext: 'Let the paint cure overnight, then reassemble everything. Be careful not to scratch the paint when mounting the wings.',
    subsystems: [sub1a]
  });

  // Project 2: "Weather Station" — mid-progress, 3 members
  const proj2 = 'demo-proj-002';
  store.projects.set(proj2, {
    id: proj2,
    classroomId: DEMO_CLASSROOM_ID,
    name: 'Weather Station',
    description: 'Arduino-based weather station that measures temperature, humidity, and barometric pressure. Displays on a small LCD.',
    isArchived: false,
    visibility: 'browseable',
    createdById: 'demo-student-008',
    createdAt: day(35)
  });

  for (const pid of ['demo-student-008', 'demo-student-012', 'demo-student-015']) {
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
    id: sub2a, projectId: proj2, name: 'Sensors', displayOrder: 1, isActive: true
  });
  store.subsystems.set(sub2b, {
    id: sub2b, projectId: proj2, name: 'Display & code', displayOrder: 2, isActive: true
  });

  seedHandoff(store, {
    projectId: proj2, authorId: 'demo-student-008', sessionId: 'demo-session-009',
    daysAgo: 35,
    whatIDid: 'Got the DHT22 temperature/humidity sensor working on the Arduino breadboard. Readings look accurate compared to the classroom thermometer.',
    whatsNext: 'Add the BMP280 pressure sensor. It uses I2C so we need to figure out the wiring.',
    subsystems: [sub2a]
  });
  seedHandoff(store, {
    projectId: proj2, authorId: 'demo-student-012', sessionId: 'demo-session-012',
    daysAgo: 28,
    whatIDid: 'Wrote the Arduino sketch to read both sensors. Temperature and pressure print to serial monitor. Had to install the Adafruit BMP280 library.',
    whatsNext: 'Hook up the LCD display and show the readings there instead of serial.',
    subsystems: [sub2b]
  });
  seedHandoff(store, {
    projectId: proj2, authorId: 'demo-student-015', sessionId: 'demo-session-015',
    daysAgo: 21,
    whatIDid: 'Wired the 16x2 LCD using an I2C adapter so it only needs 4 wires. Got "Hello World" showing on it.',
    whatsNext: 'Bella needs to update the code to send readings to the LCD instead of serial.',
    subsystems: [sub2a, sub2b]
  });
  seedHandoff(store, {
    projectId: proj2, authorId: 'demo-student-012', sessionId: 'demo-session-018',
    daysAgo: 14,
    whatIDid: 'Updated code to show temp and humidity on LCD line 1, pressure on line 2. Readings refresh every 2 seconds. Found a bug where the LCD flickers — added a check to only update when values change.',
    whatsNext: 'Design and build the enclosure. Maybe 3D print a box with holes for the sensors.',
    subsystems: [sub2b]
  });
  seedHandoff(store, {
    projectId: proj2, authorId: 'demo-student-008', sessionId: 'demo-session-021',
    daysAgo: 7,
    whatIDid: 'Started designing the enclosure in Tinkercad. Box with ventilation slots for the sensors and a window for the LCD. Printed a test piece to check dimensions.',
    whatsNext: 'Print the full enclosure. The test piece was a little tight — need to add 2mm tolerance.',
    blockers: '3D printer had a clog. Alex cleared it but it might happen again.',
    subsystems: [sub2a]
  });

  // Project 3: "Marble Run" — active, student-created, 3 members
  const proj3 = 'demo-proj-003';
  store.projects.set(proj3, {
    id: proj3,
    classroomId: DEMO_CLASSROOM_ID,
    name: 'Mega Marble Run',
    description: 'Giant marble run that spans two tables, with jumps, spirals, and a chain lift to bring marbles back to the top.',
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
    projectId: proj3, authorId: 'demo-student-005', sessionId: 'demo-session-012',
    daysAgo: 28,
    whatIDid: 'Built the main support structure out of cardboard tubes and hot glue. It is about 1 meter tall. Started the first ramp from the top.',
    whatsNext: 'Build more ramps to connect the top to the bottom. We need smooth cardboard for the track.'
  });
  seedHandoff(store, {
    projectId: proj3, authorId: 'demo-student-009', sessionId: 'demo-session-015',
    daysAgo: 21,
    whatIDid: 'Added three ramp sections and a funnel at the top. The marble makes it about halfway down before falling off the track at the curve.',
    whatsNext: 'Fix the curve — needs side walls so the marble does not fly off. Try bending cardstock.',
    questions: 'Should we add a loop-de-loop section? Worried the marble wont have enough speed.'
  });
  seedHandoff(store, {
    projectId: proj3, authorId: 'demo-student-016', sessionId: 'demo-session-017',
    daysAgo: 16,
    whatIDid: 'Made side walls for all the curves using cardstock. No more fly-offs! Also drew a diagram of the full planned marble run path and taped it to the wall next to the build.',
    whatsNext: 'Build the spiral section in the middle. Kai has an idea for using a paper towel tube.'
  });
  seedHandoff(store, {
    projectId: proj3, authorId: 'demo-student-005', sessionId: 'demo-session-020',
    daysAgo: 9,
    whatIDid: 'Built the spiral section from a cut paper towel tube — marble goes around 3 times! But the exit angle is wrong and the marble stalls.',
    whatsNext: 'Tilt the spiral more so gravity keeps the marble moving. Might need to rebuild it steeper.',
    blockers: 'Running low on hot glue sticks.'
  });
  seedHandoff(store, {
    projectId: proj3, authorId: 'demo-student-009', sessionId: 'demo-session-022',
    daysAgo: 4,
    whatIDid: 'Rebuilt the spiral at a steeper angle — marble flows through smoothly now. Added the jump section after the spiral. The marble clears the gap about 70% of the time.',
    whatsNext: 'Fine-tune the jump landing ramp angle. Start thinking about the chain lift mechanism.'
  });

  // Project 4: "LED Matrix Art" — newer project, 2 members
  const proj4 = 'demo-proj-004';
  store.projects.set(proj4, {
    id: proj4,
    classroomId: DEMO_CLASSROOM_ID,
    name: 'LED Matrix Art',
    description: 'An 8x8 LED matrix that displays animated pixel art patterns, controlled by a micro:bit.',
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
    projectId: proj4, authorId: 'demo-student-002', sessionId: 'demo-session-018',
    daysAgo: 14,
    whatIDid: 'Soldered the 8x8 LED matrix to the breakout board. Tested all 64 LEDs — 2 in the corner were dim, resoldered them and now they work.',
    whatsNext: 'Connect to the micro:bit and write code to light individual pixels.'
  });
  seedHandoff(store, {
    projectId: proj4, authorId: 'demo-student-014', sessionId: 'demo-session-020',
    daysAgo: 9,
    whatIDid: 'Drew pixel art patterns on graph paper — a heart, a star, a smiley face, and a simple animation of a bouncing ball (4 frames).',
    whatsNext: 'Convert the graph paper patterns to arrays in the code.',
    questions: 'Can we make the colors change? Or is this a single-color matrix?'
  });
  seedHandoff(store, {
    projectId: proj4, authorId: 'demo-student-002', sessionId: 'demo-session-022',
    daysAgo: 4,
    whatIDid: 'Wrote micro:bit code to display static patterns. The heart and star look great! The matrix is single color (red) but we can control brightness per pixel.',
    whatsNext: 'Code the animation — cycle through the bouncing ball frames with a delay. Chloe has the frame designs.'
  });

  // Project 5: "Wearable LED Vest" — small solo-ish project, quiet
  const proj5 = 'demo-proj-005';
  store.projects.set(proj5, {
    id: proj5,
    classroomId: DEMO_CLASSROOM_ID,
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
    projectId: proj5, authorId: 'demo-student-006', sessionId: 'demo-session-015',
    daysAgo: 21,
    whatIDid: 'Planned the LED layout on the vest. Going with 12 sewable LEDs in a zigzag pattern across the back. Tested sewing conductive thread onto scrap fabric.',
    whatsNext: 'Start sewing the first row of LEDs onto the actual vest.'
  });
  seedHandoff(store, {
    projectId: proj5, authorId: 'demo-student-006', sessionId: 'demo-session-019',
    daysAgo: 11,
    whatIDid: 'Sewed 6 LEDs onto the vest back. The conductive thread is tricky — it keeps tangling. Two LEDs light up, four dont. Debugging the connections.',
    whatsNext: 'Check all the thread connections with a multimeter. Probably have a break somewhere.',
    blockers: 'Need the multimeter — Ms. Ramirez said there is one in the electronics cabinet.'
  });
  // Note: no handoffs for 11 days — this project will show as "stale"

  // Project 6: "Catapult" — completed and archived
  const proj6 = 'demo-proj-006';
  store.projects.set(proj6, {
    id: proj6,
    classroomId: DEMO_CLASSROOM_ID,
    name: 'Desktop Catapult',
    description: 'A small wooden catapult that launches ping pong balls. First project of the semester!',
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
    projectId: proj6, authorId: 'demo-student-007', sessionId: 'demo-session-002',
    daysAgo: 51,
    whatIDid: 'Built the base and arm from scrap wood pieces. Used wood glue and a rubber band for the launching force.',
    whatsNext: 'Need a hinge for the arm pivot. Also need to figure out the cup to hold the ball.'
  });
  seedHandoff(store, {
    projectId: proj6, authorId: 'demo-student-003', sessionId: 'demo-session-004',
    daysAgo: 46,
    whatIDid: 'Made a hinge from a bolt and two brackets. Attached the arm to the base. It swings! Also glued a bottle cap on the end as the ball cup.',
    whatsNext: 'Test launch and adjust the rubber band tension.'
  });
  seedHandoff(store, {
    projectId: proj6, authorId: 'demo-student-011', sessionId: 'demo-session-006',
    daysAgo: 42,
    whatIDid: 'Test launched about 20 times. Best distance was 2 meters! We found that 2 rubber bands work better than 1. Added a trigger pin made from a pencil.',
    whatsNext: 'Decorate it and do a final demo. Maybe add a target to aim at.'
  });
  seedHandoff(store, {
    projectId: proj6, authorId: 'demo-student-007', sessionId: 'demo-session-008',
    daysAgo: 37,
    whatIDid: 'Painted the catapult and made a target out of stacked cups. Demo went great — hit the target from 1.5m! We are calling this project done.',
    whatsNext: null
  });

  // =========================================================================
  // HANDOFF READ STATUSES — some students have unread handoffs
  // =========================================================================
  // Ava read Robo-Falcon 5 days ago (has unread handoffs from days 4 and 2)
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
  // HELP REQUESTS — across several sessions, various statuses
  // =========================================================================

  // --- Resolved requests (history) ---

  store.helpRequests.set('demo-help-001', {
    id: 'demo-help-001',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-008',
    requesterId: 'demo-student-004',
    categoryId: 'help-cat-003',
    description: 'My micro:bit code compiles but the servo does not move at all.',
    whatITried: 'Checked the wiring twice and tried a different pin. Also tried the servo test example from the website.',
    hypothesis: 'Maybe the pin is not configured for PWM output?',
    topic: 'Robo-Falcon',
    urgency: 'blocked',
    status: 'resolved',
    claimedById: 'demo-student-012',
    claimedAt: day(37, 9, 15),
    resolvedAt: day(37, 9, 28),
    cancelledAt: null,
    resolutionNotes: 'The pin was set to digital instead of analog. Changed to pin 0 which supports PWM.',
    cancellationReason: null,
    createdAt: day(37, 9, 12)
  });

  store.helpRequests.set('demo-help-002', {
    id: 'demo-help-002',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-010',
    requesterId: 'demo-student-005',
    categoryId: 'help-cat-007',
    description: 'Hot glue gun is not heating up. The light is on but no glue comes out.',
    whatITried: 'Unplugged and replugged it. Tried pushing glue stick in harder.',
    hypothesis: null,
    topic: 'Marble Run',
    urgency: 'blocked',
    status: 'resolved',
    claimedById: TEACHER.id,
    claimedAt: day(32, 9, 20),
    resolvedAt: day(32, 9, 25),
    cancelledAt: null,
    resolutionNotes: 'Glue gun needed a new nozzle. Swapped it out from the supply closet.',
    cancellationReason: null,
    createdAt: day(32, 9, 18)
  });

  store.helpRequests.set('demo-help-003', {
    id: 'demo-help-003',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-014',
    requesterId: 'demo-student-012',
    categoryId: 'help-cat-003',
    description: 'My Arduino LCD shows garbled characters instead of text.',
    whatITried: 'Checked the I2C address (0x27). Tried lcd.begin(16,2) and lcd.init(). Swapped LCD modules.',
    hypothesis: 'Maybe the contrast potentiometer on the I2C adapter needs adjusting?',
    topic: 'Weather Station',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-008',
    claimedAt: day(23, 9, 32),
    resolvedAt: day(23, 9, 45),
    cancelledAt: null,
    resolutionNotes: 'Contrast pot was turned all the way up. Adjusted it with a small screwdriver.',
    cancellationReason: null,
    createdAt: day(23, 9, 30)
  });

  store.helpRequests.set('demo-help-004', {
    id: 'demo-help-004',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-016',
    requesterId: 'demo-student-006',
    categoryId: 'help-cat-002',
    description: 'Conductive thread connections keep coming loose when I sew. Two of my LEDs stopped working.',
    whatITried: 'Made tighter stitches around the LED pads. Tried wrapping the thread multiple times.',
    hypothesis: null,
    topic: 'LED Vest',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-002',
    claimedAt: day(18, 9, 40),
    resolvedAt: day(18, 9, 55),
    cancelledAt: null,
    resolutionNotes: 'Jordan showed me how to make a proper knot stitch around each LED pad. Also need to seal the knots with clear nail polish.',
    cancellationReason: null,
    createdAt: day(18, 9, 38)
  });

  store.helpRequests.set('demo-help-005', {
    id: 'demo-help-005',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-018',
    requesterId: 'demo-student-009',
    categoryId: 'help-cat-006',
    description: 'Can someone help me figure out the angle for the marble run jump section? I have tried a few things but the marble keeps undershooting.',
    whatITried: 'Built a ramp at 30 degrees and 45 degrees. 30 was too flat, 45 the marble goes too high and not far enough.',
    hypothesis: 'Maybe 35-40 degrees? Or maybe I need a curved ramp instead of straight?',
    topic: 'Marble Run',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-010',
    claimedAt: day(14, 9, 25),
    resolvedAt: day(14, 9, 50),
    cancelledAt: null,
    resolutionNotes: 'Ava suggested a curved ramp like a ski jump. We cut a curve from cardboard and it works much better — the marble gets a smooth arc.',
    cancellationReason: null,
    createdAt: day(14, 9, 22)
  });

  store.helpRequests.set('demo-help-006', {
    id: 'demo-help-006',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-020',
    requesterId: 'demo-student-001',
    categoryId: 'help-cat-001',
    description: 'The 3D printer is making a weird clicking noise and the filament is not coming out.',
    whatITried: 'Tried pulling the filament out and reinserting. Checked the nozzle temperature — it says 200 which should be right for PLA.',
    hypothesis: 'I think the nozzle might be clogged.',
    topic: null,
    urgency: 'blocked',
    status: 'resolved',
    claimedById: TEACHER.id,
    claimedAt: day(9, 9, 15),
    resolvedAt: day(9, 9, 35),
    cancelledAt: null,
    resolutionNotes: 'Partial clog. Heated to 230 and pushed filament through manually. Printed a cleaning filament through it. Working now.',
    cancellationReason: null,
    createdAt: day(9, 9, 10)
  });

  store.helpRequests.set('demo-help-007', {
    id: 'demo-help-007',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-022',
    requesterId: 'demo-student-014',
    categoryId: 'help-cat-003',
    description: 'How do I make an array of arrays in MakeCode? I want to store the pixel patterns for the LED matrix animation.',
    whatITried: 'Tried making a list of lists but MakeCode blocks dont seem to support nested arrays.',
    hypothesis: null,
    topic: 'LED Matrix',
    urgency: 'question',
    status: 'resolved',
    claimedById: 'demo-student-004',
    claimedAt: day(4, 9, 42),
    resolvedAt: day(4, 10, 5),
    cancelledAt: null,
    resolutionNotes: 'Maya showed me how to switch to JavaScript mode in MakeCode where you can use regular arrays. Made a 2D array where each row is a pattern frame.',
    cancellationReason: null,
    createdAt: day(4, 9, 40)
  });

  // --- A cancelled request ---
  store.helpRequests.set('demo-help-008', {
    id: 'demo-help-008',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-021',
    requesterId: 'demo-student-015',
    categoryId: 'help-cat-002',
    description: 'Weather station LCD shows wrong temperature — reads 45°C but classroom is definitely not that hot.',
    whatITried: 'Checked the sensor wiring. The humidity reading looks correct though.',
    hypothesis: 'Maybe the sensor is too close to the Arduino and picking up heat from the board?',
    topic: 'Weather Station',
    urgency: 'question',
    status: 'cancelled',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: day(7, 9, 50),
    resolutionNotes: null,
    cancellationReason: 'Figured it out! The code was reading Fahrenheit and displaying it as Celsius. Changed the label and it makes sense now.',
    createdAt: day(7, 9, 42)
  });

  // --- Today's active/pending requests ---

  // A pending request (just posted, no one has claimed it yet)
  store.helpRequests.set('demo-help-009', {
    id: 'demo-help-009',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-024',
    requesterId: 'demo-student-005',
    categoryId: 'help-cat-006',
    description: 'Need help designing the chain lift mechanism for the marble run. How do we get marbles from the bottom back to the top automatically?',
    whatITried: 'Watched a YouTube video about marble machines. They use a rotating wheel with cups but we dont have a motor.',
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

  // A claimed request (someone is helping)
  store.helpRequests.set('demo-help-010', {
    id: 'demo-help-010',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-024',
    requesterId: 'demo-student-010',
    categoryId: 'help-cat-001',
    description: 'My Tinkercad model exports as STL but the slicer says it has non-manifold edges. The preview shows holes in the model.',
    whatITried: 'Tried exporting again. Checked the model in Tinkercad and it looks fine. Also tried a different slicer (PrusaSlicer instead of Cura).',
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

  // Another pending — check_work urgency
  store.helpRequests.set('demo-help-011', {
    id: 'demo-help-011',
    classroomId: DEMO_CLASSROOM_ID,
    sessionId: 'demo-session-024',
    requesterId: 'demo-student-012',
    categoryId: 'help-cat-003',
    description: 'Can someone look at my weather station code? I added data logging to save readings every 5 minutes but I am not sure the SD card write is working correctly.',
    whatITried: 'The serial output shows the data but I cant tell if the file on the SD card is being written. I tried reading the card on my computer but it shows 0 bytes.',
    hypothesis: 'Maybe I need to close the file after each write? Or maybe the SD card is not formatted correctly.',
    topic: 'Weather Station',
    urgency: 'check_work',
    status: 'pending',
    claimedById: null,
    claimedAt: null,
    resolvedAt: null,
    cancelledAt: null,
    resolutionNotes: null,
    cancellationReason: null,
    createdAt: day(0, 9, 45)
  });

  // =========================================================================
  // DOMAIN EVENTS — a sampling of events for the event log
  // =========================================================================
  // We add a representative subset rather than duplicating every action above

  const events = [
    {
      type: 'SESSION_STARTED', entity: 'Session', entityId: 'demo-session-024',
      sessionId: 'demo-session-024', actorId: TEACHER.id, daysAgo: 0, hour: 9, min: 2,
      payload: { sessionId: 'demo-session-024', classroomId: DEMO_CLASSROOM_ID, startedBy: TEACHER.id, byTeacher: true }
    },
    {
      type: 'PROJECT_CREATED', entity: 'Project', entityId: proj4,
      sessionId: 'demo-session-018', actorId: 'demo-student-002', daysAgo: 14, hour: 9, min: 20,
      payload: { projectId: proj4, classroomId: DEMO_CLASSROOM_ID, name: 'LED Matrix Art', description: 'An 8x8 LED matrix that displays animated pixel art patterns, controlled by a micro:bit.', visibility: 'browseable', createdBy: 'demo-student-002', byTeacher: false }
    },
    {
      type: 'HANDOFF_SUBMITTED', entity: 'Handoff', entityId: 'event-handoff-ref',
      sessionId: 'demo-session-023', actorId: 'demo-student-001', daysAgo: 2, hour: 10, min: 10,
      payload: { projectId: proj1, classroomId: DEMO_CLASSROOM_ID, sessionId: 'demo-session-023', authorId: 'demo-student-001', whatIDid: 'Painted the chassis', byTeacher: false, subsystemIds: [sub1a] }
    },
    {
      type: 'HELP_REQUESTED', entity: 'HelpRequest', entityId: 'demo-help-009',
      sessionId: 'demo-session-024', actorId: 'demo-student-005', daysAgo: 0, hour: 9, min: 22,
      payload: { requestId: 'demo-help-009', sessionId: 'demo-session-024', classroomId: DEMO_CLASSROOM_ID, requesterId: 'demo-student-005', urgency: 'question', categoryId: 'help-cat-006', description: 'Need help designing the chain lift mechanism', byTeacher: false }
    },
    {
      type: 'HELP_CLAIMED', entity: 'HelpRequest', entityId: 'demo-help-010',
      sessionId: 'demo-session-024', actorId: 'demo-student-001', daysAgo: 0, hour: 9, min: 35,
      payload: { requestId: 'demo-help-010', sessionId: 'demo-session-024', classroomId: DEMO_CLASSROOM_ID, requesterId: 'demo-student-010', claimedById: 'demo-student-001', byTeacher: false }
    },
    {
      type: 'PERSON_SIGNED_IN', entity: 'SignIn', entityId: 'event-signin-ref',
      sessionId: 'demo-session-024', actorId: 'demo-student-001', daysAgo: 0, hour: 9, min: 3,
      payload: { sessionId: 'demo-session-024', classroomId: DEMO_CLASSROOM_ID, personId: 'demo-student-001', signedInBy: 'demo-student-001', isSelfSignIn: true, byTeacher: false }
    },
    {
      type: 'PROJECT_MEMBER_ADDED', entity: 'ProjectMembership', entityId: 'event-pm-ref',
      sessionId: 'demo-session-016', actorId: 'demo-student-002', daysAgo: 18, hour: 9, min: 10,
      payload: { projectId: proj1, classroomId: DEMO_CLASSROOM_ID, personId: 'demo-student-002', addedBy: 'demo-student-002', byTeacher: false }
    },
    {
      type: 'PROJECT_ARCHIVED', entity: 'Project', entityId: proj6,
      sessionId: 'demo-session-009', actorId: TEACHER.id, daysAgo: 35, hour: 10, min: 20,
      payload: { projectId: proj6, classroomId: DEMO_CLASSROOM_ID, archivedBy: TEACHER.id, byTeacher: true }
    },
    {
      type: 'HELP_RESOLVED', entity: 'HelpRequest', entityId: 'demo-help-001',
      sessionId: 'demo-session-008', actorId: 'demo-student-012', daysAgo: 37, hour: 9, min: 28,
      payload: { requestId: 'demo-help-001', sessionId: 'demo-session-008', classroomId: DEMO_CLASSROOM_ID, requesterId: 'demo-student-004', resolverId: 'demo-student-012', resolutionNotes: 'Pin was set to digital instead of analog.', byTeacher: false }
    },
    {
      type: 'PROFILE_UPDATED', entity: 'Person', entityId: 'demo-student-001',
      sessionId: null, actorId: 'demo-student-001', daysAgo: 7, hour: 9, min: 15,
      payload: { personId: 'demo-student-001', schoolId: DEMO_SCHOOL_ID, changedFields: ['askMeAbout', 'themeColor'] }
    },
    {
      type: 'SESSION_ENDED', entity: 'Session', entityId: 'demo-session-023',
      sessionId: 'demo-session-023', actorId: TEACHER.id, daysAgo: 2, hour: 10, min: 30,
      payload: { sessionId: 'demo-session-023', classroomId: DEMO_CLASSROOM_ID, endedBy: TEACHER.id, byTeacher: true }
    }
  ];

  for (const e of events) {
    store.domainEvents.push({
      id: uid('evt'),
      schoolId: DEMO_SCHOOL_ID,
      classroomId: DEMO_CLASSROOM_ID,
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
    whatIDid: string;
    whatsNext?: string | null;
    blockers?: string | null;
    questions?: string | null;
    subsystems?: string[];
  }
): void {
  const id = uid('handoff');
  store.handoffs.set(id, {
    id,
    projectId: opts.projectId,
    authorId: opts.authorId,
    sessionId: opts.sessionId,
    whatIDid: opts.whatIDid,
    whatsNext: opts.whatsNext ?? null,
    blockers: opts.blockers ?? null,
    questions: opts.questions ?? null,
    createdAt: day(opts.daysAgo, 10, 10 + Math.floor(Math.random() * 15))
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
