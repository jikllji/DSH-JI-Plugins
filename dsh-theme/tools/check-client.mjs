#!/usr/bin/env node
/**
 * Static + behavioural checks for the browser half.
 *
 * Loads lib/client.js exactly the way the host does (a `window.__ModuleLoader__`
 * registration whose factory receives a bare `require`), then exercises the
 * module through its `__selftest` seam. No browser, no DOM implementation:
 * everything the bundle touches at module scope must survive with stubs.
 *
 * Usage: node tools/check-client.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

/** Minimal React stub: createElement shape is all the bundle needs to type-check. */
const React = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  Fragment: 'Fragment',
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useCallback: (fn) => fn,
  useRef: (value) => ({ current: value }),
};

let registration = null;
const documentStub = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, style: {}, textContent: '', setAttribute() {}, remove() {} }),
  head: { appendChild() {} },
  body: { prepend() {}, style: { getPropertyValue: () => '' } },
};
const windowStub = {
  __ModuleLoader__: { load: (entry) => { registration = entry; } },
  document: documentStub,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  MutationObserver: class { observe() {} disconnect() {} },
};

const source = await readFile(path.join(root, 'lib', 'client.js'), 'utf8');
const run = new Function('window', 'document', 'localStorage', 'MutationObserver', source);
run(windowStub, documentStub, windowStub.localStorage, windowStub.MutationObserver);

check(registration !== null, 'bundle never called window.__ModuleLoader__.load');
check(registration !== null && registration.id === 'dsh-theme', 'bundle id must be "dsh-theme"');

const exports = registration.factory((name) => {
  if (name === 'react') return React;
  throw new Error('unexpected require: ' + name);
});

check(typeof exports.apply === 'function', 'exports.apply missing');
check(Array.isArray(exports.inject) && exports.inject.includes('theme') && exports.inject.includes('slots'),
  'inject must include slots and theme');
check(typeof exports.__selftest === 'object', '__selftest seam missing');

const selftest = exports.__selftest ?? {};
for (const name of ['derive', 'parseThemeCss', 'surfaceAlpha', 'chatMarkup', 'settingsMarkup', 'palette']) {
  check(typeof selftest[name] === 'function', '__selftest.' + name + ' missing');
}

// ── derive against every installed package ────────────────────────────────
const packagesDir = path.join(root, 'packages');
let dirs = [];
try {
  dirs = await readdir(packagesDir, { withFileTypes: true });
} catch { dirs = []; }

let derived = 0;
for (const entry of dirs) {
  if (!entry.isDirectory()) continue;
  const base = path.join(packagesDir, entry.name, 'files');
  let theme;
  try {
    theme = JSON.parse(await readFile(path.join(base, 'theme.json'), 'utf8'));
  } catch { continue; }
  let result;
  try {
    result = selftest.derive(theme);
  } catch (error) {
    failures.push('derive threw for ' + entry.name + ': ' + error.message);
    continue;
  }
  derived += 1;
  const tokens = Object.keys(result.tokens).length;
  check(tokens >= 110, entry.name + ': only ' + tokens + ' tokens');
  check(result.mode === 'light' || result.mode === 'dark', entry.name + ': bad mode ' + result.mode);
  for (const [name, value] of Object.entries(result.tokens)) {
    check(typeof value === 'string' && value.length > 0 && !value.includes('NaN'),
      entry.name + ': token ' + name + ' is not a usable CSS value (' + value + ')');
  }
  const failed = result.checks.filter((item) => !item.pass);
  check(failed.length === 0, entry.name + ': contrast check failed (' + failed.map((item) => item.key + ' ' + item.ratio.toFixed(2)).join(', ') + ')');
  const markup = selftest.chatMarkup('测试 / Test <script>') + selftest.settingsMarkup('测试 <b>', { settings: '设置', opaque: '不透明', alpha: '不透明度', coverage: 'token 覆盖' }, { tokens: 118, total: 124 });
  check(!markup.includes('<script>'), entry.name + ': markup is not escaped');
  check(!markup.includes('undefined'), entry.name + ': markup leaked undefined');
}
check(derived > 0, 'no package could be derived (packages/*/files/theme.json missing?)');

// ── surface alpha survives the theme.css contract ─────────────────────────
check(selftest.surfaceAlpha({ 'background-color': 'rgba(10,12,16,0.42)' }) === 0.42,
  'surfaceAlpha must read an explicit rgba background');
check(selftest.surfaceAlpha({ 'background-color': 'transparent' }) === 0,
  'surfaceAlpha must treat transparent as 0');
check(selftest.surfaceAlpha({ 'background-color': 'var(--ds-theme-color-panel)' }) === 1,
  'surfaceAlpha must treat a solid fill as opaque');
check(selftest.surfaceAlpha({ 'border-color': 'rgba(92,200,232,0.24)' }) === null,
  'surfaceAlpha must ignore border alpha — the v0.5 bug');

const sample = {
  name: 'sample',
  appearance: 'light',
  colors: { background: '#f4f4f5', panel: '#ffffff', panelAlt: 'rgba(240, 242, 248, 0.5)', accent: '#cd2316', text: '#1c1c20', muted: '#6b7280', line: '#e4e4e7' },
  art: { focusX: 0.5, focusY: 0.5, taskMode: 'full' },
};
const light = selftest.derive(sample);
check(light.mode === 'light', 'light package must resolve to light mode');
check(Object.keys(light.tokens).length >= 110, 'light package must emit >= 110 tokens');
check(light.meta.taskMode === 'full', 'taskMode must pass through');

if (failures.length > 0) {
  console.error('[check-client] FAILED (' + failures.length + ')');
  for (const item of failures) console.error('  - ' + item);
  process.exit(1);
}
console.log('[check-client] ok — ' + derived + ' packages derived, bundle ' + source.length + ' bytes');
