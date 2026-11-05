/**
 * Runnable check for the DreamSkin package store (v0.6 contract).
 *
 * 1. Builds synthetic DreamSkin ZIPs in memory and asserts the full metadata
 *    contract: theme.json as the only required file, appearance passthrough
 *    (light / dark / auto), image + imageUrl, raw theme passthrough, capability
 *    derivation, and the rejection of a legacy DSH v2 package.
 * 2. Re-imports the bundled example packages under packages/ (source.zip when
 *    present, otherwise the extracted files/) and asserts their metadata.
 * 3. Asserts every row in index.json carries theme.colors and either an
 *    imageUrl string or null, and that the index is version 2.
 *
 * Run: node tools/check-packages.mjs [extra-package-dir ...]
 * Each extra dir is either one DreamSkin folder (theme.json at its root, or
 * under files/) or a directory holding several such folders; those are zipped
 * in memory and imported before the index assertion runs.
 */

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  PACKAGES_DIR,
  FORMAT,
  INDEX_VERSION,
  APPEARANCES,
  importPackage,
  listPackages,
  removePackage,
  resolvePackageAsset,
  exportPath,
  exportPackage,
} from '../lib/store.js';
import { readZipEntries } from '../lib/zip.js';
import { writeZipEntries } from '../lib/zip-write.js';

const CONTRACT_KEYS = [
  'id', 'name', 'format', 'appearance', 'version', 'accent', 'license',
  'publisher', 'attribution', 'themeId', 'capabilities', 'skinApiVersion',
  'image', 'imageUrl', 'theme', 'files', 'bytes', 'unpackedBytes', 'createdAt',
];

const BUNDLED_IDS = [
  'codex-2026-8-21-17-24-30',
  'dreamskin-2560x1440',
  'jikllji-totoro',
  'simple-cat',
  'tokyo-midnight-blue',
];

const TEMP_IDS = ['check-temp-auto', 'check-temp-light', 'check-temp-plain', 'check-temp-skin'];

async function exists(path) {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function zipDirectory(root) {
  const entries = [];
  const walk = async (dir, prefix) => {
    const children = await fs.readdir(dir, { withFileTypes: true });
    for (const child of children) {
      const full = join(dir, child.name);
      const rel = prefix === '' ? child.name : `${prefix}/${child.name}`;
      if (child.isDirectory()) await walk(full, rel);
      else entries.push([rel, await fs.readFile(full)]);
    }
  };
  await walk(root, '');
  return entries;
}

/** Read a package folder back into the ZIP it would have shipped as. */
async function archiveFor(dir) {
  if (await exists(join(dir, 'source.zip'))) return fs.readFile(join(dir, 'source.zip'));
  const filesRoot = join(dir, 'files');
  const root = (await exists(join(filesRoot, 'theme.json'))) ? filesRoot : dir;
  const entries = await zipDirectory(root);
  assert.ok(entries.some(([name]) => name === 'theme.json'), `${dir}: no theme.json to import`);
  return writeZipEntries(entries);
}

/** A directory is a package folder, or a set of package folders. */
async function packageFoldersIn(dir) {
  if (await exists(join(dir, 'theme.json'))) return [dir];
  if (await exists(join(dir, 'files', 'theme.json'))) return [dir];
  const children = await fs.readdir(dir, { withFileTypes: true });
  const folders = [];
  for (const child of children) {
    if (!child.isDirectory()) continue;
    const candidate = join(dir, child.name);
    if (await exists(join(candidate, 'theme.json'))) folders.push(candidate);
    else if (await exists(join(candidate, 'files', 'theme.json'))) folders.push(candidate);
  }
  return folders;
}

function assertContract(meta, label) {
  assert.equal(
    Object.keys(meta).sort().join(','),
    [...CONTRACT_KEYS].sort().join(','),
    `${label}: contract key set`,
  );
  assert.equal(meta.format, FORMAT, `${label}: format`);
  assert.ok(typeof meta.id === 'string' && meta.id.length > 0, `${label}: id`);
  assert.ok(typeof meta.name === 'string' && meta.name.length > 0, `${label}: name`);
  assert.ok(APPEARANCES.includes(meta.appearance), `${label}: appearance "${meta.appearance}" not in ${APPEARANCES.join('/')}`);
  assert.equal(typeof meta.version, 'string', `${label}: version`);
  assert.ok(meta.accent === null || typeof meta.accent === 'string', `${label}: accent`);
  assert.ok(meta.license === null || typeof meta.license === 'string', `${label}: license`);
  assert.ok(meta.publisher === null || typeof meta.publisher === 'string', `${label}: publisher`);
  assert.ok(meta.attribution === null || typeof meta.attribution === 'string', `${label}: attribution`);
  assert.ok(typeof meta.themeId === 'string' && meta.themeId.length > 0, `${label}: themeId`);
  assert.ok(Array.isArray(meta.capabilities), `${label}: capabilities`);
  assert.ok(meta.capabilities.every((value) => typeof value === 'string'), `${label}: capabilities entries`);
  assert.equal(typeof meta.skinApiVersion, 'number', `${label}: skinApiVersion`);
  assert.ok(meta.image === null || typeof meta.image === 'string', `${label}: image`);
  assert.ok(meta.theme !== null && typeof meta.theme === 'object' && !Array.isArray(meta.theme), `${label}: theme`);
  assert.ok(meta.theme.colors !== null && typeof meta.theme.colors === 'object', `${label}: theme.colors`);
  if (meta.image === null) {
    assert.equal(meta.imageUrl, null, `${label}: imageUrl must be null without an image`);
  } else {
    assert.equal(
      meta.imageUrl,
      `/dsh-theme/packages/${meta.id}/files/${meta.image}`,
      `${label}: imageUrl`,
    );
  }
  assert.ok(Number.isInteger(meta.files) && meta.files >= 1, `${label}: files`);
  assert.ok(typeof meta.bytes === 'number' && meta.bytes > 0, `${label}: bytes`);
  assert.ok(typeof meta.unpackedBytes === 'number' && meta.unpackedBytes > 0, `${label}: unpackedBytes`);
  assert.ok(!Number.isNaN(Date.parse(meta.createdAt)), `${label}: createdAt`);
}

// ---------------------------------------------------------------------------
// 1. Synthetic packages: the contract itself.
// ---------------------------------------------------------------------------

for (const id of TEMP_IDS) await removePackage(id);

const autoTheme = {
  schemaVersion: 1,
  id: 'check-temp-auto',
  name: 'Check 中文 Name',
  appearance: 'auto',
  image: 'background.png',
  art: { focusX: 0.5, focusY: 0.5, safeArea: 'left', taskMode: 'ambient' },
  colors: { background: '#101010', panel: '#161616', accent: '#3366ff', text: '#eeeeee' },
};
const autoManifest = {
  packageVersion: 1,
  themeId: 'check-temp-auto',
  version: '1.2.3',
  skinApiVersion: 1,
  capabilities: ['background', 'tokens', 'safe-css'],
  publisher: { id: 'check', displayName: 'Check Publisher' },
  license: 'MIT',
  provenance: { aiGenerated: false, summary: '合成测试包' },
};
const autoArchive = writeZipEntries([
  ['theme.json', Buffer.from(JSON.stringify(autoTheme, null, 2))],
  ['manifest.json', Buffer.from(JSON.stringify(autoManifest, null, 2))],
  ['theme.css', Buffer.from(':root{}')],
  ['background.png', Buffer.from([0x89, 0x50, 0x4e, 0x47])],
]);

const autoMeta = await importPackage(autoArchive, { filename: 'check-temp-auto.zip' });
assertContract(autoMeta, 'auto');
assert.equal(autoMeta.id, 'check-temp-auto');
assert.equal(autoMeta.appearance, 'auto', 'appearance must pass through instead of collapsing to dark');
assert.equal(autoMeta.name, 'Check 中文 Name');
assert.equal(autoMeta.version, '1.2.3');
assert.equal(autoMeta.accent, '#3366ff');
assert.equal(autoMeta.license, 'MIT');
assert.equal(autoMeta.publisher, 'Check Publisher');
assert.equal(autoMeta.attribution, '合成测试包');
assert.equal(autoMeta.themeId, 'check-temp-auto');
assert.deepEqual(autoMeta.capabilities, ['background', 'tokens', 'safe-css']);
assert.equal(autoMeta.skinApiVersion, 1);
assert.equal(autoMeta.image, 'background.png');
assert.equal(autoMeta.files, 4);
assert.equal(autoMeta.bytes, autoArchive.length);
assert.deepEqual(autoMeta.theme, autoTheme, 'theme.json must be passed through untouched');

const autoAsset = await resolvePackageAsset('check-temp-auto', 'background.png');
assert.ok(autoAsset !== null && autoAsset.size === 4 && autoAsset.mime === 'image/png');
assert.equal(await resolvePackageAsset('check-temp-auto', '../theme.json'), null);
assert.equal(await resolvePackageAsset('check-temp-auto', 'missing.png'), null);
assert.ok(await exportPath('check-temp-auto'));

const mergedExport = await exportPackage('check-temp-auto', { merged: true });
assert.ok(mergedExport !== null && mergedExport.buffer.length > 0);
assert.deepEqual(JSON.parse(readZipEntries(mergedExport.buffer).get('theme.json').toString('utf8')), autoTheme);
const rawExport = await exportPackage('check-temp-auto', { merged: false });
assert.equal(rawExport.buffer.length, autoArchive.length);

// No manifest.json: appearance passes through and capabilities are derived.
const lightTheme = {
  schemaVersion: 1,
  id: 'check-temp-light',
  name: 'Light Package',
  appearance: 'light',
  image: 'bg.webp',
  colors: { accent: '#ff8800' },
};
const lightMeta = await importPackage(writeZipEntries([
  ['theme.json', Buffer.from(JSON.stringify(lightTheme))],
  ['theme.css', Buffer.from(':root{}')],
  ['bg.webp', Buffer.from([0x52, 0x49, 0x46, 0x46])],
]), { filename: 'check-temp-light.zip' });
assertContract(lightMeta, 'light');
assert.equal(lightMeta.appearance, 'light');
assert.deepEqual(lightMeta.capabilities, ['background', 'tokens', 'safe-css']);
assert.equal(lightMeta.version, '', 'no release version declared: empty string, not schemaVersion');
assert.equal(lightMeta.skinApiVersion, 1);

// No appearance at all, no image: neutral 'auto', tokens-only capabilities.
const plainMeta = await importPackage(writeZipEntries([
  ['theme.json', Buffer.from(JSON.stringify({ schemaVersion: 1, id: 'check-temp-plain', name: 'Plain', colors: { accent: '#123456' } }))],
]), { filename: 'check-temp-plain.zip' });
assertContract(plainMeta, 'plain');
assert.equal(plainMeta.appearance, 'auto');
assert.equal(plainMeta.image, null);
assert.equal(plainMeta.imageUrl, null);
assert.deepEqual(plainMeta.capabilities, ['tokens']);

// A legacy DSH v2 package (skin manifest + patch CSS, no theme.json) is not a
// DreamSkin package: rejected outright, never stored under a fallback id.
await assert.rejects(
  () => importPackage(writeZipEntries([
    ['skin-v2.json', Buffer.from(JSON.stringify({ skinManifestVersion: 2, id: 'check-temp-skin', name: 'Legacy' }))],
    ['patches.css', Buffer.from(':root{--dsw-alias-bg-base:#101010}')],
  ]), { filename: 'check-temp-skin.zip' }),
  /不是 DreamSkin 包/,
);
assert.ok(!(await listPackages()).some((entry) => entry.id === 'check-temp-skin'));

// ---------------------------------------------------------------------------
// 2. Bundled example packages, re-imported from source.zip / files/.
// ---------------------------------------------------------------------------

let importedNow = 0;
for (const id of BUNDLED_IDS) {
  const dir = join(PACKAGES_DIR, id);
  const archive = await archiveFor(dir);
  const meta = await importPackage(archive, { filename: `${id}.zip` });
  assert.equal(meta.id, id, `${id}: declared id wins`);
  assertContract(meta, `bundled ${id}`);
  importedNow += 1;
}

// ---------------------------------------------------------------------------
// 3. Extra package folders (optional CLI args), then the whole index.
// ---------------------------------------------------------------------------

for (const arg of process.argv.slice(2)) {
  const root = resolve(arg);
  const folders = await packageFoldersIn(root);
  assert.ok(folders.length > 0, `${arg}: no DreamSkin package folders found`);
  for (const folder of folders) {
    const meta = await importPackage(await archiveFor(folder), { filename: `${folder}.zip` });
    assertContract(meta, `extra ${meta.id}`);
    importedNow += 1;
  }
}

for (const id of TEMP_IDS) await removePackage(id);

const packages = await listPackages();
assert.ok(packages.length >= BUNDLED_IDS.length, `index has only ${packages.length} packages`);
for (const meta of packages) {
  assertContract(meta, `index ${meta.id}`);
  assert.ok(meta.theme.colors !== undefined, `${meta.id}: theme.colors`);
}
const indexedIds = new Set(packages.map((entry) => entry.id));
for (const id of BUNDLED_IDS) assert.ok(indexedIds.has(id), `index is missing bundled package ${id}`);
for (const id of TEMP_IDS) assert.ok(!indexedIds.has(id), `index still holds temp package ${id}`);

const rawIndex = JSON.parse(await fs.readFile(join(PACKAGES_DIR, 'index.json'), 'utf8'));
assert.equal(rawIndex.version, INDEX_VERSION, 'index.json version');
assert.equal(rawIndex.packages.length, packages.length);
const appearances = {};
for (const meta of packages) appearances[meta.appearance] = (appearances[meta.appearance] ?? 0) + 1;

console.log(
  `package store check: ok — ${packages.length} DreamSkin packages ` +
  `(${importedNow} imported this run, appearance ${JSON.stringify(appearances)})`,
);
