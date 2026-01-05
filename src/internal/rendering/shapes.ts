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
// Eye Frame Shapes (7×7 outer border)
// ============================================================================

export const EyeFrameShapes: Record<string, ShapeDefinition> = {
  square: {
    renderSVG(x: number, y: number, size: number, color: string): string {
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}"/>`;
    },
  },

  squircle: {
    renderSVG(x: number, y: number, size: number, color: string): string {
      const half = size / 2;
      const k = half * SQUIRCLE_CONTROL_POINTS.EYE_FRAME;
      const cx = x + half;
      const cy = y + half;

      const path = `M${cx},${cy - half}
        C${cx + k},${cy - half} ${cx + half},${cy - k} ${cx + half},${cy}
        S${cx + k},${cy + half} ${cx},${cy + half}
        S${cx - half},${cy + k} ${cx - half},${cy}
        S${cx - k},${cy - half} ${cx},${cy - half}Z`;
      return `<path d="${path}" fill="${color}"/>`;
    },
  },
};

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
// Border Shapes
// ============================================================================

export const BorderShapes: Record<string, ShapeDefinition> = {
  square: {
    getDiagonalFactor(): number {
      return Math.sqrt(2);
    },
    renderSVG(
      x: number,
      y: number,
      size: number,
      color: string,
      context?: ShapeContext
    ): string {
      const borderWidth = context?.borderWidth ?? 1;
      const style = context?.borderStyle ?? 'solid';

      if (style === 'dashed') {
        const inset = borderWidth / 2;
        const rectSize = size - borderWidth;
        const { dashArray, offset } = calculateSquareDashPattern(
          rectSize,
          borderWidth
        );

        // Use stroked rect for dashed border
        // Note: x,y are usually 0,0 for borders as they wrap the whole QR
        return (
          `<rect x="${x + inset}" y="${y + inset}" width="${rectSize}" height="${rectSize}" ` +
          `fill="none" stroke="${color}" stroke-width="${borderWidth}" ` +
          `stroke-dasharray="${dashArray}" stroke-dashoffset="${-offset}"/>`
        );
      }

      // Solid: Outer rectangle minus Inner rectangle
      const outerPath = `M${x},${y}h${size}v${size}h${-size}z`;
      const innerX = x + borderWidth;
      const innerY = y + borderWidth;
      const innerSize = size - borderWidth * 2;
      const innerPath = `M${innerX},${innerY}h${innerSize}v${innerSize}h${-innerSize}z`;

      return `<path d="${outerPath} ${innerPath}" fill="${color}" fill-rule="evenodd"/>`;
    },
  },

  squircle: {
    getDiagonalFactor(): number {
      return Math.pow(2, 0.25);
    },
    renderSVG(
      x: number,
      y: number,
      size: number,
      color: string,
      context?: ShapeContext
    ): string {
      const borderWidth = context?.borderWidth ?? 1;
      const style = context?.borderStyle ?? 'solid';
      const half = size / 2;
      const cx = x + half;
      const cy = y + half;

      // Use stroke-based rendering for BOTH solid and dashed to ensure uniform width
      const strokeRadius = half - borderWidth / 2;

      // Use Rounded Rectangle logic (CSS border-radius style)
      // This is simpler and more consistent than superellipses
      const cornerRadius = size * SQUIRCLE_CORNER_RADIUS_RATIO;

      // For the stroke path, the radius is adjusted to be the center of the border
      // If cornerRadius is the outer visual radius, stroke path radius is cornerRadius - borderWidth/2
      const pathCornerRadius = Math.max(0, cornerRadius - borderWidth / 2);

      // Construct path manually to ensure control over start point (top-center) for dashing
      const innerDim = strokeRadius - pathCornerRadius;

      // Start at top-center
      const strokePath = `M${cx},${cy - strokeRadius}
        H${cx + innerDim}
        A${pathCornerRadius},${pathCornerRadius} 0 0 1 ${cx + strokeRadius},${cy - innerDim}
        V${cy + innerDim}
        A${pathCornerRadius},${pathCornerRadius} 0 0 1 ${cx + innerDim},${cy + strokeRadius}
        H${cx - innerDim}
        A${pathCornerRadius},${pathCornerRadius} 0 0 1 ${cx - strokeRadius},${cy + innerDim}
        V${cy - innerDim}
        A${pathCornerRadius},${pathCornerRadius} 0 0 1 ${cx - innerDim},${cy - strokeRadius}
        Z`;

      if (style === 'dashed') {
        // Calculate exact perimeter for dash pattern
        const straightLen = 2 * innerDim;
        const arcLen = 0.5 * Math.PI * pathCornerRadius;
        const perimeter = 4 * straightLen + 4 * arcLen;

        const { dashArray, offset } = calculateCircleDashPattern(
          perimeter,
          borderWidth
        );

        return (
          `<path d="${strokePath}" fill="none" stroke="${color}" ` +
          `stroke-width="${borderWidth}" stroke-dasharray="${dashArray}" ` +
          `stroke-dashoffset="${offset}"/>`
        );
      }

      // Solid border - just stroke the path
      return `<path d="${strokePath}" fill="none" stroke="${color}" stroke-width="${borderWidth}"/>`;
    },
  },

  circle: {
    getDiagonalFactor(): number {
      return 1.0;
    },
    renderSVG(
      x: number,
      y: number,
      size: number,
      color: string,
      context?: ShapeContext
    ): string {
      const borderWidth = context?.borderWidth ?? 1;
      const style = context?.borderStyle ?? 'solid';
      const cx = x + size / 2;
      const cy = y + size / 2;
      const outerRadius = size / 2;

      if (style === 'dashed') {
        const strokeRadius = outerRadius - borderWidth / 2;
        const circumference = 2 * Math.PI * strokeRadius;
        const { dashArray, offset } = calculateCircleDashPattern(
          circumference,
          borderWidth
        );

        return (
          `<circle cx="${cx}" cy="${cy}" r="${strokeRadius}" ` +
          `fill="none" stroke="${color}" stroke-width="${borderWidth}" ` +
          `stroke-dasharray="${dashArray}" stroke-dashoffset="${offset}"/>`
        );
      }

      const innerRadius = outerRadius - borderWidth;

      // Outer circle (clockwise)
      const outerPath = `M${cx},${cy - outerRadius}
        A${outerRadius},${outerRadius} 0 1,1 ${cx},${cy + outerRadius}
        A${outerRadius},${outerRadius} 0 1,1 ${cx},${cy - outerRadius}Z`;

      // Inner circle (counter-clockwise to create hole)
      const innerPath = `M${cx},${cy - innerRadius}
        A${innerRadius},${innerRadius} 0 1,0 ${cx},${cy + innerRadius}
        A${innerRadius},${innerRadius} 0 1,0 ${cx},${cy - innerRadius}Z`;

      return `<path d="${outerPath} ${innerPath}" fill="${color}" fill-rule="evenodd"/>`;
    },
  },
};
