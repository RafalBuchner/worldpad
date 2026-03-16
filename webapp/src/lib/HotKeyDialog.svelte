<script>
  import {
    SYSTEM_KEY_SYMBOLS,
    SHIFT_FIX,
    BROWSER_KEY_TO_INTERNAL,
    parseShortcutText,
  } from "./keyMappings.js";

  let { onok, oncancel } = $props();

  let capturedKeys = $state([]);
  let inputEl = $state(null);

  const displayText = $derived(capturedKeys.join("+"));

  $effect(() => {
    if (inputEl) setTimeout(() => inputEl.focus(), 0);
  });

  function handleKeyDown(event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key;
    const MODIFIER_MAP = {
      Control: "Control",
      Shift: "Shift",
      Alt: "Option",
      Meta: "Command",
    };

    if (MODIFIER_MAP[key]) {
      capturedKeys = [
        SYSTEM_KEY_SYMBOLS[MODIFIER_MAP[key]] ?? MODIFIER_MAP[key],
      ];
      return;
    }

    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Control");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.altKey) modifiers.push("Option");
    if (event.metaKey) modifiers.push("Command");

    let mainKey =
      BROWSER_KEY_TO_INTERNAL[key] ??
      (key.length === 1 ? key.toUpperCase() : key);
    if (event.shiftKey && SHIFT_FIX[key]) mainKey = SHIFT_FIX[key];

    capturedKeys = [...modifiers, mainKey].map(
      (k) => SYSTEM_KEY_SYMBOLS[k] ?? k,
    );
  }

  function clear() {
    capturedKeys = [];
    inputEl?.focus();
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center">
  <button
    class="absolute inset-0 bg-black/30 cursor-default"
    onclick={oncancel}
    aria-label="Close"
  ></button>

  <div class="relative z-10 bg-base-100 rounded-box shadow-xl p-6 w-80">
    <h3 class="font-bold text-lg mb-4">Set Hotkey</h3>
    <input
      bind:this={inputEl}
      type="text"
      class="input input-bordered w-full font-mono"
      value={displayText}
      readonly
      onkeydown={handleKeyDown}
      placeholder="Press a key combination…"
    />
    <input
      type="text"
      class="input input-bordered input-sm w-full font-mono mt-2"
      placeholder="or type: cmd+2, ctrl+shift+z…"
      onkeydown={(e) => {
        if (e.key === "Enter") {
          const parsed = parseShortcutText(e.currentTarget.value);
          if (parsed.length > 0) capturedKeys = parsed;
        } else if (e.key === "Escape") {
          oncancel();
        } else {
          e.stopPropagation();
        }
      }}
    />
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn btn-ghost btn-sm" onclick={clear}>clear</button>
      <button class="btn btn-ghost" onclick={oncancel}>cancel</button>
      <button
        class="btn btn-primary"
        disabled={capturedKeys.length === 0}
        onclick={() => onok([...capturedKeys])}>ok</button
      >
    </div>
  </div>
</div>
