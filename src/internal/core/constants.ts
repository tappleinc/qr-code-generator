/**
 * QR Specification Constants
 *
 * Contains all QR code specification constants and lookup tables.
 * These values are derived from ISO/IEC 18004 QR code specification.
 * Supports QR code versions 1-10 with all error correction levels (L, M, Q, H).
 */

import { ErrorCorrectionLevel } from './types';

/**
 * Error correction code words per block for each version and EC level
 */
export const EC_CODEWORDS_PER_BLOCK: Record<ErrorCorrectionLevel, number[]> = {
  L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18], // versions 1-10
  M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  Q: [13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  H: [17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
};

/**
 * Total number of data codewords for each version and EC level
 */
export const TOTAL_DATA_CODEWORDS: Record<ErrorCorrectionLevel, number[]> = {
  L: [19, 34, 55, 80, 108, 136, 156, 194, 232, 274], // versions 1-10
  M: [16, 28, 44, 64, 86, 108, 124, 154, 182, 216],
  Q: [13, 22, 34, 48, 62, 76, 88, 110, 132, 154],
  H: [9, 16, 26, 36, 46, 60, 66, 86, 100, 122],
};

/**
 * Block structure for each version and EC level
 * Format: [group1Blocks, group1DataPerBlock, group2Blocks, group2DataPerBlock]
 * If group2Blocks is 0, only group1 exists
 */
export const BLOCK_STRUCTURE: Record<ErrorCorrectionLevel, number[][]> = {
  L: [
    [1, 19, 0, 0], // v1: 1 block of 19
    [1, 34, 0, 0], // v2: 1 block of 34
    [1, 55, 0, 0], // v3: 1 block of 55
    [1, 80, 0, 0], // v4: 1 block of 80
    [1, 108, 0, 0], // v5: 1 block of 108
    [2, 68, 0, 0], // v6: 2 blocks of 68
    [2, 78, 0, 0], // v7: 2 blocks of 78
    [2, 97, 0, 0], // v8: 2 blocks of 97
    [2, 116, 0, 0], // v9: 2 blocks of 116
    [2, 68, 2, 69], // v10: 2 blocks of 68 + 2 blocks of 69
  ],
  M: [
    [1, 16, 0, 0], // v1: 1 block of 16
    [1, 28, 0, 0], // v2: 1 block of 28
    [1, 44, 0, 0], // v3: 1 block of 44
    [2, 32, 0, 0], // v4: 2 blocks of 32
    [2, 43, 0, 0], // v5: 2 blocks of 43
    [4, 27, 0, 0], // v6: 4 blocks of 27
    [4, 31, 0, 0], // v7: 4 blocks of 31
    [2, 38, 2, 39], // v8: 2 blocks of 38 + 2 blocks of 39
    [3, 36, 2, 37], // v9: 3 blocks of 36 + 2 blocks of 37
    [4, 43, 1, 44], // v10: 4 blocks of 43 + 1 block of 44
  ],
  Q: [
    [1, 13, 0, 0], // v1: 1 block of 13
    [1, 22, 0, 0], // v2: 1 block of 22
    [2, 17, 0, 0], // v3: 2 blocks of 17
    [2, 24, 0, 0], // v4: 2 blocks of 24
    [2, 15, 2, 16], // v5: 2 blocks of 15 + 2 blocks of 16
    [4, 19, 0, 0], // v6: 4 blocks of 19
    [2, 14, 4, 15], // v7: 2 blocks of 14 + 4 blocks of 15
    [4, 18, 2, 19], // v8: 4 blocks of 18 + 2 blocks of 19
    [4, 16, 4, 17], // v9: 4 blocks of 16 + 4 blocks of 17
    [6, 19, 2, 20], // v10: 6 blocks of 19 + 2 blocks of 20
  ],
  H: [
    [1, 9, 0, 0], // v1: 1 block of 9
    [1, 16, 0, 0], // v2: 1 block of 16
    [2, 13, 0, 0], // v3: 2 blocks of 13
    [4, 9, 0, 0], // v4: 4 blocks of 9
    [2, 11, 2, 12], // v5: 2 blocks of 11 + 2 blocks of 12
    [4, 15, 0, 0], // v6: 4 blocks of 15
    [4, 13, 1, 14], // v7: 4 blocks of 13 + 1 block of 14
    [4, 14, 2, 15], // v8: 4 blocks of 14 + 2 blocks of 15
    [4, 12, 4, 13], // v9: 4 blocks of 12 + 4 blocks of 13
    [6, 15, 2, 16], // v10: 6 blocks of 15 + 2 blocks of 16
  ],
};

/**
 * Alphanumeric character set for QR encoding
 */
export const ALPHANUMERIC_CHARSET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * Character count indicator bits for each mode and version
 * Per QR spec: [bits for V1-9, bits for V10-26, bits for V27-40]
 */
export const MODE_BITS: Record<number, number[]> = {
  1: [10, 12, 14], // NUMERIC: versions 1-9, 10-26, 27-40
  2: [9, 11, 13], // ALPHANUMERIC
  4: [8, 16, 16], // BYTE
};

/**
 * Format information for each EC level
 */
export const FORMAT_INFO_EC: Record<ErrorCorrectionLevel, number> = {
  L: 0b01,
  M: 0b00,
  Q: 0b11,
  H: 0b10,
};

/**
 * Alignment pattern locations for each version
 */
export const ALIGNMENT_PATTERN_LOCATIONS: number[][] = [
  [], // version 1 (not used, we start from 2)
  [6, 18], // version 2
  [6, 22], // version 3
  [6, 26], // version 4
  [6, 30], // version 5
  [6, 34], // version 6
  [6, 22, 38], // version 7
  [6, 24, 42], // version 8
  [6, 26, 46], // version 9
  [6, 28, 50], // version 10
];

/**
 * Version information bit sequences for versions 7-40
 */
export const VERSION_INFO_BITS: number[] = [
  0x07c94,
  0x085bc,
  0x09a99,
  0x0a4d3, // versions 7-10
];

/**
 * Remainder bits required per version (QR spec requirement)
 * These padding bits are added to the end of the final message bit stream
 */
export const REMAINDER_BITS: number[] = [
  0, // version 1
  7, // version 2
  7, // version 3
  7, // version 4
  7, // version 5
  7, // version 6
  0, // version 7
  0, // version 8
  0, // version 9
  0, // version 10
];

/**
 * Get QR code size for a given version
 */
export function getQRSize(version: number): number {
  return version * 4 + 17;
}

/**
 * Get character count bits for encoding mode and version
 */
export function getCharCountBits(mode: number, version: number): number {
  const versionGroup = version < 10 ? 0 : version < 27 ? 1 : 2;
  return MODE_BITS[mode][versionGroup];
}
