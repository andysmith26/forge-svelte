<script lang="ts">
  import { StatusDot, Button } from '$lib/components/ui';

  const {
    session,
    isTeacher
  }: {
    session: {
      id: string;
      name: string | null;
      status: string;
      actualStartAt: string | null;
      actualEndAt: string | null;
    } | null;
    isTeacher: boolean;
  } = $props();

  let isActive = $derived(session?.status === 'active');
  let isScheduled = $derived(session?.status === 'scheduled');
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  <h2 class="mb-4 text-lg font-semibold text-gray-900">Session</h2>

  {#if session && isActive}
    <div class="flex items-center gap-3 rounded-lg bg-status-active-light p-4">
      <StatusDot color="green" pulse />
      <div>
        <p class="font-medium text-status-active">Session Active</p>
        {#if session.name}
          <p class="text-sm text-gray-600">{session.name}</p>
        {/if}
      </div>
    </div>

    {#if isTeacher}
      <form method="POST" action="?/endSession" class="mt-4">
        <input type="hidden" name="sessionId" value={session.id} />
        <Button type="submit" variant="danger" class="w-full">End Session</Button>
      </form>
    {/if}
  {:else if session && isScheduled}
    <div class="flex items-center gap-3 rounded-lg bg-status-scheduled-light p-4">
      <StatusDot color="blue" />
      <div>
        <p class="font-medium text-status-scheduled">Session Scheduled</p>
        {#if session.name}
          <p class="text-sm text-gray-600">{session.name}</p>
        {/if}
      </div>
    </div>

    {#if isTeacher}
      <div class="mt-4 flex gap-2">
        <form method="POST" action="?/cancelSession" class="flex-1">
          <input type="hidden" name="sessionId" value={session.id} />
          <Button type="submit" variant="secondary" class="w-full">Cancel</Button>
        </form>
      </div>
    {/if}
  {:else}
    <div class="flex items-center gap-3 rounded-lg bg-yellow-50 p-4">
      <StatusDot color="yellow" />
      <p class="text-sm text-gray-600">
        {isTeacher
          ? 'No active session'
          : 'No active session. Wait for your teacher to start the session.'}
      </p>
    </div>

    {#if isTeacher}
      <form method="POST" action="?/createAndStart" class="mt-4">
        <Button type="submit" class="w-full">Start Session</Button>
      </form>
    {/if}
  {/if}
</div>
