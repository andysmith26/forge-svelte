import type { SmartboardDataProvider } from '$lib/domain/modules/smartboard';
import type { HelpRepository } from '$lib/application/ports/HelpRepository';
import type { NinjaRepository } from '$lib/application/ports/NinjaRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { PresenceRepository } from '$lib/application/ports/PresenceRepository';
import { getHelpQueuePublic } from '$lib/application/useCases/help/getHelpQueuePublic';
import { getNinjaPresence } from '$lib/application/useCases/ninja/getNinjaPresence';

export type HelpPanelData = {
  queue: {
    id: string;
    description: string;
    urgency: string;
    status: string;
    createdAt: string;
    requester: { id: string; displayName: string };
    category: { id: string; name: string } | null;
    claimedBy: { id: string; displayName: string } | null;
  }[];
  ninjaAssignments: { personId: string; domainName: string }[];
};

type HelpSmartboardDeps = {
  helpRepo: HelpRepository;
  ninjaRepo: NinjaRepository;
  sessionRepo: SessionRepository;
  presenceRepo: PresenceRepository;
};

export const helpSmartboardProvider: SmartboardDataProvider<HelpSmartboardDeps, HelpPanelData> = {
  moduleId: 'help',
  panelId: 'help',
  fetchData: async (deps, sessionId) => {
    const [queueResult, ninjaResult] = await Promise.all([
      getHelpQueuePublic({ helpRepo: deps.helpRepo }, { sessionId }),
      getNinjaPresence(
        {
          ninjaRepo: deps.ninjaRepo,
          sessionRepo: deps.sessionRepo,
          presenceRepo: deps.presenceRepo
        },
        { sessionId }
      )
    ]);

    const queue =
      queueResult.status === 'ok'
        ? queueResult.value.map((item) => ({
            id: item.id,
            description: item.description,
            urgency: item.urgency,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
            requester: item.requester,
            category: item.category,
            claimedBy: item.claimedBy
          }))
        : [];

    const ninjaAssignments =
      ninjaResult.status === 'ok'
        ? ninjaResult.value.map((a) => ({
            personId: a.personId,
            domainName: a.ninjaDomain.name
          }))
        : [];

    return { queue, ninjaAssignments };
  }
};
