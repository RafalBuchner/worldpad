<script>
  import {
    DEFAULT_HOTKEYS,
    DEFAULT_ENCODERS,
    convertAdafruitConfigToSymbolic,
    convertSymbolicConfigToAdafruit,
  } from "./lib/keyMappings.js";
  import { fmtKey } from "./lib/chipUtils.js";
  import ChipEditor from "./lib/ChipEditor.svelte";
  import logoSvg from "./lib/worldpad-logo.svg?raw";

  // --- Persist state in localStorage ---
  function loadStoredState() {
    try {
      const raw = localStorage.getItem("worldpad-state");
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  const stored = loadStoredState();

  let hotkeys = $state(stored?.hotkeys ?? DEFAULT_HOTKEYS.map((h) => [...h]));
  let encoders = $state(
    stored?.encoders ??
      DEFAULT_ENCODERS.map((e) => ({
        name: e.name,
        hotkeys: e.hotkeys.map((h) => [...h]),
      })),
  );

  $effect(() => {
    localStorage.setItem(
      "worldpad-state",
      JSON.stringify({ hotkeys, encoders }),
    );
  });

  let selectedEncoderRow = $state(DEFAULT_ENCODERS.length > 0 ? 0 : -1);

  // --- Key button grid ---
  // Each entry is [keyIndex, colSpan]; span defaults to 1
  const KEY_LAYOUT = [
     0,  1,  2,  3,  4,
     5,  6,  7,  8,  9,
    10, 11, 12, 13, 14,
    [15, 2], 16, 17, 18,
    19, 20, 21, [22, 2],
  ].map((v) => (Array.isArray(v) ? v : [v, 1]));

  // --- Key button inline capture ---
  let editingKeyIndex = $state(null);
  let pickedKeys = $state([]);

  function startEditing(keyIdx) {
    cancelEncoderHotkey();
    editingKeyIndex = keyIdx;
    pickedKeys = [...(hotkeys[keyIdx] ?? [])];
  }

  function cancelEditing() {
    editingKeyIndex = null;
    pickedKeys = [];
  }

  function confirmEditing() {
    if (pickedKeys.length > 0) {
      hotkeys[editingKeyIndex] = [...pickedKeys];
    }
    cancelEditing();
  }

  // --- Encoder inline editing ---
  let editingEncoderName = $state(null); // rowIdx or null
  let editingEncoderNameValue = $state("");
  let editingEncoderHotkey = $state(null); // { rowIdx, colIdx } or null
  let encoderPickedKeys = $state([]);

  function startEditingEncoderName(rowIdx) {
    cancelEncoderHotkey();
    editingEncoderName = rowIdx;
    editingEncoderNameValue = encoders[rowIdx].name;
  }

  function confirmEncoderName() {
    if (editingEncoderName !== null) {
      const trimmed = editingEncoderNameValue.trim();
      if (trimmed) encoders[editingEncoderName].name = trimmed;
      editingEncoderName = null;
    }
  }

  function cancelEncoderName() {
    editingEncoderName = null;
  }

  function startEditingEncoderHotkey(rowIdx, colIdx) {
    cancelEncoderName();
    selectedEncoderRow = rowIdx;
    editingEncoderHotkey = { rowIdx, colIdx };
    encoderPickedKeys = [...(encoders[rowIdx].hotkeys[colIdx] ?? [])];
  }

  function cancelEncoderHotkey() {
    editingEncoderHotkey = null;
    encoderPickedKeys = [];
  }

  function confirmEncoderHotkey() {
    if (editingEncoderHotkey !== null) {
      const { rowIdx, colIdx } = editingEncoderHotkey;
      if (encoderPickedKeys.length === 0) {
        encoders[rowIdx].hotkeys.splice(colIdx, 1);
      } else if (colIdx >= encoders[rowIdx].hotkeys.length) {
        encoders[rowIdx].hotkeys.push([...encoderPickedKeys]);
      } else {
        encoders[rowIdx].hotkeys[colIdx] = [...encoderPickedKeys];
      }
      cancelEncoderHotkey();
    }
  }

  function removeEncoder(idx) {
    encoders.splice(idx, 1);
    if (selectedEncoderRow >= encoders.length)
      selectedEncoderRow = encoders.length - 1;
  }

  function tableKeyDown(event) {
    if (editingEncoderName !== null) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      if (selectedEncoderRow >= 0 && selectedEncoderRow < encoders.length) {
        removeEncoder(selectedEncoderRow);
      }
    }
  }

  function addEncoder() {
    encoders.push({ name: "new encoder", hotkeys: [] });
    selectedEncoderRow = encoders.length - 1;
    startEditingEncoderName(encoders.length - 1);
  }

  function addHotkey() {
    if (selectedEncoderRow < 0 || selectedEncoderRow >= encoders.length) return;
    startEditingEncoderHotkey(
      selectedEncoderRow,
      encoders[selectedEncoderRow].hotkeys.length,
    );
  }

  const maxHotkeys = $derived.by(() => {
    let max =
      encoders.length === 0
        ? 0
        : Math.max(...encoders.map((e) => e.hotkeys.length), 0);
    if (editingEncoderHotkey !== null && editingEncoderHotkey.colIdx >= max)
      max = editingEncoderHotkey.colIdx + 1;
    return max;
  });

  function focusOnMount(el) {
    setTimeout(() => el.focus(), 0);
  }

  const selectedEncoderName = $derived(
    selectedEncoderRow >= 0 && encoders[selectedEncoderRow]
      ? encoders[selectedEncoderRow].name
      : null,
  );

  // --- Load / Save ---
  let fileInput = $state(null);
  let saveFileName = $state("preset");

  function onFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    saveFileName = file.name.replace(/\.json$/i, "");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const converted = convertAdafruitConfigToSymbolic(data);
        hotkeys = converted.shortcuts;
        encoders = Object.entries(converted.wheels).map(([name, hks]) => ({
          name,
          hotkeys: hks,
        }));
        selectedEncoderRow = encoders.length > 0 ? 0 : -1;
      } catch (err) {
        alert("Error loading file: " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function saveToFile() {
    const config = convertSymbolicConfigToAdafruit(hotkeys, encoders);
    const json = JSON.stringify(config, null, 1);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (saveFileName.trim() || "preset") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<!-- Fixed top-left logo -->
<div
  class="fixed left-0 top-0 w-72 p-6 text-primary [&>svg]:w-full [&>svg]:h-auto pointer-events-none"
>
  {@html logoSvg}
</div>

<div class="min-h-screen bg-base-200 p-8 pb-16">
  <div class="max-w-2xl mx-auto space-y-4">
    <!-- Key Actions -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body gap-3">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Key Actions
        </h2>

        {#if editingKeyIndex !== null}
          <button
            class="fixed inset-0 z-10 cursor-default"
            onclick={cancelEditing}
            aria-label="Cancel key capture"
          ></button>
        {/if}

        <div class="grid gap-1 w-full" style="grid-template-columns: repeat(5, 1fr);">
          {#each KEY_LAYOUT as [keyIdx, span]}
            {@const isEditing = editingKeyIndex === keyIdx}
            <button
              class="rounded w-full text-lg font-mono leading-tight p-1 cursor-pointer
                     flex items-center justify-center text-center transition-all
                     {span === 1 ? 'aspect-square' : ''}
                     {isEditing
                ? 'relative z-20 bg-primary text-primary-content border-2 border-primary animate-pulse'
                : 'bg-base-100 border border-base-300 hover:bg-white/10 active:translate-y-px text-primary'}"
              style="grid-column: span {span};"
              onclick={() => startEditing(keyIdx)}
            >
              {#if isEditing}
                {@html pickedKeys.length > 0 ? pickedKeys.map(fmtKey).join("+") : "…"}
              {:else}
                {@html hotkeys[keyIdx].map(fmtKey).join("+")}
              {/if}
            </button>
          {/each}
        </div>

        {#if editingKeyIndex !== null}
          <div class="relative z-20">
            <ChipEditor
              bind:pickedKeys
              onConfirm={confirmEditing}
              onCancel={cancelEditing}
              confirmDisabled={pickedKeys.length === 0}
            />
          </div>
        {:else}
          <p class="text-xs text-base-content/50 mt-1">
            Click a key then press your desired combination.
          </p>
        {/if}
      </div>
    </div>

    <!-- Encoder Actions -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body gap-3">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Encoder Actions
        </h2>

        {#if editingEncoderHotkey !== null}
          <button
            class="fixed inset-0 z-10 cursor-default"
            onclick={cancelEncoderHotkey}
            aria-label="Cancel hotkey capture"
          ></button>
        {/if}

        <div class="overflow-x-auto outline-none" role="grid" tabindex="0" onkeydown={tableKeyDown}>
          <table class="table table-zebra table-sm w-full">
            <thead>
              <tr class="text-primary">
                <th>name</th>
                {#each Array(maxHotkeys) as _, i}
                  <th>hotkey {i + 1}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each encoders as encoder, rowIdx}
                <tr
                  class="cursor-pointer"
                  class:bg-primary={rowIdx === selectedEncoderRow}
                  class:text-primary-content={rowIdx === selectedEncoderRow}
                  onclick={() => { selectedEncoderRow = rowIdx; }}
                >
                  <td ondblclick={() => startEditingEncoderName(rowIdx)}>
                    {#if editingEncoderName === rowIdx}
                      <input
                        type="text"
                        class="input input-bordered input-xs w-full"
                        bind:value={editingEncoderNameValue}
                        use:focusOnMount
                        onkeydown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") confirmEncoderName();
                          else if (e.key === "Escape") cancelEncoderName();
                        }}
                        onblur={confirmEncoderName}
                        onclick={(e) => e.stopPropagation()}
                      />
                    {:else}
                      {encoder.name}
                    {/if}
                  </td>
                  {#each Array(maxHotkeys) as _, colIdx}
                    {@const isActive =
                      editingEncoderHotkey?.rowIdx === rowIdx &&
                      editingEncoderHotkey?.colIdx === colIdx}
                    <td
                      class="font-mono text-xl tracking-widest"
                      class:relative={isActive}
                      class:z-20={isActive}
                      class:ring={isActive}
                      class:ring-primary={isActive}
                      class:rounded={isActive}
                      ondblclick={() => startEditingEncoderHotkey(rowIdx, colIdx)}
                      onclick={(e) => e.stopPropagation()}
                    >
                      {@html encoder.hotkeys[colIdx]?.map(fmtKey).join("+") ?? ""}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if editingEncoderHotkey !== null}
          <div class="relative z-20">
            <ChipEditor
              bind:pickedKeys={encoderPickedKeys}
              onConfirm={confirmEncoderHotkey}
              onCancel={cancelEncoderHotkey}
            />
          </div>
        {:else}
          <p class="text-xs text-base-content/50">
            Double-click a cell to edit · Delete/Backspace removes selected row
          </p>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-sm" onclick={addEncoder}>add encoder</button>
            <button
              class="btn btn-sm"
              disabled={selectedEncoderRow < 0}
              onclick={addHotkey}
            >
              add hotkey{selectedEncoderName ? ` to "${selectedEncoderName}"` : ""}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Bottom status bar -->
<div
  class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 px-8 py-2.5 flex items-center justify-end gap-3 text-sm font-mono z-50"
>
  <input
    bind:this={fileInput}
    type="file"
    accept=".json"
    class="hidden"
    onchange={onFileChange}
  />
  <input
    type="text"
    class="bg-transparent text-base-content/50 focus:text-base-content focus:outline-none w-32 transition-colors"
    bind:value={saveFileName}
    placeholder="preset"
  /><span class="text-base-content/30">.json</span>
  <span class="text-base-content/20 select-none">·</span>
  <button
    class="text-base-content/40 hover:text-primary transition-colors"
    onclick={saveToFile}>save</button
  >
  <span class="text-base-content/20 select-none">·</span>
  <button
    class="text-base-content/40 hover:text-base-content transition-colors"
    onclick={() => fileInput.click()}>load</button
  >
</div>
