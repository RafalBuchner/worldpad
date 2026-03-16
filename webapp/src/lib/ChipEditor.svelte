<script>
  import { onMount } from "svelte";
  import { SYSTEM_KEY_SYMBOLS } from "./keyMappings.js";
  import { SPECIAL_KEY_GROUPS, fmtKey, buildChipsFromEvent } from "./chipUtils.js";

  let {
    pickedKeys = $bindable([]),
    onConfirm,
    onCancel,
    confirmDisabled = false,
  } = $props();

  let showPicker = $state(false);
  let captureInputEl = $state(null);

  onMount(() => {
    setTimeout(() => captureInputEl?.focus(), 0);
  });

  function captureKey(event) {
    const MODIFIER_MAP = { Control: "Control", Shift: "Shift", Alt: "Option", Meta: "Command" };
    if (MODIFIER_MAP[event.key]) {
      event.preventDefault();
      event.stopPropagation();
      pickedKeys = [SYSTEM_KEY_SYMBOLS[MODIFIER_MAP[event.key]] ?? MODIFIER_MAP[event.key]];
      return;
    }
    const chips = buildChipsFromEvent(event);
    if (chips) pickedKeys = chips;
  }

  function appendKey(sym) {
    pickedKeys = [...pickedKeys, sym];
    captureInputEl?.focus();
  }

  function removeKey(i) {
    pickedKeys = pickedKeys.filter((_, j) => j !== i);
    captureInputEl?.focus();
  }
</script>

<input
  bind:this={captureInputEl}
  class="sr-only"
  type="text"
  readonly
  tabindex="-1"
  onkeydown={captureKey}
/>

<div class="space-y-2">
  <div class="flex gap-2 items-stretch">
    <div class="flex-1 space-y-2">
      <div
        class="flex flex-wrap items-center gap-1.5 min-h-9 px-2 py-1.5 bg-base-200 rounded-box border border-base-300"
      >
        {#each pickedKeys as key, i}
          {#if i > 0}
            <span class="text-base-content/30 text-xs select-none font-mono">+</span>
          {/if}
          <button
            class="badge badge-neutral font-mono text-lg h-auto py-0.5 px-2 gap-1 cursor-pointer hover:badge-error transition-colors"
            onclick={() => removeKey(i)}
            title="Click to remove"
          >{@html fmtKey(key)}<span class="opacity-40 text-xs">×</span></button>
        {/each}
        {#if pickedKeys.length === 0}
          <span class="text-base-content/30 text-xs italic">press a key or pick from below…</span>
        {:else}
          <span class="text-base-content/30 text-xs italic ml-1"
            >press a key to replace · click chip to remove</span
          >
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-xs btn-ghost"
          onclick={() => { showPicker = !showPicker; captureInputEl?.focus(); }}
        >
          keys {showPicker ? "▴" : "▾"}
        </button>
        <button class="btn btn-error btn-xs ml-auto" onclick={onCancel}>cancel</button>
      </div>
    </div>
    <button
      class="btn btn-primary px-6 h-auto self-stretch rounded"
      disabled={confirmDisabled}
      onclick={onConfirm}
    >set</button>
  </div>

  {#if showPicker}
    <div class="bg-base-200 rounded-box border border-base-300 p-3 space-y-2">
      {#each SPECIAL_KEY_GROUPS as group}
        <div>
          <p class="text-[10px] text-base-content/40 uppercase tracking-wide mb-1">
            {group.label}
          </p>
          <div class="flex flex-wrap gap-1">
            {#each group.keys as key}
              <button
                class="btn btn-xs h-auto py-1 px-1.5 font-mono flex flex-col gap-0 min-w-10"
                onclick={() => appendKey(key.sym)}
              >
                <span class="text-2xl leading-none">{@html fmtKey(key.sym)}</span>
                {#if key.name !== key.sym}
                  <span class="text-[9px] opacity-50 font-sans normal-case leading-tight"
                    >{key.name}</span
                  >
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
