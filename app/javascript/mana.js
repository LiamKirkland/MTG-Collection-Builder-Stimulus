const MANA_CLASS_OVERRIDES = {
  T: "tap",
  Q: "untap",
  CHAOS: "chaos",
  E: "e",
  PW: "pw",
  TK: "tk",
}

function symbolToClass(sym) {
  if (MANA_CLASS_OVERRIDES[sym]) return MANA_CLASS_OVERRIDES[sym]
  return sym.toLowerCase().replace(/\//g, "")
}

export function manaify(text) {
  if (!text) return ""

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  return escaped.replace(/\{([A-Z0-9/]+)\}/g, (_, sym) => {
    const cls = symbolToClass(sym)
    return `<i class="ms ms-${cls} ms-cost ms-shadow"></i>`
  })
}