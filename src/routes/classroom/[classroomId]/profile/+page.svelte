<script lang="ts">
  import type { PageData } from './$types';
  import { Button, Alert } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  let editing = $state(false);
  let displayName = $state(data.profile.displayName);
  let pronouns = $state(data.profile.pronouns ?? '');
  let askMeAbout = $state(data.profile.askMeAbout.join(', '));
  let error = $state<string | null>(null);

  function startEdit() {
    displayName = data.profile.displayName;
    pronouns = data.profile.pronouns ?? '';
    askMeAbout = data.profile.askMeAbout.join(', ');
    editing = true;
    error = null;
  }

  function cancel() {
    editing = false;
    error = null;
  }
</script>

<div class="mx-auto max-w-2xl">
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">My Profile</h2>
      {#if !editing}
        <button type="button" class="text-sm text-forge-blue hover:underline" onclick={startEdit}>
          Edit
        </button>
      {/if}
    </div>

    {#if editing}
      {#if error}
        <Alert variant="error" class="mt-3">
          <p>{error}</p>
        </Alert>
      {/if}

      <form method="POST" action="?/updateProfile" class="mt-4 space-y-4">
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700"
            >Display Name</label
          >
          <input
            id="displayName"
            name="displayName"
            type="text"
            bind:value={displayName}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            required
          />
        </div>

        <div>
          <label for="pronouns" class="block text-sm font-medium text-gray-700">Pronouns</label>
          <input
            id="pronouns"
            name="pronouns"
            type="text"
            bind:value={pronouns}
            placeholder="e.g., they/them"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
          />
        </div>

        <div>
          <label for="askMeAbout" class="block text-sm font-medium text-gray-700"
            >Ask Me About</label
          >
          <input
            id="askMeAbout"
            name="askMeAbout"
            type="text"
            bind:value={askMeAbout}
            placeholder="e.g., JavaScript, 3D printing"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
          />
          <p class="mt-1 text-xs text-gray-500">Comma-separated topics</p>
        </div>

        <div class="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onclick={cancel}>Cancel</Button>
        </div>
      </form>
    {:else}
      <dl class="mt-4 space-y-3">
        <div>
          <dt class="text-sm text-gray-500">Display Name</dt>
          <dd class="text-sm font-medium text-gray-900">{data.profile.displayName}</dd>
        </div>
        {#if data.profile.pronouns}
          <div>
            <dt class="text-sm text-gray-500">Pronouns</dt>
            <dd class="text-sm text-gray-900">{data.profile.pronouns}</dd>
          </div>
        {/if}
        {#if data.profile.askMeAbout.length > 0}
          <div>
            <dt class="text-sm text-gray-500">Ask Me About</dt>
            <dd class="flex flex-wrap gap-1">
              {#each data.profile.askMeAbout as topic (topic)}
                <span
                  class="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                >
                  {topic}
                </span>
              {/each}
            </dd>
          </div>
        {/if}
      </dl>
    {/if}
  </div>
</div>
