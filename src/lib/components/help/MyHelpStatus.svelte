<script lang="ts">
  import { Badge, Button } from '$lib/components/ui';

  const {
    requests
  }: {
    requests: {
      id: string;
      description: string;
      urgency: string;
      status: string;
      createdAt: string;
      category: { id: string; name: string } | null;
      claimedBy: { id: string; displayName: string } | null;
    }[];
  } = $props();

  const urgencyLabel: Record<string, string> = {
    blocked: 'Blocked',
    question: 'Question',
    check_work: 'Check work'
  };
</script>

{#if requests.length > 0}
  <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
    <h3 class="font-medium text-blue-800">Your Open Requests</h3>
    {#each requests as req (req.id)}
      <div class="mt-3 rounded-lg bg-white p-3">
        <div class="flex items-center gap-2">
          <Badge
            variant={req.urgency === 'blocked'
              ? 'red'
              : req.urgency === 'question'
                ? 'blue'
                : 'green'}
          >
            {urgencyLabel[req.urgency] ?? req.urgency}
          </Badge>
          {#if req.category}
            <span class="text-xs text-gray-500">{req.category.name}</span>
          {/if}
          <span class="text-xs text-gray-400">
            {req.status === 'claimed' ? 'Being helped' : 'Waiting'}
          </span>
        </div>
        <p class="mt-1 text-sm text-gray-700">{req.description}</p>
        {#if req.claimedBy}
          <p class="mt-1 text-xs text-blue-600">{req.claimedBy.displayName} is helping you</p>
        {/if}
        {#if req.status === 'pending'}
          <form method="POST" action="?/cancelRequest" class="mt-2">
            <input type="hidden" name="requestId" value={req.id} />
            <Button type="submit" variant="ghost" size="sm">Cancel</Button>
          </form>
        {/if}
      </div>
    {/each}
  </div>
{/if}
