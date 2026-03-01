<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { onMount, onDestroy, tick } from 'svelte';
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

  const timeString = $derived(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const hasActiveSession = $derived(data.session?.status === 'active');
  const presentCount = $derived(data.students.filter((s) => s.isPresent).length);

  let togglingIds = $state(new Set<string>());

  type ModalStudent = {
    id: string;
    displayName: string;
    themeColor: string | null;
    isPresent: boolean;
  };

  let pinModalStudent = $state<ModalStudent | null>(null);
  let pinInput = $state('');
  let pinError = $state('');
  let pinInputEl = $state<HTMLInputElement | null>(null);
  let pinSubmitting = $state(false);

  function openPinModal(student: ModalStudent) {
    pinModalStudent = student;
    pinInput = '';
    pinError = '';
    pinSubmitting = false;
    tick().then(() => pinInputEl?.focus());
  }

  function closePinModal() {
    pinModalStudent = null;
    pinInput = '';
    pinError = '';
    pinSubmitting = false;
  }

  function handleCardClick(student: (typeof data.students)[number], event: Event) {
    if (student.hasPin) {
      event.preventDefault();
      openPinModal({
        id: student.id,
        displayName: student.displayName,
        themeColor: student.themeColor,
        isPresent: student.isPresent
      });
    }
  }
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
              onclick={(e) => handleCardClick(student, e)}
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

{#if pinModalStudent}
  {@const modalStudent = pinModalStudent}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    onkeydown={(e) => {
      if (e.key === 'Escape') closePinModal();
    }}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="absolute inset-0" onclick={closePinModal}></div>
    <div class="relative w-full max-w-sm rounded-2xl bg-gray-800 p-8 shadow-2xl">
      <div class="flex flex-col items-center">
        <Avatar name={modalStudent.displayName} size="xl" themeColor={modalStudent.themeColor} />
        <h2 class="mt-4 text-xl font-bold text-white">{modalStudent.displayName}</h2>
        <p class="mt-1 text-sm text-gray-400">
          {modalStudent.isPresent ? 'Enter PIN to sign out' : 'Enter PIN to sign in'}
        </p>
      </div>

      <form
        method="POST"
        action="?/togglePresence"
        class="mt-6"
        use:enhance={() => {
          pinSubmitting = true;
          togglingIds.add(modalStudent.id);
          togglingIds = togglingIds;
          return async ({ result, update }) => {
            pinSubmitting = false;
            togglingIds.delete(modalStudent.id);
            togglingIds = togglingIds;
            if (result.type === 'failure') {
              const errorMsg = (result.data as { error?: string } | undefined)?.error;
              if (errorMsg === 'PIN_REQUIRED' || errorMsg === 'INVALID_PIN') {
                pinError = 'Incorrect PIN. Try again.';
                pinInput = '';
                tick().then(() => pinInputEl?.focus());
                return;
              }
            }
            closePinModal();
            await update();
          };
        }}
      >
        <input type="hidden" name="personId" value={modalStudent.id} />
        <input type="hidden" name="pin" value={pinInput} />

        <div>
          <input
            bind:this={pinInputEl}
            bind:value={pinInput}
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            placeholder="Enter PIN"
            class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-center
              text-2xl tracking-[0.5em] text-white placeholder:tracking-normal
              placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50
              focus:outline-none"
          />
          {#if pinError}
            <p class="mt-2 text-center text-sm text-red-400">{pinError}</p>
          {/if}
        </div>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            onclick={closePinModal}
            class="flex-1 rounded-lg bg-gray-700 px-4 py-3 text-sm font-medium text-gray-300
              transition-colors hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!pinInput || pinSubmitting}
            class="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white
              transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pinSubmitting ? 'Verifying...' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
