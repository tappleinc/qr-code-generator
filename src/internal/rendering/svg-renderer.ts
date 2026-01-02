/**
 * SVG Renderer
 *
 * Handles generation of Scalable Vector Graphics (SVG) output.
 * Focuses on string concatenation and XML structure generation.
 */

import { QRCodeConfig } from '../core/types';
import { MergedImageOptions } from '../core/defaults';
import { EyeFrameShapes, DotShapes, BorderShapes } from './shapes';
import { calculateLogoSize } from './utils';
import { isFinderPattern, getFinderPatterns } from './utils';

// ============================================================================
// Shape Rendering - Eyes (3-Layer Composite)
// ============================================================================

/**
 * Render complete eye (frame + middle layer + pupil)
 * Uses a 3-layer composite approach: 7×7 outer frame, 5×5 white gap, 3×3 inner pupil
 */
function renderEye(
  x: number,
  y: number,
  eyeFrameShape: string,
  eyeFrameColor: string,
  pupilColor: string,
  backgroundColor: string,
  scale: number
): string {
  const shapeImpl = EyeFrameShapes[eyeFrameShape] || EyeFrameShapes['square'];

  // Layer 1: Outer frame (7×7 modules = 7*scale pixels)
  const frame = shapeImpl.renderSVG(x, y, 7 * scale, eyeFrameColor);

  // Layer 2: Middle gap (5×5 modules) - matches eye frame shape for visual consistency
  const middle = shapeImpl.renderSVG(
    x + scale,
    y + scale,
    5 * scale,
    backgroundColor
  );

  // Layer 3: Inner pupil (3×3 modules) - matches eye frame shape
  const pupil = shapeImpl.renderSVG(
    x + 2 * scale,
    y + 2 * scale,
    3 * scale,
    pupilColor
  );

  return frame + middle + pupil;
}

// ============================================================================
// Logo Rendering Utilities
// ============================================================================

/**
 * Render logo in SVG
 */
function renderLogoSVG(
  logoSrc: string,
  centerX: number,
  centerY: number,
  logoSize: number
): string {
  const logoOffset = logoSize / 2;

  // Check if the source is an SVG (starts with data:image/svg or is raw SVG)
  if (logoSrc.includes('data:image/svg') || logoSrc.trim().startsWith('<svg')) {
    // For SVG logos, embed directly with proper scaling
    let svgContent = logoSrc;
    if (logoSrc.includes('data:image/svg')) {
      // Extract SVG from data URL
      const base64Match = logoSrc.match(/data:image\/svg\+xml[^,]*,(.+)/);
      if (base64Match) {
        try {
          svgContent = decodeURIComponent(base64Match[1]);
        } catch {
          // If decoding fails, skip logo
          return '';
        }
      }
    }

    // Extract viewBox from original SVG if present
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

    // Remove XML declaration and SVG tags, keeping only the content
    const innerContent = svgContent.replace(
      /<\?xml[^>]*>|<svg[^>]*>|<\/svg>/gi,
      ''
    );

    // Wrap SVG in a group with positioning and scaling
    return `<g transform="translate(${centerX - logoOffset}, ${centerY - logoOffset})">
      <svg width="${logoSize}" height="${logoSize}" viewBox="${viewBox}">
        ${innerContent}
      </svg>
    </g>`;
  } else {
    // For raster images (PNG, JPG, WebP), use image element
    return `<image x="${centerX - logoOffset}" y="${centerY - logoOffset}" width="${logoSize}" height="${logoSize}" href="${logoSrc}" preserveAspectRatio="xMidYMid meet"/>`;
  }
}

// ============================================================================
// Shape Rendering - Data Dots
// ============================================================================

/**
 * Render data modules (non-eye dots)
 */
function renderDataModules(
  qrCodeConfig: QRCodeConfig,
  scale: number,
  shape: string,
  color: string,
  dotScale: number
): string {
  const size = qrCodeConfig.matrixSize;
  let svg = '';

  // Use unified shape definitions for ALL shapes
  const shapeImpl = DotShapes[shape] || DotShapes['classic'];

  // Special case for 'classic' - use path-based rendering for efficiency
  if (shape === 'classic') {
    svg = `<path fill="${color}" d="`;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (
          qrCodeConfig.modules[row][col] &&
          !isFinderPattern(row, col, size)
        ) {
          const moduleX = col * scale;
          const moduleY = row * scale;

          // Apply dot scale - center the scaled dot within the module
          const scaledSize = dotScale * scale;
          const offset = ((1 - dotScale) * scale) / 2;
          const x = moduleX + offset;
          const y = moduleY + offset;

          svg += `M${x},${y}h${scaledSize}v${scaledSize}h${-scaledSize}z`;
        }
      }
    }
    svg += `"/>`;
    return svg;
  }

  // All other shapes use unified shape definition with context
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qrCodeConfig.modules[row][col] && !isFinderPattern(row, col, size)) {
        const moduleX = col * scale;
        const moduleY = row * scale;

        // Apply dot scale - center the scaled dot within the module
        const scaledSize = dotScale * scale;
        const offset = ((1 - dotScale) * scale) / 2;
        const x = moduleX + offset;
        const y = moduleY + offset;

        const context = {
          qrcode: qrCodeConfig.modules,
          qrSize: size,
          row,
          col,
        };
        svg += shapeImpl.renderSVG(x, y, scaledSize, color, context);
      }
    }
  }

  return svg;
}

// ============================================================================
// SVG Rendering
// ============================================================================

export function renderSVGString(
  qrCodeConfig: QRCodeConfig,
  options: MergedImageOptions
): string {
  // All options already merged with defaults - no extraction needed
  const { size, margin, backgroundColor, eyes, pupils, dots } = options;

  // Calculate dimensions in pixels
  const scale = size / qrCodeConfig.matrixSize; // pixels per module (for QR matrix only)
  const borderWidth =
    options.border.shape === 'none' ? 0 : options.border.width;
  const totalSize = size + 2 * margin + 2 * borderWidth;
  const qrOffset = margin + borderWidth; // Offset from edge to QR matrix

  // ViewBox uses pixel coordinates - no module space conversions needed
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${backgroundColor}"/>`;

  // Render border (if enabled)
  if (options.border.shape !== 'none' && borderWidth > 0) {
    const borderShape = BorderShapes[options.border.shape];
    if (borderShape) {
      const context = {
        borderWidth: borderWidth,
        borderStyle: options.border.style,
      };

      svg += borderShape.renderSVG(
        0,
        0,
        totalSize,
        options.border.color,
        context
      );
    }
  }

  // Add QR area background rectangle when border exists
  // This uses simple SVG layering: border renders first, then this rect covers it in QR area
  if (options.border.shape !== 'none' && borderWidth > 0) {
    svg += `<rect x="${qrOffset}" y="${qrOffset}" width="${size}" height="${size}" fill="${backgroundColor}"/>`;
  }

  // Group for QR matrix (offset by margin + border)
  svg += `<g transform="translate(${qrOffset}, ${qrOffset})">`;

  // Render finder patterns (eyes) - positioned within QR matrix
  const finderPatterns = getFinderPatterns(qrCodeConfig.matrixSize);
  let eyesSvg = '';
  for (const pattern of finderPatterns) {
    eyesSvg += renderEye(
      pattern.x * scale,
      pattern.y * scale,
      eyes.shape,
      eyes.color,
      pupils.color,
      backgroundColor,
      scale
    );
  }

  // Render data modules based on shape
  const dataSvg = renderDataModules(
    qrCodeConfig,
    scale,
    dots.shape,
    dots.color,
    dots.scale
  );

  svg += eyesSvg + dataSvg + '</g>'; // Close QR matrix group

  // Render logo if provided (positioned relative to total canvas)
  let logoSvg = '';
  if (options.logo) {
    const logoSize =
      calculateLogoSize(qrCodeConfig.matrixSize, options.logo.scale) * scale;
    const center = totalSize / 2;
    logoSvg = renderLogoSVG(options.logo.src, center, center, logoSize);
  }

  svg += logoSvg + '</svg>';
  return svg;
}
