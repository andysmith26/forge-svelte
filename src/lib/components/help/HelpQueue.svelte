<script lang="ts">
  import { Badge, Button } from '$lib/components/ui';

  type QueueItem = {
    id: string;
    description: string;
    whatITried: string;
    urgency: string;
    status: string;
    createdAt: string;
    claimedAt: string | null;
    requester: { id: string; displayName: string };
    category: { id: string; name: string } | null;
    claimedBy: { id: string; displayName: string } | null;
  };

  const {
    queue,
    isTeacher,
    actorId
  }: {
    queue: QueueItem[];
    isTeacher: boolean;
    actorId: string;
  } = $props();

  let expandedId = $state<string | null>(null);

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  function getWaitTime(createdAt: string): string {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return '<1m';
    return `${minutes}m`;
  }

  function getWaitColor(createdAt: string): string {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes >= 10) return 'text-red-600 font-bold';
    if (minutes >= 5) return 'text-yellow-600';
    return 'text-gray-500';
  }

  const urgencyVariant: Record<string, 'red' | 'blue' | 'green'> = {
    blocked: 'red',
    question: 'blue',
    check_work: 'green'
  };

  const urgencyLabel: Record<string, string> = {
    blocked: 'Blocked',
    question: 'Question',
    check_work: 'Check work'
  };
</script>

{#if queue.length === 0}
  <div class="flex flex-col items-center py-12 text-gray-500">
    <svg class="mb-2 h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p>No one needs help right now</p>
  </div>
{:else}
  <div class="space-y-3">
    {#each queue as item, i (item.id)}
      {@const isClaimed = item.status === 'claimed'}
      {@const isMyItem = item.requester.id === actorId}
      {@const isClaimedByMe = item.claimedBy?.id === actorId}
      <div
        class="rounded-lg border p-4 transition-colors
          {isClaimed ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}"
      >
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono text-gray-400">#{i + 1}</span>
          <span class="font-medium text-gray-900 truncate">{item.requester.displayName}</span>
          <Badge variant={urgencyVariant[item.urgency] ?? 'gray'}>
            {urgencyLabel[item.urgency] ?? item.urgency}
          </Badge>
          {#if item.category}
            <span class="text-xs text-gray-500">{item.category.name}</span>
          {/if}
          <span class="ml-auto font-mono text-xs {getWaitColor(item.createdAt)}">
            {getWaitTime(item.createdAt)}
          </span>

          <button
            type="button"
            class="text-gray-400 hover:text-gray-600"
            onclick={() => toggleExpand(item.id)}
            aria-label="Toggle details"
          >
            <svg
              class="h-5 w-5 transition-transform {expandedId === item.id ? 'rotate-180' : ''}"
              fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {#if isClaimed && item.claimedBy}
          <p class="mt-1 text-xs text-blue-600">{item.claimedBy.displayName} is helping</p>
        {/if}

        {#if expandedId === item.id}
          <div class="mt-3 space-y-2 border-t border-gray-200 pt-3">
            <div>
              <p class="text-xs font-medium text-gray-500">Description</p>
              <p class="whitespace-pre-wrap text-sm text-gray-700">{item.description}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500">What they tried</p>
              <p class="whitespace-pre-wrap text-sm text-gray-600">{item.whatITried}</p>
            </div>
          </div>
        {/if}

        {#if isTeacher || isClaimedByMe}
          <div class="mt-3 flex gap-2">
            {#if item.status === 'pending'}
              <form method="POST" action="?/claim">
                <input type="hidden" name="requestId" value={item.id} />
                <Button type="submit" size="sm">Claim</Button>
              </form>
            {/if}
            {#if isClaimed && isClaimedByMe}
              <form method="POST" action="?/unclaim">
                <input type="hidden" name="requestId" value={item.id} />
                <Button type="submit" variant="secondary" size="sm">Release</Button>
              </form>
            {/if}
            {#if isClaimed}
              <form method="POST" action="?/resolve">
                <input type="hidden" name="requestId" value={item.id} />
                <Button type="submit" size="sm" class="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                  Resolve
                </Button>
              </form>
            {/if}
          </div>
        {/if}

        {#if isMyItem && item.status === 'pending'}
          <div class="mt-3">
            <form method="POST" action="?/cancelRequest">
              <input type="hidden" name="requestId" value={item.id} />
              <Button type="submit" variant="ghost" size="sm">Cancel my request</Button>
            </form>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
