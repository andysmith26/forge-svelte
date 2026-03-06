<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/Button.svelte';

  const { data }: { data: PageData } = $props();

  const actorId = $derived(data.actor.personId);

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

  const statusColors: Record<string, string> = {
    available: 'bg-blue-100 text-blue-700',
    claimed: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-orange-100 text-orange-700',
    verified: 'bg-green-100 text-green-700',
    redo_requested: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-500'
  };

  let completionNotes = $state('');
  let verifyFeedback = $state('');
</script>

<div class="space-y-6">
  <div>
    <a href="../chores" class="text-sm text-gray-500 hover:text-gray-700">
      &larr; Back to Chores
    </a>
  </div>

  <!-- Chore Details -->
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h1 class="text-xl font-semibold text-gray-900">{data.chore.name}</h1>
    <p class="mt-2 text-gray-600">{data.chore.description}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        {sizeLabels[data.chore.size]}
      </span>
      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        {verificationLabels[data.chore.verificationType]}
      </span>
      {#if data.chore.location}
        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {data.chore.location}
        </span>
      {/if}
      {#if !data.chore.isActive}
        <span class="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Archived</span>
      {/if}
    </div>
  </div>

  <!-- Instances -->
  <section>
    <h2 class="mb-3 text-lg font-semibold text-gray-900">Instances</h2>
    {#if data.instances.length === 0}
      <p class="text-sm text-gray-500">No instances yet.</p>
    {:else}
      <div class="space-y-3">
        {#each data.instances as instance (instance.id)}
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <span
                  class="inline-block rounded-full px-2 py-0.5 text-xs {statusColors[
                    instance.status
                  ]}"
                >
                  {instance.status.replace('_', ' ')}
                </span>
                {#if instance.claimedBy}
                  <p class="mt-1 text-sm text-gray-600">
                    Claimed by {instance.claimedBy.displayName}
                  </p>
                {/if}
                {#if instance.completionNotes}
                  <p class="mt-1 text-sm text-gray-500 italic">"{instance.completionNotes}"</p>
                {/if}
                {#if instance.verifications.length > 0}
                  <div class="mt-2 space-y-1">
                    {#each instance.verifications as v, vi (vi)}
                      <p class="text-sm">
                        <span
                          class="font-medium {v.decision === 'approved'
                            ? 'text-green-600'
                            : 'text-red-600'}"
                        >
                          {v.decision === 'approved' ? 'Approved' : 'Redo requested'}
                        </span>
                        by {v.verifier.displayName}
                        {#if v.feedback}
                          — <span class="text-gray-500 italic">"{v.feedback}"</span>
                        {/if}
                      </p>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="ml-4 shrink-0">
                <!-- Complete action (for the claimer) -->
                {#if (instance.status === 'claimed' || instance.status === 'redo_requested') && instance.claimedBy?.id === actorId}
                  <form method="POST" action="?/completeChore" class="space-y-2">
                    <input type="hidden" name="instanceId" value={instance.id} />
                    <textarea
                      name="completionNotes"
                      bind:value={completionNotes}
                      rows={2}
                      maxlength={500}
                      class="block w-48 rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
                      placeholder="Notes (optional)"
                    ></textarea>
                    <Button size="sm" type="submit">Mark Complete</Button>
                  </form>
                {/if}

                <!-- Verify action (for non-claimers when status is completed) -->
                {#if instance.status === 'completed' && instance.claimedBy?.id !== actorId}
                  <form method="POST" action="?/verifyChore" class="space-y-2">
                    <input type="hidden" name="instanceId" value={instance.id} />
                    <textarea
                      name="feedback"
                      bind:value={verifyFeedback}
                      rows={2}
                      maxlength={500}
                      class="block w-48 rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
                      placeholder="Feedback (optional)"
                    ></textarea>
                    <div class="flex gap-1">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        class="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="redo_requested"
                        class="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                      >
                        Redo
                      </button>
                    </div>
                  </form>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
