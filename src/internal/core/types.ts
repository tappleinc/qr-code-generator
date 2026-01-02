/**
 * Internal Type Definitions
 *
 * Contains ONLY internal types not exposed in the public API.
 * Public types are defined in ../../types.ts and imported as needed.
 */

/**
 * QR Code error correction levels
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * QR Code encoding modes (internal use only)
 * @internal
 */
export enum EncodingMode {
  NUMERIC = 1,
  ALPHANUMERIC = 2,
  BYTE = 4,
}

/**
 * QR Code configuration data structure (internal use only)
 * Contains the matrix and metadata needed for rendering, not the final rendered output.
 * @internal
 */
export interface QRCodeConfig {
  /** Version of the QR code (1-10) */
  version: number;
  /** Size of the QR code matrix in modules (e.g., 21 for v1, 57 for v10) */
  matrixSize: number;
  /** QR code matrix data */
  modules: boolean[][];
  /** Mask pattern used (0-7) */
  mask: number;
  /** Error correction level used */
  errorCorrectionLevel: ErrorCorrectionLevel;
  /** Debug artifacts (only present if debug: true in options) */
}
