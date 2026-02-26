import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { listStudents } from '$lib/application/useCases/person/listStudents';
import { addStudent } from '$lib/application/useCases/person/addStudent';
import { updateStudent } from '$lib/application/useCases/person/updateStudent';
import { removeStudent } from '$lib/application/useCases/person/removeStudent';
import { bulkImportStudents } from '$lib/application/useCases/person/bulkImportStudents';
import { listStudentsWithPins } from '$lib/application/useCases/pin/listStudentsWithPins';
import { generatePin } from '$lib/application/useCases/pin/generatePin';
import { generateAllPins } from '$lib/application/useCases/pin/generateAllPins';
import { removePin } from '$lib/application/useCases/pin/removePin';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();
  const env = getEnvironment();

  const [studentsResult, pinsResult] = await Promise.all([
    listStudents({ personRepo: env.personRepo }, { classroomId: parentData.classroom.id }),
    listStudentsWithPins({ pinRepo: env.pinRepo }, { classroomId: parentData.classroom.id })
  ]);

  return {
    students:
      studentsResult.status === 'ok'
        ? studentsResult.value.map((s) => ({
            id: s.id,
            displayName: s.displayName,
            email: s.email,
            gradeLevel: s.gradeLevel
          }))
        : [],
    studentsWithPins:
      pinsResult.status === 'ok'
        ? pinsResult.value.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            hasPin: p.hasPin
          }))
        : []
  };
};

export const actions: Actions = {
  addStudent: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const gradeLevel = (formData.get('gradeLevel') as string)?.trim() || null;

    if (!name) return fail(400, { error: 'Name is required' });
    if (!email) return fail(400, { error: 'Email is required' });

    const env = getEnvironment();
    const result = await addStudent(
      { personRepo: env.personRepo, classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId, name, email, gradeLevel }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  updateStudent: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const gradeLevel = (formData.get('gradeLevel') as string)?.trim();

    if (!personId) return fail(400, { error: 'Missing personId' });

    const env = getEnvironment();
    const result = await updateStudent(
      { personRepo: env.personRepo },
      {
        classroomId: params.classroomId,
        personId,
        ...(name && { name }),
        ...(email && { email }),
        ...(gradeLevel !== undefined && { gradeLevel })
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  removeStudent: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const env = getEnvironment();
    const result = await removeStudent(
      { personRepo: env.personRepo },
      { classroomId: params.classroomId, personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  importCsv: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const csvData = formData.get('csvData') as string;

    if (!csvData) return fail(400, { error: 'No CSV data provided' });

    const lines = csvData.split('\n').filter((l) => l.trim());
    if (lines.length < 2)
      return fail(400, { error: 'CSV must have a header row and at least one data row' });

    const header = lines[0].toLowerCase();
    const nameCol = header
      .split(',')
      .findIndex((h) => ['name', 'student_name', 'student'].includes(h.trim()));
    const emailCol = header
      .split(',')
      .findIndex((h) => ['email', 'student_email', 'email_address'].includes(h.trim()));
    const gradeCol = header
      .split(',')
      .findIndex((h) => ['grade', 'grade_level', 'gradelevel'].includes(h.trim()));

    if (nameCol === -1 || emailCol === -1) {
      return fail(400, { error: 'CSV must have "name" and "email" columns' });
    }

    const students = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        name: cols[nameCol] ?? '',
        email: cols[emailCol] ?? '',
        gradeLevel: gradeCol >= 0 ? cols[gradeCol] || null : null
      };
    });

    const env = getEnvironment();
    const result = await bulkImportStudents(
      { personRepo: env.personRepo, classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId, students }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return {
      success: true,
      importResult: {
        success: result.value.success,
        errors: result.value.errors
      }
    };
  },

  generatePin: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const env = getEnvironment();
    const result = await generatePin(
      { pinRepo: env.pinRepo },
      { classroomId: params.classroomId, personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true, pin: result.value };
  },

  generateAllPins: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const result = await generateAllPins(
      { pinRepo: env.pinRepo },
      { classroomId: params.classroomId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true, generated: result.value.generated };
  },

  removePin: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const env = getEnvironment();
    const result = await removePin(
      { pinRepo: env.pinRepo },
      { classroomId: params.classroomId, personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
