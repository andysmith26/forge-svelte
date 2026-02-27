import type { ClassroomModule } from '$lib/domain/types/classroom-settings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SmartboardDataProvider<TDeps = any, TData = unknown> = {
  moduleId: ClassroomModule;
  panelId: string;
  fetchData: (deps: TDeps, sessionId: string) => Promise<TData>;
};
