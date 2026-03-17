<script>
  import {
    DEFAULT_HOTKEYS,
    DEFAULT_ENCODERS,
    convertAdafruitConfigToSymbolic,
    convertSymbolicConfigToAdafruit,
  } from "./lib/keyMappings.js";
  import { fmtKey } from "./lib/chipUtils.js";
  import ChipEditor from "./lib/ChipEditor.svelte";
  import Tour from "./lib/Tour.svelte";
  import logoSvg from "./lib/worldpad-logo.svg?raw";
  import helpArrowSvg from "./lib/help-arrow.svg?raw";

  let showTour = $state(false);
  let showHint = $state(!localStorage.getItem("worldpad-tour-seen"));

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
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    [15, 2],
    16,
    17,
    18,
    19,
    20,
    21,
    [22, 2],
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
  let fileMenuOpen = $state(false);
  let showSaveDialog = $state(false);
  let saveDialogInput = $state(null);

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

  function handleGlobalKeydown(e) {
    if (e.key === "Escape" && showSaveDialog) { showSaveDialog = false; return; }
    if (!(e.metaKey || e.ctrlKey)) return;
    if (e.key === "s") { e.preventDefault(); openSaveDialog(); }
    if (e.key === "o") { e.preventDefault(); fileInput?.click(); }
  }

  function openSaveDialog() {
    fileMenuOpen = false;
    showSaveDialog = true;
    setTimeout(() => { saveDialogInput?.select(); }, 0);
  }

  async function confirmSave() {
    showSaveDialog = false;
    const config = convertSymbolicConfigToAdafruit(hotkeys, encoders);
    const json = JSON.stringify(config, null, 1);
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: (saveFileName.trim() || "preset") + ".json",
          types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (saveFileName.trim() || "preset") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<!-- Mobile message -->
<div class="sm:hidden fixed inset-0 z-[999] bg-base-200 flex flex-col items-center justify-center gap-6 p-8 text-center">
  <div class="w-48 text-primary [&>svg]:w-full [&>svg]:h-auto">
    {@html logoSvg}
  </div>
  <p class="text-base-content/60 text-sm leading-relaxed">
    WorldPad is designed to be used on a computer.<br/>Please open it on a desktop or laptop.
  </p>
</div>

<!-- Desktop app (hidden on mobile) -->
<div class="hidden sm:contents">

<!-- Fixed top-left logo -->
<div class="fixed left-0 top-0 w-72 p-6 text-primary [&>svg]:w-full [&>svg]:h-auto pointer-events-none z-40">
  {@html logoSvg}
</div>

<!-- Tour trigger -->
<button
  class="fixed top-4 right-4 z-50 w-7 h-7 rounded-full border border-primary text-primary/60 hover:text-primary transition-colors text-sm font-mono"
  onclick={() => { showTour = true; showHint = false; localStorage.setItem("worldpad-tour-seen", "1"); }}
  title="Show tutorial">?</button>

<!-- Menu bar -->
<div class="fixed top-0 left-0 right-0 z-50 px-8 pointer-events-none">
  <div
    id="tour-save"
    class="max-w-2xl mx-auto h-9 bg-base-100/90 backdrop-blur-sm border-x border-b border-base-300 rounded-b flex items-center px-3 gap-1 pointer-events-auto"
  >
    <!-- File menu -->
    <div class="relative">
      <button
        class="px-2 py-0.5 text-sm rounded hover:bg-base-200 transition-colors font-mono"
        onclick={() => (fileMenuOpen = !fileMenuOpen)}
      >File</button>
      {#if fileMenuOpen}
        <button class="fixed inset-0 z-[-1] cursor-default" onclick={() => (fileMenuOpen = false)} aria-label="Close menu"></button>
        <div class="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded shadow-lg py-1 min-w-36 z-10">
          <button
            class="w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 transition-colors font-mono flex justify-between items-center gap-6"
            onclick={openSaveDialog}
          >Save <span class="text-base-content/30 text-xs">⌘S</span></button>
          <button
            class="w-full text-left px-4 py-1.5 text-sm hover:bg-base-200 transition-colors font-mono flex justify-between items-center gap-6"
            onclick={() => { fileMenuOpen = false; fileInput.click(); }}
          >Open <span class="text-base-content/30 text-xs">⌘O</span></button>
        </div>
      {/if}
    </div>
  </div>
</div>

<input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={onFileChange} />

<!-- Help arrow hint (shown until tour is first opened) -->
{#if showHint}
  <div
    class="fixed z-[51] pointer-events-none text-primary"
    style="top: 23px; right: 42px; width: 440px;"
  >
    {@html helpArrowSvg}
  </div>
{/if}

{#if showTour}
  <Tour
    onClose={() => {
      showTour = false;
      localStorage.setItem("worldpad-tour-seen", "1");
    }}
  />
{/if}

<div class="min-h-screen bg-base-200 pt-14 p-8">
  <div class="max-w-2xl mx-auto space-y-4">
    <!-- Key Actions -->
    <div id="tour-keyboard" class="card bg-base-100 border border-base-300">
      <div class="card-body gap-3">
        <h2
          class="text-xs font-semibold uppercase tracking-widest text-primary mb-1"
        >
          Key Actions
        </h2>

        {#if editingKeyIndex !== null}
          <button
            class="fixed inset-0 z-10 cursor-default"
            onclick={cancelEditing}
            aria-label="Cancel key capture"
          ></button>
        {/if}

        <div
          class="grid gap-1 w-full"
          style="grid-template-columns: repeat(5, 1fr);"
        >
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
                {@html pickedKeys.length > 0
                  ? pickedKeys.map(fmtKey).join("+")
                  : "…"}
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
    <div id="tour-encoders" class="card bg-base-100 border border-base-300">
      <div class="card-body gap-3">
        <h2
          class="text-xs font-semibold uppercase tracking-widest text-primary mb-1"
        >
          Encoder Actions
        </h2>

        {#if editingEncoderHotkey !== null}
          <button
            class="fixed inset-0 z-10 cursor-default"
            onclick={cancelEncoderHotkey}
            aria-label="Cancel hotkey capture"
          ></button>
        {/if}

        <div
          class="overflow-x-auto outline-none"
          role="grid"
          tabindex="0"
          onkeydown={tableKeyDown}
        >
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
                  onclick={() => {
                    selectedEncoderRow = rowIdx;
                  }}
                >
                  <td
                    class="cursor-text"
                    title="Double-click to edit name"
                    ondblclick={() => startEditingEncoderName(rowIdx)}
                  >
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
                      class="font-mono text-xl tracking-widest cursor-text"
                      class:relative={isActive}
                      class:z-20={isActive}
                      class:ring={isActive}
                      class:ring-primary={isActive}
                      class:rounded={isActive}
                      title="Double-click to edit hotkey"
                      ondblclick={() =>
                        startEditingEncoderHotkey(rowIdx, colIdx)}
                      onclick={(e) => e.stopPropagation()}
                    >
                      {@html encoder.hotkeys[colIdx]?.map(fmtKey).join("+") ??
                        ""}
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
              add hotkey{selectedEncoderName
                ? ` to "${selectedEncoderName}"`
                : ""}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>


{#if showSaveDialog}
  <button class="fixed inset-0 z-[60] bg-black/40" onclick={() => (showSaveDialog = false)} aria-label="Cancel"></button>
  <div class="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
    <div
      class="bg-base-100 border border-base-300 rounded-xl shadow-2xl p-6 w-80 pointer-events-auto"
      role="dialog"
    >
      <p class="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Save preset</p>
      <div class="flex items-center gap-1 mb-4">
        <input
          bind:this={saveDialogInput}
          type="text"
          class="input input-bordered input-sm flex-1 font-mono"
          bind:value={saveFileName}
          placeholder="preset"
          onkeydown={(e) => { if (e.key === "Enter") confirmSave(); else if (e.key === "Escape") showSaveDialog = false; }}
        />
        <span class="text-base-content/40 text-sm font-mono">.json</span>
      </div>
      <div class="flex justify-end gap-2">
        <button class="btn btn-sm btn-ghost" onclick={() => (showSaveDialog = false)}>cancel</button>
        <button class="btn btn-sm btn-primary" onclick={confirmSave}>save</button>
      </div>
    </div>
  </div>
{/if}

</div><!-- end desktop wrapper -->
