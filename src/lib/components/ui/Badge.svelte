<script lang="ts">
  import type { Snippet } from 'svelte';

  type BadgeVariant = 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple';

  const {
    variant = 'gray',
    class: className = '',
    children
  }: {
    variant?: BadgeVariant;
    class?: string;
    children: Snippet;
  } = $props();

  const variantClasses: Record<BadgeVariant, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800'
  };
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {variantClasses[variant]} {className}">
  {@render children()}
</span>
