import * as esbuild from 'esbuild';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(rootDir, 'src/index.ts')],
  platform: 'browser',
  format: 'esm',
  outfile: join(rootDir, 'dist/browser.mjs'),
  alias: {
    'svg-to-raster-converter': join(
      rootDir,
      'src/internal/rendering/svg-to-raster-browser.ts'
    ),
  },
  bundle: true,
  minify: true,
  external: [], // No external dependencies for browser
});

console.log('✓ Browser bundle built: dist/browser.mjs');
