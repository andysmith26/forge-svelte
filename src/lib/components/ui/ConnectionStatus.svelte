<script lang="ts">
  import type { ConnectionState } from '$lib/realtime';

  const { state }: { state: ConnectionState } = $props();

  const label: Record<ConnectionState, string> = {
    disconnected: 'Offline',
    connecting: 'Connecting...',
    connected: 'Live',
    reconnecting: 'Reconnecting...',
    error: 'Connection error'
  };

  const dotColor: Record<ConnectionState, string> = {
    disconnected: 'bg-gray-400',
    connecting: 'bg-yellow-400',
    connected: 'bg-green-500',
    reconnecting: 'bg-yellow-400',
    error: 'bg-red-500'
  };
</script>

{#if state !== 'connected'}
  <div class="flex items-center gap-1.5 text-xs text-gray-500">
    <span class="inline-block h-2 w-2 rounded-full {dotColor[state]}"></span>
    {label[state]}
  </div>
{/if}
