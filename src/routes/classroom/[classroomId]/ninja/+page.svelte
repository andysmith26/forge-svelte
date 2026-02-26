<script lang="ts">
  import type { PageData } from './$types';
  import { Button, Badge } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  let showAddDomain = $state(false);
  let editingDomainId = $state<string | null>(null);
  let editName = $state('');
  let editDescription = $state('');
  let selectedDomainId = $state('');
  let selectedPersonId = $state('');

  function startEdit(domain: { id: string; name: string; description: string | null }) {
    editingDomainId = domain.id;
    editName = domain.name;
    editDescription = domain.description ?? '';
  }

  function cancelEdit() {
    editingDomainId = null;
  }
</script>

<div class="space-y-8">
  <!-- Domain Management -->
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">
        Ninja Domains ({data.domains.length})
      </h2>
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

    {#if data.domains.length === 0}
      <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p class="text-gray-500">No ninja domains yet.</p>
        <p class="mt-1 text-sm text-gray-400">
          Create domains like 'Electronics', '3D Printing', or 'Coding' to organize your ninjas.
        </p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {#each data.domains as domain (domain.id)}
          <div class="p-4">
            {#if editingDomainId === domain.id}
              <form
                method="POST"
                action="?/updateDomain"
                class="space-y-3 rounded bg-yellow-50 p-3"
              >
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
                    <button type="submit" class="text-sm text-red-600 hover:underline"
                      >Archive</button
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

  <!-- Ninja Assignments -->
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-900">Ninja Assignments</h2>
    <p class="mb-4 text-sm text-gray-500">Assign ninja status to students for specific domains</p>

    {#if data.domains.length > 0}
      <form method="POST" action="?/assignNinja" class="mb-6 rounded-lg bg-gray-50 p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1">
            <label for="domainSelect" class="block text-sm font-medium text-gray-700">Domain</label>
            <select
              id="domainSelect"
              name="domainId"
              bind:value={selectedDomainId}
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select domain...</option>
              {#each data.domains as d (d.id)}
                <option value={d.id}>{d.name}</option>
              {/each}
            </select>
          </div>
          <div class="flex-1">
            <label for="studentSelect" class="block text-sm font-medium text-gray-700"
              >Student</label
            >
            <select
              id="studentSelect"
              name="personId"
              bind:value={selectedPersonId}
              required
              disabled={!selectedDomainId}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Select student...</option>
              {#each data.students as student (student.id)}
                <option value={student.id}>{student.displayName}</option>
              {/each}
            </select>
          </div>
          <Button
            type="submit"
            size="sm"
            class="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            disabled={!selectedDomainId || !selectedPersonId}
          >
            Assign Ninja
          </Button>
        </div>
      </form>
    {/if}

    {#if data.domainsWithNinjas.length === 0 || data.domainsWithNinjas.every((d) => d.assignments.length === 0)}
      <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p class="text-gray-500">No ninja assignments yet.</p>
        <p class="mt-1 text-sm text-gray-400">
          Select a domain and student above to assign ninja status.
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each data.domainsWithNinjas as domain (domain.id)}
          {#if domain.assignments.length > 0}
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <h3 class="mb-2 font-medium text-gray-900">{domain.name}</h3>
              <div class="flex flex-wrap gap-2">
                {#each domain.assignments as assignment (assignment.id)}
                  <div
                    class="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                  >
                    <span>{assignment.person.displayName}</span>
                    <form method="POST" action="?/revokeNinja" class="inline">
                      <input type="hidden" name="personId" value={assignment.personId} />
                      <input type="hidden" name="domainId" value={domain.id} />
                      <button
                        type="submit"
                        class="ml-1 text-purple-600 hover:text-purple-900"
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </form>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>
