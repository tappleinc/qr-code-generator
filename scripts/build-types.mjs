/**
 * Build TypeScript declarations in system temp directory
 */
import { execSync } from 'child_process';
import { TEMP_TYPES_DIR } from './temp-paths.mjs';

try {
  console.log(`Building types to: ${TEMP_TYPES_DIR}`);
  execSync(`tsc --emitDeclarationOnly --outDir "${TEMP_TYPES_DIR}"`, {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Type generation failed:', error.message);
  process.exit(1);
}
