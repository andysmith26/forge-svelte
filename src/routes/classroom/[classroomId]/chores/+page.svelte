<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/Button.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');

  let showCreateForm = $state(false);
  let createName = $state('');
  let createDescription = $state('');
  let createSize = $state('medium');
  let createRecurrence = $state('one_time');
  let createVerificationType = $state('self');
  let createLocation = $state('');

  const sizeLabels: Record<string, string> = {
    small: 'Small (~5 min)',
    medium: 'Medium (~15 min)',
    large: 'Large (~30 min)'
  };

  const verificationLabels: Record<string, string> = {
    self: 'Self-verified',
    peer: 'Peer-verified',
    teacher: 'Teacher-verified'
  };

  const recurrenceLabels: Record<string, string> = {
    one_time: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly'
  };

  const statusColors: Record<string, string> = {
    available: 'bg-blue-100 text-blue-700',
    claimed: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-orange-100 text-orange-700',
    verified: 'bg-green-100 text-green-700',
    redo_requested: 'bg-red-100 text-red-700'
  };
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold text-gray-900">Chores</h1>
    {#if isTeacher}
      <Button size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
        {showCreateForm ? 'Cancel' : 'New Chore'}
      </Button>
    {/if}
  </div>

  {#if isTeacher && showCreateForm}
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Define Chore</h2>
      <form method="POST" action="?/defineChore" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Chore Name</label>
          <input
            type="text"
            id="name"
            name="name"
            bind:value={createName}
            maxlength={100}
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            placeholder="e.g., Clean workbench, Organize tools"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            bind:value={createDescription}
            maxlength={500}
            rows={2}
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            placeholder="What does this chore involve?"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label for="size" class="block text-sm font-medium text-gray-700">Size</label>
            <select
              id="size"
              name="size"
              bind:value={createSize}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            >
              <option value="small">Small (~5 min)</option>
              <option value="medium">Medium (~15 min)</option>
              <option value="large">Large (~30 min)</option>
            </select>
          </div>

          <div>
            <label for="recurrence" class="block text-sm font-medium text-gray-700">
              Recurrence
            </label>
            <select
              id="recurrence"
              name="recurrence"
              bind:value={createRecurrence}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            >
              <option value="one_time">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div>
            <label for="verificationType" class="block text-sm font-medium text-gray-700">
              Verification
            </label>
            <select
              id="verificationType"
              name="verificationType"
              bind:value={createVerificationType}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            >
              <option value="self">Self-verified</option>
              <option value="peer">Peer-verified</option>
              <option value="teacher">Teacher-verified</option>
            </select>
          </div>
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-gray-700">
            Location <span class="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            bind:value={createLocation}
            maxlength={100}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            placeholder="e.g., Workshop area, Art corner"
          />
        </div>

        <Button type="submit" disabled={!createName.trim() || !createDescription.trim()}>
          Create Chore
        </Button>
      </form>
    </div>
  {/if}

  <!-- Teacher: Chore Definitions -->
  {#if isTeacher && data.chores.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Chore Definitions</h2>
      <div class="space-y-3">
        {#each data.chores as chore (chore.id)}
          <div
            class="rounded-lg border bg-white p-4 shadow-sm {chore.isActive
              ? 'border-gray-200'
              : 'border-gray-100 opacity-60'}"
          >
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-medium text-gray-900">{chore.name}</h3>
                <p class="mt-1 text-sm text-gray-600">{chore.description}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {sizeLabels[chore.size]}
                  </span>
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {recurrenceLabels[chore.recurrence]}
                  </span>
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {verificationLabels[chore.verificationType]}
                  </span>
                  {#if chore.location}
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {chore.location}
                    </span>
                  {/if}
                  <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                    {chore.activeInstanceCount} instance{chore.activeInstanceCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                {#if chore.isActive}
                  <form method="POST" action="?/createInstances">
                    <input type="hidden" name="choreId" value={chore.id} />
                    <input type="hidden" name="count" value="1" />
                    <Button size="sm" variant="secondary" type="submit">+ Instance</Button>
                  </form>
                  <form method="POST" action="?/archiveChore">
                    <input type="hidden" name="choreId" value={chore.id} />
                    <Button size="sm" variant="ghost" type="submit">Archive</Button>
                  </form>
                {:else}
                  <span class="text-xs text-gray-400">Archived</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Teacher: Needs Verification -->
  {#if isTeacher && data.needingVerification.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Needs Verification</h2>
      <div class="space-y-3">
        {#each data.needingVerification as instance (instance.id)}
          <div class="rounded-lg border border-orange-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900">{instance.choreName}</h3>
                {#if instance.claimedBy}
                  <p class="text-sm text-gray-600">
                    Completed by {instance.claimedBy.displayName}
                  </p>
                {/if}
                {#if instance.completionNotes}
                  <p class="mt-1 text-sm text-gray-500 italic">"{instance.completionNotes}"</p>
                {/if}
              </div>
              <a
                href="chores/{instance.choreId}?instance={instance.id}"
                class="text-sm text-forge-blue hover:underline"
              >
                Review
              </a>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Student: Available Chores -->
  {#if !isTeacher && data.available.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Available Chores</h2>
      <div class="space-y-3">
        {#each data.available as instance (instance.id)}
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900">{instance.choreName}</h3>
                <span class="text-xs text-gray-500">
                  {verificationLabels[instance.verificationType]}
                </span>
              </div>
              <form method="POST" action="?/claimChore">
                <input type="hidden" name="instanceId" value={instance.id} />
                <Button size="sm" type="submit">Claim</Button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Student: My Chores -->
  {#if !isTeacher && data.myChores.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">My Chores</h2>
      <div class="space-y-3">
        {#each data.myChores as instance (instance.id)}
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900">{instance.choreName}</h3>
                <span
                  class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs {statusColors[
                    instance.status
                  ]}"
                >
                  {instance.status.replace('_', ' ')}
                </span>
                {#if instance.status === 'redo_requested' && instance.verifications.length > 0}
                  <p class="mt-1 text-sm text-red-600">
                    Feedback: {instance.verifications[0].feedback}
                  </p>
                {/if}
              </div>
              {#if instance.status === 'claimed' || instance.status === 'redo_requested'}
                <a
                  href="chores/{instance.choreId}?instance={instance.id}"
                  class="text-sm text-forge-blue hover:underline"
                >
                  Complete
                </a>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Empty states -->
  {#if isTeacher && data.chores.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <p class="text-gray-500">No chores defined yet. Create one to get started.</p>
    </div>
  {/if}

  {#if !isTeacher && data.available.length === 0 && data.myChores.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <p class="text-gray-500">No chores available right now. Check back later!</p>
    </div>
  {/if}
</div>
