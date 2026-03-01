<script lang="ts">
  import type { PageData } from './$types';
  import SessionControl from '$lib/components/session/SessionControl.svelte';
  import { StatusDot, Avatar, Button } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const profileEnabled = $derived(data.settings?.modules.profile?.enabled ?? false);
  const presenceEnabled = $derived(data.settings?.modules.presence?.enabled ?? false);
  const hasActiveSession = $derived(data.currentSession?.status === 'active');
</script>

{#if isTeacher}
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="space-y-6">
      <SessionControl session={data.currentSession} {isTeacher} />
    </div>
    <div class="space-y-6">
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-3 text-lg font-semibold text-gray-900">Quick Links</h2>
        <div class="space-y-2">
          <a
            href="/classroom/{data.classroom.id}/roster"
            class="block text-sm text-forge-blue hover:underline"
          >
            Manage Students
          </a>
          <a
            href="/classroom/{data.classroom.id}/settings"
            class="block text-sm text-forge-blue hover:underline"
          >
            Classroom Settings
          </a>
          <a
            href="/display/{data.classroom.displayCode}"
            class="block text-sm text-forge-blue hover:underline"
            target="_blank"
          >
            Open Smartboard Display
          </a>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="mx-auto max-w-lg space-y-6">
    {#if presenceEnabled}
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-3 text-lg font-semibold text-gray-900">Your Presence</h2>

        {#if hasActiveSession}
          <div class="flex items-center gap-3">
            {#if data.signInStatus.isSignedIn}
              <StatusDot color="green" />
              <span class="text-sm font-medium text-green-700">You are signed in</span>
            {:else}
              <StatusDot color="gray" />
              <span class="text-sm text-gray-500">You are not signed in</span>
            {/if}
          </div>
        {:else}
          <div class="flex items-center gap-3 rounded-md bg-gray-50 px-4 py-3">
            <StatusDot color="gray" />
            <span class="text-sm text-gray-500"
              >No active session — your teacher will start one</span
            >
          </div>
        {/if}

        <div class="mt-4">
          <Button href="/classroom/{data.classroom.id}/presence" variant="secondary" size="sm">
            Go to Presence
          </Button>
        </div>
      </div>
    {/if}

    {#if profileEnabled && data.profile}
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-3 flex items-center gap-3">
          <Avatar name={data.profile.displayName || 'A'} themeColor={data.profile.themeColor} />
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {data.profile.displayName}
            </h2>
            {#if data.profile.pronouns}
              <p class="text-sm text-gray-500">{data.profile.pronouns}</p>
            {/if}
          </div>
        </div>
        <div class="space-y-1 text-sm text-gray-500">
          {#if data.profile.askMeAbout.length > 0}
            <p>Ask me about: {data.profile.askMeAbout.join(', ')}</p>
          {/if}
          {#if data.profile.currentlyWorkingOn}
            <p class="italic">Working on: {data.profile.currentlyWorkingOn}</p>
          {/if}
        </div>
        <div class="mt-4">
          <Button href="/classroom/{data.classroom.id}/profile" variant="secondary" size="sm">
            Edit Profile
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/if}
