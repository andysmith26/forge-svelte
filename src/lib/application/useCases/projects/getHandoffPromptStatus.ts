import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type HandoffPromptProject = {
  id: string;
  name: string;
};

export type HandoffPromptStatus = {
  shouldPrompt: boolean;
  projectsMissingHandoff: HandoffPromptProject[];
};

export type GetHandoffPromptStatusError = { type: 'INTERNAL_ERROR'; message: string };

/**
 * Checks if a student has active projects without a handoff this session.
 * Used to show a gentle, dismissible prompt at sign-out.
 */
export async function getHandoffPromptStatus(
  deps: {
    projectRepo: ProjectRepository;
    sessionRepo: SessionRepository;
  },
  input: {
    schoolId: string;
    personId: string;
    sessionId: string;
  }
): Promise<Result<HandoffPromptStatus, GetHandoffPromptStatusError>> {
  try {
    const activeProjects = await deps.projectRepo.getActiveProjectsForPerson(
      input.schoolId,
      input.personId
    );

    if (activeProjects.length === 0) {
      return ok({ shouldPrompt: false, projectsMissingHandoff: [] });
    }

    const projectsMissingHandoff: HandoffPromptProject[] = [];

    for (const project of activeProjects) {
      const hasHandoff = await deps.projectRepo.hasHandoffInSession(
        project.id,
        input.personId,
        input.sessionId
      );
      if (!hasHandoff) {
        projectsMissingHandoff.push({ id: project.id, name: project.name });
      }
    }

    return ok({
      shouldPrompt: projectsMissingHandoff.length > 0,
      projectsMissingHandoff
    });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
