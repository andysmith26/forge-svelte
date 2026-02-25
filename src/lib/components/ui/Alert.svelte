<script lang="ts">
  import type { Snippet } from 'svelte';

  type AlertVariant = 'info' | 'success' | 'warning' | 'error';

  const {
    variant = 'info',
    title,
    dismissible = false,
    ondismiss,
    class: className = '',
    children
  }: {
    variant?: AlertVariant;
    title?: string;
    dismissible?: boolean;
    ondismiss?: () => void;
    class?: string;
    children: Snippet;
  } = $props();

  const variantClasses: Record<AlertVariant, string> = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    error: 'border-red-200 bg-red-50 text-red-700'
  };
</script>

<div class="rounded-md border p-4 {variantClasses[variant]} {className}" role="alert">
  <div class="flex items-start">
    <div class="flex-1">
      {#if title}
        <p class="font-medium">{title}</p>
      {/if}
      <div class={title ? 'mt-1 text-sm' : 'text-sm'}>
        {@render children()}
      </div>
    </div>
    {#if dismissible}
      <button
        type="button"
        class="ml-3 -mr-1 -mt-1 rounded p-1 opacity-70 hover:opacity-100"
        onclick={ondismiss}
        aria-label="Dismiss"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
</div>
