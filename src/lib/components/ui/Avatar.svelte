<script lang="ts">
  type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

  const {
    name,
    size = 'md',
    themeColor = null,
    class: className = ''
  }: {
    name: string;
    size?: AvatarSize;
    themeColor?: string | null;
    class?: string;
  } = $props();

  const sizeClasses: Record<AvatarSize, string> = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-20 w-20 text-2xl'
  };

  let initial = $derived(name.charAt(0).toUpperCase());

  let contrastColor = $derived.by(() => {
    if (!themeColor) return null;
    const hex = themeColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  });

  let hasTheme = $derived(!!themeColor);
</script>

{#if hasTheme}
  <div
    class="inline-flex items-center justify-center rounded-full font-semibold {sizeClasses[
      size
    ]} {className}"
    style="background-color: {themeColor}; color: {contrastColor}"
    aria-hidden="true"
  >
    {initial}
  </div>
{:else}
  <div
    class="inline-flex items-center justify-center rounded-full bg-forge-blue-light font-semibold text-forge-blue {sizeClasses[
      size
    ]} {className}"
    aria-hidden="true"
  >
    {initial}
  </div>
{/if}
