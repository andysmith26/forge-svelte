<script lang="ts">
  import { Button } from '$lib/components/ui';

  const {
    topics
  }: {
    topics: string[];
  } = $props();

  let currentTopics = $state([...topics]);
  let newTopic = $state('');
  let isDirty = $derived(
    currentTopics.length !== topics.length || currentTopics.some((t, i) => t !== topics[i])
  );

  function addTopic() {
    const trimmed = newTopic.trim();
    if (!trimmed || currentTopics.length >= 5) return;
    if (currentTopics.includes(trimmed)) return;
    currentTopics = [...currentTopics, trimmed];
    newTopic = '';
  }

  function removeTopic(index: number) {
    currentTopics = currentTopics.filter((_, i) => i !== index);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic();
    }
  }
</script>

<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-900">Ask Me About</h3>
  <p class="mb-3 text-xs text-gray-500">Let others know what you can help with (up to 5 topics).</p>

  <form method="POST" action="?/updateAskMeAbout">
    <div class="mb-3 flex flex-wrap gap-1.5">
      {#each currentTopics as topic, i (topic)}
        <span
          class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800"
        >
          {topic}
          <button
            type="button"
            onclick={() => removeTopic(i)}
            class="text-purple-600 hover:text-purple-900"
            aria-label="Remove {topic}"
          >
            &times;
          </button>
        </span>
      {/each}
      {#if currentTopics.length === 0}
        <span class="text-xs text-gray-400 italic">No topics yet</span>
      {/if}
    </div>

    {#if currentTopics.length < 5}
      <div class="mb-3 flex gap-2">
        <input
          type="text"
          bind:value={newTopic}
          onkeydown={handleKeyDown}
          maxlength={50}
          placeholder="Add a topic..."
          class="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onclick={addTopic}
          disabled={!newTopic.trim()}
        >
          Add
        </Button>
      </div>
    {/if}

    {#each currentTopics as topic}
      <input type="hidden" name="askMeAbout" value={topic} />
    {/each}

    {#if isDirty}
      <Button type="submit" size="sm" class="w-full">Save Topics</Button>
    {/if}
  </form>
</div>
