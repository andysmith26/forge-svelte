<script lang="ts">
  import '../app.css';
  import { PUBLIC_DEMO_MODE } from '$env/static/public';
  import DemoBanner from '$lib/components/DemoBanner.svelte';
  import type { LayoutData } from './$types';

  const { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<div class="min-h-screen bg-gray-50">
  {#if PUBLIC_DEMO_MODE === 'true'}
    <DemoBanner isStudent={data.actor?.authType === 'pin'} />
  {/if}
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <a href="/" class="text-xl font-bold text-forge-blue">Forge</a>
      {#if data.actor}
        <span class="text-sm text-gray-500">Signed in</span>
      {/if}
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 py-6">
    {@render children()}
  </main>
</div>
