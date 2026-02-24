<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
</script>

<div class="flex min-h-[60vh] items-center justify-center">
  <div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
    <h1 class="mb-6 text-center text-2xl font-bold text-forge-blue">Sign in to Forge</h1>
    <button
      onclick={() => signIn('google')}
      class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      Sign in with Google
    </button>
  </div>
</div>
