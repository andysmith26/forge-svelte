<script lang="ts">
  import Avatar from '$lib/components/ui/Avatar.svelte';

  const {
    people
  }: {
    people: {
      id: string;
      displayName: string;
      pronouns: string | null;
      askMeAbout: string[];
    }[];
  } = $props();
</script>

{#if people.length === 0}
  <p class="py-8 text-center text-gray-500">No one is signed in yet.</p>
{:else}
  <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
    {#each people as person (person.id)}
      <div class="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div class="flex flex-col items-center text-center">
          <Avatar name={person.displayName} size="lg" />
          <p class="mt-2 font-medium text-gray-900">{person.displayName}</p>
          {#if person.pronouns}
            <p class="text-xs text-gray-500">{person.pronouns}</p>
          {/if}
          {#if person.askMeAbout.length > 0}
            <div class="mt-2 flex flex-wrap justify-center gap-1">
              {#each person.askMeAbout.slice(0, 3) as topic}
                <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  {topic}
                </span>
              {/each}
              {#if person.askMeAbout.length > 3}
                <span class="text-xs text-gray-400">+{person.askMeAbout.length - 3} more</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
