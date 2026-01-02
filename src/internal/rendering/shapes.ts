/**
 * Unified Shape Definitions
 *
 * Single source of truth for all QR code shapes.
 * Each shape provides:
 * - SVG output (vector path/polygon)
 * - PNG alpha calculation (pixel-by-pixel sampling)
 *
 * This ensures mathematical consistency between SVG and PNG rendering.
 * Visual accuracy: 90-95% (different antialiasing algorithms)
 */

import { BorderStyle } from '../../types';

// ============================================================================
// Helper Types
// ============================================================================

interface Point {
  x: number;
  y: number;
}

/**
 * Context for rendering shapes (provides access to QR matrix and neighbors)
 */
export interface ShapeContext {
  qrcode?: boolean[][];
  qrSize?: number;
  row?: number;
  col?: number;
  pixelSize?: number;
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
  renderPixel(
    dx: number,
    dy: number,
    size: number,
    context?: ShapeContext
  ): number;
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
// Geometry Helpers
// ============================================================================

/**
 * Calculate alpha based on signed distance to edge
 * @param signedDistance Distance from edge (positive = inside, negative = outside)
 * @param pixelSize Size of a pixel in module units (determines AA blur radius)
 */
function clampAlpha(signedDistance: number, pixelSize: number): number {
  const halfPixel = pixelSize / 2;
  if (signedDistance <= -halfPixel) return 0;
  if (signedDistance >= halfPixel) return 255;
  return Math.round(((signedDistance + halfPixel) / pixelSize) * 255);
}

/**
 * Generate hexagon vertices (6 sides at 60° intervals)
 * Ensures SVG and PNG use identical geometry
 * @internal Reserved for future use
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateHexagonVertices(
  cx: number,
  cy: number,
  radius: number
): Point[] {
  const vertices: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    vertices.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return vertices;
}

/**
 * Calculate circle antialiasing alpha
 * Ensures consistent smoothing across all circular shapes
 */
function circleAntialiasAlpha(
  distance: number,
  radius: number,
  pixelSize: number = 0.01
): number {
  return clampAlpha(radius - distance, pixelSize);
}

/**
 * Signed Distance Function for a Rounded Box
 * @param dx X distance from center
 * @param dy Y distance from center
 * @param halfSize Half-size of the box (width/2, height/2)
 * @param radius Corner radius
 * @returns Signed distance (negative inside, positive outside)
 */
function sdRoundedBox(
  dx: number,
  dy: number,
  halfSize: number,
  radius: number
): number {
  const qx = Math.abs(dx) - halfSize + radius;
  const qy = Math.abs(dy) - halfSize + radius;

  const outerDist = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2);
  const innerDist = Math.min(Math.max(qx, qy), 0);

  return outerDist + innerDist - radius;
}

// ============================================================================
// Dash Pattern Helpers
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

/**
 * Calculate if a position is in a dash (true) or gap (false) for dashed borders
 */
function isDashPosition(
  dx: number,
  dy: number,
  totalSize: number,
  borderWidth: number,
  shape: string
): boolean {
  if (shape === 'circle') {
    return isDashPositionCircle(dx, dy, totalSize, borderWidth);
  } else if (shape === 'squircle') {
    return isDashPositionSquircle(dx, dy, totalSize, borderWidth);
  } else {
    return isDashPositionSquare(dx, dy, totalSize, borderWidth);
  }
}

/**
 * Calculate dash position for circle borders
 */
function isDashPositionCircle(
  dx: number,
  dy: number,
  totalSize: number,
  borderWidth: number
): boolean {
  // Angle-based pattern for circular shapes
  const angle = Math.atan2(dy, dx);
  const position = (angle + Math.PI) / (2 * Math.PI); // Normalize to 0-1

  // Calculate dash count based on perimeter
  const radius = totalSize / 2 - borderWidth / 2;
  const perimeter = 2 * Math.PI * radius;

  const dashLength = borderWidth * 3;
  const gapLength = borderWidth * 2;
  const dashCount = Math.floor(perimeter / (dashLength + gapLength));

  // Ensure even number for symmetry
  const evenDashCount = dashCount % 2 === 0 ? dashCount : dashCount - 1;
  const finalDashCount = Math.max(4, evenDashCount);

  const segment = (position * finalDashCount) % 1;
  return segment < 0.6; // 60% dash, 40% gap
}

/**
 * Calculate dash position for squircle borders
 */
function isDashPositionSquircle(
  dx: number,
  dy: number,
  totalSize: number,
  borderWidth: number
): boolean {
  // For squircle (Rounded Rect), we trace the perimeter
  const halfSize = totalSize / 2;
  const strokeRadius = halfSize - borderWidth / 2;
  const cornerRadius = totalSize * SQUIRCLE_CORNER_RADIUS_RATIO;
  const pathCornerRadius = Math.max(0, cornerRadius - borderWidth / 2);

  const innerDim = strokeRadius - pathCornerRadius;
  const straightLen = 2 * innerDim;
  const arcLen = 0.5 * Math.PI * pathCornerRadius;
  const perimeter = 4 * straightLen + 4 * arcLen;

  // Calculate distance along perimeter starting from top-center, going clockwise
  const dist = calculateSquirclePerimeterDistance(
    dx,
    dy,
    innerDim,
    pathCornerRadius,
    straightLen,
    arcLen,
    perimeter
  );

  // Calculate dash pattern
  const { dashArray } = calculateCircleDashPattern(perimeter, borderWidth);
  const [dash, gap] = dashArray.split(' ').map(Number);
  const patternLength = dash + gap;

  // Apply offset to center dashes
  const adjustedDist = dist + dash / 2;
  const posInPattern = adjustedDist % patternLength;
  return posInPattern < dash;
}

/**
 * Helper to calculate distance along squircle perimeter
 */
function calculateSquirclePerimeterDistance(
  dx: number,
  dy: number,
  innerDim: number,
  pathCornerRadius: number,
  straightLen: number,
  arcLen: number,
  perimeter: number
): number {
  if (dy < -innerDim) {
    // Top region
    if (dx > innerDim) {
      // TR Corner
      const angle = Math.atan2(dy - -innerDim, dx - innerDim) + Math.PI / 2;
      return innerDim + angle * pathCornerRadius;
    } else if (dx < -innerDim) {
      // TL Corner
      const angle = Math.atan2(dy - -innerDim, dx - -innerDim) + Math.PI;
      return innerDim + 3 * arcLen + 3 * straightLen + angle * pathCornerRadius;
    } else {
      // Top Edge
      return dx >= 0 ? dx : perimeter + dx;
    }
  } else if (dy > innerDim) {
    // Bottom region
    if (dx > innerDim) {
      // BR Corner
      const angle = Math.atan2(dy - innerDim, dx - innerDim);
      return innerDim + arcLen + straightLen + angle * pathCornerRadius;
    } else if (dx < -innerDim) {
      // BL Corner
      const angle = Math.atan2(dy - innerDim, dx - -innerDim) - Math.PI / 2;
      return innerDim + 2 * arcLen + 2 * straightLen + angle * pathCornerRadius;
    } else {
      // Bottom Edge
      return innerDim + 2 * arcLen + straightLen + (innerDim - dx);
    }
  } else {
    // Middle region
    if (dx > innerDim) {
      // Right Edge
      return innerDim + arcLen + (dy - -innerDim);
    } else if (dx < -innerDim) {
      // Left Edge
      return innerDim + 3 * arcLen + 2 * straightLen + (innerDim - dy);
    } else {
      // Center (inside hole) - map to top edge
      return dx >= 0 ? dx : perimeter + dx;
    }
  }
}

/**
 * Calculate dash position for square borders
 */
function isDashPositionSquare(
  dx: number,
  dy: number,
  totalSize: number,
  borderWidth: number
): boolean {
  const halfSize = totalSize / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Calculate position along the current edge
  const positionOnEdge =
    absDy >= absDx
      ? halfSize + dx // Top or bottom edge
      : halfSize + dy; // Left or right edge

  const sideLength = totalSize - borderWidth;

  // Calculate dash pattern with corner gaps
  const dashRatio = 3;
  const gapRatio = 2;
  const targetPatternLength = borderWidth * (dashRatio + gapRatio);

  const numPatterns = Math.max(1, Math.round(sideLength / targetPatternLength));
  const actualPatternLength = sideLength / numPatterns;
  const actualDashLength =
    actualPatternLength * (dashRatio / (dashRatio + gapRatio));
  const actualGapLength = actualPatternLength - actualDashLength;

  // Apply offset to center pattern (gap at both corners)
  const offset = actualGapLength / 2;
  const adjustedPosition = positionOnEdge + offset;
  const positionInPattern = adjustedPosition % actualPatternLength;

  return positionInPattern < actualDashLength;
}

// ============================================================================
// Shape Constants (Single Source of Truth)
// ============================================================================

/**
 * Corner radius ratio for squircle borders (relative to total size)
 *
 * Value: 0.12 = 12% of size
 * Example: For a 300px QR code, corner radius = 36px
 *
 * Rationale:
 * - Chosen to match iOS/Material Design "slightly rounded" aesthetic
 * - Provides visual softness without compromising scannability
 * - Range 0.10-0.15 provides optimal balance between roundness and clarity
 * - Values <0.10 appear too sharp, >0.15 risk scanner misreads at corners
 */
export const SQUIRCLE_CORNER_RADIUS_RATIO = 0.12;

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
// Eye Frame Shapes (7×7 outer border)
// ============================================================================

export const EyeFrameShapes: Record<string, ShapeDefinition> = {
  square: {
    renderSVG(x: number, y: number, size: number, color: string): string {
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}"/>`;
    },

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const half = size / 2;
      const pixelSize = context?.pixelSize ?? 0.01;
      const dist = Math.min(half - Math.abs(dx), half - Math.abs(dy));
      return clampAlpha(dist, pixelSize);
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const half = size / 2;
      const pixelSize = context?.pixelSize ?? 0.01;
      const n = 4; // Squircle exponent

      // Estimate signed distance using gradient method
      // f = (|x|/h)^n + (|y|/h)^n
      // dist = (1 - f) / |grad f|

      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const xh = ax / half;
      const yh = ay / half;

      // Avoid division by zero at center
      if (ax < 0.001 && ay < 0.001) return 255;

      const f = Math.pow(xh, n) + Math.pow(yh, n);

      // Gradient magnitude: |grad f| = (n/half) * sqrt((xh)^(2n-2) + (yh)^(2n-2))
      const gradMag =
        (n / half) *
        Math.sqrt(Math.pow(xh, 2 * n - 2) + Math.pow(yh, 2 * n - 2));

      // Signed distance (approx)
      const dist = (1 - f) / gradMag;

      return clampAlpha(dist, pixelSize);
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const half = size / 2;
      const pixelSize = context?.pixelSize ?? 0.01;

      // If size is large enough to touch neighbors (>= 1.0), check for connections
      // to avoid seams between adjacent modules due to anti-aliasing
      if (
        size >= 0.99 &&
        context &&
        context.qrcode &&
        context.row !== undefined &&
        context.col !== undefined
      ) {
        const { qrcode, row, col } = context;
        const qrSize = context.qrSize || qrcode.length;

        // Check neighbors (bounds check included)
        const hasLeft = col > 0 && qrcode[row][col - 1];
        const hasRight = col < qrSize - 1 && qrcode[row][col + 1];
        const hasTop = row > 0 && qrcode[row - 1][col];
        const hasBottom = row < qrSize - 1 && qrcode[row + 1][col];

        // If we have a neighbor, the distance to that edge is effectively infinite (inside)
        // dx is negative at left, positive at right
        // dy is negative at top, positive at bottom

        const distL = hasLeft ? Infinity : half + dx;
        const distR = hasRight ? Infinity : half - dx;
        const distT = hasTop ? Infinity : half + dy;
        const distB = hasBottom ? Infinity : half - dy;

        const dist = Math.min(Math.min(distL, distR), Math.min(distT, distB));
        return clampAlpha(dist, pixelSize);
      }

      const dist = Math.min(half - Math.abs(dx), half - Math.abs(dy));
      return clampAlpha(dist, pixelSize);
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const r = size * 0.35;
      const pixelSize = context?.pixelSize ?? 0.01;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return circleAntialiasAlpha(dist, r, pixelSize);
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const squareSize = size * 0.7;
      const half = squareSize / 2;
      const pixelSize = context?.pixelSize ?? 0.01;
      const dist = Math.min(half - Math.abs(dx), half - Math.abs(dy));
      return clampAlpha(dist, pixelSize);
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const borderWidth = context?.borderWidth ?? 1;
      const style = context?.borderStyle ?? 'solid';
      const pixelSize = context?.pixelSize ?? 0.01;
      const half = size / 2;
      const innerHalf = half - borderWidth;

      // Distance from center to edges (positive = inside)
      const distOuterX = half - Math.abs(dx);
      const distOuterY = half - Math.abs(dy);
      const distInnerX = innerHalf - Math.abs(dx);
      const distInnerY = innerHalf - Math.abs(dy);

      // For square border: pixel is in border if inside outer box AND outside inner box
      // Use min of x/y distances for box edges
      const distOuter = Math.min(distOuterX, distOuterY);
      const distInner = Math.min(distInnerX, distInnerY);

      // Inside border if: outside inner box but inside outer box
      if (distOuter >= 0 && distInner <= 0) {
        // Check dash pattern if needed
        if (style === 'dashed') {
          if (!isDashPosition(dx, dy, size, borderWidth, 'square')) {
            return 0;
          }
        }

        // Alpha for outer edge (how far inside outer boundary)
        const alphaOuter = clampAlpha(distOuter, pixelSize);

        // Alpha for inner edge (inverted: 0 when inside inner box, 255 when outside)
        const alphaInner = 255 - clampAlpha(distInner, pixelSize);

        return Math.min(alphaOuter, alphaInner);
      }

      return 0;
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const borderWidth = context?.borderWidth ?? 1;
      const style = context?.borderStyle ?? 'solid';
      const pixelSize = context?.pixelSize ?? 0.01;
      const half = size / 2;

      // Calculate distance to the CENTER path (stroke path)
      // This matches the SVG implementation which strokes a central path
      const strokeRadius = half - borderWidth / 2;
      const cornerRadius = size * SQUIRCLE_CORNER_RADIUS_RATIO;
      const pathCornerRadius = Math.max(0, cornerRadius - borderWidth / 2);

      // Signed Distance to Rounded Box (outline)
      // Box half-size is strokeRadius
      // Corner radius is pathCornerRadius
      const distToPath = Math.abs(
        sdRoundedBox(dx, dy, strokeRadius, pathCornerRadius)
      );

      // We want to be within borderWidth/2 of the path
      const distFromStrokeEdge = borderWidth / 2 - distToPath;

      if (distFromStrokeEdge > -pixelSize) {
        // Optimization: only calculate if near/inside
        if (style === 'dashed') {
          if (!isDashPosition(dx, dy, size, borderWidth, 'squircle')) {
            return 0;
          }
        }
        return clampAlpha(distFromStrokeEdge, pixelSize);
      }

      return 0;
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

    renderPixel(
      dx: number,
      dy: number,
      size: number,
      context?: ShapeContext
    ): number {
      const borderWidth = context?.borderWidth ?? 1;
      const style = context?.borderStyle ?? 'solid';
      const pixelSize = context?.pixelSize ?? 0.01;
      const outerRadius = size / 2;
      const innerRadius = outerRadius - borderWidth;

      const dist = Math.sqrt(dx * dx + dy * dy);

      // Inside border if: outside inner circle but inside outer circle
      if (dist <= outerRadius && dist >= innerRadius) {
        if (style === 'dashed') {
          if (!isDashPosition(dx, dy, size, borderWidth, 'circle')) {
            return 0;
          }
        }

        const alphaOuter = circleAntialiasAlpha(dist, outerRadius, pixelSize);
        const alphaInner =
          255 - circleAntialiasAlpha(dist, innerRadius, pixelSize);
        return Math.min(alphaOuter, alphaInner);
      }

      return 0;
    },
  },
};
