<script lang="ts">
  import type { Snippet } from 'svelte';

  type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
  type ButtonSize = 'sm' | 'md' | 'lg';

  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    href,
    class: className = '',
    onclick,
    children
  }: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  } = $props();

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-forge-blue text-white hover:bg-forge-blue-dark focus:ring-forge-blue',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-forge-blue',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500'
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  let computedClass = $derived(
    `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()
  );
</script>

{#if href && !disabled}
  <a {href} class={computedClass}>
    {#if loading}
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
    {/if}
    {@render children()}
  </a>
{:else}
  <button {type} class={computedClass} disabled={disabled || loading} {onclick}>
    {#if loading}
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
    {/if}
    {@render children()}
  </button>
{/if}
