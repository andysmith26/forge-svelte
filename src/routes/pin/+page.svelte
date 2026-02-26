<script lang="ts">
  import type { PageData } from './$types';
  import { StatusDot, Button, Avatar } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  const hasActiveSession = $derived(data.currentSession?.status === 'active');
</script>

<div class="mx-auto max-w-md space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
    <div class="flex items-center gap-3">
      <Avatar name={data.displayName} size="md" />
      <div>
        <p class="font-medium text-gray-900">{data.displayName}</p>
        <p class="text-sm text-gray-500">{data.classroomName}</p>
      </div>
    </div>
    <form method="POST" action="/api/pin/logout">
      <button type="submit" class="text-sm text-gray-500 hover:text-gray-700">Log out</button>
    </form>
  </div>

  <!-- Session Status -->
  {#if hasActiveSession}
    <div class="flex items-center gap-3 rounded-lg bg-status-active-light p-4">
      <StatusDot color="green" pulse />
      <p class="font-medium text-status-active">
        Session Active{data.currentSession?.name ? ` — ${data.currentSession.name}` : ''}
      </p>
    </div>
  {:else}
    <div class="flex items-center gap-3 rounded-lg bg-yellow-50 p-4">
      <StatusDot color="yellow" />
      <p class="text-sm text-gray-600">
        No active session. Wait for your teacher to start the session.
      </p>
    </div>
  {/if}

  <!-- Presence -->
  {#if hasActiveSession}
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Your Presence</h2>
      <div class="flex items-center gap-3">
        {#if data.signInStatus.isSignedIn}
          <StatusDot color="green" />
          <span class="text-sm font-medium text-green-700">You are signed in</span>
        {:else}
          <StatusDot color="gray" />
          <span class="text-sm text-gray-500">You are not signed in</span>
        {/if}
      </div>
      <div class="mt-4">
        {#if data.signInStatus.isSignedIn}
          <form method="POST" action="?/signOut">
            <Button type="submit" variant="danger" class="w-full">Sign Out</Button>
          </form>
        {:else}
          <form method="POST" action="?/signIn">
            <Button
              type="submit"
              class="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              Sign In
            </Button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <p class="text-center text-xs text-gray-400">
    Auto-logout after 30 min inactivity or 4 hours max.
  </p>
</div>
