<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import { Button, Alert } from '$lib/components/ui';

  let activeTab = $state<'pin' | 'google'>('pin');
  let classroomCode = $state('');
  let pin = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);

  async function handlePinLogin(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    loading = true;

    try {
      const response = await fetch('/api/pin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomCode: classroomCode.toUpperCase(), pin })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error ?? 'Invalid classroom code or PIN';
        loading = false;
        return;
      }

      window.location.href = '/pin';
    } catch {
      error = 'Failed to sign in. Please try again.';
      loading = false;
    }
  }
</script>

<div class="flex min-h-[60vh] items-center justify-center">
  <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
    <h1 class="mb-2 text-center text-2xl font-bold text-forge-blue">Forge</h1>
    <p class="mb-6 text-center text-sm text-gray-500">Sign in to your classroom</p>

    <!-- Tabs -->
    <div class="mb-6 flex border-b border-gray-200">
      <button
        type="button"
        class="flex-1 border-b-2 py-2 text-center text-sm font-medium transition-colors
          {activeTab === 'pin' ? 'border-forge-blue text-forge-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        onclick={() => (activeTab = 'pin')}
      >
        PIN Login
      </button>
      <button
        type="button"
        class="flex-1 border-b-2 py-2 text-center text-sm font-medium transition-colors
          {activeTab === 'google' ? 'border-forge-blue text-forge-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        onclick={() => (activeTab = 'google')}
      >
        Google Account
      </button>
    </div>

    {#if error}
      <Alert variant="error" class="mb-4">
        <p>{error}</p>
      </Alert>
    {/if}

    {#if activeTab === 'pin'}
      <form onsubmit={handlePinLogin} class="space-y-4">
        <div>
          <label for="classroomCode" class="block text-sm font-medium text-gray-700">Classroom Code</label>
          <input
            id="classroomCode"
            type="text"
            bind:value={classroomCode}
            maxlength={6}
            placeholder="e.g., DEMO01"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg uppercase tracking-widest focus:border-forge-blue focus:outline-none focus:ring-1 focus:ring-forge-blue"
            oninput={(e) => { classroomCode = (e.target as HTMLInputElement).value.replace(/[^A-Za-z0-9]/g, '').toUpperCase(); }}
          />
          <p class="mt-1 text-xs text-gray-500">Ask your teacher for the classroom code</p>
        </div>

        <div>
          <label for="pin" class="block text-sm font-medium text-gray-700">Your PIN</label>
          <input
            id="pin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            bind:value={pin}
            maxlength={6}
            placeholder="Enter your PIN"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-forge-blue focus:outline-none focus:ring-1 focus:ring-forge-blue"
            oninput={(e) => { pin = (e.target as HTMLInputElement).value.replace(/\D/g, ''); }}
          />
          <p class="mt-1 text-xs text-gray-500">4-6 digit PIN assigned by your teacher</p>
        </div>

        <Button
          type="submit"
          class="w-full"
          {loading}
          disabled={!classroomCode || !pin}
        >
          {loading ? 'Signing in...' : 'Sign in with PIN'}
        </Button>
      </form>
      <p class="mt-4 text-center text-xs text-gray-400">For shared tablets. Ask your teacher for your PIN.</p>
    {:else}
      <button
        onclick={() => signIn('google')}
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        Sign in with Google
      </button>
      <p class="mt-4 text-center text-xs text-gray-400">For your personal device. Uses your Google account.</p>
    {/if}
  </div>
</div>
