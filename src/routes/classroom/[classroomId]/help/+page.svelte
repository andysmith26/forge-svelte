<script lang="ts">
  import type { PageData } from './$types';
  import HelpQueue from '$lib/components/help/HelpQueue.svelte';
  import RequestHelpForm from '$lib/components/help/RequestHelpForm.svelte';
  import MyHelpStatus from '$lib/components/help/MyHelpStatus.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const hasSession = $derived(!!data.currentSession && data.currentSession.status === 'active');
  const hasOpenRequest = $derived(data.myRequests.length > 0);
</script>

{#if !hasSession}
  <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
    <p class="text-gray-500">No active session. The help queue is only available during active sessions.</p>
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

      {#if !isTeacher}
        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Request Help</h2>
          <RequestHelpForm categories={data.categories} {hasOpenRequest} />
        </div>
      {/if}
    </div>
  </div>
{/if}
