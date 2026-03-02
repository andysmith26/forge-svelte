<script lang="ts">
  import { Badge } from '$lib/components/ui';

  type NinjaHelper = {
    personId: string;
    displayName: string;
    domains: string[];
  };

  type AskMeAboutHelper = {
    personId: string;
    displayName: string;
    askMeAbout: string[];
  };

  const {
    ninjas,
    helpers
  }: {
    ninjas: NinjaHelper[];
    helpers: AskMeAboutHelper[];
  } = $props();

  // Combine: ninjas + people with askMeAbout (deduped by personId)
  const allHelpers = $derived(() => {
    const ninjaIds = new Set(ninjas.map((n) => n.personId));
    const nonNinjaHelpers = helpers.filter(
      (h) => !ninjaIds.has(h.personId) && h.askMeAbout.length > 0
    );
    return { ninjas, nonNinjaHelpers };
  });

  const hasAnyHelpers = $derived(ninjas.length > 0 || helpers.some((h) => h.askMeAbout.length > 0));
</script>

<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
  <h3 class="mb-3 text-sm font-semibold text-gray-900">Available Helpers</h3>

  {#if !hasAnyHelpers}
    <p class="text-sm text-gray-500">No helpers are currently available.</p>
  {:else}
    <div class="space-y-3">
      {#each allHelpers().ninjas as ninja (ninja.personId)}
        <div class="flex items-start gap-2">
          <span class="text-sm font-medium text-gray-900">{ninja.displayName}</span>
          <div class="flex flex-wrap gap-1">
            {#each ninja.domains as domain}
              <Badge variant="purple">{domain}</Badge>
            {/each}
          </div>
        </div>
      {/each}
      {#each allHelpers().nonNinjaHelpers as helper (helper.personId)}
        <div class="flex items-start gap-2">
          <span class="text-sm font-medium text-gray-900">{helper.displayName}</span>
          <div class="flex flex-wrap gap-1">
            {#each helper.askMeAbout as topic}
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{topic}</span
              >
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
