#!/usr/bin/env node
/**
 * Inline lib/kernel.js into lib/client.template.js to produce lib/client.js.
 *
 * The plugin bundle is loaded by the host's `window.__ModuleLoader__` with a
 * bare `require` that can only resolve host packages, so the kernel cannot be
 * imported at runtime. Keeping one ESM source and inlining it at build time
 * avoids two drifting implementations.
 *
 * Usage: node tools/build-client.mjs [--check]
 *   --check  verify lib/client.js is up to date instead of writing it.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const kernelPath = path.join(root, 'lib', 'kernel.js');
const templatePath = path.join(root, 'lib', 'client.template.js');
const outputPath = path.join(root, 'lib', 'client.js');
const PLACEHOLDER = '/*__KERNEL__*/';

/** Turn an ESM module source into a plain statement block. */
function stripModuleSyntax(source, label) {
  if (/^\s*import\s/m.test(source)) throw new Error(label + ': import statements cannot be inlined');
  const body = source
    .replace(/^export\s+default\s+/gm, 'const __default__ = ')
    .replace(/^export\s+(?=(async\s+)?function|class|const|let|var)/gm, '')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  if (/^\s*export\s/m.test(body)) throw new Error(label + ': unsupported export form left in source');
  return body.trim();
}

function build(template, kernel) {
  if (!template.includes(PLACEHOLDER)) throw new Error('client.template.js is missing ' + PLACEHOLDER);
  const block = stripModuleSyntax(kernel, 'kernel.js');
  return template.replace(PLACEHOLDER, () => block);
}

const [template, kernel] = await Promise.all([
  readFile(templatePath, 'utf8'),
  readFile(kernelPath, 'utf8'),
]);

let output;
try {
  output = build(template, kernel);
} catch (error) {
  console.error('[build-client] ' + error.message);
  process.exit(1);
}

const check = process.argv.includes('--check');
if (check) {
  let current = '';
  try { current = await readFile(outputPath, 'utf8'); } catch { current = ''; }
  if (current !== output) {
    console.error('[build-client] lib/client.js is stale — run: node tools/build-client.mjs');
    process.exit(1);
  }
  console.log('[build-client] lib/client.js is up to date (' + output.length + ' bytes)');
} else {
  await writeFile(outputPath, output, 'utf8');
  console.log('[build-client] wrote lib/client.js (' + output.length + ' bytes, kernel ' + kernel.length + ' bytes)');
}
