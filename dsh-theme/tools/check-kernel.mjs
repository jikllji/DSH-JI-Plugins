#!/usr/bin/env node
/**
 * check-kernel.mjs — acceptance harness for lib/kernel.js.
 *
 * Runs the kernel over the 11 real DreamSkin packages (6 freshly exported +
 * 5 already installed), asserts the eight contrast pairs and their thresholds,
 * validates that every emitted token is legal CSS, and exercises the edge
 * inputs that used to produce NaN. Prints exactly one line per package on
 * stdout; every diagnostic goes to stderr.
 *
 * Exit code 1 if any assertion fails.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TOKEN_TOTAL,
  contrastRatio,
  derive,
  deriveLegacy,
  fromOklch,
  parseColor,
  toCss,
  toOklch,
} from '../lib/kernel.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VENDOR = path.resolve(HERE, '..');
const UNPACKED = 'C:\\Users\\Jikll\\Desktop\\dsh-temp-work\\dl\\unpacked';
const INSTALLED = path.join(VENDOR, 'packages');

const failures = [];
let failureCount = 0;

function fail(label, message) {
  failureCount += 1;
  failures.push(`[${label}] ${message}`);
  console.error(`✗ [${label}] ${message}`);
}

function assert(condition, label, message) {
  if (!condition) fail(label, message);
  return Boolean(condition);
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/* ─────────────── expected contract ─────────────── */

const EXPECTED_CHECKS = [
  { fg: 'label-primary', bg: 'bg-base', min: 7 },
  { fg: 'label-primary', bg: 'bg-layer-2', min: 7 },
  { fg: 'label-secondary', bg: 'bg-layer-1', min: 4.5 },
  { fg: 'label-tertiary', bg: 'bg-layer-1', min: 3.2 },
  { fg: 'brand-text', bg: 'bg-base', min: 4.5 },
  { fg: 'on-accent', bg: 'brand-primary', min: 4.5 },
  { fg: 'code-text', bg: 'markdown-code-block', min: 7 },
  { fg: 'state-error', bg: 'bg-layer-1', min: 4.5 },
];

const CSS_COLOR = /^(?:#[0-9a-f]{6}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (?:0|1|0?\.\d+)\)|transparent)$/;

// The audit must judge the colours that were actually emitted, not shadow
// values. Every fg/bg name in checks maps onto one of the published tokens.
const CHECK_TOKENS = {
  'label-primary': '--dsw-alias-label-primary',
  'label-secondary': '--dsw-alias-label-secondary',
  'label-tertiary': '--dsw-alias-label-tertiary',
  'brand-text': '--dsw-alias-brand-text',
  'on-accent': '--dsw-alias-brand-primary-invert',
  'code-text': '--dsw-alias-label-primary',
  'state-error': '--dsw-alias-state-error-primary',
  'bg-base': '--dsw-alias-bg-base',
  'bg-layer-1': '--dsw-alias-bg-layer-1',
  'bg-layer-2': '--dsw-alias-bg-layer-2',
  'bg-layer-3': '--dsw-alias-bg-layer-3',
  'brand-primary': '--dsw-alias-brand-primary',
  'markdown-code-block': '--dsw-alias-markdown-code-block',
};

/* ─────────────── package discovery ─────────────── */

function listPackageDirs(root, nested) {
  if (!statSync(root, { throwIfNoEntry: false })) {
    throw new Error(`缺少包目录：${root}`);
  }
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = nested ? path.join(root, entry.name, 'files') : path.join(root, entry.name);
      const themePath = path.join(dir, 'theme.json');
      if (!statSync(themePath, { throwIfNoEntry: false })) return null;
      return { folder: entry.name, dir };
    })
    .filter(Boolean)
    .sort((a, b) => a.folder.localeCompare(b.folder));
}

function loadTheme({ dir, folder }) {
  const raw = readFileSync(path.join(dir, 'theme.json'), 'utf8').replace(/^\uFEFF/, '');
  const theme = JSON.parse(raw);
  const cssPath = path.join(dir, 'theme.css');
  const css = statSync(cssPath, { throwIfNoEntry: false }) ? readFileSync(cssPath, 'utf8') : '';
  return {
    folder,
    theme: {
      ...theme,
      css: typeof theme.css === 'string' && theme.css.trim() ? theme.css : css,
    },
  };
}

/* ─────────────── shared result validation ─────────────── */

function validateTokens(label, result) {
  const tokens = result.tokens;
  expect(isPlainObject(tokens), `${label}: tokens 不是对象`);
  const keys = Object.keys(tokens);
  assert(keys.length >= 110, label, `token 数 ${keys.length} < 110`);
  assert(
    keys.every((key) => key.startsWith('--dsw-alias-') || key.startsWith('--dsw-specific-')),
    label,
    '存在非 --dsw-alias-/--dsw-specific- 前缀的 token',
  );
  for (const [key, value] of Object.entries(tokens)) {
    expect(typeof value === 'string', `${label}: ${key} 不是字符串`);
    expect(!/nan|undefined|null|\[object/i.test(value), `${label}: ${key} 含非法内容 (${value})`);
    assert(CSS_COLOR.test(value), label, `${key} 不是合法 CSS 颜色：${value}`);
  }
  expect(result.meta && typeof result.meta === 'object', `${label}: 缺少 meta`);
  expect(result.meta.coverage === keys.length, `${label}: meta.coverage 与 token 数不一致`);
  expect(result.meta.coverageTotal === TOKEN_TOTAL, `${label}: coverageTotal 应为 ${TOKEN_TOTAL}`);
  expect(result.meta.coverageTotal === 124, `${label}: coverageTotal 契约应为 124（114 alias + 10 specific）`);
  expect(Number.isFinite(result.meta.step), `${label}: meta.step 非数字`);
  assert(result.meta.step >= 0.028 && result.meta.step <= 0.055, label, `meta.step 越界：${result.meta.step}`);
  expect(result.mode === 'light' || result.mode === 'dark', `${label}: mode 非法`);
  expect(Array.isArray(result.warnings), `${label}: warnings 不是数组`);
  expect(isPlainObject(result.surfaces), `${label}: surfaces 缺失`);
  for (const [key, value] of Object.entries(result.surfaces)) {
    assert(CSS_COLOR.test(value), label, `surfaces.${key} 不是合法 CSS 颜色：${value}`);
  }

  // Art focus contract.
  const { focusX, focusY, backgroundX, backgroundY, taskMode } = result.meta;
  assert(Number.isFinite(focusX) && focusX >= 0 && focusX <= 1, label, `focusX 越界：${focusX}`);
  assert(Number.isFinite(focusY) && focusY >= 0 && focusY <= 1, label, `focusY 越界：${focusY}`);
  assert(backgroundX === Math.round((focusX - 0.5) * 200), label, 'backgroundX 与 focusX 不一致');
  assert(backgroundY === Math.round((focusY - 0.5) * 200), label, 'backgroundY 与 focusY 不一致');
  assert(backgroundX >= -100 && backgroundX <= 100, label, `backgroundX 越界：${backgroundX}`);
  assert(backgroundY >= -100 && backgroundY <= 100, label, `backgroundY 越界：${backgroundY}`);
  if (taskMode === 'full') {
    assert(focusX === 0.5 && focusY === 0.5, label, "taskMode=full 时 focus 应为 0.5/0.5");
    assert(backgroundX === 0 && backgroundY === 0, label, "taskMode=full 时 background 偏移应为 0");
  }

  // cssVars contract.
  const vars = result.cssVars;
  expect(isPlainObject(vars), `${label}: cssVars 缺失`);
  for (const [key, value] of Object.entries(vars)) {
    if (key === '--jz-dialog-alpha') {
      assert(Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1, label, `dialogAlpha 非法：${value}`);
    } else {
      assert(CSS_COLOR.test(value), label, `${key} 不是合法 CSS 颜色：${value}`);
    }
  }
}

function validateChecks(label, result) {
  expect(Array.isArray(result.checks), `${label}: checks 不是数组`);
  expect(result.checks.length === 8, `${label}: checks 应有 8 项，实得 ${result.checks.length}`);
  const actualShape = result.checks.map(({ fg, bg, min }) => ({ fg, bg, min }));
  expect(
    JSON.stringify(actualShape) === JSON.stringify(EXPECTED_CHECKS),
    `${label}: 检查项/阈值与 engine.js 不一致\n实得 ${JSON.stringify(actualShape)}`,
  );
  for (const check of result.checks) {
    expect(Number.isFinite(check.ratio) && check.ratio > 0, `${label}: ${check.fg}/${check.bg} ratio 非数字`);
    if (!check.pass) fail(label, `${check.fg}/${check.bg} 未达标：${check.ratio} < ${check.min}`);

    // Recompute from the emitted tokens so a check can never drift away from
    // the colours the client actually consumes.
    const fgKey = CHECK_TOKENS[check.fg];
    const bgKey = CHECK_TOKENS[check.bg];
    expect(fgKey && bgKey, `${label}: ${check.fg}/${check.bg} 没有对应的 token 映射`);
    const fg = parseColor(result.tokens[fgKey]);
    const bg = parseColor(result.tokens[bgKey]);
    expect(fg && bg, `${label}: ${check.fg}/${check.bg} 的 token 无法解析`);
    const recomputed = contrastRatio(fg, bg);
    // Tokens are serialised to 8-bit sRGB, so a tiny quantisation drift from
    // the float colours used by the guard is expected; anything larger means
    // the audit and the emitted colours have diverged.
    expect(
      Math.abs(recomputed - check.ratio) <= 0.12,
      `${label}: ${check.fg}/${check.bg} 报告 ${check.ratio} 与 token 实测 ${recomputed.toFixed(3)} 不一致`,
    );
  }
}

const minimumOf = (result) =>
  result.checks.reduce((min, check) => (check.ratio < min.ratio ? check : min), result.checks[0]);

function runTheme(label, theme) {
  const result = derive(theme);
  validateTokens(label, result);
  validateChecks(label, result);
  return result;
}

/* ─────────────── 1) the eleven real packages ─────────────── */

// The installed tree can already contain the six fresh packages after a
// previous install run. Deduplicate by theme id (fresh export wins) so the
// harness always audits the intended 11 distinct themes.
const discovered = [
  ...listPackageDirs(UNPACKED, false).map((entry) => ({ ...entry, origin: 'new' })),
  ...listPackageDirs(INSTALLED, true).map((entry) => ({ ...entry, origin: 'installed' })),
];
const seenIds = new Set();
const packages = [];
for (const entry of discovered) {
  const { theme } = loadTheme(entry);
  const id = typeof theme.id === 'string' && theme.id ? theme.id : entry.folder;
  if (seenIds.has(id)) continue;
  seenIds.add(id);
  packages.push({ ...entry, id, theme });
}

if (packages.length !== 11) {
  fail('discovery', `预期 11 个包，实得 ${packages.length}（${packages.map((p) => p.folder).join(', ')}）`);
}

let rgbaPanelAltPackages = 0;
const rows = [];

for (const pkg of packages) {
  const label = pkg.folder;
  const theme = pkg.theme;
  let result;
  try {
    const panelAlt = theme.colors && theme.colors.panelAlt;
    if (typeof panelAlt === 'string' && /^rgba?\(/i.test(panelAlt.trim())) {
      rgbaPanelAltPackages += 1;
      const probe = derive(theme);
      const serialised = JSON.stringify({ tokens: probe.tokens, cssVars: probe.cssVars });
      expect(!/nan|undefined/i.test(serialised), `${label}: rgba panelAlt 产生了 NaN/undefined`);
    }
    result = runTheme(label, theme);

    const min = minimumOf(result);
    rows.push({
      label,
      name: typeof theme.name === 'string' ? theme.name : '',
      origin: pkg.origin,
      mode: result.mode,
      tokens: Object.keys(result.tokens).length,
      minRatio: min.ratio,
      minPair: `${min.fg}/${min.bg}`,
      ratios: result.checks.map((c) => c.ratio.toFixed(2)).join(','),
      passCount: result.checks.filter((c) => c.pass).length,
    });
  } catch (error) {
    fail(label, error instanceof Error ? error.message : String(error));
    rows.push({
      label,
      name: '',
      origin: pkg.origin,
      mode: '?',
      tokens: 0,
      minRatio: 0,
      minPair: '-',
      ratios: '-',
      passCount: 0,
    });
  }
}

assert(rgbaPanelAltPackages >= 1, 'panelAlt', '没有找到 panelAlt 为 rgba 的包，断言未覆盖');

/* ─────────────── 2) edge inputs ─────────────── */

try {
  // Empty / missing theme must still produce a complete, legal token set.
  for (const theme of [undefined, null, {}, { colors: {} }, { colors: { panelAlt: '' } }]) {
    const label = `edge:${JSON.stringify(theme)}`;
    const result = runTheme(label, theme);
    expect(['light', 'dark'].includes(result.mode), `${label}: mode 非法`);
  }

  // panelAlt in hsl() and empty string must land safely (no NaN, legal CSS).
  const hsl = runTheme('edge:hsl-panel-alt', {
    appearance: 'light',
    colors: {
      background: '#f6f6f6',
      panel: '#ffffff',
      panelAlt: 'hsl(210 40% 80%)',
      accent: '#5888ae',
      text: '#1c1f24',
      line: 'rgba(28, 31, 36, 0.2)',
    },
  });
  expect(hsl.mode === 'light', 'edge:hsl-panel-alt: mode 应为 light');
  assert(hsl.checks.every((c) => c.pass), 'edge:hsl-panel-alt', 'hsl panelAlt 导致检查失败');

  const rgba = runTheme('edge:rgba-panel-alt', {
    appearance: 'auto',
    colors: {
      background: '#EFF5FF',
      panel: '#DDEAFF',
      panelAlt: 'rgba(219, 234, 255, 0.48)',
      accent: '#385ABC',
      text: '#20345A',
      line: '#B6CDEC',
    },
  });
  assert(rgba.mode === 'light', 'edge:rgba-panel-alt', `mode 应为 light，实得 ${rgba.mode}`);

  // appearance is a claim: a clear background conflict warns and wins.
  const conflict = runTheme('edge:appearance-conflict', {
    appearance: 'dark',
    colors: {
      background: '#ffffff',
      panel: '#f4f4f4',
      panelAlt: '#ececec',
      accent: '#385ABC',
      text: '#1b1b1b',
      line: 'rgba(0, 0, 0, 0.16)',
    },
  });
  expect(conflict.mode === 'light', 'edge:appearance-conflict: 背景明显为浅色时 mode 应为 light');
  assert(conflict.warnings.length > 0, 'edge:appearance-conflict', '未发出冲突警告');

  // Ambiguous mid-tone background keeps the explicit declaration.
  const ambiguous = derive({ appearance: 'dark', colors: { background: '#7a7a7a' } });
  expect(ambiguous.mode === 'dark', 'edge:ambiguous: 中灰背景应尊重显式声明');

  // taskMode full pins focus.
  const full = derive({
    appearance: 'light',
    art: { focusX: 0.9, focusY: 0.1, taskMode: 'full', safeArea: 'left' },
    colors: { background: '#f6f6f6', panel: '#ffffff', panelAlt: '#f0f0f0', accent: '#5888ae', text: '#1c1f24' },
  });
  expect(full.meta.taskMode === 'full', 'edge:taskMode: taskMode 未保留');
  expect(full.meta.focusX === 0.5 && full.meta.focusY === 0.5, 'edge:taskMode: full 未把 focus 归中');
  expect(full.meta.backgroundX === 0 && full.meta.backgroundY === 0, 'edge:taskMode: 偏移未归零');

  // Missing/null/blank focus and a whitespace-padded appearance must land on
  // the documented defaults instead of coercing to zero.
  const missingFocus = derive({
    appearance: ' Light ',
    art: { focusX: null, focusY: '', taskMode: 'ambient' },
    colors: { background: '#ffffff' },
  });
  expect(missingFocus.mode === 'light', 'edge:focus: 带空白的 appearance 未归一化');
  expect(missingFocus.meta.focusX === 0.5 && missingFocus.meta.focusY === 0.5, 'edge:focus: 空 focus 未回到 0.5');

  // The known real defect: #5579ac with white ink is 4.45:1. The fill must
  // move (hue kept), the label must stay white, and the pair must pass.
  const clearSky = derive({
    appearance: 'light',
    colors: {
      background: '#F2F3F7',
      panel: '#FFFFFF',
      panelAlt: '#E8ECF5',
      accent: '#5579ac',
      accentAlt: '#7FA2CC',
      secondary: '#6E89B8',
      text: '#1D2430',
      muted: '#5A6678',
      line: '#C9D2E0',
    },
  });
  const onAccent = clearSky.checks[5];
  expect(onAccent.fg === 'on-accent' && onAccent.bg === 'brand-primary', 'edge:clear-sky: 第 6 项不是 on-accent');
  expect(onAccent.ratio >= 4.5, `edge:clear-sky: on-accent 仍不达标 ${onAccent.ratio}`);
  const fill = clearSky.tokens['--dsw-alias-brand-primary'];
  expect(fill !== '#5579ac', 'edge:clear-sky: 填充色未被修正');
  expect(clearSky.cssVars['--jz-btn-text'] === '#ffffff', 'edge:clear-sky: 文字色被改动（应保持白色）');
  const fillOklch = toOklch(parseColor(fill));
  const accentOklch = toOklch(parseColor('#5579ac'));
  expect(Math.abs(fillOklch.H - accentOklch.H) < 0.02, 'edge:clear-sky: 修正填充色时色相发生了偏移');

  // Colour parsing contract.
  expect(parseColor('#abc')?.r === 0xaa && parseColor('#abc')?.g === 0xbb, 'edge:parseColor: #abc');
  expect(parseColor('#aabbccdd')?.a === 0xdd / 255, 'edge:parseColor: #aabbccdd');
  expect(parseColor('rgba(1 2 3 / 40%)')?.a === 0.4, 'edge:parseColor: rgba 空格语法');
  expect(parseColor('hsl(0, 100%, 50%)')?.r === 255, 'edge:parseColor: hsl');
  expect(parseColor('transparent')?.a === 0, 'edge:parseColor: transparent');
  expect(parseColor('var(--x)') === null, 'edge:parseColor: var() 应返回 null');
  expect(parseColor('not-a-color') === null, 'edge:parseColor: 垃圾输入应返回 null');
  expect(Number.isFinite(toCss(parseColor('hsl(210, 40%, 80%)')).length), 'edge:toCss: hsl 输出');

  // Round-trip guards: OKLCH→sRGB stays finite and in gamut.
  for (const L of [0, 0.02, 0.5, 0.98, 1]) {
    const c = fromOklch({ L, C: 0.4, H: 2.2, a: 1 });
    expect([c.r, c.g, c.b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255), `edge:gamut L=${L}`);
  }
  expect(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 }) > 20, 'edge:contrast');

  // Legacy comparison still runs (deliberately buggy by design, never used
  // for acceptance): it only needs to stay safe.
  const legacy = deriveLegacy({
    appearance: 'light',
    colors: { background: '#ffffff', panel: '#f4f4f4', panelAlt: '#ececec', accent: '#5579ac', text: '#1b1b1b' },
  });
  expect(Object.keys(legacy.tokens).length > 10, 'edge:legacy: token 过少');
} catch (error) {
  fail('edge', error instanceof Error ? error.message : String(error));
}

/* ─────────────── 3) report ─────────────── */

for (const row of rows) {
  // Exactly one stdout line per package: 6 new + 5 installed = 11.
  const status = row.passCount === 8 ? '8/8' : `${row.passCount}/8`;
  const name = row.name ? ` ${row.name}` : '';
  console.log(
    `${row.label}${name} | ${row.origin} | mode=${row.mode} | tokens=${row.tokens} | checks=${status} | ratios=${row.ratios} | min=${row.minRatio} (${row.minPair})`,
  );
}

console.error(
  `\n共 ${packages.length} 个包；RGBA panelAlt 包 ${rgbaPanelAltPackages} 个；失败断言 ${failureCount} 条。`,
);
if (failureCount > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
