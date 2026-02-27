import type { SmartboardDataProvider } from '$lib/domain/modules/smartboard';
import type { PresenceRepository } from '$lib/application/ports/PresenceRepository';
import { listPresentPublic } from '$lib/application/useCases/presence/listPresentPublic';

export type PresencePanelData = {
  id: string;
  displayName: string;
  pronouns: string | null;
  askMeAbout: string[];
}[];

export const presenceSmartboardProvider: SmartboardDataProvider<
  { presenceRepo: PresenceRepository },
  PresencePanelData
> = {
  moduleId: 'presence',
  panelId: 'presence',
  fetchData: async (deps, sessionId) => {
    const result = await listPresentPublic({ presenceRepo: deps.presenceRepo }, { sessionId });
    if (result.status === 'ok') {
      return result.value.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        pronouns: p.pronouns,
        askMeAbout: p.askMeAbout
      }));
    }
    return [];
  }
};
