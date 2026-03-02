<script lang="ts">
  import { Button } from '$lib/components/ui';

  type Domain = {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
  };

  const {
    domains
  }: {
    domains: Domain[];
  } = $props();

  let showAddDomain = $state(false);
  let editingDomainId = $state<string | null>(null);
  let editName = $state('');
  let editDescription = $state('');

  function startEdit(domain: { id: string; name: string; description: string | null }) {
    editingDomainId = domain.id;
    editName = domain.name;
    editDescription = domain.description ?? '';
  }

  function cancelEdit() {
    editingDomainId = null;
  }
</script>

<div>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-base font-semibold text-gray-900">
      Domains ({domains.length})
    </h3>
    <Button
      size="sm"
      class="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
      onclick={() => (showAddDomain = !showAddDomain)}
    >
      {showAddDomain ? 'Cancel' : 'Add Domain'}
    </Button>
  </div>

  {#if showAddDomain}
    <form method="POST" action="?/createDomain" class="mb-4 rounded-lg bg-purple-50 p-4">
      <div class="space-y-3">
        <div>
          <label for="newDomainName" class="block text-sm font-medium text-gray-700"
            >Domain Name</label
          >
          <input
            id="newDomainName"
            name="name"
            type="text"
            required
            placeholder="e.g., Electronics, 3D Printing, Coding"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label for="newDomainDesc" class="block text-sm font-medium text-gray-700"
            >Description</label
          >
          <input
            id="newDomainDesc"
            name="description"
            type="text"
            placeholder="Brief description of what this domain covers"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          class="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
        >
          Create Domain
        </Button>
      </div>
    </form>
  {/if}

  {#if domains.length === 0}
    <div class="rounded-lg border border-gray-200 bg-white p-6 text-center">
      <p class="text-gray-500">No ninja domains yet.</p>
      <p class="mt-1 text-sm text-gray-400">
        Create domains like 'Electronics', '3D Printing', or 'Coding' to organize your ninjas.
      </p>
    </div>
  {:else}
    <div class="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      {#each domains as domain (domain.id)}
        <div class="p-4">
          {#if editingDomainId === domain.id}
            <form method="POST" action="?/updateDomain" class="space-y-3 rounded bg-yellow-50 p-3">
              <input type="hidden" name="domainId" value={domain.id} />
              <input
                name="name"
                type="text"
                bind:value={editName}
                required
                class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="description"
                type="text"
                bind:value={editDescription}
                class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div class="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" variant="secondary" size="sm" onclick={cancelEdit}
                  >Cancel</Button
                >
              </div>
            </form>
          {:else}
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900">{domain.name}</h4>
                {#if domain.description}
                  <p class="text-sm text-gray-500">{domain.description}</p>
                {/if}
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-sm text-purple-600 hover:underline"
                  onclick={() => startEdit(domain)}>Edit</button
                >
                <form method="POST" action="?/archiveDomain" class="inline">
                  <input type="hidden" name="domainId" value={domain.id} />
                  <button type="submit" class="text-sm text-red-600 hover:underline">Archive</button
                  >
                </form>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
