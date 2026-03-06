import type { SmartboardDataProvider } from '$lib/domain/modules/smartboard';
import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import {
  getProjectFreshness,
  type FreshnessLevel
} from '$lib/application/useCases/projects/getProjectFreshness';
import { listRecentHandoffs } from '$lib/application/useCases/projects/listRecentHandoffs';

export type ProjectsPanelData = {
  projects: {
    id: string;
    name: string;
    memberCount: number;
    freshness: FreshnessLevel;
    lastHandoffAt: string | null;
  }[];
  recentHandoffs: {
    id: string;
    projectName: string;
    authorName: string;
    whatIDid: string;
    createdAt: string;
  }[];
};

export const projectsSmartboardProvider: SmartboardDataProvider<
  { projectRepo: ProjectRepository; sessionRepo: SessionRepository; schoolId: string },
  ProjectsPanelData
> = {
  moduleId: 'projects',
  panelId: 'projects',
  fetchData: async (deps) => {
    const projects = await deps.projectRepo.listBySchool(deps.schoolId, false);
    const activeProjects = projects.filter((p) => p.memberCount > 0);

    const freshnessMap = new Map<string, FreshnessLevel>();
    if (activeProjects.length > 0) {
      const freshnessResult = await getProjectFreshness(
        { projectRepo: deps.projectRepo, sessionRepo: deps.sessionRepo },
        { schoolId: deps.schoolId, projectIds: activeProjects.map((p) => p.id) }
      );
      if (freshnessResult.status === 'ok') {
        for (const [id, f] of freshnessResult.value) {
          freshnessMap.set(id, f.level);
        }
      }
    }

    const handoffsResult = await listRecentHandoffs(
      { projectRepo: deps.projectRepo },
      { schoolId: deps.schoolId, limit: 5 }
    );

    const recentHandoffs =
      handoffsResult.status === 'ok'
        ? handoffsResult.value.map((h) => ({
            id: h.id,
            projectName: h.projectName,
            authorName: h.author.displayName,
            whatIDid: h.whatIDid,
            createdAt: h.createdAt.toISOString()
          }))
        : [];

    return {
      projects: activeProjects.map((p) => ({
        id: p.id,
        name: p.name,
        memberCount: p.memberCount,
        freshness: freshnessMap.get(p.id) ?? 'no_handoffs',
        lastHandoffAt: p.lastHandoffAt?.toISOString() ?? null
      })),
      recentHandoffs
    };
  }
};
