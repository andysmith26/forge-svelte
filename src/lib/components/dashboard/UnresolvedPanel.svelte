<script lang="ts">
  import DashboardPanelShell from './DashboardPanelShell.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  const {
    unresolvedItems,
    classroomId
  }: {
    unresolvedItems: {
      handoffId: string;
      projectId: string;
      projectName: string;
      itemType: 'blocker' | 'question';
      content: string;
      authorName: string;
      responseCount: number;
    }[];
    classroomId: string;
  } = $props();

  const blockerCount = $derived(unresolvedItems.filter((i) => i.itemType === 'blocker').length);
</script>

<DashboardPanelShell
  title="Unresolved Items"
  count={unresolvedItems.length}
  countVariant={blockerCount > 0 ? 'red' : 'yellow'}
  href="/classroom/{classroomId}/projects"
  linkLabel="Projects"
>
  {#if unresolvedItems.length === 0}
    <div class="rounded-md bg-green-50 px-4 py-3">
      <span class="text-sm text-green-700">No unresolved blockers or questions.</span>
    </div>
  {:else}
    <ul class="space-y-2">
      {#each unresolvedItems.slice(0, 5) as item (item.handoffId + item.itemType)}
        <li>
          <a
            href="/classroom/{classroomId}/projects/{item.projectId}"
            class="block rounded-md border px-3 py-2 hover:bg-gray-50 {item.itemType === 'blocker'
              ? 'border-red-200 bg-red-50'
              : 'border-yellow-200 bg-yellow-50'}"
          >
            <div class="flex items-center gap-2">
              <Badge variant={item.itemType === 'blocker' ? 'red' : 'yellow'}>
                {item.itemType}
              </Badge>
              <span class="text-xs text-gray-500">{item.projectName}</span>
            </div>
            <p class="mt-1 line-clamp-2 text-sm text-gray-700">{item.content}</p>
            <p class="mt-1 text-xs text-gray-400">
              by {item.authorName}
              {#if item.responseCount > 0}
                &middot; {item.responseCount} response{item.responseCount !== 1 ? 's' : ''}
              {/if}
            </p>
          </a>
        </li>
      {/each}
    </ul>
    {#if unresolvedItems.length > 5}
      <p class="mt-2 text-xs text-gray-500">
        +{unresolvedItems.length - 5} more &mdash;
        <a href="/classroom/{classroomId}/projects" class="text-forge-blue hover:underline"
          >see all</a
        >
      </p>
    {/if}
  {/if}
</DashboardPanelShell>
