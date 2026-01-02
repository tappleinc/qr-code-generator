/**
 * Error Correction (Reed-Solomon)
 *
 * Implements Reed-Solomon error correction codes for QR codes.
 * Uses Galois Field GF(256) arithmetic to generate error correction codewords
 * that allow QR codes to be decoded even when partially damaged.
 *
 * Supports all error correction levels:
 * - L: ~7% recovery capacity
 * - M: ~15% recovery capacity
 * - Q: ~25% recovery capacity
 * - H: ~30% recovery capacity
 */

/**
 * Galois Field GF(256) lookup tables for efficient multiplication
 */

const GF256_EXP: number[] = new Array(256);
const GF256_LOG: number[] = new Array(256);

// Initialize GF(256) logarithm and exponential tables
function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
}

initGF256();

// ============================================================================
// Galois Field Arithmetic
// ============================================================================

/**
 * Multiply two numbers in GF(256)
 */
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

/**
 * Generate Reed-Solomon generator polynomial coefficients
 * Uses polynomial multiplication in GF(256): poly = poly * (x - α^i)
 */
function generateGeneratorPolynomial(degree: number): number[] {
  let poly: number[] = [1];

  for (let i = 0; i < degree; i++) {
    // Multiply poly by (x - α^i) in GF(256)
    const newLength = poly.length + 1;
    const newPoly: number[] = new Array(newLength).fill(0);

    for (let j = 0; j < poly.length; j++) {
      newPoly[j] ^= poly[j];
      newPoly[j + 1] ^= gfMul(poly[j], GF256_EXP[i]);
    }

    poly = newPoly;
  }

  return poly;
}

// ============================================================================
// Reed-Solomon Encoding
// ============================================================================

/**
 * Calculate Reed-Solomon error correction codewords
 */
export function calculateReedSolomonCodewords(
  data: number[],
  ecCodewords: number
): number[] {
  const generator = generateGeneratorPolynomial(ecCodewords);
  const message = [...data, ...new Array(ecCodewords).fill(0)];

  for (let i = 0; i < data.length; i++) {
    const coef = message[i];
    if (coef !== 0) {
      for (let j = 0; j < generator.length; j++) {
        message[i + j] ^= gfMul(generator[j], coef);
      }
    }
  }

  return message.slice(data.length);
}

/**
 * Divide data into blocks and calculate error correction for each
 * Supports variable-sized blocks as specified in QR spec
 */
export function generateErrorCorrection(
  data: number[],
  ecCodewordsPerBlock: number,
  blockStructure: number[]
): { dataBlocks: number[][]; ecBlocks: number[][] } {
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];

  const [group1Blocks, group1Data, group2Blocks, group2Data] = blockStructure;

  let offset = 0;

  // Process group 1 blocks
  for (let i = 0; i < group1Blocks; i++) {
    const block = data.slice(offset, offset + group1Data);
    dataBlocks.push(block);
    const ecBlock = calculateReedSolomonCodewords(block, ecCodewordsPerBlock);
    ecBlocks.push(ecBlock);
    offset += group1Data;
  }

  // Process group 2 blocks (if they exist)
  for (let i = 0; i < group2Blocks; i++) {
    const block = data.slice(offset, offset + group2Data);
    dataBlocks.push(block);
    const ecBlock = calculateReedSolomonCodewords(block, ecCodewordsPerBlock);
    ecBlocks.push(ecBlock);
    offset += group2Data;
  }

  return { dataBlocks, ecBlocks };
}

/**
 * Interleave data and error correction blocks
 */
export function interleaveBlocks(
  dataBlocks: number[][],
  ecBlocks: number[][]
): number[] {
  const result: number[] = [];

  // Interleave data blocks
  const maxDataSize = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataSize; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }

  // Interleave error correction blocks
  const maxEcSize = Math.max(...ecBlocks.map((b) => b.length));
  for (let i = 0; i < maxEcSize; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }

  return result;
}
