<script lang="ts">
  import DashboardPanelShell from './DashboardPanelShell.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  const {
    openRequests,
    hasSession,
    classroomId
  }: {
    openRequests: {
      id: string;
      description: string;
      status: string;
      urgency: string | null;
      categoryName: string | null;
    }[];
    hasSession: boolean;
    classroomId: string;
  } = $props();

  const urgencyVariants: Record<string, 'red' | 'yellow' | 'green' | 'gray'> = {
    blocked: 'red',
    question: 'yellow',
    check_work: 'green'
  };
</script>

<DashboardPanelShell
  title="Help Requests"
  count={openRequests.length}
  countVariant={openRequests.length > 0 ? 'yellow' : 'gray'}
  href="/classroom/{classroomId}/help"
>
  {#if !hasSession}
    <div class="flex items-center gap-3 rounded-md bg-gray-50 px-4 py-3">
      <span class="text-sm text-gray-500">No active session</span>
    </div>
  {:else if openRequests.length === 0}
    <div class="rounded-md bg-green-50 px-4 py-3">
      <span class="text-sm text-green-700">No open help requests.</span>
    </div>
  {:else}
    <ul class="space-y-2">
      {#each openRequests as req (req.id)}
        <li
          class="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-gray-900">{req.description}</p>
            <div class="mt-0.5 flex items-center gap-2">
              {#if req.urgency}
                <Badge variant={urgencyVariants[req.urgency] ?? 'gray'}>{req.urgency}</Badge>
              {/if}
              {#if req.categoryName}
                <span class="text-xs text-gray-400">{req.categoryName}</span>
              {/if}
            </div>
          </div>
          <Badge variant={req.status === 'claimed' ? 'blue' : 'gray'}>
            {req.status}
          </Badge>
        </li>
      {/each}
    </ul>
  {/if}
</DashboardPanelShell>
