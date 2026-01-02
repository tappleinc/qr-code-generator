/**
 * QR Code Matrix Generation - Main Entry Point
 *
 * Orchestrates the complete QR code matrix generation pipeline.
 * This module delegates to specialized sub-modules for clarity:
 * - matrix-core: Basic matrix creation and function pattern tracking
 * - function-patterns: Finder, alignment, timing patterns
 * - data-placement: Zigzag data placement algorithm
 * - mask-selection: Mask pattern application and optimization
 * - format-info: Format and version information encoding
 */

import { ErrorCorrectionLevel } from '../core/types';
import { createMatrix, createFunctionPattern } from './matrix-core';
import {
  placeFinderPatterns,
  placeAlignmentPatterns,
  addTimingPatterns,
  addDarkModule,
} from './function-patterns';
import { placeDataBits } from './data-placement';
import { applyMask, selectBestMask } from './mask-selection';
import {
  addFormatInfo,
  addVersionInfo,
  calculateFormatInfo,
} from './format-info';

// Re-export commonly used functions for backward compatibility
export { createMatrix, createFunctionPattern } from './matrix-core';
export { applyMask } from './mask-selection';

/**
 * Generate complete QR code matrix
 *
 * Combines all matrix generation steps into a single pipeline:
 * 1. Create empty matrix and function pattern tracker
 * 2. Place function patterns (finder, alignment, timing, dark module)
 * 3. Place data bits using zigzag pattern
 * 4. Select optimal mask pattern (or use provided one)
 * 5. Apply mask to data modules
 * 6. Add format and version information
 *
 * @param version QR code version (1-10)
 * @param ecLevel Error correction level ('L', 'M', 'Q', or 'H')
 * @param bitStream Complete bit stream (data + EC + remainder bits)
 * @param maskPattern Optional mask pattern (0-7), auto-selected if not provided
 * @param debug If true, includes debug artifacts in result
 * @returns Object containing final matrix, selected mask, and optional debug info
 */
export function generateMatrix(
  version: number,
  ecLevel: ErrorCorrectionLevel,
  bitStream: boolean[],
  maskPattern?: number,
  debug?: boolean
): {
  matrix: boolean[][];
  mask: number;
  formatInfo?: number;
  unmaskedMatrix?: boolean[][];
} {
  // Step 1: Create empty matrix and function pattern tracker
  const matrix = createMatrix(version);
  const functionPattern = createFunctionPattern(version);

  // Step 2: Place all function patterns
  placeFinderPatterns(matrix);
  addTimingPatterns(matrix);
  placeAlignmentPatterns(matrix, version);
  addDarkModule(matrix, version);

  // Step 3: Place data bits using zigzag pattern
  placeDataBits(matrix, functionPattern, bitStream);

  // Step 4: Capture unmasked matrix for debug if requested
  const unmaskedMatrix = debug ? matrix.map((row) => [...row]) : undefined;

  // Step 5: Select and apply optimal mask pattern
  const selectedMask =
    maskPattern ??
    selectBestMask(matrix, functionPattern, ecLevel, addFormatInfo);
  applyMask(matrix, functionPattern, selectedMask);

  // Step 6: Add format and version information
  addFormatInfo(matrix, ecLevel, selectedMask);
  addVersionInfo(matrix, version);

  // Return result with optional debug info
  return {
    matrix,
    mask: selectedMask,
    formatInfo: debug ? calculateFormatInfo(ecLevel, selectedMask) : undefined,
    unmaskedMatrix,
  };
}
