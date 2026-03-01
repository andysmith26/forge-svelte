<script lang="ts">
  import type { LayoutData } from './$types';
  import { createClassroomSubscription } from '$lib/realtime';
  import { ConnectionStatus } from '$lib/components/ui';
  import { getModuleNavItems } from '$lib/domain/types/module-nav';
  import { DEFAULT_CLASSROOM_SETTINGS } from '$lib/domain/types/classroom-settings';

  const { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');

  let realtimeState = $state<import('$lib/realtime').RealtimeState>({
    connectionState: 'connecting',
    isConnected: false
  });

  $effect(() => {
    const sub = createClassroomSubscription(data.classroom.id, data.currentSession?.id ?? null);
    realtimeState = sub;
  });

  const moduleNavItems = $derived(
    getModuleNavItems(
      data.classroom.id,
      data.settings ?? DEFAULT_CLASSROOM_SETTINGS,
      data.membership.role
    )
  );

  const navItems = $derived([
    { label: 'Dashboard', href: `/classroom/${data.classroom.id}` },
    ...moduleNavItems,
    ...(isTeacher
      ? [
          { label: 'Ninja', href: `/classroom/${data.classroom.id}/ninja` },
          { label: 'Roster', href: `/classroom/${data.classroom.id}/roster` },
          { label: 'Settings', href: `/classroom/${data.classroom.id}/settings` }
        ]
      : [])
  ]);
</script>

<div class="mb-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{data.classroom.name}</h1>
      <p class="text-sm text-gray-500">Code: {data.classroom.displayCode}</p>
    </div>
    <div class="flex items-center gap-3">
      <ConnectionStatus state={realtimeState.connectionState} />
      {#if isTeacher}
        <a
          href="/display/{data.classroom.displayCode}"
          class="text-sm text-forge-blue hover:underline"
          target="_blank"
        >
          Smartboard
        </a>
      {/if}
      {#if !isTeacher}
        <a href="/guide.html" target="_blank" class="text-sm text-gray-500 hover:text-gray-700">
          Student Guide
        </a>
      {/if}
      {#if data.actor?.authType === 'pin'}
        <form method="POST" action="/api/pin/logout">
          <button type="submit" class="text-sm text-gray-500 hover:text-gray-700">Log out</button>
        </form>
      {:else}
        <a href="/" class="text-sm text-gray-500 hover:text-gray-700">Back to classrooms</a>
      {/if}
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
