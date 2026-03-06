<script lang="ts">
  import type { Snippet } from 'svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  const {
    title,
    count,
    countVariant = 'blue',
    href,
    linkLabel = 'View all',
    children
  }: {
    title: string;
    count?: number;
    countVariant?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';
    href?: string;
    linkLabel?: string;
    children: Snippet;
  } = $props();
</script>

<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
  <div class="mb-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <h2 class="text-base font-semibold text-gray-900">{title}</h2>
      {#if count !== undefined && count > 0}
        <Badge variant={countVariant}>{count}</Badge>
      {/if}
    </div>
    {#if href}
      <a {href} class="text-sm text-forge-blue hover:underline">{linkLabel} &rarr;</a>
    {/if}
  </div>
  {@render children()}
</div>
