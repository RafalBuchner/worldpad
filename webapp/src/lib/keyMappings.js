export const QT_TO_ADAFRUIT = {
  "1": "ONE", "2": "TWO", "3": "THREE", "4": "FOUR", "5": "FIVE",
  "6": "SIX", "7": "SEVEN", "8": "EIGHT", "9": "NINE", "0": "ZERO",
  "Enter": "ENTER", "Return": "RETURN", "Escape": "ESCAPE",
  "Backspace": "BACKSPACE", "Tab": "TAB", "Space": "SPACEBAR",
  "-": "MINUS", "=": "EQUALS", "[": "LEFT_BRACKET", "]": "RIGHT_BRACKET",
  "\\": "BACKSLASH", "Pound": "POUND",
  ";": "SEMICOLON", "'": "QUOTE", "`": "GRAVE_ACCENT",
  ",": "COMMA", ".": "PERIOD", "/": "FORWARD_SLASH",
  "CapsLock": "CAPS_LOCK",
  ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`F${i + 1}`, `F${i + 1}`])),
  "PrintScreen": "PRINT_SCREEN", "ScrollLock": "SCROLL_LOCK", "Pause": "PAUSE",
  "Insert": "INSERT", "Home": "HOME", "PgUp": "PAGE_UP",
  "Delete": "DELETE", "End": "END", "PgDown": "PAGE_DOWN",
  "Right": "RIGHT_ARROW", "Left": "LEFT_ARROW", "Down": "DOWN_ARROW", "Up": "UP_ARROW",
  "Left_Control": "LEFT_CONTROL", "Control": "CONTROL",
  "Left_Shift": "LEFT_SHIFT", "Shift": "SHIFT",
  "Left_Alt": "LEFT_ALT", "Alt": "ALT", "Option": "OPTION",
  "Left_Gui": "LEFT_GUI", "Gui": "GUI", "Windows": "WINDOWS", "Command": "COMMAND",
  "Right_Control": "RIGHT_CONTROL", "Right_Shift": "RIGHT_SHIFT",
  "Right_Alt": "RIGHT_ALT", "Right_Gui": "RIGHT_GUI",
  "Keypad_Zero": "KEYPAD_ZERO", "Keypad_One": "KEYPAD_ONE", "Keypad_Two": "KEYPAD_TWO",
  "Keypad_Three": "KEYPAD_THREE", "Keypad_Four": "KEYPAD_FOUR", "Keypad_Five": "KEYPAD_FIVE",
  "Keypad_Six": "KEYPAD_SIX", "Keypad_Seven": "KEYPAD_SEVEN", "Keypad_Eight": "KEYPAD_EIGHT",
  "Keypad_Nine": "KEYPAD_NINE", "Keypad_Period": "KEYPAD_PERIOD",
  "Keypad_Enter": "KEYPAD_ENTER", "Keypad_Plus": "KEYPAD_PLUS",
  "Keypad_Minus": "KEYPAD_MINUS", "Keypad_Asterisk": "KEYPAD_ASTERISK",
  "Keypad_Slash": "KEYPAD_FORWARD_SLASH", "Keypad_Equals": "KEYPAD_EQUALS",
  "Keypad_Numlock": "KEYPAD_NUMLOCK",
  // Media / Consumer Control keys (stored as CC_ prefix in JSON)
  "Play/Pause": "CC_PLAY_PAUSE",
  "Stop": "CC_STOP",
  "Next Track": "CC_SCAN_NEXT_TRACK",
  "Prev Track": "CC_SCAN_PREVIOUS_TRACK",
  "Fast Fwd": "CC_FAST_FORWARD",
  "Rewind": "CC_REWIND",
  "Vol+": "CC_VOLUME_INCREMENT",
  "Vol-": "CC_VOLUME_DECREMENT",
  "Mute": "CC_MUTE",
  "Brt+": "CC_BRIGHTNESS_INCREMENT",
  "Brt-": "CC_BRIGHTNESS_DECREMENT",
  "Eject": "CC_EJECT"
};

export const QT_TO_ADAFRUIT_Inverted = Object.fromEntries(
  Object.entries(QT_TO_ADAFRUIT).map(([k, v]) => [v, k])
);

// Note: "Ctrl" and "Command" both map to "⌘"; "Command" is last so inverted gives "⌘"→"Command"
export const SYSTEM_KEY_SYMBOLS = {
  "Keypad_Zero": "0 NUM", "Keypad_One": "1 NUM", "Keypad_Two": "2 NUM",
  "Keypad_Three": "3 NUM", "Keypad_Four": "4 NUM", "Keypad_Five": "5 NUM",
  "Keypad_Six": "6 NUM", "Keypad_Seven": "7 NUM", "Keypad_Eight": "8 NUM",
  "Keypad_Nine": "9 NUM", "Keypad_Period": ". NUM", "Keypad_Enter": "⌤ NUM",
  "Keypad_Plus": "+ NUM", "Keypad_Minus": "- NUM", "Keypad_Asterisk": "* NUM",
  "Keypad_Slash": "/ NUM", "Keypad_Equals": "= NUM", "Keypad_Numlock": "NUM LK",
  "Meta": "⌃",
  "Ctrl": "⌘",
  "Command": "⌘",
  "Shift": "⇧",
  "Alt": "⌥", "Option": "⌥",
  "Return": "↵",
  "Enter": "⌤",
  "Up": "↑",
  "Down": "↓",
  "Left": "←",
  "Right": "→",
  "Esc": "⎋",
  "Backspace": "⌫",
  "End": "↘",
  "Home": "↖",
  "Del": "⌦",
  "PgDown": "⇟",
  "PgUp": "⇞",
  "Tab": "⇥",
  "CapsLock": "⇪",
  // Media keys
  "Play/Pause": "⏯",
  "Stop": "⏹",
  "Next Track": "⏭",
  "Prev Track": "⏮",
  "Fast Fwd": "⏩",
  "Rewind": "⏪",
  "Vol+": "🔊",
  "Vol-": "🔉",
  "Mute": "🔇",
  "Brt+": "Brt+",
  "Brt-": "Brt-",
  "Eject": "⏏"
};

export const SYSTEM_KEY_SYMBOLS_Inverted = Object.fromEntries(
  Object.entries(SYSTEM_KEY_SYMBOLS).map(([k, v]) => [v, k])
);

// macOS platform conversion (mirrors Python's QT_CONVERSION for darwin)
export const QT_CONVERSION = {
  "Meta": "Control",
  "Ctrl": "Command",
  "Alt": "Option",
  "Esc": "Escape",
  "Del": "Delete"
};

export const SHIFT_FIX = {
  "~": "`", "!": "1", "@": "2", "#": "3", "$": "4", "%": "5",
  "^": "6", "&": "7", "*": "8", "(": "9", ")": "0",
  "_": "-", "+": "=", "{": "[", "}": "]",
  ":": ";", '"': "'", "<": ",", ">": ".", "?": "/"
};

// Maps browser event.code values to internal key names for numpad keys
// (needed because numpad digits produce same event.key as regular digits)
export const BROWSER_CODE_TO_INTERNAL = {
  'Numpad0': 'Keypad_Zero', 'Numpad1': 'Keypad_One', 'Numpad2': 'Keypad_Two',
  'Numpad3': 'Keypad_Three', 'Numpad4': 'Keypad_Four', 'Numpad5': 'Keypad_Five',
  'Numpad6': 'Keypad_Six', 'Numpad7': 'Keypad_Seven', 'Numpad8': 'Keypad_Eight',
  'Numpad9': 'Keypad_Nine', 'NumpadDecimal': 'Keypad_Period',
  'NumpadEnter': 'Keypad_Enter', 'NumpadAdd': 'Keypad_Plus',
  'NumpadSubtract': 'Keypad_Minus', 'NumpadMultiply': 'Keypad_Asterisk',
  'NumpadDivide': 'Keypad_Slash', 'NumpadEqual': 'Keypad_Equals',
  'NumLock': 'Keypad_Numlock'
};

// Maps browser event.key values to internal key names (matching Qt naming).
// Only entries that differ from the key itself are needed; the rest fall through via `?? k`.
export const BROWSER_KEY_TO_INTERNAL = {
  'Alt': 'Option',
  'Meta': 'Command',
  'Escape': 'Esc',
  'Enter': 'Return',
  ' ': 'Space',
  'ArrowUp': 'Up',
  'ArrowDown': 'Down',
  'ArrowLeft': 'Left',
  'ArrowRight': 'Right',
  'Delete': 'Del',
  'PageUp': 'PgUp',
  'PageDown': 'PgDown',
};

export function convertAdafruitToSymbolicNames(shortcut) {
  return shortcut
    .map(k => QT_TO_ADAFRUIT_Inverted[k] ?? k)
    .map(k => SYSTEM_KEY_SYMBOLS[k] ?? k);
}

export function convertSymbolicToAdafruitNames(shortcut) {
  return shortcut
    .map(k => SYSTEM_KEY_SYMBOLS_Inverted[k] ?? k)
    .map(k => QT_CONVERSION[k] ?? k)
    .map(k => QT_TO_ADAFRUIT[k] ?? k);
}

export function convertAdafruitConfigToSymbolic(config) {
  return {
    shortcuts: config.shortcuts.map(s => convertAdafruitToSymbolicNames(s)),
    wheels: Object.fromEntries(
      Object.entries(config.wheels).map(([name, hotkeys]) => [
        name,
        hotkeys.map(h => convertAdafruitToSymbolicNames(h))
      ])
    )
  };
}

export function convertSymbolicConfigToAdafruit(hotkeys, encoders) {
  return {
    shortcuts: hotkeys.map(h => convertSymbolicToAdafruitNames(h)),
    wheels: Object.fromEntries(
      encoders.map(enc => [
        enc.name,
        enc.hotkeys
          .filter(h => h.length > 0)
          .map(h => convertSymbolicToAdafruitNames(h))
      ])
    )
  };
}

export const DEFAULT_HOTKEYS = [
  ['ONE'], ['TWO'], ['THREE'], ['FOUR'], ['FIVE'],
  ['TAB'], ['Q'], ['W'], ['E'], ['R'],
  ['CAPS_LOCK'], ['A'], ['S'], ['D'], ['F'],
  ['SHIFT'], ['Z'], ['X'], ['C'],
  ['CONTROL'], ['OPTION'], ['COMMAND'], ['SPACEBAR']
].map(s => convertAdafruitToSymbolicNames(s));

export const DEFAULT_ENCODERS = [
  {
    name: 'Undo/Redo',
    hotkeys: [
      convertAdafruitToSymbolicNames(['COMMAND', 'Z']),
      convertAdafruitToSymbolicNames(['SHIFT', 'COMMAND', 'Z'])
    ]
  },
  {
    name: 'Numbers',
    hotkeys: [
      convertAdafruitToSymbolicNames(['ONE']),
      convertAdafruitToSymbolicNames(['TWO']),
      convertAdafruitToSymbolicNames(['THREE']),
      convertAdafruitToSymbolicNames(['FOUR']),
      convertAdafruitToSymbolicNames(['FIVE']),
    ]
  }
];
