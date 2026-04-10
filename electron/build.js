// Build script for Electron main process TypeScript
const esbuild = require('esbuild');
const path = require('path');

async function build() {
  // Build main process
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.join(__dirname, '../dist-electron/main.js'),
    external: ['electron'],
    format: 'cjs',
  });

  // Build preload
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'preload.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.join(__dirname, '../dist-electron/preload.js'),
    external: ['electron'],
    format: 'cjs',
  });

  console.log('Electron build complete');
}

build().catch(console.error);