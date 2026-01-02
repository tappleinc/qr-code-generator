/**
 * QR Code Matrix Core
 *
 * Handles basic matrix creation and function pattern tracking.
 * These are the foundational operations for QR code matrix generation.
 */

import { ALIGNMENT_PATTERN_LOCATIONS, getQRSize } from '../core/constants';

/**
 * Create empty QR code matrix filled with false (light modules)
 * @param version QR code version (1-10)
 * @returns 2D boolean array representing the QR code matrix
 */
export function createMatrix(version: number): boolean[][] {
  const size = getQRSize(version);
  return Array.from({ length: size }, () => Array(size).fill(false));
}

/**
 * Create function pattern matrix (marks reserved areas that should not be masked)
 * Function patterns include: finder patterns, timing patterns, alignment patterns,
 * dark module, format information areas, and version information areas.
 *
 * @param version QR code version (1-10)
 * @returns 2D boolean array where true = reserved (function pattern area)
 */
export function createFunctionPattern(version: number): boolean[][] {
  const size = getQRSize(version);
  const pattern = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  // Top-left: rows 0-7, cols 0-7
  for (let dy = 0; dy <= 7; dy++) {
    for (let dx = 0; dx <= 7; dx++) {
      pattern[dy][dx] = true;
    }
  }

  // Top-right: rows 0-7, cols (size-8) to (size-1)
  for (let dy = 0; dy <= 7; dy++) {
    for (let dx = 0; dx <= 7; dx++) {
      pattern[dy][size - 8 + dx] = true;
    }
  }

  // Bottom-left: rows (size-8) to (size-1), cols 0-7
  for (let dy = 0; dy <= 7; dy++) {
    for (let dx = 0; dx <= 7; dx++) {
      pattern[size - 8 + dy][dx] = true;
    }
  }

  // Timing patterns (horizontal and vertical)
  for (let i = 8; i < size - 8; i++) {
    pattern[6][i] = true;
    pattern[i][6] = true;
  }

  // Dark module (always present at specific position)
  pattern[4 * version + 9][8] = true;

  // Format information areas (must be reserved so masking doesn't touch them)
  // Vertical (column 8)
  for (let i = 0; i < 6; i++) pattern[i][8] = true;
  pattern[7][8] = true;
  pattern[8][8] = true;
  for (let i = size - 8; i < size; i++) pattern[i][8] = true;

  // Horizontal (row 8)
  for (let i = 0; i < 9; i++) pattern[8][i] = true;
  for (let i = size - 8; i < size; i++) pattern[8][i] = true;

  // Alignment patterns
  const locations = ALIGNMENT_PATTERN_LOCATIONS[version - 1] || [];
  for (const row of locations) {
    for (const col of locations) {
      // Skip if alignment pattern would overlap with finder patterns or timing patterns
      // Finder patterns occupy rows/cols 0-8, and bottom-left/top-right corners
      const overlapsWithFinder =
        (row < 9 && col < 9) || // Top-left finder + separator
        (row < 9 && col > size - 9) || // Top-right finder + separator
        (row > size - 9 && col < 9); // Bottom-left finder + separator

      if (overlapsWithFinder) continue;

      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          pattern[row + dy][col + dx] = true;
        }
      }
    }
  }

  // Version information areas (versions 7+)
  if (version >= 7) {
    // Bottom-left: 6 rows × 3 columns
    for (let row = 0; row < 6; row++) {
      for (let col = size - 11; col < size - 8; col++) {
        pattern[row][col] = true;
      }
    }
    // Top-right: 3 rows × 6 columns
    for (let row = size - 11; row < size - 8; row++) {
      for (let col = 0; col < 6; col++) {
        pattern[row][col] = true;
      }
    }
  }

  return pattern;
}
