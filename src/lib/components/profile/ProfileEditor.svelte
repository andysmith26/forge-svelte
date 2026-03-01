<script lang="ts">
  import { Button, Alert, Avatar } from '$lib/components/ui';

  const {
    profile,
    classroomId
  }: {
    profile: {
      displayName: string;
      pronouns: string | null;
      askMeAbout: string[];
      themeColor: string | null;
      currentlyWorkingOn: string | null;
      helpQueueVisible: boolean;
    };
    classroomId: string;
  } = $props();

  let editing = $state(false);
  let displayName = $state(profile.displayName);
  let pronouns = $state(profile.pronouns ?? '');
  let askMeAbout = $state(profile.askMeAbout.join(', '));
  let themeColor = $state(profile.themeColor ?? '#4A90D9');
  let currentlyWorkingOn = $state(profile.currentlyWorkingOn ?? '');
  let helpQueueVisible = $state(profile.helpQueueVisible);
  let error = $state<string | null>(null);
  let saving = $state(false);

  const presetColors = ['#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];

  let askMeAboutCount = $derived(
    askMeAbout
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean).length
  );

  function startEdit() {
    displayName = profile.displayName;
    pronouns = profile.pronouns ?? '';
    askMeAbout = profile.askMeAbout.join(', ');
    themeColor = profile.themeColor ?? '#4A90D9';
    currentlyWorkingOn = profile.currentlyWorkingOn ?? '';
    helpQueueVisible = profile.helpQueueVisible;
    editing = true;
    error = null;
  }

  function cancel() {
    editing = false;
    error = null;
  }
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Avatar
        name={editing ? displayName || 'A' : profile.displayName || 'A'}
        size="lg"
        themeColor={editing ? themeColor : profile.themeColor}
      />
      <h2 class="text-lg font-semibold text-gray-900">My Profile</h2>
    </div>
    {#if !editing}
      <button type="button" class="text-sm text-forge-blue hover:underline" onclick={startEdit}>
        Edit
      </button>
    {/if}
  </div>

  {#if editing}
    {#if error}
      <Alert variant="error" class="mt-3">
        <p>{error}</p>
      </Alert>
    {/if}

    <form
      method="POST"
      action="/classroom/{classroomId}/profile?/updateProfile"
      class="mt-4 space-y-4"
    >
      <div>
        <label for="pe-displayName" class="block text-sm font-medium text-gray-700"
          >Display Name</label
        >
        <input
          id="pe-displayName"
          name="displayName"
          type="text"
          bind:value={displayName}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
          required
        />
      </div>

      <div>
        <label for="pe-pronouns" class="block text-sm font-medium text-gray-700">Pronouns</label>
        <input
          id="pe-pronouns"
          name="pronouns"
          type="text"
          bind:value={pronouns}
          placeholder="e.g., they/them"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
        />
      </div>

      <div>
        <label for="pe-themeColor" class="block text-sm font-medium text-gray-700"
          >Theme Color</label
        >
        <div class="mt-1 flex items-center gap-2">
          <input
            id="pe-themeColor"
            name="themeColor"
            type="color"
            bind:value={themeColor}
            class="h-9 w-9 cursor-pointer rounded border border-gray-300"
          />
          <div class="flex gap-1">
            {#each presetColors as color (color)}
              <button
                type="button"
                class="h-7 w-7 rounded-full border-2 {themeColor === color
                  ? 'border-gray-900'
                  : 'border-transparent'}"
                style="background-color: {color}"
                onclick={() => (themeColor = color)}
                aria-label="Select color {color}"
              ></button>
            {/each}
          </div>
        </div>
        <p class="mt-1 text-xs text-gray-500">Used as your avatar background</p>
      </div>

      <div>
        <label for="pe-askMeAbout" class="block text-sm font-medium text-gray-700"
          >Ask Me About</label
        >
        <input
          id="pe-askMeAbout"
          name="askMeAbout"
          type="text"
          bind:value={askMeAbout}
          placeholder="e.g., JavaScript, 3D printing"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
        />
        <p class="mt-1 text-xs {askMeAboutCount > 5 ? 'text-red-600' : 'text-gray-500'}">
          Comma-separated topics ({askMeAboutCount}/5)
        </p>
      </div>

      <div>
        <label for="pe-currentlyWorkingOn" class="block text-sm font-medium text-gray-700"
          >Currently Working On</label
        >
        <input
          id="pe-currentlyWorkingOn"
          name="currentlyWorkingOn"
          type="text"
          bind:value={currentlyWorkingOn}
          placeholder="e.g., Building a robot arm"
          maxlength={200}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-forge-blue focus:ring-1 focus:ring-forge-blue focus:outline-none"
        />
        <p class="mt-1 text-xs text-gray-500">Visible on the smartboard</p>
      </div>

      <div class="flex items-center gap-2">
        <input
          id="pe-helpQueueVisible"
          name="helpQueueVisible"
          type="checkbox"
          bind:checked={helpQueueVisible}
          class="h-4 w-4 rounded border-gray-300 text-forge-blue focus:ring-forge-blue"
        />
        <label for="pe-helpQueueVisible" class="text-sm text-gray-700"
          >Show me in the help queue</label
        >
      </div>
      <input type="hidden" name="helpQueueVisible" value={helpQueueVisible ? 'true' : 'false'} />

      <div class="flex gap-2">
        <Button type="submit" loading={saving}>Save</Button>
        <Button type="button" variant="secondary" onclick={cancel}>Cancel</Button>
      </div>
    </form>
  {:else}
    <dl class="mt-4 space-y-3">
      <div>
        <dt class="text-sm text-gray-500">Display Name</dt>
        <dd class="text-sm font-medium text-gray-900">{profile.displayName}</dd>
      </div>
      {#if profile.pronouns}
        <div>
          <dt class="text-sm text-gray-500">Pronouns</dt>
          <dd class="text-sm text-gray-900">{profile.pronouns}</dd>
        </div>
      {/if}
      {#if profile.askMeAbout.length > 0}
        <div>
          <dt class="text-sm text-gray-500">Ask Me About</dt>
          <dd class="flex flex-wrap gap-1">
            {#each profile.askMeAbout as topic (topic)}
              <span
                class="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
              >
                {topic}
              </span>
            {/each}
          </dd>
        </div>
      {/if}
      {#if profile.currentlyWorkingOn}
        <div>
          <dt class="text-sm text-gray-500">Currently Working On</dt>
          <dd class="text-sm text-gray-900">{profile.currentlyWorkingOn}</dd>
        </div>
      {/if}
      <div>
        <dt class="text-sm text-gray-500">Help Queue Visibility</dt>
        <dd class="text-sm text-gray-900">
          {profile.helpQueueVisible ? 'Visible' : 'Hidden'}
        </dd>
      </div>
    </dl>
  {/if}
</div>
