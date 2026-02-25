<script lang="ts">
  import type { PageData } from './$types';
  import PresenceStatus from '$lib/components/presence/PresenceStatus.svelte';
  import PresenceBoard from '$lib/components/presence/PresenceBoard.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const hasSession = $derived(!!data.currentSession && data.currentSession.status === 'active');
</script>

<div class="space-y-6">
  <PresenceStatus
    isSignedIn={data.signInStatus?.isSignedIn ?? false}
    {hasSession}
  />

  {#if hasSession}
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          Who's Here ({data.present.length})
        </h2>
      </div>
      <PresenceBoard people={data.present} />
    </div>

    {#if isTeacher && data.signIns.length > 0}
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Sign-In Log</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th class="py-2 pr-4">Name</th>
                <th class="py-2 pr-4">Signed In</th>
                <th class="py-2 pr-4">Signed Out</th>
                <th class="py-2">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {#each data.signIns as signIn (signIn.id)}
                <tr>
                  <td class="py-2 pr-4 font-medium">{signIn.displayName}</td>
                  <td class="py-2 pr-4 text-gray-500">
                    {new Date(signIn.signedInAt).toLocaleTimeString()}
                  </td>
                  <td class="py-2 pr-4 text-gray-500">
                    {signIn.signedOutAt
                      ? new Date(signIn.signedOutAt).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td class="py-2">
                    {#if !signIn.signedOutAt}
                      <form method="POST" action="?/signOutOther" class="inline">
                        <input type="hidden" name="personId" value={signIn.personId} />
                        <button type="submit" class="text-xs text-red-600 hover:underline">
                          Sign Out
                        </button>
                      </form>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</div>
