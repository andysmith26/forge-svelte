<script lang="ts">
  import type { PageData } from './$types';
  import { Badge } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  function formatDate(iso: string | null): string {
    if (!iso) return '--';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatTime(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatDuration(minutes: number | null): string {
    if (minutes === null) return '--';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-900">Session History</h2>
  </div>

  {#if data.sessions.length === 0}
    <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <p class="text-gray-500">No past sessions yet. Sessions will appear here after they end.</p>
    </div>
  {:else}
    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
            >
              Session
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
            >
              Duration
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
            >
              Students
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
            >
              Help Requests
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each data.sessions as session (session.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <a
                  href="/classroom/{data.classroom.id}/sessions/{session.id}"
                  class="font-medium text-forge-blue hover:underline"
                >
                  {session.name ?? formatDate(session.startedAt)}
                </a>
                <div class="text-xs text-gray-500">
                  {formatDate(session.startedAt)}
                  {#if session.startedAt}
                    at {formatTime(session.startedAt)}
                  {/if}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {formatDuration(session.durationMinutes)}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {session.studentCount}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {session.helpRequestCount}
              </td>
              <td class="px-4 py-3">
                {#if session.status === 'ended'}
                  <Badge variant="green">Ended</Badge>
                {:else}
                  <Badge variant="gray">Cancelled</Badge>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
