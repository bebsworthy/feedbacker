/**
 * Pack the extension into a ZIP file for distribution.
 * Creates feedbacker-extension-v{version}.zip in the project root.
 *
 * Includes: manifest.json, dist/, popup/, icons/
 */

import { createWriteStream, readFileSync } from 'fs';
import { resolve, relative } from 'path';
import { glob } from 'glob';
import archiver from 'archiver';

const ROOT = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf-8'));
const version = manifest.version || pkg.version;
const outFile = resolve(ROOT, `feedbacker-extension-v${version}.zip`);

async function pack() {
  const output = createWriteStream(outFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    const sizeKB = (archive.pointer() / 1024).toFixed(1);
    console.log(`\n✅ Packed: feedbacker-extension-v${version}.zip (${sizeKB} KB)`);
  });

  archive.on('error', (err) => { throw err; });
  archive.pipe(output);

  // Files to include
  const patterns = [
    'manifest.json',
    'dist/**/*',
    'popup/**/*',
    'icons/**/*'
  ];

  // Exclude source maps from the release ZIP
  const files = await glob(patterns, { cwd: ROOT, ignore: ['**/*.map'] });

  for (const file of files) {
    archive.file(resolve(ROOT, file), { name: file });
  }

  await archive.finalize();
}

pack().catch((err) => {
  console.error('❌ Pack failed:', err);
  process.exit(1);
});
