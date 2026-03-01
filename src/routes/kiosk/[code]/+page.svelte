<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { onMount, onDestroy } from 'svelte';
  import { createClassroomSubscription } from '$lib/realtime';
  import Avatar from '$lib/components/ui/Avatar.svelte';

  const { data }: { data: PageData } = $props();

  const realtime = createClassroomSubscription(
    data.classroom.displayCode,
    data.session?.id ?? null
  );

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

  const timeString = $derived(
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const hasActiveSession = $derived(data.session?.status === 'active');
  const presentCount = $derived(data.students.filter((s) => s.isPresent).length);

  let togglingIds = $state(new Set<string>());
</script>

<svelte:head>
  <title>{data.classroom.name} — Kiosk</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-900 text-white">
  <header class="flex items-center justify-between bg-gray-800 px-6 py-4">
    <div>
      <h1 class="text-2xl font-bold">{data.classroom.name}</h1>
      <p class="text-sm text-gray-400">Tap your name to sign in or out</p>
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
          <span class="text-sm text-green-400">
            {presentCount} / {data.students.length} here
          </span>
        </div>
      {/if}
      <span class="font-mono text-xl">{timeString}</span>
      {#if !realtime.isConnected}
        <span class="h-2 w-2 rounded-full bg-yellow-400" title="Reconnecting..."></span>
      {/if}
    </div>
  </header>

  <main class="flex-1 p-6">
    {#if !hasActiveSession}
      <div class="flex min-h-[60vh] items-center justify-center">
        <p class="text-2xl text-gray-500">No active session</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {#each data.students as student (student.id)}
          <form
            method="POST"
            action="?/togglePresence"
            use:enhance={() => {
              togglingIds.add(student.id);
              togglingIds = togglingIds;
              return async ({ update }) => {
                togglingIds.delete(student.id);
                togglingIds = togglingIds;
                await update();
              };
            }}
          >
            <input type="hidden" name="personId" value={student.id} />
            <button
              type="submit"
              disabled={togglingIds.has(student.id)}
              class="flex w-full flex-col items-center rounded-xl p-5 transition-all active:scale-95
                {student.isPresent
                ? 'bg-green-900/30 ring-2 ring-green-500'
                : 'bg-gray-800 ring-1 ring-gray-700 hover:ring-gray-500'}
                {togglingIds.has(student.id) ? 'opacity-50' : ''}"
            >
              <Avatar name={student.displayName} size="xl" themeColor={student.themeColor} />
              <p
                class="mt-3 text-lg font-semibold
                  {student.isPresent ? 'text-white' : 'text-gray-400'}"
              >
                {student.displayName}
              </p>
              {#if student.pronouns}
                <p class="text-sm text-gray-500">{student.pronouns}</p>
              {/if}
              {#if data.demoMode && data.demoPins[student.id]}
                <p class="mt-1 text-xs text-amber-600">PIN: {data.demoPins[student.id]}</p>
              {/if}
              {#if student.isPresent}
                <span class="mt-2 inline-flex items-center gap-1 text-sm text-green-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Here
                </span>
              {:else}
                <span class="mt-2 text-sm text-gray-600">Tap to sign in</span>
              {/if}
            </button>
          </form>
        {/each}
      </div>
    {/if}
  </main>

  <footer class="px-6 py-3 text-center text-xs text-gray-700">
    Kiosk Mode — {data.classroom.displayCode}
  </footer>
</div>
