const fs = require('node:fs');
const path = require('node:path');

const MAX_BYTES = 1048576;
const OUTPUT_NAME = 'entry.png';

if (process.argv.slice(2).some((arg) => arg === '--help' || arg === '-h')) {
  console.log('Usage: node main.ts [--help|-h]\nCopies entry.png next to this script to $MAKEFUN_OUTPUT_DIR/entry.png (default /output/entry.png).');
  process.exit(0);
}

function magic(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return bytes.subarray(0, 4);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return bytes.subarray(0, 3);
  throw new Error('Source must start with PNG or JPEG magic bytes.');
}

try {
  const sourcePath = path.join(__dirname, 'entry.png');
  if (!fs.existsSync(sourcePath)) throw new Error(`Source is missing: ${sourcePath}`);
  if (fs.statSync(sourcePath).size > MAX_BYTES) throw new Error(`Source exceeds MAX_BYTES (${MAX_BYTES} bytes).`);
  if (!fs.statSync(sourcePath).isFile()) throw new Error(`Source is not a regular file: ${sourcePath}`);
  const source = fs.readFileSync(sourcePath);
  if (source.length > MAX_BYTES) throw new Error(`Source exceeds MAX_BYTES (${MAX_BYTES} bytes).`);
  const sourceMagic = magic(source);
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, OUTPUT_NAME);
  fs.writeFileSync(outputPath, source);
  const written = fs.readFileSync(outputPath);
  if (written.length !== source.length || !magic(written).equals(sourceMagic)) {
    throw new Error('Output verification failed: byte length or magic bytes mismatch.');
  }
  console.log(`${outputPath} ${written.length} bytes`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
