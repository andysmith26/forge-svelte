<script lang="ts">
  import type { PageData } from './$types';
  import SessionControl from '$lib/components/session/SessionControl.svelte';
  import { StatusDot, Avatar } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const profileEnabled = $derived(data.settings?.modules.profile?.enabled ?? false);
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <div class="space-y-6">
    {#if isTeacher}
      <SessionControl session={data.currentSession} {isTeacher} />
    {/if}

    {#if !isTeacher && data.currentSession?.status === 'active'}
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
        <div class="mt-3">
          <a
            href="/classroom/{data.classroom.id}/presence"
            class="text-sm text-forge-blue hover:underline"
          >
            Go to Presence
          </a>
        </div>
      </div>
    {/if}
  </div>

  <div class="space-y-6">
    {#if profileEnabled && data.profile}
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-3 flex items-center gap-3">
          <Avatar name={data.profile.displayName || 'A'} themeColor={data.profile.themeColor} />
          <h2 class="text-lg font-semibold text-gray-900">Your Profile</h2>
        </div>
        <div class="space-y-1 text-sm text-gray-700">
          <p class="font-medium">{data.profile.displayName}</p>
          {#if data.profile.pronouns}
            <p class="text-gray-500">{data.profile.pronouns}</p>
          {/if}
          {#if data.profile.askMeAbout.length > 0}
            <p class="text-gray-500">Ask me about: {data.profile.askMeAbout.join(', ')}</p>
          {/if}
          {#if data.profile.currentlyWorkingOn}
            <p class="text-gray-500 italic">Working on: {data.profile.currentlyWorkingOn}</p>
          {/if}
        </div>
        <div class="mt-3">
          <a
            href="/classroom/{data.classroom.id}/profile"
            class="text-sm text-forge-blue hover:underline"
          >
            Edit Profile
          </a>
        </div>
      </div>
    {/if}

    {#if isTeacher}
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
    {/if}
  </div>
</div>
