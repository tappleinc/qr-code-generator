/**
 * Unified Shape Definitions
 *
 * Single source of truth for all QR code shapes.
 * Each shape provides SVG output (vector paths/polygons).
 * PNG rendering is handled by Canvas API (browser) or resvg (Node.js).
 */

import { BorderStyle } from '../../types';

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Context for rendering shapes (provides access to QR matrix and neighbors)
 */
export interface ShapeContext {
  qrcode?: boolean[][];
  qrSize?: number;
  row?: number;
  col?: number;
  // Border specific
  borderWidth?: number;
  borderStyle?: BorderStyle;
}

interface ShapeDefinition {
  renderSVG(
    x: number,
    y: number,
    size: number,
    color: string,
    context?: ShapeContext
  ): string;
  /**
   * Ratio of the shape's diagonal radius to its axis radius (half-width).
   * Used for layout calculations (e.g. safe border width).
   * - Circle: 1.0
   * - Square: sqrt(2) ≈ 1.414
   * - Squircle: 2^(1/4) ≈ 1.189
   */
  getDiagonalFactor?(): number;
}

// ============================================================================
// Shape Constants (Single Source of Truth)
// ============================================================================

/**
 * Corner radius ratio for squircle borders (relative to total size)
 *
 * Value: 0.09 = 9% of size
 * Example: For a 300px QR code, corner radius = 27px
 *
 * Rationale:
 * - Chosen to visually match the eye frame squircle roundness
 * - Eye frames use Bezier control point at 0.90909, giving ~9% effective radius
 * - Provides visual consistency across all squircle elements
 * - Maintains scannability while creating cohesive rounded aesthetic
 */
export const SQUIRCLE_CORNER_RADIUS_RATIO = 0.09;

/**
 * Bezier control point coefficients for squircle shapes
 * These define the "roundness" of corners in superellipse curves
 *
 * EYE_FRAME value: 0.90909 (≈ 10/11)
 *
 * Mathematical basis:
 * - Superellipse (n=4): |x/a|^4 + |y/b|^4 = 1
 * - Bezier approximation uses control points at distance k from corners
 * - k = 0.90909 provides close approximation to n=4 superellipse
 *
 * Visual characteristics:
 * - More rounded than simple circular arc (k=0.5522)
 * - Less rounded than true circle (k=1.0)
 * - Creates smooth, organic corners favored in modern UI design
 */
export const SQUIRCLE_CONTROL_POINTS = {
  /** Eye frames: More rounded corners (n=4 superellipse) */
  EYE_FRAME: 0.90909,
} as const;

// ============================================================================
// Dash Pattern Helpers (for SVG dashed borders only)
// ============================================================================

/**
 * Calculate dash pattern for square borders with corner gaps
 * Returns pattern and offset to center dashes (gaps at corners)
 */
function calculateSquareDashPattern(
  sideLength: number,
  borderWidth: number
): { dashArray: string; offset: number } {
  // Target dash and gap proportions
  const dashRatio = 3;
  const gapRatio = 2;
  const targetDashLength = borderWidth * dashRatio;
  const targetGapLength = borderWidth * gapRatio;
  const targetPatternLength = targetDashLength + targetGapLength;

  // Calculate how many FULL patterns fit on one side
  const numPatterns = Math.max(1, Math.round(sideLength / targetPatternLength));

  // Adjust to fit exactly on one side
  const actualPatternLength = sideLength / numPatterns;
  const actualDashLength =
    actualPatternLength * (dashRatio / (dashRatio + gapRatio));
  const actualGapLength =
    actualPatternLength * (gapRatio / (dashRatio + gapRatio));

  // Offset by half a gap to center pattern (gaps at both corners)
  const offset = actualGapLength / 2;

  return {
    dashArray: `${actualDashLength} ${actualGapLength}`,
    offset,
  };
}

/**
 * Calculate dash pattern for circular/squircle borders with even distribution
 */
function calculateCircleDashPattern(
  perimeter: number,
  borderWidth: number
): { dashArray: string; offset: number } {
  // Target dash and gap lengths
  const targetDashLength = borderWidth * 3;
  const targetGapLength = borderWidth * 2;
  const targetPatternLength = targetDashLength + targetGapLength;

  // Calculate number of dashes
  let numDashes = Math.round(perimeter / targetPatternLength);

  // Force multiple of 4 for 4-fold symmetry (ensures corners look identical)
  // This aligns dashes/gaps to the 4 quadrants of the circle/squircle
  numDashes = Math.round(numDashes / 4) * 4;
  numDashes = Math.max(4, numDashes); // Minimum 4 dashes

  // Calculate adjusted lengths to fit exactly
  const actualPatternLength = perimeter / numDashes;
  const actualDashLength = actualPatternLength * 0.6;
  const actualGapLength = actualPatternLength * 0.4;

  // Offset to start with a dash centered at top
  const offset = actualDashLength / 2;

  return {
    dashArray: `${actualDashLength} ${actualGapLength}`,
    offset: offset,
  };
}

// ============================================================================
// Eye Shape Rendering (uses native SVG <rect rx> for corner radius)
// ============================================================================

/**
 * Render eye shape (frame, gap, or pupil)
 * Always renders filled shapes. Border thickness is controlled by adjusting gap layer size.
 *
 * @param x - X position
 * @param y - Y position
 * @param size - Size of the shape (width and height)
 * @param color - Fill color
 * @param cornerRadius - Corner radius scale: 0 = square, 0.5 = circle
 */
export function renderEyeShape(
  x: number,
  y: number,
  size: number,
  color: string,
  cornerRadius: number
): string {
  // Calculate actual corner radius in pixels
  // cornerRadius 0 = square (rx=0), cornerRadius 0.5 = circle (rx=50% of size)
  const rx = size * cornerRadius;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${color}"/>`;
}

// ============================================================================
// Data Dot Shapes
// ============================================================================

export const DotShapes: Record<string, ShapeDefinition> = {
  classic: {
    renderSVG(): string {
      // Handled specially in renderer (path-based for efficiency)
      return '';
    },
  },

  dots: {
    renderSVG(x: number, y: number, size: number, color: string): string {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const r = size * 0.35; // 35% of module size - balances visibility with gap spacing
      // Smaller (20-30%) = too sparse, harder to scan
      // Larger (40-50%) = dots touch, loses "dots" aesthetic
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    },
  },

  square: {
    renderSVG(x: number, y: number, size: number, color: string): string {
      const squareSize = size * 0.7; // 70% of module size - provides balanced appearance
      // Matches industry standard for decorative dot shapes
      // Leaves 15% margin on each side (0.3 / 2 = 0.15)
      const offset = (size - squareSize) / 2;
      const sx = x + offset;
      const sy = y + offset;
      return `<rect x="${sx}" y="${sy}" width="${squareSize}" height="${squareSize}" fill="${color}"/>`;
    },
  },
};

// ============================================================================
// Border Rendering (unified rect-based with corner radius)
// ============================================================================

/**
 * Render border as single rect with variable corner radius
 * 
 * @param x - X position
 * @param y - Y position  
 * @param size - Size of border area
 * @param color - Border color
 * @param borderWidth - Border stroke width
 * @param cornerRadius - Corner radius scale (0 = square, 0.5 = circle, 0.19 = squircle)
 * @param style - Border style (solid, dashed, dotted, double)
 */
export function renderBorder(
  x: number,
  y: number,
  size: number,
  color: string,
  borderWidth: number,
  cornerRadius: number,
  style: BorderStyle = BorderStyle.SOLID
): string {
  // Calculate actual corner radius in pixels
  const rx = size * cornerRadius;
  
  // Calculate stroke center position (stroke expands equally inward/outward from center)
  const inset = borderWidth / 2;
  const rectSize = size - borderWidth;

  if (style === 'dashed') {
    const { dashArray, offset } = calculateSquareDashPattern(
      rectSize,
      borderWidth
    );
    return (
      `<rect x="${x + inset}" y="${y + inset}" width="${rectSize}" height="${rectSize}" rx="${rx}" ` +
      `fill="none" stroke="${color}" stroke-width="${borderWidth}" ` +
      `stroke-dasharray="${dashArray}" stroke-dashoffset="${-offset}"/>`
    );
  }

  if (style === 'dotted') {
    // Dotted: very small dash with round caps creates distinct dots
    // Use 0.1 for dash (round caps make it circular) and larger gap for spacing
    const dotSize = borderWidth * 0.1;
    const gapSize = borderWidth * 1.5;
    return (
      `<rect x="${x + inset}" y="${y + inset}" width="${rectSize}" height="${rectSize}" rx="${rx}" ` +
      `fill="none" stroke="${color}" stroke-width="${borderWidth}" ` +
      `stroke-dasharray="${dotSize} ${gapSize}" stroke-linecap="round"/>`
    );
  }

  if (style === 'double') {
    // Double: two concentric strokes
    const outerStrokeWidth = borderWidth * 0.3;
    const innerStrokeWidth = borderWidth * 0.3;
    const gap = borderWidth * 0.4;
    
    const outerInset = outerStrokeWidth / 2;
    const outerSize = size - outerStrokeWidth;
    const outerRx = outerSize * cornerRadius;
    
    const innerInset = outerStrokeWidth + gap + innerStrokeWidth / 2;
    const innerSize = size - 2 * innerInset;
    const innerRx = innerSize * cornerRadius;
    
    return (
      `<rect x="${x + outerInset}" y="${y + outerInset}" width="${outerSize}" height="${outerSize}" rx="${outerRx}" ` +
      `fill="none" stroke="${color}" stroke-width="${outerStrokeWidth}"/>` +
      `<rect x="${x + innerInset}" y="${y + innerInset}" width="${innerSize}" height="${innerSize}" rx="${innerRx}" ` +
      `fill="none" stroke="${color}" stroke-width="${innerStrokeWidth}"/>`
    );
  }

  // Solid: simple stroke
  return (
    `<rect x="${x + inset}" y="${y + inset}" width="${rectSize}" height="${rectSize}" rx="${rx}" ` +
    `fill="none" stroke="${color}" stroke-width="${borderWidth}"/>`
  );
}
