<script lang="ts">
  import type { PageData } from './$types';
  import PresenceStatus from '$lib/components/presence/PresenceStatus.svelte';
  import PresenceBoard from '$lib/components/presence/PresenceBoard.svelte';
  import { Button } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const hasSession = $derived(!!data.currentSession && data.currentSession.status === 'active');
</script>

<div class="mx-auto max-w-2xl space-y-6">
  <div>
    <PresenceStatus isSignedIn={data.signInStatus?.isSignedIn ?? false} {hasSession} />
  </div>

  {#if data.handoffPrompt?.shouldPrompt && data.handoffPrompt.projects.length > 0}
    <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p class="text-sm font-medium text-amber-800">Want to leave a note for your teammates?</p>
      <p class="mt-1 text-sm text-amber-600">You haven't written a handoff this session for:</p>
      <ul class="mt-2 space-y-1">
        {#each data.handoffPrompt.projects as project (project.id)}
          <li>
            <a
              href="/classroom/{data.classroom.id}/projects/{project.id}"
              class="text-sm font-medium text-amber-700 underline hover:text-amber-900"
            >
              {project.name}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if hasSession}
    <div>
      <h2 class="mb-4 text-lg font-semibold text-gray-900">
        Who's Here ({data.present.length})
      </h2>
      <PresenceBoard people={data.present} />
    </div>

    {#if isTeacher && data.signIns.length > 0}
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Sign-In Log</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs text-gray-500 uppercase">
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
                    {signIn.signedOutAt ? new Date(signIn.signedOutAt).toLocaleTimeString() : '—'}
                  </td>
                  <td class="py-2">
                    {#if !signIn.signedOutAt}
                      <form method="POST" action="?/signOutOther" class="inline">
                        <input type="hidden" name="personId" value={signIn.personId} />
                        <Button type="submit" variant="ghost" size="sm">Sign Out</Button>
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
