/**
 * Rendering Utilities
 *
 * Shared helper functions for QR code rendering.
 */

/**
 * Check if a module is part of a finder pattern (eye)
 * Finder patterns are 7x7 squares in three corners
 */
export function isFinderPattern(
  row: number,
  col: number,
  size: number
): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= size - 7) return true;
  // Bottom-left
  if (row >= size - 7 && col < 7) return true;
  return false;
}

/**
 * Get finder pattern regions (eyes)
 */
export function getFinderPatterns(
  size: number
): Array<{ x: number; y: number }> {
  return [
    { x: 0, y: 0 }, // Top-left
    { x: size - 7, y: 0 }, // Top-right
    { x: 0, y: size - 7 }, // Bottom-left
  ];
}

/**
 * Determine the appropriate middle layer shape based on eye frame shape.
 * The white gap must match the outer ring shape for scanner compatibility.
 */
export function getMiddleLayerShape(eyeFrameShape: string): string {
  // For circular/rounded frames, use matching middle layer shape
  // For square frames, keep square middle layer
  switch (eyeFrameShape) {
    case 'squircle':
      return 'squircle';
    case 'square':
    default:
      return 'square';
  }
}

/**
 * Calculate safe logo size
 * Best practices: 20-30% of QR code size is generally safe with proper error correction
 * Clamp to safe range (10-30%)
 */
export function calculateLogoSize(
  matrixSize: number,
  logoSizeRatio: number
): number {
  const MAX_LOGO_SIZE = 0.3; // 30% maximum
  const clampedRatio = Math.max(0.1, Math.min(MAX_LOGO_SIZE, logoSizeRatio));
  return matrixSize * clampedRatio;
}
