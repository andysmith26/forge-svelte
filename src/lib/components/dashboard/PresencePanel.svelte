<script lang="ts">
  import DashboardPanelShell from './DashboardPanelShell.svelte';
  import { StatusDot, Button } from '$lib/components/ui';

  const {
    isSignedIn,
    hasSession,
    classroomId
  }: {
    isSignedIn: boolean;
    hasSession: boolean;
    classroomId: string;
  } = $props();
</script>

<DashboardPanelShell title="Presence" href="/classroom/{classroomId}/presence">
  {#if hasSession}
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        {#if isSignedIn}
          <StatusDot color="green" />
          <span class="text-sm font-medium text-green-700">You are signed in</span>
        {:else}
          <StatusDot color="gray" />
          <span class="text-sm text-gray-500">You are not signed in</span>
        {/if}
      </div>
      {#if isSignedIn}
        <form method="POST" action="/classroom/{classroomId}?/signOut">
          <Button size="sm" variant="secondary" type="submit">Sign Out</Button>
        </form>
      {:else}
        <form method="POST" action="/classroom/{classroomId}?/signIn">
          <Button size="sm" type="submit">Sign In</Button>
        </form>
      {/if}
    </div>
  {:else}
    <div class="flex items-center gap-3 rounded-md bg-gray-50 px-4 py-3">
      <StatusDot color="gray" />
      <span class="text-sm text-gray-500"
        >No active session &mdash; your teacher will start one</span
      >
    </div>
  {/if}
</DashboardPanelShell>
