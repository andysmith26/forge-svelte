<script lang="ts">
  type SpinnerSize = 'sm' | 'md' | 'lg';

  const { size = 'md', class: className = '' }: { size?: SpinnerSize; class?: string } = $props();

  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
</script>

<span
  class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent {sizeClasses[
    size
  ]} {className}"
  role="status"
  aria-label="Loading"
>
  <span class="sr-only">Loading...</span>
</span>
