<script lang="ts">
  import DashboardPanelShell from './DashboardPanelShell.svelte';
  import { Avatar } from '$lib/components/ui';

  const {
    profile,
    classroomId
  }: {
    profile: {
      displayName: string;
      pronouns: string | null;
      askMeAbout: string[];
      themeColor: string | null;
      currentlyWorkingOn: string | null;
    };
    classroomId: string;
  } = $props();
</script>

<DashboardPanelShell title="Profile" href="/classroom/{classroomId}/profile" linkLabel="Edit">
  <div class="flex items-center gap-3">
    <Avatar name={profile.displayName || 'A'} themeColor={profile.themeColor} />
    <div>
      <p class="font-medium text-gray-900">{profile.displayName}</p>
      {#if profile.pronouns}
        <p class="text-sm text-gray-500">{profile.pronouns}</p>
      {/if}
    </div>
  </div>
  <div class="mt-2 space-y-1 text-sm text-gray-500">
    {#if profile.askMeAbout.length > 0}
      <p>Ask me about: {profile.askMeAbout.join(', ')}</p>
    {/if}
    {#if profile.currentlyWorkingOn}
      <p class="italic">Working on: {profile.currentlyWorkingOn}</p>
    {/if}
  </div>
</DashboardPanelShell>
