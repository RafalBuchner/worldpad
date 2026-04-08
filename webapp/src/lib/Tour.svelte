<script>
  import { fade } from "svelte/transition";
  import deviceSvg from "./device-top-view.svg?raw";
  import logoSvg from "./worldpad-logo.svg?raw";

  let { onClose } = $props();

  const STEPS = [
    {
      title: "Welcome to WorldPad",
      text: "A profile defines what each key and encoder does. You'll save it as a JSON file and copy it into the configs/ folder on the WorldPad USB device: the filename becomes the preset title on the display.",
      svgHighlight: null,
      uiTarget: null,
      showLogo: true,
    },
    {
      title: "Keyboard Layout",
      text: "This grid mirrors the 23 physical keys on your device. The layout matches the leftmost columns of a standard keyboard.",
      svgHighlight: "keyboard",
      uiTarget: "tour-keyboard",
    },
    {
      title: "Assigning a Key Shortcut",
      text: "Click any key to start editing it. Then type a key combination on your keyboard: Each key becomes listed on the list below the layout. You can also pick special keys (F-keys, media keys, numpad…) from the panel below.",
      svgHighlight: "keyboard",
      uiTarget: "tour-keyboard",
    },
    {
      title: "Encoders (Rotary Knobs)",
      text: "Your device has two rotary encoders. Each row in this table is a named encoder action. Push the knob to cycle through available actions: the name appears on the device display.",
      svgHighlight: ["encoder1", "encoder2"],
      uiTarget: "tour-encoders",
    },
    {
      title: "Left / Right Mode",
      text: "Assign exactly 2 hotkeys to an encoder to create a Left/Right action. The first hotkey fires on counterclockwise rotation, the second on clockwise.",
      svgHighlight: ["encoder1", "encoder2"],
      uiTarget: "tour-encoders",
    },
    {
      title: "Carousel Mode",
      text: "Assign 1 or 3+ hotkeys for Carousel mode. Each clockwise step advances to the next hotkey in the list; counterclockwise steps back. Great for cycling through numbered shortcuts.",
      svgHighlight: ["encoder1", "encoder2"],
      uiTarget: "tour-encoders",
    },
    {
      title: "Save Your Profile",
      text: "Press Save to download the JSON file. Copy it into the configs/ folder on the WorldPad USB device. Done: your profile is live.",
      svgHighlight: null,
      uiTarget: "tour-save",
    },
  ];

  const PAD = 10;
  const TOOLTIP_W = 580;
  const TOOLTIP_H = 200; // estimated for placement logic
  const GAP = 16;

  let current = $state(0);
  const step = $derived(STEPS[current]);
  const isLast = $derived(current === STEPS.length - 1);

  let spotlightRect = $state(null);

  $effect(() => {
    const id = STEPS[current].uiTarget;
    if (!id) {
      spotlightRect = null;
      return;
    }
    const el = document.getElementById(id);
    if (!el) {
      spotlightRect = null;
      return;
    }

    function measure() {
      const r = el.getBoundingClientRect();
      spotlightRect = {
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      };
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    measure();
    setTimeout(measure, 380);
    window.addEventListener("scroll", measure, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("scroll", measure, { capture: true });
      spotlightRect = null;
    };
  });

  const tooltipStyle = $derived.by(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(TOOLTIP_W, vw - 32);

    if (!spotlightRect) {
      const left = Math.round(vw / 2 - w / 2);
      const top = Math.round(vh / 2 - TOOLTIP_H / 2);
      return `top: ${top}px; left: ${left}px; width: ${w}px;`;
    }

    const cx = spotlightRect.left + spotlightRect.width / 2;
    const left = Math.max(16, Math.min(Math.round(cx - w / 2), vw - w - 16));
    const spBottom = spotlightRect.top + spotlightRect.height;

    if (spBottom + GAP + TOOLTIP_H <= vh - 8) {
      return `top: ${Math.round(spBottom + GAP)}px; left: ${left}px; width: ${w}px;`;
    }
    return `top: ${Math.max(16, Math.round(spotlightRect.top - GAP - TOOLTIP_H))}px; left: ${left}px; width: ${w}px;`;
  });

  function prev() {
    if (current > 0) current--;
  }
  function next() {
    if (!isLast) current++;
    else onClose();
  }
</script>

<!-- Full-screen click blocker (dismiss on outside click) -->
<button
  class="fixed inset-0 z-[200] cursor-default w-full h-full"
  onclick={onClose}
  aria-label="Close tour"
></button>

<!-- Spotlight hole — box-shadow creates the dim overlay around it -->
{#if spotlightRect}
  <div
    class="fixed z-[201] rounded-lg pointer-events-none"
    style="
      top: {spotlightRect.top}px;
      left: {spotlightRect.left}px;
      width: {spotlightRect.width}px;
      height: {spotlightRect.height}px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.75);
      transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease;
    "
  ></div>
{:else}
  <!-- No target — plain full-screen dim -->
  <div class="fixed inset-0 z-[201] bg-black/75 pointer-events-none"></div>
{/if}

<!-- Tooltip card — morphs position/size with CSS transitions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed z-[202] bg-base-100 border border-base-300 rounded-xl shadow-2xl p-5 overflow-hidden"
  style="transition: top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1); {tooltipStyle}"
  onclick={(e) => e.stopPropagation()}
  onkeydown={(e) => e.stopPropagation()}
>
  {#key current}
    <div class="flex gap-4 items-start" in:fade={{ duration: 180, delay: 80 }}>
      <!-- Text + nav -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xs font-mono text-base-content/40"
            >{current + 1} / {STEPS.length}</span
          >
          <span
            class="text-xs text-primary font-semibold uppercase tracking-widest"
            >{step.title}</span
          >
        </div>
        <p class="text-sm text-base-content/80 leading-relaxed">{step.text}</p>

        <div class="flex items-center gap-2 mt-4">
          <!-- Step dots -->
          <div class="flex gap-1.5 flex-1">
            {#each STEPS as _, i}
              <button
                class="w-1.5 h-1.5 rounded-full transition-colors {i === current
                  ? 'bg-primary'
                  : 'bg-base-content/20'}"
                aria-label="Go to step {i + 1}"
                onclick={() => (current = i)}
              ></button>
            {/each}
          </div>
          <button class="btn btn-xs btn-ghost" onclick={onClose}>skip</button>
          {#if current > 0}
            <button class="btn btn-xs btn-ghost" onclick={prev}>← prev</button>
          {/if}
          <button class="btn btn-sm btn-primary" onclick={next}>
            {isLast ? "finish" : "next →"}
          </button>
        </div>
      </div>

      <!-- Logo (welcome step) -->
      {#if step.showLogo}
        <div
          class="w-[200px] shrink-0 text-primary [&>svg]:w-full [&>svg]:h-auto"
        >
          {@html logoSvg}
        </div>
      {/if}

      <!-- Device SVG (when relevant) -->
      {#if step.svgHighlight}
        <div
          class="w-56 shrink-0 opacity-90"
          data-tour-highlight={[step.svgHighlight].flat().join(" ")}
        >
          {@html deviceSvg}
        </div>
      {/if}
    </div>
  {/key}
</div>
