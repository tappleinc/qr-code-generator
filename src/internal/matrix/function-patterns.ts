/**
 * QR Code Function Patterns
 *
 * Handles placement of function patterns in QR code matrices:
 * - Finder patterns (position detection patterns in three corners)
 * - Alignment patterns (smaller position markers for larger QR codes)
 * - Timing patterns (alternating dark/light modules for coordinate detection)
 * - Dark module (single dark module for coordinate reference)
 */

import { ALIGNMENT_PATTERN_LOCATIONS } from '../core/constants';

/**
 * Add finder pattern (7×7 position detection pattern) to matrix
 * Finder patterns have three layers:
 * - Outer 7×7 border (dark)
 * - 5×5 white separator inside
 * - 3×3 dark core in center
 *
 * The pattern is actually placed in an 8×8 area including white separator
 *
 * @param matrix QR code matrix to modify
 * @param row Top-left row coordinate of the 8×8 area
 * @param col Top-left column coordinate of the 8×8 area
 */
export function addFinderPattern(
  matrix: boolean[][],
  row: number,
  col: number
): void {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const y = row + dy;
      const x = col + dx;
      if (y < 0 || y >= matrix.length || x < 0 || x >= matrix.length) continue;

      const isOuter =
        dy >= 0 &&
        dy <= 6 &&
        dx >= 0 &&
        dx <= 6 &&
        (dy === 0 || dy === 6 || dx === 0 || dx === 6);
      const isCenter = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;

      matrix[y][x] = isOuter || isCenter;
    }
  }
}

/**
 * Add alignment pattern (5×5 position marker) to matrix
 * Alignment patterns help scanners correct for distortion in larger QR codes
 * Structure: outer 5×5 border (dark), white ring, dark center module
 *
 * @param matrix QR code matrix to modify
 * @param row Center row coordinate of the alignment pattern
 * @param col Center column coordinate of the alignment pattern
 */
export function addAlignmentPattern(
  matrix: boolean[][],
  row: number,
  col: number
): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const isOuter = dy === -2 || dy === 2 || dx === -2 || dx === 2;
      const isCenter = dy === 0 && dx === 0;
      matrix[row + dy][col + dx] = isOuter || isCenter;
    }
  }
}

/**
 * Add timing patterns (alternating dark/light modules) to matrix
 * Timing patterns run horizontally (row 6) and vertically (column 6)
 * Used by scanners to determine module coordinates
 *
 * @param matrix QR code matrix to modify
 */
export function addTimingPatterns(matrix: boolean[][]): void {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
}

/**
 * Place all finder patterns in the three corners of the QR code
 * @param matrix QR code matrix to modify
 */
export function placeFinderPatterns(matrix: boolean[][]): void {
  // Top-left
  addFinderPattern(matrix, 0, 0);
  // Top-right
  addFinderPattern(matrix, 0, matrix.length - 7);
  // Bottom-left
  addFinderPattern(matrix, matrix.length - 7, 0);
}

/**
 * Place all alignment patterns according to QR specification
 * Alignment patterns are positioned based on version-specific coordinates
 * and must not overlap with finder patterns
 *
 * @param matrix QR code matrix to modify
 * @param version QR code version (1-10)
 */
export function placeAlignmentPatterns(
  matrix: boolean[][],
  version: number
): void {
  const size = matrix.length;
  const locations = ALIGNMENT_PATTERN_LOCATIONS[version - 1] || [];

  for (const row of locations) {
    for (const col of locations) {
      // Skip if alignment pattern would overlap with finder patterns
      // Finder patterns occupy rows/cols 0-8, and bottom-left/top-right corners
      const overlapsWithFinder =
        (row < 9 && col < 9) || // Top-left finder + separator
        (row < 9 && col > size - 9) || // Top-right finder + separator
        (row > size - 9 && col < 9); // Bottom-left finder + separator

      if (overlapsWithFinder) {
        continue;
      }

      addAlignmentPattern(matrix, row, col);
    }
  }
}

/**
 * Add dark module (single dark module used as coordinate reference)
 * Always positioned at (4*version + 9, 8) per QR specification
 *
 * @param matrix QR code matrix to modify
 * @param version QR code version (1-10)
 */
export function addDarkModule(matrix: boolean[][], version: number): void {
  matrix[4 * version + 9][8] = true;
}
