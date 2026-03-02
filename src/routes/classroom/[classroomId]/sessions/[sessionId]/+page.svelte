<script lang="ts">
  import type { PageData } from './$types';
  import { Badge } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();
  const a = $derived(data.analytics);

  function formatDate(iso: string | null): string {
    if (!iso) return '--';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(iso: string | null): string {
    if (!iso) return '--';
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatDuration(minutes: number | null): string {
    if (minutes === null) return '--';
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function urgencyLabel(urgency: string | null): string {
    switch (urgency) {
      case 'blocked':
        return 'Blocked';
      case 'question':
        return 'Question';
      case 'check_work':
        return 'Check Work';
      case null:
        return 'Unspecified';
      default:
        return urgency;
    }
  }

  function urgencyVariant(urgency: string | null): 'red' | 'blue' | 'purple' {
    switch (urgency) {
      case 'blocked':
        return 'red';
      case 'question':
        return 'blue';
      case 'check_work':
        return 'purple';
      default:
        return 'blue';
    }
  }
</script>

<div class="space-y-6">
  <!-- Overview -->
  <div>
    <a
      href="/classroom/{data.classroom.id}/sessions"
      class="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700"
    >
      &larr; Back to sessions
    </a>
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {a.sessionName ?? 'Session'}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {formatDate(a.startedAt)}
            {#if a.startedAt}
              &middot; {formatTime(a.startedAt)}
              {#if a.endedAt}
                &ndash; {formatTime(a.endedAt)}
              {/if}
            {/if}
          </p>
        </div>
        <div class="flex items-center gap-3">
          {#if a.durationMinutes !== null}
            <span class="text-sm text-gray-600">{formatDuration(a.durationMinutes)}</span>
          {/if}
          {#if a.status === 'ended'}
            <Badge variant="green">Ended</Badge>
          {:else if a.status === 'cancelled'}
            <Badge variant="gray">Cancelled</Badge>
          {:else}
            <Badge variant="blue">{a.status}</Badge>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Attendance -->
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h3 class="mb-4 text-base font-semibold text-gray-900">Attendance</h3>
    <div class="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div>
        <p class="text-2xl font-bold text-gray-900">{a.attendance.uniqueStudents}</p>
        <p class="text-xs text-gray-500">Students</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-gray-900">{a.attendance.totalSignIns}</p>
        <p class="text-xs text-gray-500">Total sign-ins</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-gray-900">{a.attendance.selfSignIns}</p>
        <p class="text-xs text-gray-500">Self sign-ins</p>
      </div>
      <div>
        <p class="text-2xl font-bold text-gray-900">
          {formatDuration(a.attendance.avgDurationMinutes)}
        </p>
        <p class="text-xs text-gray-500">Avg duration</p>
      </div>
    </div>

    {#if a.attendance.attendees.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Signed In
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Signed Out
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each a.attendance.attendees as att (att.personId + att.signedInAt)}
              <tr>
                <td class="px-3 py-2 text-gray-900">{att.displayName}</td>
                <td class="px-3 py-2 text-gray-600">{formatTime(att.signedInAt)}</td>
                <td class="px-3 py-2 text-gray-600">{formatTime(att.signedOutAt)}</td>
                <td class="px-3 py-2 text-gray-600">{formatDuration(att.durationMinutes)}</td>
                <td class="px-3 py-2">
                  {#if att.selfSignIn}
                    <Badge variant="blue">Self</Badge>
                  {:else}
                    <Badge variant="yellow">Assisted</Badge>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Help Requests -->
  {#if a.help.totalRequests > 0}
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-base font-semibold text-gray-900">Help Requests</h3>
      <div class="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div>
          <p class="text-2xl font-bold text-gray-900">{a.help.totalRequests}</p>
          <p class="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-green-700">{a.help.resolvedCount}</p>
          <p class="text-xs text-gray-500">Resolved</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-500">{a.help.cancelledCount}</p>
          <p class="text-xs text-gray-500">Cancelled</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">
            {formatDuration(a.help.avgResponseTimeMinutes)}
          </p>
          <p class="text-xs text-gray-500">Avg response</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">
            {formatDuration(a.help.avgResolutionTimeMinutes)}
          </p>
          <p class="text-xs text-gray-500">Avg resolution</p>
        </div>
      </div>

      {#if a.help.byUrgency.length > 0}
        <div class="mb-3">
          <p class="mb-1 text-xs font-medium text-gray-500 uppercase">By Urgency</p>
          <div class="flex flex-wrap gap-2">
            {#each a.help.byUrgency as u (u.urgency)}
              <Badge variant={urgencyVariant(u.urgency)}>
                {urgencyLabel(u.urgency)}: {u.count}
              </Badge>
            {/each}
          </div>
        </div>
      {/if}

      {#if a.help.byCategory.length > 0}
        <div>
          <p class="mb-1 text-xs font-medium text-gray-500 uppercase">By Category</p>
          <div class="flex flex-wrap gap-2">
            {#each a.help.byCategory as cat (cat.categoryName)}
              <Badge variant="gray">{cat.categoryName}: {cat.count}</Badge>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Timeline -->
  {#if a.timeline.length > 0}
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-base font-semibold text-gray-900">Event Timeline</h3>
      <div class="space-y-0">
        {#each a.timeline as event, i (event.timestamp + event.eventType)}
          <div class="flex gap-3 {i < a.timeline.length - 1 ? 'pb-3' : ''}">
            <div class="flex flex-col items-center">
              <div class="h-2 w-2 rounded-full bg-gray-400"></div>
              {#if i < a.timeline.length - 1}
                <div class="w-px flex-1 bg-gray-200"></div>
              {/if}
            </div>
            <div class="pb-1">
              <p class="text-sm text-gray-900">{event.description}</p>
              <p class="text-xs text-gray-500">
                {formatTime(event.timestamp)}
                {#if event.actorName}
                  &middot; {event.actorName}
                {/if}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
