<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/Button.svelte';

  const { data }: { data: PageData } = $props();

  const isTeacher = $derived(data.membership.role === 'teacher');
  const isMember = $derived(data.isMember);
  const activeMembers = $derived(data.project.members.filter((m) => m.isActive));

  let showEditForm = $state(false);
  let editName = $state(data.project.name);
  let editDescription = $state(data.project.description ?? '');
  let editVisibility = $state(data.project.visibility);

  let addMemberPersonId = $state('');
  let newSubsystemName = $state('');
  let showHandoffForm = $state(false);

  let handoffWhatIDid = $state('');
  let handoffWhatsNext = $state('');
  let handoffBlockers = $state('');
  let handoffQuestions = $state('');
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center gap-2">
        <a
          href="/classroom/{data.classroom.id}/projects"
          class="text-sm text-gray-400 hover:text-gray-600"
        >
          Projects
        </a>
        <span class="text-sm text-gray-300">/</span>
      </div>
      <h1 class="text-xl font-semibold text-gray-900">{data.project.name}</h1>
    </div>
    <div class="flex items-center gap-2">
      {#if data.project.isArchived}
        <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">Archived</span>
      {/if}
      {#if data.project.visibility === 'members_only'}
        <span class="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">Private</span>
      {/if}
    </div>
  </div>

  {#if data.project.description}
    <p class="text-sm text-gray-600">{data.project.description}</p>
  {/if}

  <!-- Edit project (member or teacher) -->
  {#if (isMember || isTeacher) && !data.project.isArchived}
    <div>
      <Button size="sm" variant="secondary" onclick={() => (showEditForm = !showEditForm)}>
        {showEditForm ? 'Cancel Edit' : 'Edit Project'}
      </Button>
    </div>

    {#if showEditForm}
      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Edit Project</h2>
        <form method="POST" action="?/updateProject" class="space-y-4">
          <div>
            <label for="edit-name" class="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              bind:value={editName}
              maxlength={100}
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            />
            <p class="mt-1 text-xs text-gray-500">{editName.length}/100 characters</p>
          </div>
          <div>
            <label for="edit-description" class="block text-sm font-medium text-gray-700">
              Description <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              bind:value={editDescription}
              maxlength={500}
              rows={2}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">{editDescription.length}/500 characters</p>
          </div>
          <div>
            <label for="edit-visibility" class="block text-sm font-medium text-gray-700">
              Visibility
            </label>
            <div class="mt-2 space-y-2">
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  value="browseable"
                  bind:group={editVisibility}
                />
                <span class="text-sm text-gray-700">Browseable</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  value="members_only"
                  bind:group={editVisibility}
                />
                <span class="text-sm text-gray-700">Members only</span>
              </label>
            </div>
          </div>
          <Button type="submit" disabled={!editName.trim()}>Save Changes</Button>
        </form>
      </div>
    {/if}
  {/if}

  <!-- Handoff Form (member or teacher, not archived) -->
  {#if (isMember || isTeacher) && !data.project.isArchived}
    <section>
      <Button onclick={() => (showHandoffForm = !showHandoffForm)}>
        {showHandoffForm ? 'Cancel' : 'Write Handoff'}
      </Button>

      {#if showHandoffForm}
        <div class="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Write a Handoff</h2>
          <form method="POST" action="?/submitHandoff" class="space-y-4">
            <div>
              <label for="whatIDid" class="block text-sm font-medium text-gray-700">
                What I did <span class="text-red-500">*</span>
              </label>
              <textarea
                id="whatIDid"
                name="whatIDid"
                bind:value={handoffWhatIDid}
                minlength={20}
                maxlength={2000}
                rows={4}
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
                placeholder="Describe what you worked on today..."
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">
                {handoffWhatIDid.length}/2000 characters (min 20)
              </p>
            </div>

            <div>
              <label for="whatsNext" class="block text-sm font-medium text-gray-700">
                What's next <span class="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="whatsNext"
                name="whatsNext"
                bind:value={handoffWhatsNext}
                maxlength={1000}
                rows={2}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
                placeholder="What should the next person work on?"
              ></textarea>
            </div>

            <div>
              <label for="blockers" class="block text-sm font-medium text-gray-700">
                Blockers <span class="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="blockers"
                name="blockers"
                bind:value={handoffBlockers}
                maxlength={1000}
                rows={2}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
                placeholder="Anything blocking progress?"
              ></textarea>
            </div>

            <div>
              <label for="questions" class="block text-sm font-medium text-gray-700">
                Questions <span class="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="questions"
                name="questions"
                bind:value={handoffQuestions}
                maxlength={1000}
                rows={2}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
                placeholder="Any questions for the team?"
              ></textarea>
            </div>

            {#if data.subsystems.length > 0}
              <fieldset>
                <legend class="block text-sm font-medium text-gray-700">
                  Subsystems <span class="text-gray-400">(optional)</span>
                </legend>
                <div class="mt-2 space-y-1">
                  {#each data.subsystems as subsystem (subsystem.id)}
                    <label class="flex items-center gap-2">
                      <input type="checkbox" name="subsystemIds" value={subsystem.id} />
                      <span class="text-sm text-gray-700">{subsystem.name}</span>
                    </label>
                  {/each}
                </div>
              </fieldset>
            {/if}

            <Button type="submit" disabled={handoffWhatIDid.trim().length < 20}>
              Submit Handoff
            </Button>
          </form>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Handoff Timeline -->
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">
        Handoffs ({data.handoffs.length})
        {#if data.unreadCount > 0}
          <span
            class="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forge-blue px-1.5 text-xs font-medium text-white"
          >
            {data.unreadCount} new
          </span>
        {/if}
      </h2>
      {#if data.unreadCount > 0}
        <form method="POST" action="?/markAsRead">
          <Button type="submit" size="sm" variant="secondary">Mark as read</Button>
        </form>
      {/if}
    </div>
    {#if data.handoffs.length === 0}
      <div class="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p class="text-gray-500">No handoffs yet.</p>
        <p class="mt-1 text-sm text-gray-400">
          Write a handoff to help your teammates know what you worked on.
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each data.handoffs as handoff (handoff.id)}
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{handoff.author.displayName}</span>
                <span class="text-xs text-gray-400">
                  {new Date(handoff.createdAt).toLocaleString()}
                </span>
              </div>
              {#if handoff.subsystems.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each handoff.subsystems as sub (sub.id)}
                    <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {sub.name}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="mt-3 space-y-2">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase">What I did</p>
                <p class="mt-0.5 text-sm whitespace-pre-wrap text-gray-700">{handoff.whatIDid}</p>
              </div>

              {#if handoff.whatsNext}
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase">What's next</p>
                  <p class="mt-0.5 text-sm whitespace-pre-wrap text-gray-700">
                    {handoff.whatsNext}
                  </p>
                </div>
              {/if}

              {#if handoff.blockers}
                <div class="rounded-md border border-red-100 bg-red-50 p-2">
                  <p class="text-xs font-medium text-red-600 uppercase">Blockers</p>
                  <p class="mt-0.5 text-sm whitespace-pre-wrap text-red-700">
                    {handoff.blockers}
                  </p>
                </div>
              {/if}

              {#if handoff.questions}
                <div class="rounded-md border border-amber-100 bg-amber-50 p-2">
                  <p class="text-xs font-medium text-amber-600 uppercase">Questions</p>
                  <p class="mt-0.5 text-sm whitespace-pre-wrap text-amber-700">
                    {handoff.questions}
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Subsystems -->
  {#if (isMember || isTeacher) && !data.project.isArchived}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">
        Subsystems ({data.subsystems.length})
      </h2>
      {#if data.subsystems.length > 0}
        <div class="mb-3 flex flex-wrap gap-2">
          {#each data.subsystems as subsystem (subsystem.id)}
            <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {subsystem.name}
            </span>
          {/each}
        </div>
      {/if}
      <form method="POST" action="?/addSubsystem" class="flex items-end gap-2">
        <div class="flex-1">
          <label for="subsystem-name" class="block text-sm font-medium text-gray-700">
            Add subsystem
          </label>
          <input
            type="text"
            id="subsystem-name"
            name="name"
            bind:value={newSubsystemName}
            maxlength={60}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            placeholder="e.g., Drivetrain, Sensors, Frame"
          />
        </div>
        <Button type="submit" size="sm" disabled={!newSubsystemName.trim()}>Add</Button>
      </form>
    </section>
  {:else if data.subsystems.length > 0}
    <section>
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Subsystems</h2>
      <div class="flex flex-wrap gap-2">
        {#each data.subsystems as subsystem (subsystem.id)}
          <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {subsystem.name}
          </span>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Members -->
  <section>
    <h2 class="mb-3 text-lg font-semibold text-gray-900">
      Members ({activeMembers.length})
    </h2>
    <div class="space-y-2">
      {#each activeMembers as member (member.id)}
        <div
          class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
        >
          <span class="text-sm text-gray-700">{member.displayName}</span>
          {#if isTeacher && member.personId !== data.actor.personId}
            <form method="POST" action="?/removeMember">
              <input type="hidden" name="personId" value={member.personId} />
              <Button type="submit" size="sm" variant="ghost">Remove</Button>
            </form>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Add member (member or teacher, not archived) -->
    {#if (isMember || isTeacher) && !data.project.isArchived && data.classroomStudents.length > 0}
      <div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <h3 class="mb-2 text-sm font-medium text-gray-700">Add a Member</h3>
        <form method="POST" action="?/addMember" class="flex items-end gap-2">
          <div class="flex-1">
            <select
              name="personId"
              bind:value={addMemberPersonId}
              class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
            >
              <option value="">Select a student...</option>
              {#each data.classroomStudents as student (student.personId)}
                <option value={student.personId}>{student.displayName}</option>
              {/each}
            </select>
          </div>
          <Button type="submit" size="sm" disabled={!addMemberPersonId}>Add</Button>
        </form>
      </div>
    {/if}
  </section>

  <!-- Leave project (student member) -->
  {#if isMember && !isTeacher}
    <section>
      <form method="POST" action="?/leaveProject">
        <Button type="submit" variant="ghost" size="sm">Leave Project</Button>
      </form>
    </section>
  {/if}
</div>
