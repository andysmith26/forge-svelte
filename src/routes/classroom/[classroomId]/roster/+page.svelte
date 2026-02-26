<script lang="ts">
  import type { PageData } from './$types';
  import { Button, Alert } from '$lib/components/ui';

  const { data }: { data: PageData } = $props();

  let showAddForm = $state(false);
  let showImport = $state(false);
  let editingId = $state<string | null>(null);
  let editName = $state('');
  let editEmail = $state('');
  let editGrade = $state('');
  let csvData = $state('');
  let generatedPin = $state<string | null>(null);
  let generatedForId = $state<string | null>(null);

  function startEdit(student: {
    id: string;
    displayName: string;
    email: string | null;
    gradeLevel: string | null;
  }) {
    editingId = student.id;
    editName = student.displayName;
    editEmail = student.email ?? '';
    editGrade = student.gradeLevel ?? '';
  }

  function cancelEdit() {
    editingId = null;
  }

  const pinMap = $derived(new Map(data.studentsWithPins.map((p) => [p.id, p.hasPin])));
</script>

<div class="space-y-6">
  <!-- Student List -->
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Students ({data.students.length})</h2>
      <div class="flex gap-2">
        <Button
          size="sm"
          class="bg-green-600 hover:bg-green-700 focus:ring-green-500"
          onclick={() => {
            showAddForm = !showAddForm;
            showImport = false;
          }}
        >
          Add Student
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onclick={() => {
            showImport = !showImport;
            showAddForm = false;
          }}
        >
          Import CSV
        </Button>
      </div>
    </div>

    {#if showAddForm}
      <form method="POST" action="?/addStudent" class="mb-4 rounded-lg bg-green-50 p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <label for="newName" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="newName"
              name="name"
              type="text"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="newEmail" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="newEmail"
              name="email"
              type="email"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="newGrade" class="block text-sm font-medium text-gray-700">Grade</label>
            <input
              id="newGrade"
              name="gradeLevel"
              type="text"
              placeholder="e.g., 9th"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <Button
            type="submit"
            size="sm"
            class="bg-green-600 hover:bg-green-700 focus:ring-green-500">Add Student</Button
          >
          <Button type="button" variant="secondary" size="sm" onclick={() => (showAddForm = false)}
            >Cancel</Button
          >
        </div>
      </form>
    {/if}

    {#if showImport}
      <form method="POST" action="?/importCsv" class="mb-4 rounded-lg bg-gray-50 p-4">
        <p class="mb-2 text-sm text-gray-600">
          Paste CSV data with columns: <strong>name</strong>, <strong>email</strong>, and optionally
          <strong>grade</strong>
        </p>
        <textarea
          name="csvData"
          bind:value={csvData}
          rows={6}
          placeholder={'name,email,grade\nJohn Doe,john@school.edu,9th\nJane Smith,jane@school.edu,10th'}
          class="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
        ></textarea>
        <div class="mt-3 flex gap-2">
          <Button
            type="submit"
            size="sm"
            class="bg-green-600 hover:bg-green-700 focus:ring-green-500">Import</Button
          >
          <Button type="button" variant="secondary" size="sm" onclick={() => (showImport = false)}
            >Cancel</Button
          >
        </div>
      </form>
    {/if}

    {#if data.students.length === 0}
      <p class="py-8 text-center text-gray-500">
        No students yet. Add students individually or import a CSV.
      </p>
    {:else}
      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Grade</th>
              <th class="px-4 py-3">PIN</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each data.students as student (student.id)}
              {#if editingId === student.id}
                <tr class="bg-yellow-50">
                  <td class="px-4 py-2">
                    <input
                      name="name"
                      bind:value={editName}
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td class="px-4 py-2">
                    <input
                      name="email"
                      bind:value={editEmail}
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td class="px-4 py-2">
                    <input
                      name="gradeLevel"
                      bind:value={editGrade}
                      class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td class="px-4 py-2"></td>
                  <td class="px-4 py-2">
                    <form method="POST" action="?/updateStudent" class="inline">
                      <input type="hidden" name="personId" value={student.id} />
                      <input type="hidden" name="name" value={editName} />
                      <input type="hidden" name="email" value={editEmail} />
                      <input type="hidden" name="gradeLevel" value={editGrade} />
                      <button type="submit" class="text-xs text-green-600 hover:underline"
                        >Save</button
                      >
                    </form>
                    <button
                      type="button"
                      class="ml-2 text-xs text-gray-500 hover:underline"
                      onclick={cancelEdit}>Cancel</button
                    >
                  </td>
                </tr>
              {:else}
                <tr>
                  <td class="px-4 py-3 font-medium">{student.displayName}</td>
                  <td class="px-4 py-3 text-gray-500">{student.email ?? '—'}</td>
                  <td class="px-4 py-3 text-gray-500">{student.gradeLevel ?? '—'}</td>
                  <td class="px-4 py-3">
                    {#if generatedForId === student.id && generatedPin}
                      <span class="font-mono text-sm font-bold text-green-700">{generatedPin}</span>
                    {:else if pinMap.get(student.id)}
                      <span class="text-xs text-green-600">Set</span>
                    {:else}
                      <form method="POST" action="?/generatePin" class="inline">
                        <input type="hidden" name="personId" value={student.id} />
                        <button type="submit" class="text-xs text-forge-blue hover:underline"
                          >Generate</button
                        >
                      </form>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      class="text-xs text-green-600 hover:underline"
                      onclick={() => startEdit(student)}>Edit</button
                    >
                    <form method="POST" action="?/removeStudent" class="ml-2 inline">
                      <input type="hidden" name="personId" value={student.id} />
                      <button type="submit" class="text-xs text-red-600 hover:underline"
                        >Remove</button
                      >
                    </form>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- PIN Management -->
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 class="mb-3 text-lg font-semibold text-gray-900">PIN Management</h2>
    <p class="mb-4 text-sm text-gray-500">
      Classroom code: <span class="font-mono font-bold">{data.classroom.displayCode}</span>
    </p>
    <form method="POST" action="?/generateAllPins">
      <Button type="submit" size="sm" variant="secondary">Generate PINs for All Students</Button>
    </form>
  </div>
</div>
