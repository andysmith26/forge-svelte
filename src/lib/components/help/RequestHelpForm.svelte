<script lang="ts">
  import { Button, Alert } from '$lib/components/ui';

  const {
    categories,
    hasOpenRequest
  }: {
    categories: { id: string; name: string }[];
    hasOpenRequest: boolean;
  } = $props();

  let description = $state('');
  let whatITried = $state('');
  let urgency = $state('');
  let categoryId = $state('');
  let charCount = $derived(whatITried.length);
  let meetsMinimum = $derived(charCount >= 20);
</script>

{#if hasOpenRequest}
  <Alert variant="info" title="Active Request">
    <p>You already have an open help request. Cancel it before submitting a new one.</p>
  </Alert>
{:else}
  <form method="POST" action="?/requestHelp" class="space-y-4">
    {#if categories.length > 0}
      <div>
        <label for="categoryId" class="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="categoryId"
          name="categoryId"
          bind:value={categoryId}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
        >
          <option value="">None</option>
          {#each categories as cat (cat.id)}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>
    {/if}

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700">
        What do you need help with? <span class="text-red-500">*</span>
      </label>
      <textarea
        id="description"
        name="description"
        bind:value={description}
        rows={3}
        required
        placeholder="Describe your problem or question..."
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
      ></textarea>
    </div>

    <div>
      <label for="whatITried" class="block text-sm font-medium text-gray-700">
        What have you tried? <span class="text-red-500">*</span>
      </label>
      <textarea
        id="whatITried"
        name="whatITried"
        bind:value={whatITried}
        rows={3}
        required
        minlength={20}
        placeholder="Describe what you've already tried..."
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
      ></textarea>
      <p class="mt-1 text-xs {meetsMinimum ? 'text-green-600' : 'text-gray-500'}">
        {charCount}/20 characters minimum
      </p>
    </div>

    <fieldset>
      <legend class="block text-sm font-medium text-gray-700">
        Urgency <span class="text-red-500">*</span>
      </legend>
      <div class="mt-2 space-y-2">
        <label
          class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
            {urgency === 'blocked'
            ? 'border-red-500 bg-red-50'
            : 'border-gray-200 hover:bg-gray-50'}"
        >
          <input type="radio" name="urgency" value="blocked" bind:group={urgency} class="mt-1" />
          <div>
            <p class="text-sm font-medium">Stuck and blocked</p>
            <p class="text-xs text-gray-500">I can't continue without help</p>
          </div>
        </label>
        <label
          class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
            {urgency === 'question'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:bg-gray-50'}"
        >
          <input type="radio" name="urgency" value="question" bind:group={urgency} class="mt-1" />
          <div>
            <p class="text-sm font-medium">Have a question</p>
            <p class="text-xs text-gray-500">I have a question but can keep working</p>
          </div>
        </label>
        <label
          class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
            {urgency === 'check_work'
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 hover:bg-gray-50'}"
        >
          <input type="radio" name="urgency" value="check_work" bind:group={urgency} class="mt-1" />
          <div>
            <p class="text-sm font-medium">Check my work</p>
            <p class="text-xs text-gray-500">I want someone to review what I did</p>
          </div>
        </label>
      </div>
    </fieldset>

    <Button
      type="submit"
      class="w-full"
      disabled={!description.trim() || !meetsMinimum || !urgency}
    >
      Request Help
    </Button>
  </form>
{/if}
