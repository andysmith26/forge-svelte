<script lang="ts">
  import DashboardPanelShell from './DashboardPanelShell.svelte';

  const {
    projectsMissingHandoff,
    hasSession,
    classroomId
  }: {
    projectsMissingHandoff: { id: string; name: string }[] | null;
    hasSession: boolean;
    classroomId: string;
  } = $props();
</script>

<DashboardPanelShell
  title="Projects"
  count={projectsMissingHandoff?.length ?? 0}
  countVariant={projectsMissingHandoff && projectsMissingHandoff.length > 0 ? 'yellow' : 'gray'}
  href="/classroom/{classroomId}/projects"
>
  {#if !hasSession}
    <div class="flex items-center gap-3 rounded-md bg-gray-50 px-4 py-3">
      <span class="text-sm text-gray-500">No active session</span>
    </div>
  {:else if projectsMissingHandoff && projectsMissingHandoff.length > 0}
    <p class="mb-2 text-sm text-gray-600">Projects that need a handoff this session:</p>
    <ul class="space-y-2">
      {#each projectsMissingHandoff as project (project.id)}
        <li>
          <a
            href="/classroom/{classroomId}/projects/{project.id}"
            class="flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm hover:bg-yellow-100"
          >
            <span class="font-medium text-gray-900">{project.name}</span>
            <span class="text-xs text-yellow-700">Needs handoff</span>
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="rounded-md bg-green-50 px-4 py-3">
      <span class="text-sm text-green-700">All caught up! No handoffs needed.</span>
    </div>
  {/if}
</DashboardPanelShell>
