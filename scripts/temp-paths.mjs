/**
 * Centralized temp directory paths for build scripts
 * All temporary build artifacts go in system temp, not in the repo
 * 
 * Note: Playwright temp dir is defined directly in playwright.config.ts
 * since TypeScript can't easily import .mjs modules.
 */
import { tmpdir } from 'os';
import { join } from 'path';

const TEMP_BASE = join(tmpdir(), 'tapple-qr-build');

export const TEMP_TYPES_DIR = join(TEMP_BASE, 'types');
