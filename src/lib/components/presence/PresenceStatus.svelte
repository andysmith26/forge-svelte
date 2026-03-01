<script lang="ts">
  import { StatusDot, Button } from '$lib/components/ui';

  const {
    isSignedIn,
    hasSession
  }: {
    isSignedIn: boolean;
    hasSession: boolean;
  } = $props();
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  <h2 class="mb-3 text-lg font-semibold text-gray-900">Your Presence</h2>

  {#if !hasSession}
    <p class="text-sm text-gray-500">No active session.</p>
  {:else}
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
        <form method="POST" action="?/signOut">
          <Button type="submit" variant="secondary" size="sm">Sign Out</Button>
        </form>
      {:else}
        <form method="POST" action="?/signIn">
          <Button type="submit" size="sm">Sign In</Button>
        </form>
      {/if}
    </div>
  {/if}
</div>
