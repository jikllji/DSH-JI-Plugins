/**
 * Minimal ZIP reader for theme packages.
 *
 * Only the features a theme package needs: stored and deflate entries, no
 * encryption, no ZIP64. The central directory is authoritative; local headers
 * are consulted only for their variable-length fields.
 */

import { inflateRawSync } from 'node:zlib';

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

function findEocd(bytes) {
  const min = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= min; i -= 1) {
    if (bytes.readUInt32LE(i) === EOCD_SIG) return i;
  }
  return -1;
}

/**
 * Read every file entry from a ZIP buffer.
 * @param buffer - ZIP bytes.
 * @param options.maxTotal - hard cap on summed uncompressed bytes (zip-bomb guard).
 * @returns name -> bytes map, in central-directory order.
 */
export function readZipEntries(buffer, options = {}) {
  const maxTotal = Number.isFinite(options.maxTotal) ? options.maxTotal : 64 * 1024 * 1024;
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const eocd = findEocd(bytes);
  if (eocd === -1) throw new Error('not a zip file');
  const count = bytes.readUInt16LE(eocd + 10);
  let offset = bytes.readUInt32LE(eocd + 16);
  if (offset === 0xffffffff) throw new Error('zip64 is not supported');
  const entries = new Map();
  let expanded = 0;
  for (let index = 0; index < count; index += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== CENTRAL_SIG) {
      throw new Error('damaged zip central directory');
    }
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    if ((flags & 0x1) !== 0) throw new Error('encrypted zip entries are not supported');
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new Error('zip64 is not supported');
    }
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    if (localOffset + 30 > bytes.length || bytes.readUInt32LE(localOffset) !== LOCAL_SIG) {
      throw new Error(`damaged zip entry: ${name}`);
    }
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) throw new Error(`truncated zip entry: ${name}`);
    const compressed = bytes.subarray(dataStart, dataEnd);
    // 先按中央目录的声明值做预算检查，再解码——否则压缩炸弹会在检查之前把进程撑爆。
    if (uncompressedSize > maxTotal) throw new Error(`zip entry too large: ${name}`);
    expanded += uncompressedSize;
    if (expanded > maxTotal) throw new Error('zip expands beyond the size limit');
    let data;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) {
      data = inflateRawSync(compressed, { maxOutputLength: Math.max(1, Math.min(uncompressedSize, maxTotal)) });
    } else throw new Error(`unsupported zip compression method ${method}`);
    if (data.length > maxTotal) throw new Error(`zip entry too large: ${name}`);
    entries.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
