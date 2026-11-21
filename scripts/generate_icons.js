const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (width * 4 + 1));

  let pos = 0;
  const center = size / 2;
  const radius = size * 0.46;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Gradient from deep blue (#2563EB) to cyan (#06B6D4)
        const factor = (x + y) / (width + height);
        const r = Math.round(37 + (6 - 37) * factor);
        const g = Math.round(99 + (182 - 99) * factor);
        const b = Math.round(235 + (212 - 235) * factor);

        // Simple lightning/bolt shape or 'A' in center (white)
        const relX = x / size;
        const relY = y / size;

        let isLogo = false;
        // Draw lightning bolt
        if (
          (relX >= 0.42 && relX <= 0.62 && relY >= 0.22 && relY <= 0.45 && (relX + relY * 0.6 >= 0.58 && relX + relY * 0.6 <= 0.78)) ||
          (relX >= 0.35 && relX <= 0.58 && relY >= 0.42 && relY <= 0.78 && (relX + relY * 0.7 >= 0.62 && relX + relY * 0.7 <= 0.85))
        ) {
          isLogo = true;
        }

        if (isLogo) {
          rawData[pos++] = 255; // R
          rawData[pos++] = 255; // G
          rawData[pos++] = 255; // B
          rawData[pos++] = 255; // A
        } else {
          rawData[pos++] = r;
          rawData[pos++] = g;
          rawData[pos++] = b;
          rawData[pos++] = 255;
        }
      } else {
        // Transparent
        rawData[pos++] = 0;
        rawData[pos++] = 0;
        rawData[pos++] = 0;
        rawData[pos++] = 0;
      }
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

[16, 48, 128].forEach(size => {
  const buf = generatePng(size);
  const outPath = path.join(__dirname, '..', 'icons', `icon${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`Generated ${outPath} (${buf.length} bytes)`);
});
