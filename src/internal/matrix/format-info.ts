/**
 * QR Code Format and Version Information
 *
 * Handles encoding and placement of:
 * - Format information (error correction level + mask pattern)
 * - Version information (for QR codes version 7 and above)
 *
 * Format information is placed in two locations for redundancy,
 * and includes BCH error correction for reliability.
 */

import { ErrorCorrectionLevel } from '../core/types';
import { FORMAT_INFO_EC, VERSION_INFO_BITS } from '../core/constants';

/**
 * Add format information to matrix (error correction level + mask pattern)
 * Format info is encoded with BCH error correction and placed in two locations
 * for redundancy. The two copies are XORed with different fixed patterns.
 *
 * Format: 15 bits = 5 data bits (2 EC + 3 mask) + 10 BCH error correction bits
 *
 * @param matrix QR code matrix to modify
 * @param ecLevel Error correction level ('L', 'M', 'Q', or 'H')
 * @param maskPattern Mask pattern number (0-7)
 */
export function addFormatInfo(
  matrix: boolean[][],
  ecLevel: ErrorCorrectionLevel,
  maskPattern: number
): void {
  const size = matrix.length;
  const formatBits = (FORMAT_INFO_EC[ecLevel] << 3) | maskPattern;

  // Calculate BCH error correction for format info
  let data = formatBits << 10;
  for (let i = 0; i < 5; i++) {
    if (data & (1 << (14 - i))) {
      data ^= 0x537 << (4 - i);
    }
  }

  const formatInfo = ((formatBits << 10) | data) ^ 0x5412;

  // Place format info bits according to spec
  // Bit 0 = MSB (bit 14 of formatInfo), Bit 14 = LSB (bit 0 of formatInfo)
  for (let i = 0; i < 15; i++) {
    // Extract bit i (where i=0 is MSB, i=14 is LSB)
    const mod = ((formatInfo >> (14 - i)) & 1) === 1;

    // Copy 1 - Around top-left finder
    if (i <= 5) {
      // Bits 0-5: horizontal along row 8, cols 0-5
      matrix[8][i] = mod;
    } else if (i === 6) {
      // Bit 6: skip col 6 (timing), place at col 7
      matrix[8][7] = mod;
    } else if (i === 7) {
      // Bit 7: col 8, row 8
      matrix[8][8] = mod;
    } else if (i === 8) {
      // Bit 8: col 8, row 7 (skip row 6 timing)
      matrix[7][8] = mod;
    } else {
      // Bits 9-14: col 8, rows 5,4,3,2,1,0
      matrix[5 - (i - 9)][8] = mod;
    }

    // Copy 2 - Bottom-left + Top-right
    if (i <= 6) {
      // Bits 0-6: vertical from bottom, col 8
      matrix[size - 1 - i][8] = mod;
    } else {
      // Bits 7-14: horizontal from right, row 8
      matrix[8][size - 8 + (i - 7)] = mod;
    }
  }
}

/**
 * Add version information to matrix (versions 7+ only)
 * Version info is 18 bits encoded with BCH error correction,
 * placed in two locations for redundancy.
 *
 * @param matrix QR code matrix to modify
 * @param version QR code version (only versions 7+ have version info)
 */
export function addVersionInfo(matrix: boolean[][], version: number): void {
  if (version < 7) return;

  const size = matrix.length;
  const versionBits = VERSION_INFO_BITS[version - 7];

  // Place 18-bit version information in two locations
  for (let i = 0; i < 18; i++) {
    const bit = ((versionBits >> i) & 1) === 1;

    // Bottom-left: 6 rows × 3 columns, starting at (0, size-11)
    const blRow = Math.floor(i / 3);
    const blCol = size - 11 + (i % 3);
    matrix[blRow][blCol] = bit;

    // Top-right: 3 rows × 6 columns, starting at (size-11, 0)
    const trRow = size - 11 + (i % 3);
    const trCol = Math.floor(i / 3);
    matrix[trRow][trCol] = bit;
  }
}

/**
 * Calculate format information value (for debug/testing purposes)
 * Returns the 5-bit data portion (EC level + mask pattern)
 *
 * @param ecLevel Error correction level
 * @param mask Mask pattern number (0-7)
 * @returns 5-bit format information data
 */
export function calculateFormatInfo(
  ecLevel: ErrorCorrectionLevel,
  mask: number
): number {
  const ecBits = FORMAT_INFO_EC[ecLevel];
  const data = (ecBits << 3) | mask;
  return data;
}
