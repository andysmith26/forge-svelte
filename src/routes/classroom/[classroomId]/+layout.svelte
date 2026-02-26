<script lang="ts">
  import type { LayoutData } from './$types';

  const { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');

  const navItems = $derived(
    [
      { label: 'Dashboard', href: `/classroom/${data.classroom.id}` },
      data.settings?.modules.presence.enabled
        ? { label: 'Presence', href: `/classroom/${data.classroom.id}/presence` }
        : null,
      data.settings?.modules.help.enabled
        ? { label: 'Help', href: `/classroom/${data.classroom.id}/help` }
        : null,
      isTeacher ? { label: 'Ninja', href: `/classroom/${data.classroom.id}/ninja` } : null,
      isTeacher ? { label: 'Roster', href: `/classroom/${data.classroom.id}/roster` } : null,
      isTeacher ? { label: 'Settings', href: `/classroom/${data.classroom.id}/settings` } : null
    ].filter(Boolean) as { label: string; href: string }[]
  );
</script>

<div class="mb-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{data.classroom.name}</h1>
      <p class="text-sm text-gray-500">Code: {data.classroom.displayCode}</p>
    </div>
    <div class="flex items-center gap-3">
      {#if isTeacher}
        <a
          href="/display/{data.classroom.displayCode}"
          class="text-sm text-forge-blue hover:underline"
          target="_blank"
        >
          Smartboard
        </a>
      {/if}
      <a href="/" class="text-sm text-gray-500 hover:text-gray-700">Back to classrooms</a>
    </div>
  </div>

  <nav class="mt-4 flex gap-1 border-b border-gray-200">
    {#each navItems as item (item.href)}
      <a
        href={item.href}
        class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors
          {false
          ? 'border-forge-blue text-forge-blue'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
      >
        {item.label}
      </a>
    {/each}
  </nav>
</div>

{@render children()}
