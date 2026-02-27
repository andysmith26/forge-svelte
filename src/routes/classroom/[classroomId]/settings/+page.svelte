<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from '$lib/components/ui';
  import { MODULE_DEFINITIONS } from '$lib/domain/modules';

  const { data }: { data: PageData } = $props();

  const allModules = Object.values(MODULE_DEFINITIONS);
</script>

<div class="mx-auto max-w-2xl">
  <h2 class="mb-2 text-lg font-semibold text-gray-900">Classroom Settings</h2>
  <p class="mb-6 text-sm text-gray-500">
    Enable or disable features for this classroom. Disabled features will be hidden from students
    and teachers.
  </p>

  <form method="POST" action="?/updateModules">
    <div class="space-y-3">
      {#each allModules as def (def.id)}
        {@const enabled = data.classroomSettings.modules[def.id].enabled}
        {@const disabled = def.status === 'coming_soon'}
        <label
          class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm
            {disabled ? 'opacity-60' : ''}"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{def.name}</span>
              {#if disabled}
                <span
                  class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"
                >
                  Coming Soon
                </span>
              {/if}
            </div>
            <p class="text-sm text-gray-500">{def.description}</p>
          </div>
          <div class="relative ml-4">
            <input
              type="checkbox"
              name={def.id}
              checked={enabled}
              {disabled}
              value="on"
              class="peer sr-only"
            />
            <div
              class="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-forge-blue peer-disabled:cursor-not-allowed"
            ></div>
            <div
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
            ></div>
          </div>
        </label>
      {/each}
    </div>

    <div class="mt-6">
      <Button type="submit">Save Settings</Button>
    </div>
  </form>
</div>
