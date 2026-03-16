<script>
  import { onMount } from "svelte";
  import deviceSvg from "./device-top-view.svg?raw";

  let { onClose } = $props();

  const STEPS = [
    {
      title: "Welcome to WorldPad",
      text: "A profile defines what each key and encoder does. You'll save it as a JSON file and copy it into the configs/ folder on the WorldPad USB device — the filename becomes the preset title on the display.",
      svgHighlight: null,
      uiTarget: null,
    },
    {
      title: "Keyboard Layout",
      text: "This grid mirrors the 23 physical keys on your device. The layout matches the leftmost columns of a standard keyboard.",
      svgHighlight: "keyboard",
      uiTarget: "tour-keyboard",
    },
    {
      title: "Assigning a Key Shortcut",
      text: "Click any key to start editing it. Then type a key combination on your keyboard — each key becomes a chip. You can also pick special keys (F-keys, media keys, numpad…) from the panel below.",
      svgHighlight: "keyboard",
      uiTarget: "tour-keyboard",
    },
    {
      title: "Encoders (Rotary Knobs)",
      text: "Your device has two rotary encoders. Each row in this table is a named encoder action. Push the knob to cycle through available actions — the name appears on the device display.",
      svgHighlight: "encoder1",
      uiTarget: "tour-encoders",
    },
    {
      title: "Left / Right Mode",
      text: "Assign exactly 2 hotkeys to an encoder to create a Left/Right action. The first hotkey fires on counterclockwise rotation, the second on clockwise.",
      svgHighlight: "encoder2",
      uiTarget: "tour-encoders",
    },
    {
      title: "Carousel Mode",
      text: "Assign 1 or 3+ hotkeys for Carousel mode. Each clockwise step advances to the next hotkey in the list; counterclockwise steps back. Great for cycling through numbered shortcuts.",
      svgHighlight: "encoder1",
      uiTarget: "tour-encoders",
    },
    {
      title: "Save Your Profile",
      text: "Press Save to download the JSON file. Copy it into the configs/ folder on the WorldPad USB device. Done — your profile is live.",
      svgHighlight: null,
      uiTarget: "tour-save",
    },
  ];

  let current = $state(0);
  const step = $derived(STEPS[current]);
  const isLast = $derived(current === STEPS.length - 1);

  $effect(() => {
    const id = STEPS[current].uiTarget;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("tour-highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => el.classList.remove("tour-highlight");
  });

  function prev() { if (current > 0) current--; }
  function next() { if (!isLast) current++; else onClose(); }
</script>

<!-- Backdrop dimmer (subtle) -->
<div class="fixed inset-0 z-40 pointer-events-none bg-black/30"></div>

<!-- Tour panel -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-300 shadow-2xl">
  <div class="max-w-5xl mx-auto flex gap-6 p-4 items-center">

    <!-- Device SVG -->
    <div
      class="w-64 shrink-0 opacity-90"
      data-tour-highlight={step.svgHighlight}
    >
      {@html deviceSvg}
    </div>

    <!-- Step content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xs font-mono text-base-content/40 uppercase tracking-widest">
          {current + 1} / {STEPS.length}
        </span>
        <span class="text-xs text-primary font-semibold uppercase tracking-widest">{step.title}</span>
      </div>
      <p class="text-sm text-base-content/80 leading-relaxed">{step.text}</p>

      <!-- Step dots -->
      <div class="flex gap-1.5 mt-3">
        {#each STEPS as _, i}
          <button
            class="w-1.5 h-1.5 rounded-full transition-colors {i === current ? 'bg-primary' : 'bg-base-content/20'}"
            onclick={() => current = i}
          ></button>
        {/each}
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex items-center gap-2 shrink-0">
      <button
        class="btn btn-xs btn-ghost"
        onclick={onClose}
      >skip</button>
      {#if current > 0}
        <button class="btn btn-xs btn-ghost" onclick={prev}>← prev</button>
      {/if}
      <button class="btn btn-sm btn-primary" onclick={next}>
        {isLast ? "finish" : "next →"}
      </button>
    </div>

  </div>
</div>
