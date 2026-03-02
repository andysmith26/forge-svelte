<script lang="ts">
  import { Button } from '$lib/components/ui';

  type Domain = {
    id: string;
    name: string;
  };

  type Student = {
    id: string;
    displayName: string;
  };

  type DomainWithNinjas = {
    id: string;
    name: string;
    assignments: {
      id: string;
      personId: string;
      person: { displayName: string };
    }[];
  };

  const {
    domains,
    students,
    domainsWithNinjas
  }: {
    domains: Domain[];
    students: Student[];
    domainsWithNinjas: DomainWithNinjas[];
  } = $props();

  let selectedDomainId = $state('');
  let selectedPersonId = $state('');
</script>

<div>
  <h3 class="mb-3 text-base font-semibold text-gray-900">Assignments</h3>
  <p class="mb-4 text-sm text-gray-500">Assign ninja status to students for specific domains</p>

  {#if domains.length > 0}
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
            {#each domains as d (d.id)}
              <option value={d.id}>{d.name}</option>
            {/each}
          </select>
        </div>
        <div class="flex-1">
          <label for="studentSelect" class="block text-sm font-medium text-gray-700">Student</label>
          <select
            id="studentSelect"
            name="personId"
            bind:value={selectedPersonId}
            required
            disabled={!selectedDomainId}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">Select student...</option>
            {#each students as student (student.id)}
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

  {#if domainsWithNinjas.length === 0 || domainsWithNinjas.every((d) => d.assignments.length === 0)}
    <div class="rounded-lg border border-gray-200 bg-white p-6 text-center">
      <p class="text-gray-500">No ninja assignments yet.</p>
      <p class="mt-1 text-sm text-gray-400">
        Select a domain and student above to assign ninja status.
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each domainsWithNinjas as domain (domain.id)}
        {#if domain.assignments.length > 0}
          <div class="rounded-lg border border-gray-200 bg-white p-4">
            <h4 class="mb-2 font-medium text-gray-900">{domain.name}</h4>
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
