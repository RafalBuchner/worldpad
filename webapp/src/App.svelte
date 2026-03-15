<script>
  import {
    DEFAULT_HOTKEYS,
    DEFAULT_ENCODERS,
    convertAdafruitConfigToSymbolic,
    convertSymbolicConfigToAdafruit,
    SYSTEM_KEY_SYMBOLS,
    SHIFT_FIX,
    BROWSER_KEY_TO_INTERNAL,
  } from "./lib/keyMappings.js";
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
  const KEY_LAYOUT = [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [7, 1],
    [8, 1],
    [9, 1],
    [10, 1],
    [11, 1],
    [12, 1],
    [13, 1],
    [14, 1],
    [15, 2],
    [16, 1],
    [17, 1],
    [18, 1],
    [19, 1],
    [20, 1],
    [21, 1],
    [22, 2],
  ];

  // Special key picker groups (shared by both chip editors)
  const SPECIAL_KEY_GROUPS = [
    {
      label: "Modifiers",
      keys: [
        { sym: "⌘", name: "Cmd" },
        { sym: "⌃", name: "Ctrl" },
        { sym: "⇧", name: "Shift" },
        { sym: "⌥", name: "Option" },
      ],
    },
    {
      label: "Keys",
      keys: [
        { sym: "↵", name: "Return" },
        { sym: "⌤", name: "Enter" },
        { sym: "⎋", name: "Esc" },
        { sym: "⌫", name: "Backspace" },
        { sym: "⌦", name: "Delete" },
        { sym: "⇥", name: "Tab" },
        { sym: "⇪", name: "Caps Lock" },
        { sym: "Space", name: "Space" },
      ],
    },
    {
      label: "Navigation",
      keys: [
        { sym: "↑", name: "Up" },
        { sym: "↓", name: "Down" },
        { sym: "←", name: "Left" },
        { sym: "→", name: "Right" },
        { sym: "↖", name: "Home" },
        { sym: "↘", name: "End" },
        { sym: "⇞", name: "Page Up" },
        { sym: "⇟", name: "Page Down" },
      ],
    },
    {
      label: "F-keys",
      keys: Array.from({ length: 12 }, (_, i) => ({
        sym: `F${i + 1}`,
        name: `F${i + 1}`,
      })),
    },
    {
      label: "0–9",
      keys: Array.from({ length: 10 }, (_, i) => ({
        sym: String(i),
        name: String(i),
      })),
    },
  ];

  // Shared key capture logic — returns chip array from a keyboard event, or null for modifier-only
  function buildChipsFromEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    const key = event.key;
    const MODIFIER_MAP = {
      Control: "Control",
      Shift: "Shift",
      Alt: "Option",
      Meta: "Command",
    };
    if (MODIFIER_MAP[key]) return null; // modifier-only: caller shows preview
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Control");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.altKey) modifiers.push("Option");
    if (event.metaKey) modifiers.push("Command");
    let mainKey =
      BROWSER_KEY_TO_INTERNAL[key] ??
      (key.length === 1 ? key.toUpperCase() : key);
    if (event.shiftKey && SHIFT_FIX[key]) mainKey = SHIFT_FIX[key];
    return [...modifiers, mainKey].map((k) => SYSTEM_KEY_SYMBOLS[k] ?? k);
  }

  // --- Key button inline capture ---
  let editingKeyIndex = $state(null);
  let pickedKeys = $state([]);
  let captureInputEl = $state(null);
  let showKeyPicker = $state(false);

  function startEditing(keyIdx) {
    cancelEncoderHotkey();
    editingKeyIndex = keyIdx;
    pickedKeys = [];
    showKeyPicker = false;
    setTimeout(() => captureInputEl?.focus(), 0);
  }

  function cancelEditing() {
    editingKeyIndex = null;
    pickedKeys = [];
    showKeyPicker = false;
  }

  function confirmEditing() {
    if (pickedKeys.length > 0) {
      hotkeys[editingKeyIndex] = [...pickedKeys];
      cancelEditing();
    }
  }

  function appendToPickedKey(sym) {
    pickedKeys = [...pickedKeys, sym];
    captureInputEl?.focus();
  }

  function captureKeyForButton(event) {
    const MODIFIER_MAP = {
      Control: "Control",
      Shift: "Shift",
      Alt: "Option",
      Meta: "Command",
    };
    if (MODIFIER_MAP[event.key]) {
      event.preventDefault();
      event.stopPropagation();
      pickedKeys = [
        SYSTEM_KEY_SYMBOLS[MODIFIER_MAP[event.key]] ?? MODIFIER_MAP[event.key],
      ];
      return;
    }
    const chips = buildChipsFromEvent(event);
    if (chips) pickedKeys = chips;
  }

  // --- Encoder inline editing ---
  let editingEncoderName = $state(null); // rowIdx or null
  let editingEncoderNameValue = $state("");
  let editingEncoderHotkey = $state(null); // { rowIdx, colIdx } or null
  let encoderPickedKeys = $state([]);
  let encoderShowPicker = $state(false);
  let encoderCaptureInputEl = $state(null);

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
    encoderShowPicker = false;
    setTimeout(() => encoderCaptureInputEl?.focus(), 0);
  }

  function cancelEncoderHotkey() {
    editingEncoderHotkey = null;
    encoderPickedKeys = [];
    encoderShowPicker = false;
  }

  function confirmEncoderHotkey() {
    if (encoderPickedKeys.length > 0 && editingEncoderHotkey !== null) {
      const { rowIdx, colIdx } = editingEncoderHotkey;
      if (colIdx >= encoders[rowIdx].hotkeys.length) {
        encoders[rowIdx].hotkeys.push([...encoderPickedKeys]);
      } else {
        encoders[rowIdx].hotkeys[colIdx] = [...encoderPickedKeys];
      }
      cancelEncoderHotkey();
    }
  }

  function appendToEncoderPickedKey(sym) {
    encoderPickedKeys = [...encoderPickedKeys, sym];
    encoderCaptureInputEl?.focus();
  }

  function captureKeyForEncoder(event) {
    const MODIFIER_MAP = {
      Control: "Control",
      Shift: "Shift",
      Alt: "Option",
      Meta: "Command",
    };
    if (MODIFIER_MAP[event.key]) {
      event.preventDefault();
      event.stopPropagation();
      encoderPickedKeys = [
        SYSTEM_KEY_SYMBOLS[MODIFIER_MAP[event.key]] ?? MODIFIER_MAP[event.key],
      ];
      return;
    }
    const chips = buildChipsFromEvent(event);
    if (chips) encoderPickedKeys = chips;
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
    // Start editing the name immediately
    startEditingEncoderName(encoders.length - 1);
  }

  function addHotkey() {
    if (selectedEncoderRow < 0 || selectedEncoderRow >= encoders.length) return;
    startEditingEncoderHotkey(
      selectedEncoderRow,
      encoders[selectedEncoderRow].hotkeys.length,
    );
  }

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
</script>

<!-- Fixed top-left logo -->
<div
  class="fixed left-0 top-0 w-72 p-6 text-base-content [&>svg]:w-full [&>svg]:h-auto pointer-events-none"
>
  {@html logoSvg}
</div>

<div class="min-h-screen bg-base-200 p-6">
  <div class="max-w-2xl mx-auto space-y-4">
    <!-- Key Actions -->
    <div class="card bg-base-100 shadow">
      <div class="card-body gap-3">
        <h2 class="card-title text-base">Key Actions</h2>

        <!-- Hidden input: the real keyboard capture target for key buttons -->
        <input
          bind:this={captureInputEl}
          class="sr-only"
          type="text"
          readonly
          tabindex="-1"
          onkeydown={captureKeyForButton}
        />

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
              class="rounded w-full text-sm font-mono leading-tight p-1 cursor-pointer
                     flex items-center justify-center text-center transition-all
                     {span === 1 ? 'aspect-[3/2]' : ''}
                     {isEditing
                ? 'relative z-20 bg-primary text-primary-content border-2 border-primary animate-pulse'
                : 'bg-base-100 border border-base-300 hover:bg-base-200 active:translate-y-px'}"
              style="grid-column: span {span};"
              onclick={() => startEditing(keyIdx)}
            >
              {#if isEditing}
                {pickedKeys.length > 0 ? pickedKeys.join("+") : "…"}
              {:else}
                {hotkeys[keyIdx].join("+")}
              {/if}
            </button>
          {/each}
        </div>

        {#if editingKeyIndex !== null}
          <div class="relative z-20 space-y-2">
            <div
              class="flex flex-wrap items-center gap-1.5 min-h-9 px-2 py-1.5 bg-base-200 rounded-box border border-base-300"
            >
              {#each pickedKeys as key, i}
                {#if i > 0}<span
                    class="text-base-content/30 text-xs select-none font-mono"
                    >+</span
                  >{/if}
                <button
                  class="badge badge-neutral font-mono text-sm h-auto py-0.5 px-2 gap-1 cursor-pointer hover:badge-error transition-colors"
                  onclick={() => {
                    pickedKeys = pickedKeys.filter((_, j) => j !== i);
                    captureInputEl?.focus();
                  }}
                  title="Click to remove"
                  >{key} <span class="opacity-40 text-xs">×</span></button
                >
              {/each}
              {#if pickedKeys.length === 0}
                <span class="text-base-content/30 text-xs italic"
                  >press a key or pick from below…</span
                >
              {/if}
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn btn-xs btn-ghost"
                onclick={() => {
                  showKeyPicker = !showKeyPicker;
                  captureInputEl?.focus();
                }}
              >
                keys {showKeyPicker ? "▴" : "▾"}
              </button>
              <button
                class="btn btn-xs btn-primary"
                disabled={pickedKeys.length === 0}
                onclick={confirmEditing}>set</button
              >
              <button class="btn btn-xs btn-error" onclick={cancelEditing}
                >cancel</button
              >
            </div>
            {#if showKeyPicker}
              <div
                class="bg-base-200 rounded-box border border-base-300 p-3 space-y-2"
              >
                {#each SPECIAL_KEY_GROUPS as group}
                  <div>
                    <p
                      class="text-[10px] text-base-content/40 uppercase tracking-wide mb-1"
                    >
                      {group.label}
                    </p>
                    <div class="flex flex-wrap gap-1">
                      {#each group.keys as key}
                        <button
                          class="btn btn-xs h-auto py-1 px-1.5 font-mono flex flex-col gap-0 min-w-10"
                          onclick={() => appendToPickedKey(key.sym)}
                        >
                          <span class="text-sm leading-none">{key.sym}</span>
                          {#if key.name !== key.sym}<span
                              class="text-[9px] opacity-50 font-sans normal-case leading-tight"
                              >{key.name}</span
                            >{/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <p class="text-xs text-base-content/50">
            Click a key then press your desired combination.
          </p>
        {/if}
      </div>
    </div>

    <!-- Encoder Actions -->
    <div class="card bg-base-100 shadow">
      <div class="card-body gap-3">
        <h2 class="card-title text-base">Encoder Actions</h2>

        <!-- Hidden input: keyboard capture target for encoder hotkeys -->
        <input
          bind:this={encoderCaptureInputEl}
          class="sr-only"
          type="text"
          readonly
          tabindex="-1"
          onkeydown={captureKeyForEncoder}
        />

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
              <tr>
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
                  <!-- Name cell: inline editing on double-click -->
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
                  <!-- Hotkey cells: chip editor opens below on double-click -->
                  {#each Array(maxHotkeys) as _, colIdx}
                    {@const isActive =
                      editingEncoderHotkey?.rowIdx === rowIdx &&
                      editingEncoderHotkey?.colIdx === colIdx}
                    <td
                      class="font-mono"
                      class:relative={isActive}
                      class:z-20={isActive}
                      class:ring={isActive}
                      class:ring-primary={isActive}
                      class:rounded={isActive}
                      ondblclick={() =>
                        startEditingEncoderHotkey(rowIdx, colIdx)}
                      onclick={(e) => e.stopPropagation()}
                    >
                      {encoder.hotkeys[colIdx]?.join("+") ?? ""}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if editingEncoderHotkey !== null}
          <!-- Encoder chip editor -->
          <div class="relative z-20 space-y-2">
            <div
              class="flex flex-wrap items-center gap-1.5 min-h-9 px-2 py-1.5 bg-base-200 rounded-box border border-base-300"
            >
              {#each encoderPickedKeys as key, i}
                {#if i > 0}<span
                    class="text-base-content/30 text-xs select-none font-mono"
                    >+</span
                  >{/if}
                <button
                  class="badge badge-neutral font-mono text-sm h-auto py-0.5 px-2 gap-1 cursor-pointer hover:badge-error transition-colors"
                  onclick={() => {
                    encoderPickedKeys = encoderPickedKeys.filter(
                      (_, j) => j !== i,
                    );
                    encoderCaptureInputEl?.focus();
                  }}
                  title="Click to remove"
                  >{key} <span class="opacity-40 text-xs">×</span></button
                >
              {/each}
              {#if encoderPickedKeys.length === 0}
                <span class="text-base-content/30 text-xs italic"
                  >press a key or pick from below…</span
                >
              {/if}
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn btn-xs btn-ghost"
                onclick={() => {
                  encoderShowPicker = !encoderShowPicker;
                  encoderCaptureInputEl?.focus();
                }}
              >
                keys {encoderShowPicker ? "▴" : "▾"}
              </button>
              <button
                class="btn btn-xs btn-primary"
                disabled={encoderPickedKeys.length === 0}
                onclick={confirmEncoderHotkey}>set</button
              >
              <button class="btn btn-xs btn-error" onclick={cancelEncoderHotkey}
                >cancel</button
              >
            </div>
            {#if encoderShowPicker}
              <div
                class="bg-base-200 rounded-box border border-base-300 p-3 space-y-2"
              >
                {#each SPECIAL_KEY_GROUPS as group}
                  <div>
                    <p
                      class="text-[10px] text-base-content/40 uppercase tracking-wide mb-1"
                    >
                      {group.label}
                    </p>
                    <div class="flex flex-wrap gap-1">
                      {#each group.keys as key}
                        <button
                          class="btn btn-xs h-auto py-1 px-1.5 font-mono flex flex-col gap-0 min-w-10"
                          onclick={() => appendToEncoderPickedKey(key.sym)}
                        >
                          <span class="text-sm leading-none">{key.sym}</span>
                          {#if key.name !== key.sym}<span
                              class="text-[9px] opacity-50 font-sans normal-case leading-tight"
                              >{key.name}</span
                            >{/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
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

    <!-- Load / Save -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-wrap gap-2 items-center">
          <input
            bind:this={fileInput}
            type="file"
            accept=".json"
            class="hidden"
            onchange={onFileChange}
          />
          <button
            class="btn btn-sm btn-outline"
            onclick={() => fileInput.click()}>load</button
          >
          <div class="flex gap-1 items-center">
            <input
              type="text"
              class="input input-bordered input-sm w-36"
              bind:value={saveFileName}
              placeholder="filename"
            />
            <span class="text-base-content/40 text-sm">.json</span>
          </div>
          <button class="btn btn-sm btn-primary" onclick={saveToFile}
            >save</button
          >
        </div>
      </div>
    </div>
  </div>
</div>
