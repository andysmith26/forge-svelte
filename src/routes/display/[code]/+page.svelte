<script lang="ts">
  import type { PageData } from './$types';
  import { Badge } from '$lib/components/ui';
  import { onMount, onDestroy } from 'svelte';

  const { data }: { data: PageData } = $props();

  let now = $state(new Date());
  let intervalId: ReturnType<typeof setInterval>;

  onMount(() => {
    intervalId = setInterval(() => {
      now = new Date();
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  const timeString = $derived(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const hasActiveSession = $derived(data.session?.status === 'active');

  const ninjaMap = $derived(
    new Map<string, string[]>(
      data.ninjaAssignments.reduce((acc, a) => {
        const existing = acc.get(a.personId) ?? [];
        existing.push(a.domainName);
        acc.set(a.personId, existing);
        return acc;
      }, new Map<string, string[]>())
    )
  );

  const ninjaCount = $derived(new Set(data.ninjaAssignments.map((a) => a.personId)).size);

  const urgencyLabel: Record<string, string> = {
    blocked: 'Blocked',
    question: 'Question',
    check_work: 'Check'
  };

  const urgencyColor: Record<string, string> = {
    blocked: 'bg-red-500',
    question: 'bg-yellow-500',
    check_work: 'bg-green-500'
  };

  function getWaitTime(createdAt: string): string {
    const minutes = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return '<1m';
    return `${minutes}m`;
  }

  function getWaitColor(createdAt: string): string {
    const minutes = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000);
    if (minutes >= 10) return 'text-red-400 font-bold';
    if (minutes >= 5) return 'text-yellow-400';
    return 'text-gray-400';
  }
</script>

<svelte:head>
  <title>{data.classroom.name} — Smartboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Header -->
  <header class="flex items-center justify-between bg-gray-800 px-8 py-4">
    <div>
      <h1 class="text-2xl font-bold">{data.classroom.name}</h1>
    </div>
    <div class="flex items-center gap-4">
      {#if hasActiveSession}
        <div class="flex items-center gap-2">
          <span class="relative inline-flex h-3 w-3">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
            ></span>
            <span class="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
          </span>
          <span class="text-sm text-green-400">Session Active</span>
        </div>
      {/if}
      <span class="font-mono text-xl">{timeString}</span>
    </div>
  </header>

  <main class="p-8">
    {#if !hasActiveSession}
      <div class="flex min-h-[60vh] items-center justify-center">
        <p class="text-2xl text-gray-500">No active session</p>
      </div>
    {:else if !data.settings.presenceEnabled && !data.settings.helpEnabled}
      <div class="flex min-h-[60vh] items-center justify-center">
        <p class="text-2xl text-gray-500">Welcome to {data.classroom.name}</p>
      </div>
    {:else}
      <div
        class="grid gap-8 {data.settings.presenceEnabled && data.settings.helpEnabled
          ? 'lg:grid-cols-2'
          : ''}"
      >
        {#if data.settings.presenceEnabled}
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold">Who's Here</h2>
              <div class="flex gap-4 text-sm text-gray-400">
                {#if ninjaCount > 0}
                  <span>{ninjaCount} ninja{ninjaCount !== 1 ? 's' : ''} on duty</span>
                {/if}
                <span>{data.present.length} present</span>
              </div>
            </div>

            {#if data.present.length === 0}
              <p class="text-gray-500">No one signed in yet</p>
            {:else}
              <div class="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
                {#each data.present as person (person.id)}
                  {@const isNinja = ninjaMap.has(person.id)}
                  {@const domains = ninjaMap.get(person.id) ?? []}
                  <div
                    class="flex flex-col items-center rounded-lg p-4
                      {isNinja ? 'bg-purple-900/50 ring-1 ring-purple-500' : 'bg-gray-800'}"
                  >
                    <div class="relative">
                      <div
                        class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-xl font-bold"
                      >
                        {person.displayName.charAt(0).toUpperCase()}
                      </div>
                      {#if isNinja}
                        <span
                          class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold"
                        >
                          N
                        </span>
                      {/if}
                    </div>
                    <p class="mt-2 text-center text-sm font-medium">{person.displayName}</p>
                    {#if person.pronouns}
                      <p class="text-xs text-gray-400">{person.pronouns}</p>
                    {/if}
                    {#if domains.length > 0}
                      <div class="mt-1 flex flex-wrap justify-center gap-1">
                        {#each domains as domain}
                          <span class="rounded-full bg-purple-600 px-2 py-0.5 text-xs"
                            >{domain}</span
                          >
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if data.settings.helpEnabled}
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold">Help Queue</h2>
              <span class="text-sm text-gray-400">{data.queue.length} waiting</span>
            </div>

            {#if data.queue.length === 0}
              <div class="flex flex-col items-center py-12 text-gray-500">
                <svg
                  class="mb-2 h-10 w-10 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>No one waiting for help</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each data.queue.slice(0, 10) as item, i (item.id)}
                  {@const isClaimed = item.status === 'claimed'}
                  <div
                    class="flex items-center gap-4 rounded-lg p-4 {isClaimed
                      ? 'border border-blue-500 bg-gray-800'
                      : 'bg-gray-800'}"
                  >
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-lg font-bold"
                    >
                      {i + 1}
                    </div>
                    <div class="flex-1">
                      <p class="text-lg font-semibold">{item.requester.displayName}</p>
                      <div class="flex items-center gap-2">
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-medium {urgencyColor[
                            item.urgency
                          ] ?? 'bg-gray-500'}"
                        >
                          {urgencyLabel[item.urgency] ?? item.urgency}
                        </span>
                        {#if item.category}
                          <span class="text-xs text-gray-400">{item.category.name}</span>
                        {/if}
                        {#if item.claimedBy}
                          <span class="text-xs text-blue-400"
                            >{item.claimedBy.displayName} is helping</span
                          >
                        {/if}
                      </div>
                    </div>
                    <span class="font-mono text-lg {getWaitColor(item.createdAt)}">
                      {getWaitTime(item.createdAt)}
                    </span>
                  </div>
                {/each}
                {#if data.queue.length > 10}
                  <p class="text-center text-gray-500">+{data.queue.length - 10} more requests</p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>
