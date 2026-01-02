/**
 * Bundle TypeScript declarations from temp directory
 */
import { execSync } from 'child_process';
import { TEMP_TYPES_DIR } from './temp-paths.mjs';
import { join } from 'path';

try {
  const inputPath = join(TEMP_TYPES_DIR, 'index.d.ts');
  const tsconfigPath = join(process.cwd(), 'tsconfig.json');
  console.log(`Bundling types from: ${inputPath}`);
  execSync(`dts-bundle-generator -o dist/index.d.ts "${inputPath}" --no-check --project "${tsconfigPath}"`, {
    stdio: 'inherit'
  });
  console.log('✓ Type declarations bundled: dist/index.d.ts');
} catch (error) {
  console.error('Type bundling failed:', error.message);
  process.exit(1);
}
