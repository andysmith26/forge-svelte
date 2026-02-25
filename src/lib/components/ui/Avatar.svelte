<script lang="ts">
  type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

  const {
    name,
    size = 'md',
    class: className = ''
  }: {
    name: string;
    size?: AvatarSize;
    class?: string;
  } = $props();

  const sizeClasses: Record<AvatarSize, string> = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-20 w-20 text-2xl'
  };

  let initial = $derived(name.charAt(0).toUpperCase());
</script>

<div
  class="inline-flex items-center justify-center rounded-full bg-forge-blue-light font-semibold text-forge-blue {sizeClasses[size]} {className}"
  aria-hidden="true"
>
  {initial}
</div>
