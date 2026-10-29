'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { localPath } = require('./media');

// Width and height for <img> tags whose source comes from content data, so the browser
// can reserve space before the image loads (the boxes themselves are sized by CSS).
//
//   /images/...           read from the file header in public/ (PNG, JPEG, WebP)
//   ...-1200x800.webp     taken from a "-<width>x<height>" suffix in the file name
//                         (used by scripts/seed-homepage-content.js for uploaded images)
//   anything else         unknown - the tag is rendered without width/height
const cache = new Map();

function fromHeader(buffer) {
  // PNG: IHDR width/height at bytes 16-23.
  if (buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // WebP: RIFF....WEBP then a VP8 / VP8L / VP8X chunk.
  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (chunk === 'VP8L') {
      const bits = buffer.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    if (chunk === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  // JPEG: walk the segments to the first start-of-frame marker.
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      offset += 2 + length;
    }
  }
  return null;
}

function readLocal(publicPath) {
  const root = path.join(config.root, 'public');
  const file = path.join(root, decodeURIComponent(publicPath));
  if (!file.startsWith(root + path.sep)) return null;
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const buffer = Buffer.alloc(64 * 1024);
      const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
      return fromHeader(buffer.subarray(0, bytes));
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}

// Sizes of every file uploaded to Storage by tools/db/upload-images.js, for when the files
// are not on this server.
let manifest;
function fromManifest(publicPath) {
  if (manifest === undefined) {
    try {
      manifest = require('../config/media-sizes.json');
    } catch {
      manifest = {};
    }
  }
  const entry = manifest[publicPath];
  return entry ? { width: entry[0], height: entry[1] } : null;
}

function imageSize(src) {
  if (typeof src !== 'string' || !src) return null;
  if (cache.has(src)) return cache.get(src);
  let size = null;
  const suffix = src.match(/-(\d{1,5})x(\d{1,5})\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i);
  const publicPath = /^\/images\/[^?#]+$/.test(src) ? src : localPath(src);
  if (suffix) size = { width: Number(suffix[1]), height: Number(suffix[2]) };
  else if (publicPath) size = readLocal(publicPath) || fromManifest(publicPath);
  cache.set(src, size);
  return size;
}

module.exports = { imageSize };
