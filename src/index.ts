/**
 * Tapple QR - Lightweight QR Code Generator
 *
 * Features:
 * - Dual package support (ESM & CommonJS)
 * - Universal compatibility (Node.js, browsers, bundlers)
 * - Zero browser dependencies (Node.js uses optional resvg for PNG)
 * - QR versions 1-10 (automatically selected)
 * - Error correction levels: L, M, Q, H
 * - Mask patterns (automatically optimized)
 * - Auto-sizing based on input length
 * - Multiple output formats: SVG, PNG, ASCII
 * - TypeScript support
 */

// ============================================================================
// Public API - Rendering Functions
// ============================================================================

export { genQrImage, genQrText } from './qrcode';

// ============================================================================
// Public API - Error Classes
// ============================================================================

export { QRValidationError } from './internal/core/validation';

// ============================================================================
// Public API - TypeScript Support
// ============================================================================

// Render option types (for public API functions)
export type {
  ImageOptions,
  TextOptions,
  QRInput,
  VCardData,
  WiFiData,
  CalendarData,
  OutputConfig,
} from './types';

// Shape enums (for type-safe shape specifications)
export { EyeFrameShape, DotShape, BorderShape, BorderStyle } from './types';
