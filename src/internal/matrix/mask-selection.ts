/**
 * QR Code Mask Pattern Application and Selection
 *
 * Implements the 8 standard QR code mask patterns and penalty calculation
 * to automatically select the optimal mask pattern for best scannability.
 *
 * Mask patterns help avoid problematic patterns in QR codes like:
 * - Large areas of same color
 * - Patterns that look like finder patterns
 * - Imbalanced dark/light ratio
 */

import { ErrorCorrectionLevel } from '../core/types';

/**
 * Apply mask pattern to matrix (XOR operation)
 * Only masks data modules - function patterns are never masked
 *
 * The 8 mask patterns are defined by the QR specification:
 * - Pattern 0: (row + col) % 2 == 0
 * - Pattern 1: row % 2 == 0
 * - Pattern 2: col % 3 == 0
 * - Pattern 3: (row + col) % 3 == 0
 * - Pattern 4: (⌊row/2⌋ + ⌊col/3⌋) % 2 == 0
 * - Pattern 5: ((row*col) % 2) + ((row*col) % 3) == 0
 * - Pattern 6: (((row*col) % 2) + ((row*col) % 3)) % 2 == 0
 * - Pattern 7: (((row+col) % 2) + ((row*col) % 3)) % 2 == 0
 *
 * @param matrix QR code matrix to mask
 * @param functionPattern Function pattern matrix (true = don't mask)
 * @param pattern Mask pattern number (0-7)
 */
export function applyMask(
  matrix: boolean[][],
  functionPattern: boolean[][],
  pattern: number
): void {
  const size = matrix.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (functionPattern[row][col]) continue;

      let mask = false;
      switch (pattern) {
        case 0:
          mask = (row + col) % 2 === 0;
          break;
        case 1:
          mask = row % 2 === 0;
          break;
        case 2:
          mask = col % 3 === 0;
          break;
        case 3:
          mask = (row + col) % 3 === 0;
          break;
        case 4:
          mask = (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
          break;
        case 5:
          mask = ((row * col) % 2) + ((row * col) % 3) === 0;
          break;
        case 6:
          mask = (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
          break;
        case 7:
          mask = (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
          break;
      }

      if (mask) {
        matrix[row][col] = !matrix[row][col];
      }
    }
  }
}

/**
 * Calculate penalty score for mask pattern per QR specification
 * Lower scores indicate better patterns for scanning
 *
 * Four penalty rules:
 * - N1: Adjacent modules of same color (penalize runs of 5+)
 * - N2: 2×2 blocks of same color (penalize large uniform areas)
 * - N3: Patterns resembling finder patterns (penalize false positives)
 * - N4: Dark/light balance (penalize heavily imbalanced ratios)
 *
 * @param matrix QR code matrix to evaluate
 * @returns Total penalty score (lower is better)
 */
export function calculatePenalty(matrix: boolean[][]): number {
  const size = matrix.length;
  let penalty = 0;

  // Rule 1 (N1): Adjacent modules in row/column with same color
  // Penalty: 3 + (count - 5) for each group of 5+ adjacent same-color modules
  for (let i = 0; i < size; i++) {
    let lastRow = matrix[i][0];
    let lastCol = matrix[0][i];
    let countRow = 1;
    let countCol = 1;

    for (let j = 1; j < size; j++) {
      // Check row
      if (matrix[i][j] === lastRow) {
        countRow++;
      } else {
        if (countRow >= 5) penalty += 3 + (countRow - 5);
        lastRow = matrix[i][j];
        countRow = 1;
      }

      // Check column
      if (matrix[j][i] === lastCol) {
        countCol++;
      } else {
        if (countCol >= 5) penalty += 3 + (countCol - 5);
        lastCol = matrix[j][i];
        countCol = 1;
      }
    }

    if (countRow >= 5) penalty += 3 + (countRow - 5);
    if (countCol >= 5) penalty += 3 + (countCol - 5);
  }

  // Rule 2 (N2): 2×2 blocks of same color
  // Penalty: 3 for each 2×2 block
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const value = matrix[row][col];
      if (
        matrix[row][col + 1] === value &&
        matrix[row + 1][col] === value &&
        matrix[row + 1][col + 1] === value
      ) {
        penalty += 3;
      }
    }
  }

  // Rule 3 (N3): 1:1:3:1:1 ratio pattern (dark:light:dark:light:dark)
  // preceded or followed by 4 light modules
  // Pattern: 10111010000 (0x5D0) or 00001011101 (0x05D)
  // Penalty: 40 for each occurrence
  for (let row = 0; row < size; row++) {
    let bitsRow = 0;
    let bitsCol = 0;

    for (let col = 0; col < size; col++) {
      // Check row
      bitsRow = ((bitsRow << 1) & 0x7ff) | (matrix[row][col] ? 1 : 0);
      if (col >= 10 && (bitsRow === 0x5d0 || bitsRow === 0x05d)) penalty += 40;

      // Check column
      bitsCol = ((bitsCol << 1) & 0x7ff) | (matrix[col][row] ? 1 : 0);
      if (col >= 10 && (bitsCol === 0x5d0 || bitsCol === 0x05d)) penalty += 40;
    }
  }

  // Rule 4 (N4): Balance of dark/light modules
  // Penalty: 10 * k, where k = abs(ceil((darkCount * 100 / totalCount) / 5) - 10)
  let darkCount = 0;
  const totalCount = size * size;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) darkCount++;
    }
  }
  const k = Math.abs(Math.ceil((darkCount * 100) / totalCount / 5) - 10);
  penalty += k * 10;

  return penalty;
}

/**
 * Select best mask pattern by trying all 8 patterns and choosing
 * the one with the lowest penalty score
 *
 * @param matrix QR code matrix (will be tested with each mask)
 * @param functionPattern Function pattern matrix
 * @param ecLevel Error correction level (needed for format info during testing)
 * @param addFormatInfoFn Function to add format information to test matrix
 * @returns Mask pattern number (0-7) with lowest penalty
 */
export function selectBestMask(
  matrix: boolean[][],
  functionPattern: boolean[][],
  ecLevel: ErrorCorrectionLevel,
  addFormatInfoFn: (
    matrix: boolean[][],
    ecLevel: ErrorCorrectionLevel,
    mask: number
  ) => void
): number {
  let bestPattern = 0;
  let bestPenalty = Infinity;

  for (let pattern = 0; pattern < 8; pattern++) {
    const testMatrix = matrix.map((row) => [...row]);
    applyMask(testMatrix, functionPattern, pattern);
    addFormatInfoFn(testMatrix, ecLevel, pattern);

    const penalty = calculatePenalty(testMatrix);

    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestPattern = pattern;
    }
  }

  return bestPattern;
}
