<script>
  import {
    DEFAULT_HOTKEYS,
    DEFAULT_ENCODERS,
    convertAdafruitConfigToSymbolic,
    convertSymbolicConfigToAdafruit
  } from './lib/keyMappings.js';
  import HotKeyDialog from './lib/HotKeyDialog.svelte';
  import TextDialog from './lib/TextDialog.svelte';

  // Deep-copy defaults to avoid mutating the exported constants
  let hotkeys = $state(DEFAULT_HOTKEYS.map(h => [...h]));
  let encoders = $state(DEFAULT_ENCODERS.map(e => ({
    name: e.name,
    hotkeys: e.hotkeys.map(h => [...h])
  })));

  let selectedEncoderRow = $state(DEFAULT_ENCODERS.length > 0 ? 0 : -1);

  // Active dialog: null | { callback: fn } for hotkey, { callback: fn, initialValue: str } for text
  let hotKeyDialog = $state(null);
  let textDialog = $state(null);

  // --- Key button grid ---
  // Each entry: [keyIndex (0-based), gridRow, gridCol, colSpan]
  // Mirrors the PyQt5 layout:
  //   rows 1-3: 5 keys each, 1 col wide
  //   row 4:    key 16 spans 2 cols, keys 17-19 are 1 col each
  //   row 5:    keys 20-22 are 1 col each, key 23 spans 2 cols
  const KEY_LAYOUT = [
    [0, 1, 1, 1], [1, 1, 2, 1], [2, 1, 3, 1], [3, 1, 4, 1], [4, 1, 5, 1],
    [5, 2, 1, 1], [6, 2, 2, 1], [7, 2, 3, 1], [8, 2, 4, 1], [9, 2, 5, 1],
    [10, 3, 1, 1], [11, 3, 2, 1], [12, 3, 3, 1], [13, 3, 4, 1], [14, 3, 5, 1],
    [15, 4, 1, 2], [16, 4, 3, 1], [17, 4, 4, 1], [18, 4, 5, 1],
    [19, 5, 1, 1], [20, 5, 2, 1], [21, 5, 3, 1], [22, 5, 4, 2]
  ];

  // Max hotkey columns needed across all encoders
  const maxHotkeys = $derived(
    encoders.length === 0 ? 0 : Math.max(...encoders.map(e => e.hotkeys.length), 0)
  );

  // --- Dialog helpers ---

  function openHotKeyDialog(onOk) {
    hotKeyDialog = {
      callback: (keys) => {
        onOk(keys);
        hotKeyDialog = null;
      }
    };
  }

  function openTextDialog(onOk, initialValue = '') {
    textDialog = {
      callback: (value) => {
        onOk(value);
        textDialog = null;
      },
      initialValue
    };
  }

  // --- Key button click ---

  function onKeyButtonClick(keyIndex) {
    openHotKeyDialog((keys) => {
      hotkeys[keyIndex] = keys;
    });
  }

  // --- Encoder table interactions ---

  function onEncoderNameDblClick(encoderIdx) {
    openTextDialog((newName) => {
      encoders[encoderIdx].name = newName;
    }, encoders[encoderIdx].name);
  }

  function onEncoderHotkeyDblClick(encoderIdx, hotkeyIdx) {
    openHotKeyDialog((keys) => {
      if (hotkeyIdx >= encoders[encoderIdx].hotkeys.length) {
        encoders[encoderIdx].hotkeys.push(keys);
      } else {
        encoders[encoderIdx].hotkeys[hotkeyIdx] = keys;
      }
    });
  }

  function removeEncoder(idx) {
    encoders.splice(idx, 1);
    if (selectedEncoderRow >= encoders.length) {
      selectedEncoderRow = encoders.length - 1;
    }
  }

  function tableKeyDown(event) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedEncoderRow >= 0 && selectedEncoderRow < encoders.length) {
        removeEncoder(selectedEncoderRow);
      }
    }
  }

  // --- Toolbar buttons ---

  function addEncoder() {
    encoders.push({ name: 'new encoder', hotkeys: [] });
    selectedEncoderRow = encoders.length - 1;
  }

  function addHotkey() {
    if (selectedEncoderRow < 0 || selectedEncoderRow >= encoders.length) return;
    const idx = selectedEncoderRow;
    openHotKeyDialog((keys) => {
      encoders[idx].hotkeys.push(keys);
    });
  }

  // --- Load / Save ---

  let fileInput = $state(null);

  function onFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const converted = convertAdafruitConfigToSymbolic(data);
        hotkeys = converted.shortcuts;
        encoders = Object.entries(converted.wheels).map(([name, hks]) => ({
          name,
          hotkeys: hks
        }));
        selectedEncoderRow = encoders.length > 0 ? 0 : -1;
      } catch (err) {
        alert('Error loading file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function saveToFile() {
    const config = convertSymbolicConfigToAdafruit(hotkeys, encoders);
    const json = JSON.stringify(config, null, 1);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preset.json';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<h1>BlastPad</h1>

<hr />

<!-- Key Action Grid: 5-column CSS grid matching the physical key layout -->
<div style="display:grid; grid-template-columns: repeat(5, auto);">
  {#each KEY_LAYOUT as [keyIdx, , , span]}
    <button
      style="grid-column: span {span};"
      onclick={() => onKeyButtonClick(keyIdx)}
    >
      {hotkeys[keyIdx].join('+')}
    </button>
  {/each}
</div>

<hr />

<!-- Encoder Table -->
<div role="grid" tabindex="0" onkeydown={tableKeyDown}>
  <table>
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
          onclick={() => { selectedEncoderRow = rowIdx; }}
          style={rowIdx === selectedEncoderRow ? 'outline: 1px solid black;' : ''}
        >
          <td ondblclick={() => onEncoderNameDblClick(rowIdx)}>
            {encoder.name}
          </td>
          {#each Array(maxHotkeys) as _, colIdx}
            <td ondblclick={() => onEncoderHotkeyDblClick(rowIdx, colIdx)}>
              {encoder.hotkeys[colIdx]?.join('+') ?? ''}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div>
  <button onclick={addEncoder}>add encoder</button>
  <button onclick={addHotkey}>add hotkey</button>
  <input bind:this={fileInput} type="file" accept=".json" onchange={onFileChange} style="display:none;" />
  <button onclick={() => fileInput.click()}>load</button>
  <button onclick={saveToFile}>save</button>
</div>

<!-- HotKey Dialog -->
{#if hotKeyDialog}
  <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; border:1px solid black; padding:8px;">
    <HotKeyDialog
      onok={hotKeyDialog.callback}
      oncancel={() => { hotKeyDialog = null; }}
    />
  </div>
{/if}

<!-- Text Dialog -->
{#if textDialog}
  <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; border:1px solid black; padding:8px;">
    <TextDialog
      onok={textDialog.callback}
      oncancel={() => { textDialog = null; }}
      initialValue={textDialog.initialValue}
    />
  </div>
{/if}
