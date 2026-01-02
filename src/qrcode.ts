/**
 * QR Code Generator - Main Pipeline Orchestrator
 *
 * Implements the complete QR code generation pipeline per ISO/IEC 18004:
 * 1. Data encoding (mode detection, encoding, padding)
 * 2. Error correction (Reed-Solomon)
 * 3. Block interleaving
 * 4. Bit stream creation with remainder bits
 * 5. Matrix generation (function patterns, data placement, masking)
 * 6. Rendering (SVG-first approach with environment-specific raster conversion)
 */

import { QRInput, ImageOptions, TextOptions } from './types';
import { QRCodeConfig, ErrorCorrectionLevel } from './internal/core/types';
import {
  TOTAL_DATA_CODEWORDS,
  EC_CODEWORDS_PER_BLOCK,
  BLOCK_STRUCTURE,
  REMAINDER_BITS,
  getQRSize,
} from './internal/core/constants';
import { mergeImageOptions, mergeTextOptions } from './internal/core/defaults';
import {
  encodeData,
  calculateMinVersion,
  selectOptimalEC,
} from './internal/encoding/data-encoder';
import {
  generateErrorCorrection,
  interleaveBlocks,
} from './internal/encoding/error-correction';
import { generateMatrix } from './internal/matrix/matrix';
import { renderSVGString } from './internal/rendering/svg-renderer';
import { renderASCIIString } from './internal/rendering/ascii-renderer';
import { handleOutput } from './internal/rendering/output-handler';
import { formatQRInput } from './internal/encoding/formatters';

// ============================================================================
// Internal QR Code Generation
// ============================================================================

/**
 * Step 4 & 5: Create bit stream from bytes and add remainder bits
 * Per QR spec: convert final message bytes to bits, then append remainder bits
 *
 * @param bytes - Final message bytes (data + error correction)
 * @param version - QR code version (1-10)
 * @returns Complete bit stream ready for matrix placement
 * @internal
 */
function createBitStream(bytes: number[], version: number): boolean[] {
  const bits: boolean[] = [];

  // Convert bytes to bits
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push(((byte >> i) & 1) === 1);
    }
  }

  // Add remainder bits (padding zeros)
  const remainderBits = REMAINDER_BITS[version - 1];
  for (let i = 0; i < remainderBits; i++) {
    bits.push(false);
  }

  return bits;
}

/**
 * Generate QR code matrix from input data
 * Version and mask pattern are automatically calculated for optimal quality
 *
 * @param input - String data to encode
 * @param hasLogo - Whether a logo will be placed (affects error correction level selection)
 * @returns QRCodeConfig object containing matrix and metadata
 * @internal - Internal function, not part of public API
 */
function buildQRCodeConfig(input: string, hasLogo: boolean): QRCodeConfig {
  if (!input) {
    throw new Error(
      'QR Code input cannot be empty. Please provide text or structured content to encode.'
    );
  }

  // Auto-select optimal error correction level
  const ecLevel: ErrorCorrectionLevel = selectOptimalEC(input, hasLogo);
  const totalDataCodewords = TOTAL_DATA_CODEWORDS[ecLevel];

  // Auto-calculate version based on input data and selected EC level
  const version = calculateMinVersion(input, totalDataCodewords);

  if (version < 1 || version > 10) {
    throw new Error(
      `Input data is too large for QR code version 10. ` +
        `Data length: ${input.length} characters. ` +
        `Maximum capacity at EC level ${ecLevel}: ~${TOTAL_DATA_CODEWORDS[ecLevel][9]} bytes. ` +
        `Try reducing input length or removing logo for higher capacity.`
    );
  }

  // Encode data
  const dataCodewords = encodeData(
    input,
    version,
    totalDataCodewords[version - 1]
  );

  // Generate error correction
  const ecCodewordsPerBlock = EC_CODEWORDS_PER_BLOCK[ecLevel][version - 1];
  const blockStructure = BLOCK_STRUCTURE[ecLevel][version - 1];
  const { dataBlocks, ecBlocks } = generateErrorCorrection(
    dataCodewords,
    ecCodewordsPerBlock,
    blockStructure
  );

  // Step 3: Interleave blocks to create final message (bytes)
  const finalMessage = interleaveBlocks(dataBlocks, ecBlocks);

  // Step 4 & 5: Convert to bit stream and add remainder bits
  const bitStream = createBitStream(finalMessage, version);

  // Step 6: Place bits in matrix, auto-select best mask, add format info
  const { matrix, mask } = generateMatrix(version, ecLevel, bitStream);

  // Build QR code config object
  const qrCodeConfig: QRCodeConfig = {
    version,
    matrixSize: getQRSize(version),
    modules: matrix,
    mask,
    errorCorrectionLevel: ecLevel,
  };

  return qrCodeConfig;
}

// ============================================================================
// Public API - Unified Rendering Functions
// ============================================================================

/**
 * Generate QR code image with configurable output format
 * @param input - Content to encode (string or structured content type)
 * @param options - Styling and output options
 * @returns Promise resolving to Buffer, Uint8Array, or string based on output config
 */
export async function genQrImage(
  input: QRInput,
  options?: ImageOptions
): Promise<string | Buffer | Uint8Array> {
  // 1. Format input and merge options (Single Authority pattern)
  const text = formatQRInput(input);
  const mergedOptions = mergeImageOptions(options);

  // 2. Generate QR matrix
  const qrCodeConfig = buildQRCodeConfig(text, !!mergedOptions.logo);

  // 3. Phase 1: Always generate SVG first
  const svgString = renderSVGString(qrCodeConfig, mergedOptions);

  // 4. Phase 2: Handle output format (async)
  return await handleOutput(svgString, mergedOptions);
}

/**
 * Generate ASCII QR code
 * @param input - Content to encode (string or structured content type)
 * @param options - Text styling options
 * @returns ASCII string representation
 */
export function genQrText(input: QRInput, options?: TextOptions): string {
  const text = formatQRInput(input);
  const mergedOptions = mergeTextOptions(options);
  const qrCodeConfig = buildQRCodeConfig(text, false);
  return renderASCIIString(qrCodeConfig, mergedOptions);
}

// ============================================================================
// Test-Only Exports (NOT part of public API)
// ============================================================================

/**
 * INTERNAL: Export for testing purposes only
 * This is NOT exported from index.ts and is NOT part of the public API
 * @internal
 */
export { buildQRCodeConfig };
