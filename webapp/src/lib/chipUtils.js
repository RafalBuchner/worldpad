import {
  SYSTEM_KEY_SYMBOLS,
  SHIFT_FIX,
  BROWSER_KEY_TO_INTERNAL,
  BROWSER_CODE_TO_INTERNAL,
} from "./keyMappings.js";

// Formats a key symbol for display — wraps "NUM" in small-caps styling
export function fmtKey(k) {
  return k.replace(
    /\bNUM\b/g,
    "<span style=\"font-feature-settings:'smcp';opacity:0.7\">num</span>",
  );
}

// Builds a chip array from a keyboard event; returns null for modifier-only presses
export function buildChipsFromEvent(event) {
  event.preventDefault();
  event.stopPropagation();
  const key = event.key;
  const MODIFIER_MAP = { Control: "Control", Shift: "Shift", Alt: "Option", Meta: "Command" };
  if (MODIFIER_MAP[key]) return null;
  const modifiers = [];
  if (event.ctrlKey) modifiers.push("Control");
  if (event.shiftKey) modifiers.push("Shift");
  if (event.altKey) modifiers.push("Option");
  if (event.metaKey) modifiers.push("Command");
  if (BROWSER_CODE_TO_INTERNAL[event.code]) {
    const mainKey = BROWSER_CODE_TO_INTERNAL[event.code];
    return [...modifiers, mainKey].map((k) => SYSTEM_KEY_SYMBOLS[k] ?? k);
  }
  const physicalKey =
    event.altKey && key.length === 1 && !BROWSER_KEY_TO_INTERNAL[key]
      ? event.code.startsWith("Key")
        ? event.code.slice(3)
        : event.code.startsWith("Digit")
          ? event.code.slice(5)
          : key.toUpperCase()
      : key;
  let mainKey =
    BROWSER_KEY_TO_INTERNAL[physicalKey] ??
    (physicalKey.length === 1 ? physicalKey.toUpperCase() : physicalKey);
  if (event.shiftKey && SHIFT_FIX[physicalKey]) mainKey = SHIFT_FIX[physicalKey];
  return [...modifiers, mainKey].map((k) => SYSTEM_KEY_SYMBOLS[k] ?? k);
}

export const SPECIAL_KEY_GROUPS = [
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
    keys: Array.from({ length: 12 }, (_, i) => ({ sym: `F${i + 1}`, name: `F${i + 1}` })),
  },
  {
    label: "Numpad",
    keys: [
      ...Array.from({ length: 10 }, (_, i) => ({ sym: `${i} NUM`, name: `${i} NUM` })),
      { sym: ". NUM", name: ". NUM" },
      { sym: "⌤ NUM", name: "⌤ NUM" },
      { sym: "+ NUM", name: "+ NUM" },
      { sym: "- NUM", name: "- NUM" },
      { sym: "* NUM", name: "* NUM" },
      { sym: "/ NUM", name: "/ NUM" },
      { sym: "= NUM", name: "= NUM" },
      { sym: "NUM LK", name: "Num Lock" },
    ],
  },
];
