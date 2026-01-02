import * as esbuild from 'esbuild';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(rootDir, 'src/index.ts')],
  platform: 'node',
  format: 'cjs',
  outfile: join(rootDir, 'dist/node.cjs'),
  alias: {
    'svg-to-raster-converter': join(
      rootDir,
      'src/internal/rendering/svg-to-raster-node.ts'
    ),
  },
  bundle: true,
  minify: true,
  external: ['@resvg/resvg-js'], // Keep resvg external (optionalDependency)
});

console.log('✓ Node CJS bundle built: dist/node.cjs');
