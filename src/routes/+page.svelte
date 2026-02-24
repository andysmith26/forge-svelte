<script lang="ts">
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();
</script>

<h1 class="text-2xl font-bold text-forge-blue">My Classrooms</h1>

{#if data.classrooms.length === 0}
  <p class="mt-4 text-gray-500">No classrooms found.</p>
{:else}
  <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.classrooms as classroom (classroom.id)}
      <a
        href="/classroom/{classroom.id}"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <h2 class="text-lg font-semibold text-gray-900">{classroom.name}</h2>
        <div class="mt-1 flex items-center gap-2">
          <span
            class="inline-block rounded bg-forge-blue-light px-2 py-0.5 text-xs font-medium text-forge-blue"
          >
            {classroom.role}
          </span>
          <span class="text-xs text-gray-400">{classroom.displayCode}</span>
        </div>
      </a>
    {/each}
  </div>
{/if}
