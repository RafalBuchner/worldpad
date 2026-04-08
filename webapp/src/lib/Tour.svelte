<script>
  import { fade } from "svelte/transition";
  import deviceSvg from "./device-top-view.svg?raw";
  import logoSvg from "./worldpad-logo.svg?raw";
  import { SPECIAL_KEY_GROUPS, fmtKey } from "./chipUtils.js";

  let { onClose, onStepChange = () => {} } = $props();

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
      text: "Click any key to start editing it. Then type a key combination on your keyboard: each key becomes listed below the layout.",
      svgHighlight: null,
      uiTarget: "tour-keyboard",
      showDemo: "key-chip",
    },
    {
      title: "Special Keys",
      text: 'You can also pick special keys (F-keys, media keys, numpad…) from the panel. To open this panel klick on "keys" button.',
      svgHighlight: null,
      uiTarget: "tour-keyboard",
      showDemo: "special-keys",
    },
    {
      title: "Encoders (Rotary Knobs)",
      text: "Your device has two knobs. Each row in this table is a named action that any of those knobs can perform.\nPush the knob to cycle through available actions: the name appears on the device display.",
      svgHighlight: ["encoder1", "encoder2"],
      uiTarget: "tour-encoders",
    },
    {
      title: "Left / Right Mode",
      text: "Assign exactly 2 hotkeys to create a Left/Right action. The first hotkey fires on counterclockwise rotation, the second on clockwise.",
      svgHighlight: ["encoder1", "encoder2"],
      uiTarget: "tour-encoders",
    },
    {
      title: "Carousel Mode",
      text: "Assign 3 or more hotkeys to create a Carousel action. Each clockwise step advances to the next hotkey in the list; counterclockwise steps back. Great for cycling through multiple tool shortcuts.",
      svgHighlight: ["encoder1", "encoder2"],
      uiTarget: "tour-encoders",
    },
    {
      title: "Save Your Profile",
      text: "Press Save to download the JSON file. Copy it into the configs/ folder on the WorldPad USB device. Done: your profile is live.",
      svgHighlight: null,
      uiTarget: "tour-save",
      showDemo: "save-profile",
    },
    {
      title: "Selecting a Profile",
      text: "On the device, hold the button below the display and rotate the left knob to cycle through saved profiles. Release to confirm.",
      svgHighlight: ["encoder1", "action"],
      uiTarget: null,
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

  let demoChips = $state([]);
  let _demoTimer = null;

  $effect(() => {
    if (step.showDemo !== "key-chip") {
      clearTimeout(_demoTimer);
      demoChips = [];
      return;
    }
    const SEQ = ["⌘", "⇧", "A"];

    function run() {
      demoChips = [];
      let i = 0;
      function tick() {
        if (i < SEQ.length) {
          demoChips = SEQ.slice(0, ++i);
          _demoTimer = setTimeout(tick, 480);
        } else {
          _demoTimer = setTimeout(run, 1000);
        }
      }
      _demoTimer = setTimeout(tick, 400);
    }

    run();
    return () => {
      clearTimeout(_demoTimer);
      demoChips = [];
    };
  });

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

  $effect(() => {
    onStepChange(step.showDemo ?? null);
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
    <div
      class="flex gap-4 items-stretch"
      in:fade={{ duration: 180, delay: 80 }}
    >
      <!-- Text + nav -->
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xs font-mono text-base-content/40"
            >{current + 1} / {STEPS.length}</span
          >
          <span
            class="text-xs text-primary font-semibold uppercase tracking-widest"
            >{step.title}</span
          >
        </div>
        <p
          class="text-sm text-base-content/80 leading-relaxed whitespace-pre-line"
        >
          {step.text}
        </p>

        <div class="flex items-center gap-2 mt-auto pt-4">
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
      {:else if step.showDemo === "key-chip"}
        <div class="w-48 shrink-0 flex flex-col gap-2">
          <div
            class="grid gap-1"
            style="grid-template-columns: repeat(3, 1fr);"
          >
            {#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as i}
              <div
                class="aspect-square rounded font-mono flex items-center justify-center border text-center leading-tight p-0.5
                  {i === 4
                  ? 'bg-primary text-primary-content border-primary animate-pulse text-xs'
                  : 'bg-base-200 border-base-300 text-base-content/30 text-lg'}"
              >
                {#if i === 4}{@html demoChips.map(fmtKey).join("+") || "…"}{/if}
              </div>
            {/each}
          </div>
          <div
            class="flex flex-wrap items-center gap-1.5 min-h-9 px-2 py-1.5 bg-base-200 rounded-box border border-base-300"
          >
            {#each demoChips as key, i}
              {#if i > 0}<span class="text-base-content/30 text-xs font-mono"
                  >+</span
                >{/if}
              <span
                class="badge badge-neutral font-mono text-lg h-auto py-0.5 px-2"
                >{key}</span
              >
            {/each}
            {#if demoChips.length === 0}
              <span class="text-base-content/30 text-xs italic"
                >press a key…</span
              >
            {/if}
          </div>
        </div>
      {:else if step.showDemo === "special-keys"}
        <div class="w-48 shrink-0 flex flex-col gap-1.5">
          <div
            class="bg-base-200 rounded-box border border-base-300 p-2 space-y-2 overflow-hidden"
          >
            {#each SPECIAL_KEY_GROUPS.filter( (g) => ["F-keys", "Media"].includes(g.label), ) as group}
              <div>
                <p
                  class="text-[10px] text-base-content/40 uppercase tracking-wide mb-1"
                >
                  {group.label}
                </p>
                <div class="flex flex-wrap gap-1">
                  {#each group.keys as key}
                    <span
                      class="py-0.5 px-1 font-mono text-base rounded bg-base-100 border border-base-300 text-sm leading-none"
                    >
                      {@html fmtKey(key.sym)}
                    </span>
                  {/each}
                </div>
              </div>
            {/each}
            <p class="text-[10px] text-base-content/40 italic">
              + modifiers, navigation, numpad…
            </p>
          </div>
        </div>
      {/if}
    </div>
  {/key}
</div>
