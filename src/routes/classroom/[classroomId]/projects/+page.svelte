<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/Button.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');

  let showCreateForm = $state(false);
  let createName = $state('');
  let createDescription = $state('');
  let createVisibility = $state('browseable');

  const freshnessColors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    quiet: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Quiet' },
    stale: { bg: 'bg-red-100', text: 'text-red-700', label: 'Stale' },
    no_handoffs: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'No handoffs' }
  };
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold text-gray-900">Projects</h1>
    <Button size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
      {showCreateForm ? 'Cancel' : 'New Project'}
    </Button>
  </div>

  {#if showCreateForm}
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Create Project</h2>
      <form method="POST" action="?/createProject" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            id="name"
            name="name"
            bind:value={createName}
            maxlength={100}
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            placeholder="e.g., Robot Arm, Weather Station"
          />
          <p class="mt-1 text-xs text-gray-500">{createName.length}/100 characters</p>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">
            Description <span class="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            bind:value={createDescription}
            maxlength={500}
            rows={2}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            placeholder="What is this project about?"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">{createDescription.length}/500 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Visibility</label>
          <div class="mt-2 space-y-2">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="browseable"
                bind:group={createVisibility}
              />
              <span class="text-sm text-gray-700">
                Browseable — anyone in the classroom can see and join
              </span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="members_only"
                bind:group={createVisibility}
              />
              <span class="text-sm text-gray-700"> Members only — hidden from browse list </span>
            </label>
          </div>
        </div>

        <Button type="submit" disabled={!createName.trim()}>Create Project</Button>
      </form>
    </div>
  {/if}

  {#if data.myProjects.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">
        {isTeacher ? 'All Projects' : 'My Projects'}
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.myProjects as project (project.id)}
          <a
            href="/classroom/{data.classroom.id}/projects/{project.id}"
            class="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
            class:opacity-60={project.isArchived}
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-gray-900">{project.name}</h3>
                {#if project.unreadCount > 0}
                  <span
                    class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forge-blue px-1.5 text-xs font-medium text-white"
                  >
                    {project.unreadCount}
                  </span>
                {/if}
              </div>
              <div class="flex items-center gap-1">
                {#if project.isArchived}
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    Archived
                  </span>
                {:else}
                  {@const fresh = freshnessColors[project.freshness]}
                  <span class="rounded-full {fresh.bg} px-2 py-0.5 text-xs {fresh.text}">
                    {fresh.label}
                  </span>
                {/if}
                {#if project.visibility === 'members_only'}
                  <span class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                    Private
                  </span>
                {/if}
              </div>
            </div>
            {#if project.description}
              <p class="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
            {/if}
            <div class="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span>{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</span>
              {#if project.lastHandoffAt}
                <span>Last handoff: {new Date(project.lastHandoffAt).toLocaleDateString()}</span>
              {:else}
                <span>No handoffs yet</span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    </section>
  {:else if !isTeacher}
    <div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <p class="text-gray-500">You're not a member of any projects yet.</p>
      <p class="mt-1 text-sm text-gray-400">Create one or browse projects below to join.</p>
    </div>
  {/if}

  {#if !isTeacher && data.browseableProjects.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Browse Projects</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.browseableProjects as project (project.id)}
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 class="font-medium text-gray-900">{project.name}</h3>
            {#if project.description}
              <p class="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
            {/if}
            <div class="mt-3 flex items-center justify-between">
              <span class="text-xs text-gray-400">
                {project.memberCount} member{project.memberCount !== 1 ? 's' : ''}
              </span>
              <form method="POST" action="?/joinProject">
                <input type="hidden" name="projectId" value={project.id} />
                <Button type="submit" size="sm" variant="secondary">Join</Button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if isTeacher}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Teacher Actions</h2>
      <p class="text-sm text-gray-500">
        Archive or unarchive projects below. Click a project card to view details.
      </p>
      <div class="mt-3 space-y-2">
        {#each data.myProjects.filter((p) => !p.isArchived) as project (project.id)}
          <div
            class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
          >
            <span class="text-sm text-gray-700">{project.name}</span>
            <form method="POST" action="?/archiveProject">
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" size="sm" variant="ghost">Archive</Button>
            </form>
          </div>
        {/each}
        {#each data.myProjects.filter((p) => p.isArchived) as project (project.id)}
          <div
            class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 opacity-60"
          >
            <span class="text-sm text-gray-500">{project.name} (archived)</span>
            <form method="POST" action="?/unarchiveProject">
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" size="sm" variant="ghost">Unarchive</Button>
            </form>
          </div>
        {/each}
      </div>
    </section>

    {#if data.recentHandoffs && data.recentHandoffs.length > 0}
      <section>
        <h2 class="mb-3 text-lg font-semibold text-gray-900">Recent Handoffs</h2>
        <div class="space-y-3">
          {#each data.recentHandoffs as handoff (handoff.id)}
            <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium text-gray-900">{handoff.author.displayName}</span>
                <span class="text-gray-400">in</span>
                <span class="font-medium text-gray-700">{handoff.projectName}</span>
                <span class="text-xs text-gray-400">
                  {new Date(handoff.createdAt).toLocaleString()}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-sm text-gray-600">{handoff.whatIDid}</p>
              {#if handoff.blockers}
                <p class="mt-1 text-xs font-medium text-red-600">
                  Blocker: {handoff.blockers}
                </p>
              {/if}
              {#if handoff.questions}
                <p class="mt-1 text-xs font-medium text-amber-600">
                  Question: {handoff.questions}
                </p>
              {/if}
              {#if handoff.subsystems.length > 0}
                <div class="mt-1 flex flex-wrap gap-1">
                  {#each handoff.subsystems as sub (sub.id)}
                    <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {sub.name}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
