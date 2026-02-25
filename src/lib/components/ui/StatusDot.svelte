<script lang="ts">
  const {
    color = 'gray',
    pulse = false,
    class: className = ''
  }: {
    color?: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
    pulse?: boolean;
    class?: string;
  } = $props();

  const colorClasses: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
    blue: 'bg-blue-500'
  };
</script>

<span class="relative inline-flex h-3 w-3 {className}">
  {#if pulse}
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 {colorClasses[color]}"></span>
  {/if}
  <span class="relative inline-flex h-3 w-3 rounded-full {colorClasses[color]}"></span>
</span>
