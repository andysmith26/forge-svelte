<script lang="ts">
  import type { PageData } from './$types';
  import HelpQueue from '$lib/components/help/HelpQueue.svelte';
  import RequestHelpForm from '$lib/components/help/RequestHelpForm.svelte';
  import MyHelpStatus from '$lib/components/help/MyHelpStatus.svelte';
  import AvailableHelpers from '$lib/components/help/AvailableHelpers.svelte';
  import AskMeAboutEditor from '$lib/components/help/AskMeAboutEditor.svelte';
  import NinjaDomainManager from '$lib/components/help/NinjaDomainManager.svelte';
  import NinjaAssignmentManager from '$lib/components/help/NinjaAssignmentManager.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const hasSession = $derived(!!data.currentSession && data.currentSession.status === 'active');
  const hasOpenRequest = $derived(data.myRequests.length > 0);

  let showNinjaSettings = $state(false);
</script>

{#if !hasSession}
  <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
    <p class="text-gray-500">
      No active session. The help queue is only available during active sessions.
    </p>
  </div>
{:else}
  <div class="grid gap-6 lg:grid-cols-3">
    <div class="lg:col-span-2">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">
        Help Queue ({data.queue.length} request{data.queue.length !== 1 ? 's' : ''})
      </h2>
      <HelpQueue queue={data.queue} {isTeacher} actorId={data.actor.personId} />
    </div>

    <div class="space-y-6">
      <MyHelpStatus requests={data.myRequests} />

      <AvailableHelpers ninjas={data.ninjaHelpers} helpers={data.askMeAboutHelpers} />

      {#if !isTeacher}
        <AskMeAboutEditor topics={data.myAskMeAbout} />
      {/if}

      {#if !isTeacher}
        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Request Help</h2>
          <RequestHelpForm categories={data.categories} {hasOpenRequest} />
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if isTeacher}
  <div class="mt-8">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-6 py-4 text-left transition-colors hover:bg-purple-100"
      onclick={() => (showNinjaSettings = !showNinjaSettings)}
    >
      <h2 class="text-lg font-semibold text-purple-900">Ninja Settings</h2>
      <svg
        class="h-5 w-5 text-purple-600 transition-transform {showNinjaSettings ? 'rotate-180' : ''}"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    {#if showNinjaSettings}
      <div class="mt-4 space-y-8 rounded-lg border border-gray-200 bg-white p-6">
        <NinjaDomainManager domains={data.ninjaDomains ?? []} />
        <NinjaAssignmentManager
          domains={data.ninjaDomains ?? []}
          students={data.ninjaStudents ?? []}
          domainsWithNinjas={data.domainsWithNinjas ?? []}
        />
      </div>
    {/if}
  </div>
{/if}
