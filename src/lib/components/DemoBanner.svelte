<script lang="ts">
  let { isStudent = false }: { isStudent: boolean } = $props();
  let seeding = $state(false);
  let clearing = $state(false);

  async function seed() {
    seeding = true;
    await fetch('/api/demo/seed', { method: 'POST' });
    seeding = false;
    window.location.reload();
  }

  async function switchToTeacher() {
    await fetch('/api/pin/logout', { method: 'POST' });
    window.location.href = '/';
  }

  async function clear() {
    clearing = true;
    await fetch('/api/demo/clear', { method: 'POST' });
    clearing = false;
    window.location.reload();
  }
</script>

<div
  class="flex items-center justify-between border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-800"
>
  <span class="font-medium">Demo Mode</span>
  <div class="flex items-center gap-2">
    {#if isStudent}
      <button onclick={switchToTeacher} class="rounded px-2 py-1 text-xs hover:bg-amber-200">
        Switch to Teacher
      </button>
    {:else}
      <a href="/login" class="rounded px-2 py-1 text-xs hover:bg-amber-200">Switch to Student</a>
    {/if}
    <button
      onclick={seed}
      disabled={seeding}
      class="rounded bg-amber-200 px-2 py-1 text-xs font-medium hover:bg-amber-300 disabled:opacity-50"
    >
      {seeding ? 'Loading...' : 'Load Sample Data'}
    </button>
    <button
      onclick={clear}
      disabled={clearing}
      class="rounded bg-amber-200 px-2 py-1 text-xs font-medium hover:bg-amber-300 disabled:opacity-50"
    >
      {clearing ? 'Clearing...' : 'Clear All Data'}
    </button>
  </div>
</div>
