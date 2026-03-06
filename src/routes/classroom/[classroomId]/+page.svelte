<script lang="ts">
  import type { PageData } from './$types';
  import SessionControl from '$lib/components/session/SessionControl.svelte';
  import PresencePanel from '$lib/components/dashboard/PresencePanel.svelte';
  import ProjectsPanel from '$lib/components/dashboard/ProjectsPanel.svelte';
  import UnresolvedPanel from '$lib/components/dashboard/UnresolvedPanel.svelte';
  import ChoresPanel from '$lib/components/dashboard/ChoresPanel.svelte';
  import HelpPanel from '$lib/components/dashboard/HelpPanel.svelte';
  import ProfilePanel from '$lib/components/dashboard/ProfilePanel.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const hasActiveSession = $derived(data.currentSession?.status === 'active');
  const classroomId = $derived(data.classroom.id);

  // Module enabled flags
  const presenceEnabled = $derived(data.settings?.modules.presence?.enabled ?? false);
  const profileEnabled = $derived(data.settings?.modules.profile?.enabled ?? false);
  const projectsEnabled = $derived(data.settings?.modules.projects?.enabled ?? false);
  const choresEnabled = $derived(data.settings?.modules.chores?.enabled ?? false);
  const helpEnabled = $derived(data.settings?.modules.help?.enabled ?? false);

  // Panel visibility preferences (localStorage)
  type PanelId = 'presence' | 'projects' | 'unresolved' | 'chores' | 'help' | 'profile';

  const defaultPrefs: Record<PanelId, boolean> = {
    presence: true,
    projects: true,
    unresolved: true,
    chores: true,
    help: true,
    profile: true
  };

  let panelPrefs = $state<Record<PanelId, boolean>>({ ...defaultPrefs });
  let showSettings = $state(false);
  let prefsLoaded = $state(false);

  const storageKey = $derived(`forge:dashboard:${classroomId}:panels`);

  $effect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        panelPrefs = { ...defaultPrefs, ...JSON.parse(stored) };
      }
    } catch {
      // localStorage unavailable
    }
    prefsLoaded = true;
  });

  function togglePanel(id: PanelId) {
    panelPrefs = { ...panelPrefs, [id]: !panelPrefs[id] };
    try {
      localStorage.setItem(storageKey, JSON.stringify(panelPrefs));
    } catch {
      // localStorage unavailable
    }
  }

  function resetPanels() {
    panelPrefs = { ...defaultPrefs };
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // localStorage unavailable
    }
  }

  // Panels that are both module-enabled and user-visible
  const enabledPanels = $derived(
    (['presence', 'projects', 'unresolved', 'chores', 'help', 'profile'] as PanelId[]).filter(
      (id) => {
        if (id === 'presence') return presenceEnabled;
        if (id === 'projects' || id === 'unresolved') return projectsEnabled;
        if (id === 'chores') return choresEnabled;
        if (id === 'help') return helpEnabled;
        if (id === 'profile') return profileEnabled && data.profile;
        return false;
      }
    )
  );

  const visiblePanelCount = $derived(enabledPanels.filter((id) => panelPrefs[id]).length);

  const panelLabels: Record<PanelId, string> = {
    presence: 'Presence',
    projects: 'Projects',
    unresolved: 'Unresolved Items',
    chores: 'Chores',
    help: 'Help Requests',
    profile: 'Profile'
  };
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
            href="/classroom/{classroomId}/roster"
            class="block text-sm text-forge-blue hover:underline"
          >
            Manage Students
          </a>
          <a
            href="/classroom/{classroomId}/settings"
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
  <div class="mx-auto max-w-2xl space-y-4">
    <!-- Header with settings toggle -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-900">My Dashboard</h1>
      {#if enabledPanels.length > 0}
        <div class="relative">
          <button
            onclick={() => (showSettings = !showSettings)}
            class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dashboard settings"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {#if showSettings}
            <div
              class="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
            >
              <p class="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                Show panels
              </p>
              {#each enabledPanels as id (id)}
                <label
                  class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={panelPrefs[id]}
                    onchange={() => togglePanel(id)}
                    class="h-4 w-4 rounded border-gray-300 text-forge-blue focus:ring-forge-blue"
                  />
                  <span class="text-sm text-gray-700">{panelLabels[id]}</span>
                </label>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Panels -->
    {#if prefsLoaded}
      {#if presenceEnabled && panelPrefs.presence}
        <PresencePanel
          isSignedIn={data.signInStatus.isSignedIn}
          hasSession={hasActiveSession}
          {classroomId}
        />
      {/if}

      {#if projectsEnabled && panelPrefs.projects}
        <ProjectsPanel
          projectsMissingHandoff={data.projectsMissingHandoff}
          hasSession={hasActiveSession}
          {classroomId}
        />
      {/if}

      {#if projectsEnabled && panelPrefs.unresolved && data.unresolvedItems}
        <UnresolvedPanel unresolvedItems={data.unresolvedItems} {classroomId} />
      {/if}

      {#if choresEnabled && panelPrefs.chores && data.chores}
        <ChoresPanel
          available={data.chores.available}
          myChores={data.chores.myChores}
          {classroomId}
        />
      {/if}

      {#if helpEnabled && panelPrefs.help}
        <HelpPanel
          openRequests={data.openHelpRequests ?? []}
          hasSession={hasActiveSession}
          {classroomId}
        />
      {/if}

      {#if profileEnabled && panelPrefs.profile && data.profile}
        <ProfilePanel profile={data.profile} {classroomId} />
      {/if}

      {#if visiblePanelCount === 0 && enabledPanels.length > 0}
        <div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p class="mb-3 text-gray-500">All panels are hidden.</p>
          <button onclick={resetPanels} class="text-sm text-forge-blue hover:underline">
            Show all panels
          </button>
        </div>
      {/if}

      {#if enabledPanels.length === 0}
        <div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p class="text-gray-500">No modules are enabled for this classroom yet.</p>
        </div>
      {/if}
    {/if}
  </div>
{/if}
