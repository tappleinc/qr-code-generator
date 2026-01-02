/**
 * Data Encoder
 *
 * Handles QR code data encoding according to the QR specification.
 * Implements three encoding modes:
 * - Numeric: For digits 0-9 (most compact)
 * - Alphanumeric: For 0-9, A-Z, space, and special characters
 * - Byte: For any data (UTF-8 encoded)
 *
 * Includes mode detection, data encoding, padding, and version calculation.
 */

import { EncodingMode, ErrorCorrectionLevel } from '../core/types';
import {
  ALPHANUMERIC_CHARSET,
  getCharCountBits,
  TOTAL_DATA_CODEWORDS,
} from '../core/constants';

/**
 * Detect the best encoding mode for the input
 * Selects the most compact mode that can encode all characters:
 * - NUMERIC: Only digits 0-9 (most compact)
 * - ALPHANUMERIC: Digits, uppercase letters, and limited special chars
 * - BYTE: Any data via UTF-8 (most flexible, least compact)
 *
 * @param input - String to analyze
 * @returns EncodingMode enum value
 * @example
 * detectEncodingMode('12345') // Returns NUMERIC
 * detectEncodingMode('HELLO') // Returns ALPHANUMERIC
 * detectEncodingMode('hello') // Returns BYTE (lowercase not in alphanumeric)
 */
export function detectEncodingMode(input: string): EncodingMode {
  if (/^\d+$/.test(input)) {
    return EncodingMode.NUMERIC;
  }

  // Alphanumeric mode only supports uppercase letters
  // Don't convert to uppercase for checking - check the actual input
  if ([...input].every((c) => ALPHANUMERIC_CHARSET.includes(c))) {
    return EncodingMode.ALPHANUMERIC;
  }

  return EncodingMode.BYTE;
}

// ============================================================================
// Mode-Specific Encoding Functions
// ============================================================================

/**
 * Encode data in numeric mode
 * Groups digits into chunks of 3, encoding each chunk in 10 bits
 * Smaller chunks use fewer bits: 2 digits = 7 bits, 1 digit = 4 bits
 *
 * @param data - String of digits (0-9 only)
 * @returns Array of bits (0s and 1s as numbers)
 */
function encodeNumeric(data: string): number[] {
  const bits: number[] = [];

  for (let i = 0; i < data.length; i += 3) {
    const chunk = data.substring(i, Math.min(i + 3, data.length));
    const value = parseInt(chunk, 10);
    const bitLength = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;

    for (let j = bitLength - 1; j >= 0; j--) {
      bits.push((value >> j) & 1);
    }
  }

  return bits;
}

/**
 * Encode data in alphanumeric mode
 * Pairs of characters are encoded in 11 bits, single trailing char in 6 bits
 * Only supports: 0-9, A-Z, space, and special chars $ % * + - . / :
 *
 * @param data - String with alphanumeric characters only
 * @returns Array of bits (0s and 1s as numbers)
 */
function encodeAlphanumeric(data: string): number[] {
  const bits: number[] = [];

  // Alphanumeric mode only supports uppercase letters and specific symbols
  // Data should already be validated to contain only these characters
  for (let i = 0; i < data.length; i += 2) {
    if (i + 1 < data.length) {
      const value =
        ALPHANUMERIC_CHARSET.indexOf(data[i]) * 45 +
        ALPHANUMERIC_CHARSET.indexOf(data[i + 1]);
      for (let j = 10; j >= 0; j--) {
        bits.push((value >> j) & 1);
      }
    } else {
      const value = ALPHANUMERIC_CHARSET.indexOf(data[i]);
      for (let j = 5; j >= 0; j--) {
        bits.push((value >> j) & 1);
      }
    }
  }

  return bits;
}

/**
 * Encode data in byte mode
 * Converts string to UTF-8 bytes, then to bits (8 bits per byte)
 * Supports any Unicode characters
 *
 * @param data - String to encode (any characters)
 * @returns Array of bits (0s and 1s as numbers)
 */
function encodeByte(data: string): number[] {
  const bits: number[] = [];
  const bytes = new TextEncoder().encode(data);

  for (const byte of bytes) {
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1);
    }
  }

  return bits;
}

// ============================================================================
// Data Stream Construction
// ============================================================================

/**
 * Add mode indicator and character count
 */
function addModeAndCount(
  bits: number[],
  mode: EncodingMode,
  length: number,
  version: number
): number[] {
  const result: number[] = [];

  // Mode indicator (4 bits)
  for (let i = 3; i >= 0; i--) {
    result.push((mode >> i) & 1);
  }

  // Character count
  const charCountBits = getCharCountBits(mode, version);
  for (let i = charCountBits - 1; i >= 0; i--) {
    result.push((length >> i) & 1);
  }

  return [...result, ...bits];
}

/**
 * Convert bit array to byte array
 */
function bitsToBytes(bits: number[]): number[] {
  const bytes: number[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    if (i + 8 > bits.length) {
      byte <<= 8 - (bits.length % 8);
    }
    bytes.push(byte);
  }

  return bytes;
}

/**
 * Add padding bytes to reach required length
 */
function addPadding(bytes: number[], requiredLength: number): number[] {
  const result = [...bytes];
  const padPatterns = [0b11101100, 0b00010001];
  let patternIndex = 0;

  while (result.length < requiredLength) {
    result.push(padPatterns[patternIndex]);
    patternIndex = 1 - patternIndex;
  }

  return result;
}

// ============================================================================
// Main Encoding Functions
// ============================================================================

/**
 * Encode input data for QR code
 */
export function encodeData(
  input: string,
  version: number,
  totalDataCodewords: number
): number[] {
  const mode = detectEncodingMode(input);

  let dataBits: number[];
  let charCount: number;

  if (mode === EncodingMode.NUMERIC) {
    dataBits = encodeNumeric(input);
    charCount = input.length;
  } else if (mode === EncodingMode.ALPHANUMERIC) {
    dataBits = encodeAlphanumeric(input);
    charCount = input.length;
  } else {
    dataBits = encodeByte(input);
    // For byte mode, use actual byte count, not string length
    charCount = new TextEncoder().encode(input).length;
  }

  const bitsWithHeader = addModeAndCount(dataBits, mode, charCount, version);

  // Add terminator (up to 4 zero bits)
  const terminatorLength = Math.min(
    4,
    totalDataCodewords * 8 - bitsWithHeader.length
  );
  for (let i = 0; i < terminatorLength; i++) {
    bitsWithHeader.push(0);
  }

  // Pad to byte boundary
  while (bitsWithHeader.length % 8 !== 0) {
    bitsWithHeader.push(0);
  }

  const bytes = bitsToBytes(bitsWithHeader);

  return addPadding(bytes, totalDataCodewords);
}

/**
 * Calculate minimum QR code version needed for input
 * Tries each version 1-10 until finding one with sufficient capacity
 *
 * @param input - String data to encode
 * @param totalDataCodewords - Array of capacity values per version for selected EC level
 * @returns Version number (1-10) or throws error if data too large
 * @throws {Error} If input exceeds capacity of version 10
 */
export function calculateMinVersion(
  input: string,
  totalDataCodewords: number[]
): number {
  const mode = detectEncodingMode(input);

  // For byte mode, use actual byte count
  const byteLength =
    mode === EncodingMode.BYTE
      ? new TextEncoder().encode(input).length
      : input.length;

  for (let version = 1; version <= 10; version++) {
    const charCountBits = getCharCountBits(mode, version);
    const dataBits =
      mode === EncodingMode.NUMERIC
        ? Math.ceil(byteLength / 3) * 10 -
          (byteLength % 3 === 1 ? 6 : byteLength % 3 === 2 ? 3 : 0)
        : mode === EncodingMode.ALPHANUMERIC
          ? Math.floor(byteLength / 2) * 11 + (byteLength % 2) * 6
          : byteLength * 8;

    const totalBits = 4 + charCountBits + dataBits;
    const requiredBytes = Math.ceil(totalBits / 8);

    if (requiredBytes <= totalDataCodewords[version - 1]) {
      return version;
    }
  }

  // Calculate final required bytes for error message
  const charCountBits = getCharCountBits(mode, 10);
  const dataBits =
    mode === EncodingMode.NUMERIC
      ? Math.ceil(byteLength / 3) * 10 -
        (byteLength % 3 === 1 ? 6 : byteLength % 3 === 2 ? 3 : 0)
      : mode === EncodingMode.ALPHANUMERIC
        ? Math.floor(byteLength / 2) * 11 + (byteLength % 2) * 6
        : byteLength * 8;
  const totalBits = 4 + charCountBits + dataBits;
  const finalRequiredBytes = Math.ceil(totalBits / 8);

  throw new Error(
    `Input too long for QR code version 10. ` +
      `Required capacity: ${finalRequiredBytes} bytes, Maximum available: ${totalDataCodewords[9]} bytes. ` +
      `Current data length: ${input.length} characters (${byteLength} bytes encoded).`
  );
}

/**
 * Select optimal error correction level
 * Automatically determines the best EC level based on:
 * - Data size (picks highest EC that fits)
 * - Logo presence (forces H level for 30% error recovery)
 *
 * @param input - String data to encode
 * @param hasLogo - Whether a logo will overlay the QR code
 * @returns Error correction level ('L', 'M', 'Q', or 'H')
 * @throws {Error} If data is too large even at lowest EC level
 *
 * EC Level Recovery Capacity:
 * - L: ~7% data recovery
 * - M: ~15% data recovery
 * - Q: ~25% data recovery
 * - H: ~30% data recovery (required for logos)
 */
export function selectOptimalEC(
  input: string,
  hasLogo: boolean
): ErrorCorrectionLevel {
  // Logo requires H level (can recover ~30% of damaged data)
  if (hasLogo) {
    try {
      const version = calculateMinVersion(input, TOTAL_DATA_CODEWORDS['H']);
      if (version <= 10) {
        return 'H';
      }
    } catch {
      throw new Error(
        `Data too large for QR code with logo. ` +
          `Data length: ${input.length} characters. ` +
          `Maximum capacity with logo (EC level H): ~122 bytes (version 10). ` +
          `Logos require high error correction (H) which reduces data capacity. ` +
          `Consider: reducing data length, removing logo, or using multiple QR codes.`
      );
    }
  }

  // No logo: try highest EC level that fits (best reliability)
  const levels: ErrorCorrectionLevel[] = ['H', 'Q', 'M', 'L'];

  for (const level of levels) {
    try {
      const version = calculateMinVersion(input, TOTAL_DATA_CODEWORDS[level]);
      if (version <= 10) {
        return level;
      }
    } catch {
      // Try next level
      continue;
    }
  }

  throw new Error(
    `Data too large for QR code version 10 at any error correction level. ` +
      `Data length: ${input.length} characters. ` +
      `Maximum capacity: ~274 bytes (version 10, EC level L). ` +
      `Please reduce input length or split into multiple QR codes.`
  );
}
