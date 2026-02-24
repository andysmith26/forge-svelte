<script lang="ts">
  import { page } from '$app/state';

  const errorMessage = $derived(page.url.searchParams.get('error') || 'An unknown error occurred');
</script>

<div class="flex min-h-[60vh] items-center justify-center">
  <div class="w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-8">
    <h1 class="mb-2 text-xl font-bold text-red-800">Authentication Error</h1>
    <p class="text-red-600">{errorMessage}</p>
    <a href="/auth/signin" class="mt-4 inline-block text-sm font-medium text-forge-blue underline">
      Try again
    </a>
  </div>
</div>
