<script lang="ts">
  import DashboardPanelShell from './DashboardPanelShell.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  const {
    available,
    myChores,
    classroomId
  }: {
    available: {
      id: string;
      choreId: string;
      choreName: string;
      verificationType: string;
    }[];
    myChores: {
      id: string;
      choreId: string;
      choreName: string;
      status: string;
    }[];
    classroomId: string;
  } = $props();

  const totalCount = $derived(available.length + myChores.length);

  type BadgeVariant = 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';

  const statusColors: Record<string, BadgeVariant> = {
    claimed: 'yellow',
    completed: 'blue',
    redo_requested: 'red'
  };

  const verificationLabels: Record<string, string> = {
    self: 'Self-verified',
    peer: 'Peer-verified',
    teacher: 'Teacher-verified'
  };
</script>

<DashboardPanelShell
  title="Chores"
  count={totalCount}
  countVariant="blue"
  href="/classroom/{classroomId}/chores"
>
  {#if myChores.length > 0}
    <div class="mb-3">
      <h3 class="mb-1.5 text-xs font-medium tracking-wide text-gray-500 uppercase">My Chores</h3>
      <ul class="space-y-1.5">
        {#each myChores as chore (chore.id)}
          <li>
            <a
              href="/classroom/{classroomId}/chores/{chore.choreId}?instance={chore.id}"
              class="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <span class="font-medium text-gray-900">{chore.choreName}</span>
              <Badge variant={statusColors[chore.status] ?? 'gray'}>
                {chore.status.replace('_', ' ')}
              </Badge>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if available.length > 0}
    <div>
      <h3 class="mb-1.5 text-xs font-medium tracking-wide text-gray-500 uppercase">Available</h3>
      <ul class="space-y-1.5">
        {#each available.slice(0, 3) as chore (chore.id)}
          <li>
            <a
              href="/classroom/{classroomId}/chores"
              class="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <span class="text-gray-900">{chore.choreName}</span>
              <span class="text-xs text-gray-400"
                >{verificationLabels[chore.verificationType] ?? chore.verificationType}</span
              >
            </a>
          </li>
        {/each}
      </ul>
      {#if available.length > 3}
        <p class="mt-1.5 text-xs text-gray-500">
          +{available.length - 3} more &mdash;
          <a href="/classroom/{classroomId}/chores" class="text-forge-blue hover:underline"
            >see all</a
          >
        </p>
      {/if}
    </div>
  {/if}

  {#if totalCount === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-4 text-center">
      <p class="text-sm text-gray-500">No chores available right now.</p>
    </div>
  {/if}
</DashboardPanelShell>
