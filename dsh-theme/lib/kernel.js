/**
 * dsh-theme v0.6 — DreamSkin → DSH token kernel.
 *
 * One input path: a DreamSkin theme.json (10 colours + art focus) plus the
 * optional theme.css part rules. Nothing else is guessed.
 *
 * Design rules kept from the validated prototype:
 *   1. Build one predictable lightness ladder, then hang the DSH tokens on it.
 *   2. package translucency only applies to content surfaces; tool surfaces
 *      (menus, dialogs, settings) stay solid.
 *   3. Contrast is a hard guard: a failing foreground is moved along the OKLCH
 *      L axis (hue preserved) until it passes. For on-accent failures the FILL
 *      lightness moves, never the label colour.
 *
 * Pure ESM, no dependencies, no window/document access.
 */

/* ─────────────── numbers & CSS colour plumbing ─────────────── */

const num = (value, fallback) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, lo = 0, hi = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
};

const round2 = (value) => Math.round(value * 100) / 100;

/** Parse #rgb/#rgba/#rrggbb/#rrggbbaa, rgb()/rgba(), hsl()/hsla(), transparent. */
export function parseColor(input) {
  if (input == null) return null;
  const s = String(input).trim().toLowerCase();
  if (!s) return null;
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6) h += 'ff';
    if (h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: clamp(parseInt(h.slice(6, 8), 16) / 255),
    };
  }

  const alpha = (raw) => {
    if (raw == null) return 1;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return 1;
    return clamp(raw.endsWith('%') ? n / 100 : n);
  };

  m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
  if (m) {
    const channel = (raw) => {
      const n = parseFloat(raw);
      if (!Number.isFinite(n)) return null;
      return clamp(raw.endsWith('%') ? (n / 100) * 255 : n, 0, 255);
    };
    const r = channel(m[1]);
    const g = channel(m[2]);
    const b = channel(m[3]);
    if (r == null || g == null || b == null) return null;
    return { r, g, b, a: alpha(m[4]) };
  }

  m = /^hsla?\(\s*([+-]?[\d.]+)(deg|turn|grad|rad)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(s);
  if (m) {
    let hue = parseFloat(m[1]);
    const sat = parseFloat(m[3]);
    const light = parseFloat(m[4]);
    if (!Number.isFinite(hue) || !Number.isFinite(sat) || !Number.isFinite(light)) return null;
    if (m[2] === 'turn') hue *= 360;
    else if (m[2] === 'grad') hue *= 0.9;
    else if (m[2] === 'rad') hue *= 180 / Math.PI;
    hue = ((hue % 360) + 360) % 360;
    const s = clamp(sat / 100);
    const l = clamp(light / 100);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = hue / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m0 = l - c / 2;
    return { r: (r + m0) * 255, g: (g + m0) * 255, b: (b + m0) * 255, a: alpha(m[5]) };
  }

  return null;
}

const toLin = (channel) => {
  const v = clamp(num(channel, 0), 0, 255) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const fromLin = (value) => {
  const v = num(value, 0);
  const encoded = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return clamp(encoded, 0, 1) * 255;
};

/** WCAG relative luminance (alpha is deliberately ignored: guards judge solid ink). */
export function luminance(c) {
  const col = c || { r: 0, g: 0, b: 0 };
  return 0.2126 * toLin(col.r) + 0.7152 * toLin(col.g) + 0.0722 * toLin(col.b);
}

export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const hex2 = (channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0');

/** Serialise a parsed colour. Never emits NaN/undefined, even for damaged input. */
export function toCss(c) {
  if (!c) return 'transparent';
  const r = Math.round(clamp(num(c.r, 0), 0, 255));
  const g = Math.round(clamp(num(c.g, 0), 0, 255));
  const b = Math.round(clamp(num(c.b, 0), 0, 255));
  const a = clamp(num(c.a, 1));
  if (a >= 0.999) return '#' + hex2(r) + hex2(g) + hex2(b);
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}

/* sRGB ↔ OKLab ↔ OKLCH */
export function toOklch(c) {
  const col = c || { r: 0, g: 0, b: 0 };
  const r = toLin(col.r);
  const g = toLin(col.g);
  const b = toLin(col.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    L: clamp(num(L, 0)),
    C: Math.max(0, num(Math.hypot(A, B), 0)),
    H: num(Math.atan2(B, A), 0),
    a: clamp(num(col.a, 1)),
  };
}

function oklchToLinear({ L, C, H }) {
  const A = Math.cos(H) * C;
  const B = Math.sin(H) * C;
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((v) => Number.isFinite(v) && v >= -0.0005 && v <= 1.0005);

export function fromOklch({ L, C, H, a = 1 } = {}) {
  const lightness = clamp(num(L, 0));
  const hue = num(H, 0);
  let chroma = Math.max(0, num(C, 0));
  let rgb = oklchToLinear({ L: lightness, C: chroma, H: hue });
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = chroma;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ L: lightness, C: mid, H: hue }))) lo = mid;
      else hi = mid;
    }
    chroma = lo;
    rgb = oklchToLinear({ L: lightness, C: chroma, H: hue });
  }
  return { r: fromLin(rgb[0]), g: fromLin(rgb[1]), b: fromLin(rgb[2]), a: clamp(num(a, 1)) };
}

export const mix = (c1, c2, t) => {
  const a = c1 || { r: 0, g: 0, b: 0, a: 1 };
  const b = c2 || { r: 0, g: 0, b: 0, a: 1 };
  const k = clamp(num(t, 0));
  return {
    r: num(a.r, 0) + (num(b.r, 0) - num(a.r, 0)) * k,
    g: num(a.g, 0) + (num(b.g, 0) - num(a.g, 0)) * k,
    b: num(a.b, 0) + (num(b.b, 0) - num(a.b, 0)) * k,
    a: num(a.a, 1) + (num(b.a, 1) - num(a.a, 1)) * k,
  };
};

export const withAlpha = (c, alpha) => ({ ...(c || { r: 0, g: 0, b: 0 }), a: clamp(num(alpha, 1)) });

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const NEAR_BLACK = { r: 12, g: 12, b: 12, a: 1 };

/**
 * Move a failing foreground along OKLCH L until it passes, preserving hue.
 * Both directions are attempted (the one leading to the higher-contrast
 * extreme first), so a mid-tone surface cannot trap the guard; the original
 * colour is returned untouched when it already passes.
 */
function guard(fg, bg, min) {
  const src = fg || { r: 0, g: 0, b: 0, a: 1 };
  if (contrastRatio(src, bg) >= min) return src;
  const o = toOklch(src);
  const preferLight = contrastRatio(WHITE, bg) >= contrastRatio(NEAR_BLACK, bg);
  const directions = preferLight ? [1, -1] : [-1, 1];
  for (const direction of directions) {
    for (let i = 1; i <= 40; i++) {
      const delta = i * 0.025;
      const L = direction > 0 ? Math.min(1, o.L + delta) : Math.max(0, o.L - delta);
      const C = o.C * Math.max(0, 1 - (i - 1) * 0.004);
      const candidate = fromOklch({ L, C, H: o.H, a: src.a });
      if (contrastRatio(candidate, bg) >= min) return candidate;
      if (L === 1 || L === 0) break;
    }
  }
  return preferLight
    ? { r: 255, g: 255, b: 255, a: src.a }
    : { r: 0, g: 0, b: 0, a: src.a };
}

const bestOn = (bg, alpha = 1) => {
  const white = { r: 255, g: 255, b: 255, a: alpha };
  const black = { r: 12, g: 12, b: 12, a: alpha };
  return contrastRatio(white, bg) >= contrastRatio(black, bg) ? white : black;
};

/* ─────────────── theme.css (property-level, never guesses) ─────────────── */

export function parseThemeCss(css) {
  const text = String(css || '');
  const rules = [];
  const re = /\[data-ds-part\s*=\s*["']([^"']+)["']\]((?::[a-z-]+(?:\([^)]*\))?)*)\s*\{([^{}]*)\}/gi;
  let m;
  while ((m = re.exec(text))) {
    const decls = {};
    m[3].split(';').forEach((decl) => {
      const i = decl.indexOf(':');
      if (i > 0) decls[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    });
    rules.push({ part: m[1], state: m[2] || '', decls });
  }
  const parts = {};
  for (const rule of rules) if (!rule.state) parts[rule.part] = rule.decls;
  return { rules, parts };
}

/**
 * Alpha of a part's background. Only an explicit rgba()/hsla()/transparent
 * counts as translucent; a var() is a designed solid surface, and anything
 * unparseable falls back to "unknown" (the caller treats it as solid).
 */
export function surfaceAlpha(decls) {
  if (!decls) return null;
  const raw = decls['background-color'] || decls['background'];
  if (!raw) return null;
  const bg = String(raw).trim().toLowerCase();
  if (bg === 'transparent') return 0;
  if (bg.startsWith('var(')) return 1;
  const c = parseColor(bg);
  return c ? clamp(c.a) : null;
}

/* ─────────────── new kernel ─────────────── */

const SEMANTIC = {
  success: 0.55,
  warn: 0.8,
  error: 0.28,
  info: 0.62,
};

/**
 * 覆盖率分母 = DSH ui-theme 实际声明的 token 数：
 *   114 个 --dsw-alias-* + 10 个 --dsw-specific-* = 124
 * 我们发 118 个（114 alias 里有 6 个由 DSH 按上下文自己算，我们不覆盖）。
 */
export const TOKEN_TOTAL = 124;

/** v0.5 kernel budget, retained only for the legacy comparison numbers. */
const LEGACY_TOKEN_TOTAL = 118;

export function derive(theme) {
  const src = theme && typeof theme === 'object' ? theme : {};
  const rawColors = src.colors && typeof src.colors === 'object' ? src.colors : {};
  const warnings = [];

  const pick = (key, fallback) => {
    const raw = rawColors[key];
    if (raw == null || raw === '') return fallback;
    const parsed = parseColor(raw);
    if (!parsed) {
      warnings.push(`colors.${key} 无法解析（${String(raw)}），已使用回退色`);
      return fallback;
    }
    return parsed;
  };

  const base = pick('background', { r: 17, g: 17, b: 20, a: 1 });
  const panel = pick('panel', mix(base, WHITE, 0.08));
  const panelAlt = pick('panelAlt', mix(panel, WHITE, 0.08));
  const accent = pick('accent', { r: 80, g: 120, b: 200, a: 1 });
  const accentAlt = pick('accentAlt', accent);
  const secondary = pick('secondary', accent);
  const text = pick('text', bestOn(base));
  const line = pick('line', withAlpha(text, 0.16));

  const css = parseThemeCss(src.css);
  const parts = css.parts || {};

  // Light or dark is decided by the background's perceptual lightness; an
  // explicit appearance only overrides when the background is not clearly
  // on the other side (otherwise the claim loses and a warning is emitted).
  const bgLightness = toOklch(base).L;
  const declared = String(src.appearance || 'auto').trim().toLowerCase();
  let mode = bgLightness >= 0.5 ? 'light' : 'dark';
  if (declared === 'light' || declared === 'dark') {
    const declaredLight = declared === 'light';
    const backgroundLight = mode === 'light';
    if (declaredLight !== backgroundLight && Math.abs(bgLightness - 0.5) > 0.18) {
      warnings.push(`appearance 声明 ${declared}，但背景明度更像 ${mode}；以背景为准`);
    } else {
      mode = declared;
    }
  }
  const dark = mode === 'dark';
  const dir = dark ? 1 : -1;
  const oBase = toOklch(base);
  const oPanel = toOklch(panel);

  // One predictable surface ladder. The hue follows the panel when it has any
  // chroma, otherwise the background, so a neutral panel cannot inject red.
  const step = clamp(Math.abs(oPanel.L - oBase.L) * 0.9, 0.028, 0.055);
  const surfaceHue = oPanel.C > 0.003 ? oPanel.H : oBase.H;
  const surf = (n) => {
    const L = clamp(oBase.L + dir * step * n, 0.015, 0.985);
    return fromOklch({ L, C: oBase.C * 0.9 + oPanel.C * 0.1, H: surfaceHue });
  };

  const S = {
    base: base,
    layer1: surf(0.85),
    layer2: surf(1.55),
    layer3: surf(2.4),
    overlay: surf(3.2),
    raised: panel,
    raisedAlt: panelAlt,
  };

  // Tool surfaces stay solid. A package's translucency only informs the
  // dialog alpha variable; bg-overlay itself is deliberately opaque.
  const toolAlpha = (part) => {
    const a = surfaceAlpha(parts[part]);
    return a == null ? 1 : clamp(a, 0.62, 1);
  };
  const dialogAlpha = toolAlpha('dialog');

  // Text ladder.
  const t1 = guard(text, S.layer2, 7.0);
  const t2 = guard(mix(text, base, 0.28), S.layer1, 4.5);
  const t3 = guard(mix(text, base, 0.48), S.layer1, 3.2);
  const caption = guard(mix(text, base, 0.62), S.layer1, 3.0);

  // Brand: keep the hue, correct the fill's lightness for the label.
  const brandText = guard(accent, S.base, 4.5);
  let brandFill = accent;
  let onBrand = bestOn(brandFill);
  if (contrastRatio(onBrand, brandFill) < 4.5) {
    // The label colour is not touched. White text => darken the fill; dark
    // text => lighten the fill. Hue is preserved throughout.
    const o = toOklch(accent);
    const darken = luminance(onBrand) > 0.5;
    let corrected = null;
    for (let i = 1; i <= 30; i++) {
      const L = clamp(o.L + (darken ? -1 : 1) * i * 0.015, 0.05, 0.95);
      const candidate = fromOklch({ L, C: o.C, H: o.H, a: 1 });
      if (contrastRatio(onBrand, candidate) >= 4.5) {
        corrected = candidate;
        break;
      }
    }
    if (!corrected) {
      // Last resort: the darkest/lightest fill that still keeps the hue.
      corrected = fromOklch({ L: darken ? 0.02 : 0.98, C: o.C * 0.6, H: o.H, a: 1 });
    }
    brandFill = corrected;
  }
  const oAccent = toOklch(accent);
  const brandHover = fromOklch({ L: clamp(oAccent.L + dir * 0.06, 0.05, 0.97), C: oAccent.C, H: oAccent.H, a: 1 });

  const borderBase = line;
  const borderAlpha = line.a < 1 ? line.a : dark ? 0.18 : 0.11;
  const border = (k) => withAlpha(borderBase, clamp(borderAlpha * k, 0, 1));

  const sem = (name, bg, minBg = 4.5) => {
    const hue = SEMANTIC[name] * Math.PI * 2;
    const raw = fromOklch({ L: dark ? 0.76 : 0.52, C: 0.135, H: hue });
    return guard(raw, bg, minBg);
  };

  const codeBg = dark ? surf(2.0) : surf(1.2);
  const inlineCode = dark ? surf(2.8) : surf(1.9);
  const hoverSolid = dark ? mix(base, text, 0.1) : mix(base, text, 0.06);

  const tokens = {};
  const put = (key, color) => {
    tokens['--dsw-alias-' + key] = toCss(color);
  };
  const putA = (key, color, alpha) => {
    tokens['--dsw-alias-' + key] = toCss(withAlpha(color, alpha));
  };

  // Surfaces.
  put('bg-base', S.base);
  put('bg-layer-1', S.layer1);
  put('bg-layer-2', S.layer2);
  put('bg-layer-3', S.layer3);
  put('bg-overlay', S.overlay);
  put('bg-module-platform', S.layer2);
  put('bg-multi-select', withAlpha(accent, 0.16));
  put('bg-skeleton', withAlpha(text, dark ? 0.07 : 0.05));
  put('bg-document-preview', S.overlay);
  put('bg-document-selection', withAlpha(accent, 0.18));
  putA('bg-mask-1', { r: 0, g: 0, b: 0 }, dark ? 0.24 : 0.08);
  putA('bg-mask-2', { r: 0, g: 0, b: 0 }, dark ? 0.42 : 0.16);
  putA('bg-mask-3', { r: 0, g: 0, b: 0 }, dark ? 0.62 : 0.28);
  putA('bg-mask-drop', { r: 0, g: 0, b: 0 }, 0.18);
  putA('bg-mask-photo', { r: 0, g: 0, b: 0 }, 0.32);

  // Text.
  put('label-primary', t1);
  put('label-secondary', t2);
  put('label-tertiary', t3);
  put('label-caption', caption);
  put('label-dimmed', withAlpha(t2, 0.62));
  put('label-primary-bluish', guard(mix(t1, accent, 0.16), S.layer1, 7));
  put('label-primary-dimmed', withAlpha(t1, 0.66));
  put('label-primary-foreground', dark ? { r: 255, g: 255, b: 255, a: 1 } : { r: 250, g: 250, b: 250, a: 1 });
  put('label-primary-inverted', bestOn(S.layer3));
  put('label-deep-diving', guard(mix(t1, accent, 0.3), S.layer1, 4.5));
  put('label-deep-diving-shimmer', guard(mix(t1, accentAlt, 0.5), S.layer1, 4.5));
  put('label-shimmer', guard(mix(t2, accentAlt, 0.4), S.layer1, 3.0));
  put('label-document-preview', t2);

  // Brand / links.
  put('brand-primary', brandFill);
  put('brand-primary-invert', onBrand);
  put('brand-primary-new-colorprimary-new-color', brandFill);
  put('brand-text', brandText);
  put('link', brandText);

  // Borders.
  put('border-l1', border(0.55));
  put('border-l2', border(0.9));
  put('border-l3', border(1.35));
  put('border-l4', border(1.9));
  put('border-inverted', withAlpha(bestOn(S.base), 0.24));
  put('border-inverted2', withAlpha(bestOn(S.base), 0.42));
  put('border-l2-darkmode-thin', border(0.7));

  // Buttons.
  put('button-primary-fill', brandFill);
  put('button-primary-hover', brandHover);
  put('button-primary-dimmed', withAlpha(accent, 0.35));
  put('button-contrast-fill', bestOn(S.base));
  put('button-elevated-fill', S.layer3);
  put('button-floating-fill', withAlpha(S.layer3, 0.96));
  put('button-floating-hover', withAlpha(S.layer3, 1));
  put('button-ghost-active-fill', withAlpha(accent, 0.14));
  put('button-ghost-active-hover', withAlpha(accent, 0.2));
  put('button-ghost-active-border', withAlpha(accent, 0.4));
  put('button-info-fill', withAlpha(sem('info', S.layer1), 0.9));
  put('button-info-hover', withAlpha(sem('info', S.layer1), 1));
  put('button-tool-bar-fill', S.layer2);
  put('button-tool-bar-hover', S.layer3);
  put('button-tool-bar-fill-invisible', withAlpha(S.layer2, 0));

  // Interaction.
  put('interactive-bg-hover', withAlpha(text, dark ? 0.07 : 0.05));
  put('interactive-bg-active', withAlpha(text, dark ? 0.11 : 0.08));
  put('interactive-bg-hover-accent', withAlpha(accent, 0.12));
  put('interactive-bg-hover-danger', withAlpha(sem('error', S.layer1), 0.12));
  put('interactive-bg-hover-solid', hoverSolid);

  // States.
  put('state-success-primary', sem('success', S.layer1));
  put('state-success-secondary', withAlpha(sem('success', S.layer1), 0.55));
  put('state-success-tertiary', withAlpha(sem('success', S.layer1), 0.16));
  put('state-warn-primary', guard(mix(sem('warn', S.layer1), { r: 245, g: 158, b: 11, a: 1 }, 0.35), S.layer1, 4.5));
  put('state-warn-secondary', withAlpha(sem('warn', S.layer1), 0.55));
  put('state-warn-tertiary', withAlpha(sem('warn', S.layer1), 0.16));
  put('state-warn-label', bestOn(sem('warn', S.layer1)));
  put('state-error-primary', sem('error', S.layer1));
  put('state-error-secondary', withAlpha(sem('error', S.layer1), 0.55));
  put('state-business-primary', guard(secondary, S.layer1, 4.5));
  put('state-business-tertiary', withAlpha(secondary, 0.16));
  put('state-done-primary', sem('success', S.layer1));
  put('state-idle-primary', t3);

  // Markdown / code.
  put('markdown-code-block', codeBg);
  put('markdown-code-block-banner', dark ? surf(2.6) : surf(1.6));
  put('markdown-code-segment-selected', t2);
  put('markdown-code-segment-unselected', t3);
  put('markdown-inline-code', inlineCode);
  put('markdown-placeholder', withAlpha(t3, 0.7));
  put('markdown-tag', withAlpha(accent, 0.16));
  put('markdown-citation', withAlpha(accent, 0.12));
  put('code-diff-added', withAlpha(sem('success', codeBg), 0.16));
  put('code-diff-deleted', withAlpha(sem('error', codeBg), 0.16));
  put('file-diff-added-bg', withAlpha(sem('success', codeBg), 0.12));
  put('file-diff-added-gutter', withAlpha(sem('success', codeBg), 0.22));
  put('file-diff-added-marker', sem('success', codeBg));
  put('file-diff-deleted-bg', withAlpha(sem('error', codeBg), 0.12));
  put('file-diff-deleted-gutter', withAlpha(sem('error', codeBg), 0.22));
  put('file-diff-deleted-marker', sem('error', codeBg));

  // Chrome.
  putA('scrollbar-bg-l1', text, dark ? 0.08 : 0.06);
  putA('scrollbar-bg-l2', text, dark ? 0.12 : 0.09);
  putA('scrollbar-hover-l1', text, dark ? 0.18 : 0.14);
  putA('scrollbar-hover-l2', text, dark ? 0.24 : 0.18);
  put('menu-group-header-fill', withAlpha(text, 0.04));
  put('menu-icon', t2);
  put('switch-thumb', bestOn(brandFill));
  put('toast-bg', S.layer3);
  put('toast-label', guard(t1, S.layer3, 7));
  put('tooltip-bg', dark ? S.overlay : bestOn(S.base));
  put('tooltip-key-bg', withAlpha(dark ? WHITE : { r: 0, g: 0, b: 0, a: 1 }, 0.1));
  put('turn-trigger-bg', withAlpha(S.layer2, 0.9));
  put('turn-trigger-bg-hover', S.layer3);
  put('illustration-background', S.layer2);
  put('illustration-backing', S.layer3);
  put('illustration-detail', t3);
  put('illustration-inset', withAlpha(accent, 0.2));
  put('illustration-shadow', withAlpha({ r: 0, g: 0, b: 0, a: 1 }, 0.22));
  put('illustration-surface', S.overlay);

  // Component-level tokens.
  const specifics = {
    bubble: S.layer2,
    'bubble-highlight': withAlpha(accent, 0.14),
    'input-major': S.layer2,
    'login-input': S.layer2,
    menu: S.layer3,
    selector: S.layer3,
    'sidebar-fill': S.layer1,
    'sidebar-nav-item-active': withAlpha(accent, 0.16),
    'sidebar-nav-item-active-accent': withAlpha(accent, 0.5),
    tip: S.layer3,
  };
  for (const [key, value] of Object.entries(specifics)) tokens['--dsw-specific-' + key] = toCss(value);

  // Contrast audit: the same eight pairs and thresholds as the prototype.
  const pairs = [
    ['label-primary', t1, 'bg-base', S.base, 7],
    ['label-primary', t1, 'bg-layer-2', S.layer2, 7],
    ['label-secondary', t2, 'bg-layer-1', S.layer1, 4.5],
    ['label-tertiary', t3, 'bg-layer-1', S.layer1, 3.2],
    ['brand-text', brandText, 'bg-base', S.base, 4.5],
    ['on-accent', onBrand, 'brand-primary', brandFill, 4.5],
    ['code-text', t1, 'markdown-code-block', codeBg, 7],
    ['state-error', sem('error', S.layer1), 'bg-layer-1', S.layer1, 4.5],
  ].map(([fg, fgColor, bg, bgColor, min]) => {
    const ratio = contrastRatio(fgColor, bgColor);
    return { fg, bg, ratio: round2(ratio), min, pass: ratio >= min };
  });

  const cssVars = {
    '--jz-btn': toCss(brandFill),
    '--jz-btn-text': toCss(onBrand),
    '--jz-accent-soft': toCss(withAlpha(accent, 0.14)),
    '--jz-dialog-alpha': String(dialogAlpha),
  };

  // Art focus: taskMode 'full' pins the composition centre.
  const art = src.art && typeof src.art === 'object' ? src.art : {};
  const taskMode = typeof art.taskMode === 'string' && art.taskMode ? art.taskMode : 'ambient';
  const focus = (value) => {
    if (value == null || value === '') return 0.5;
    const n = Number(value);
    return Number.isFinite(n) ? clamp(n) : 0.5;
  };
  const full = taskMode === 'full';
  const focusX = full ? 0.5 : focus(art.focusX);
  const focusY = full ? 0.5 : focus(art.focusY);
  const backgroundX = Math.round((focusX - 0.5) * 200) || 0;
  const backgroundY = Math.round((focusY - 0.5) * 200) || 0;

  return {
    mode,
    tokens,
    cssVars,
    checks: pairs,
    surfaces: Object.fromEntries(Object.entries(S).map(([key, value]) => [key, toCss(value)])),
    warnings,
    meta: {
      step: +step.toFixed(3),
      coverage: Object.keys(tokens).length,
      coverageTotal: TOKEN_TOTAL,
      taskMode,
      focusX,
      focusY,
      backgroundX,
      backgroundY,
    },
  };
}

/* ─────────────── legacy kernel (comparison only; buggy by design) ─────────────── */

export function deriveLegacy(theme) {
  const src = theme && typeof theme === 'object' ? theme : {};
  const colors = src.colors && typeof src.colors === 'object' ? src.colors : {};
  const base = parseColor(colors.background) || { r: 0, g: 0, b: 0, a: 1 };
  const panel = parseColor(colors.panel) || base;
  const text = parseColor(colors.text) || bestOn(base);
  const muted = parseColor(colors.muted) || text;
  const accent = parseColor(colors.accent) || { r: 80, g: 120, b: 200, a: 1 };
  const panelAlt = parseColor(colors.panelAlt) || panel;
  const line = parseColor(colors.line) || text;

  const { parts } = parseThemeCss(src.css);
  const buggyAlpha = (part) => {
    const d = parts[part];
    if (!d) return null;
    const bg = d['background-color'];
    if (bg === 'transparent') return 0;
    // Reproduces the v0.5 bug: grabs the first rgba in the block, which often
    // comes from border-color or box-shadow rather than the background.
    for (const value of Object.values(d)) {
      const m = /rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/.exec(value);
      if (m) return clamp(parseFloat(m[1]));
    }
    return null;
  };
  const bgOp = buggyAlpha('main') ?? buggyAlpha('thread') ?? 0.01;
  const surfOp = buggyAlpha('message') ?? buggyAlpha('composer') ?? buggyAlpha('panel') ?? 0.01;

  const tokens = {};
  const put = (key, color) => {
    tokens['--dsw-alias-' + key] = toCss(color);
  };
  const a = (color, alpha) => withAlpha(color, alpha);

  put('bg-base', a(base, bgOp));
  put('bg-layer-1', a(panel, surfOp));
  put('bg-layer-2', a(panel, surfOp));
  put('bg-layer-3', a(panelAlt, surfOp));
  put('bg-overlay', a(panelAlt, clamp(surfOp + 0.08)));
  put('label-primary', text);
  put('label-secondary', muted);
  put('label-tertiary', muted);
  put('border-l1', line);
  put('border-l2', line);
  put('border-l3', line);
  put('brand-primary', accent);
  put('brand-text', accent);
  put('link', accent);
  put('button-primary-fill', accent);
  put('markdown-code-block', a(panel, surfOp));
  put('bg-module-platform', a(panel, surfOp));
  put('specific-sidebar-fill', a(base, clamp(bgOp + 0.1)));
  put('specific-bubble', a(panel, surfOp));
  put('specific-menu', a(panelAlt, surfOp));
  put('state-error-primary', { r: 220, g: 68, b: 68, a: 1 });
  put('state-success-primary', { r: 52, g: 199, b: 89, a: 1 });

  const covered = Object.keys(tokens).length;

  return {
    mode: String(src.appearance || 'auto').toLowerCase() === 'light' ? 'light' : 'dark',
    tokens,
    surfaces: { base: toCss(a(base, bgOp)), layer1: toCss(a(panel, surfOp)) },
    warnings: [],
    meta: { bgOp, surfOp, covered, uncovered: LEGACY_TOKEN_TOTAL - covered },
    checks: [
      ['label-primary', text, 'bg-overlay', a(panelAlt, clamp(surfOp + 0.08)), 4.5],
      ['label-primary', text, 'bg-layer-1', a(panel, surfOp), 4.5],
      ['label-secondary', muted, 'bg-layer-1', a(panel, surfOp), 4.5],
    ].map(([fg, fgColor, bg, bgColor, min]) => {
      const ratio = contrastRatio(fgColor, bgColor);
      return { fg, bg, ratio: round2(ratio), min, pass: ratio >= min };
    }),
  };
}
