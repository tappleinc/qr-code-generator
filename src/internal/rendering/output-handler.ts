/**
 * Output Handler
 *
 * Routes and processes output based on format/type configuration.
 * Handles SVG output directly, delegates raster (PNG) conversion
 * to environment-specific converter (swapped at build time).
 */

import { MergedImageOptions } from '../core/defaults';
// Package-style import (no leading dot) - swapped by esbuild alias at build time
import { convertSvgToRaster } from 'svg-to-raster-converter';

export async function handleOutput(
  svgString: string,
  options: MergedImageOptions
): Promise<string | Buffer | Uint8Array> {
  const { format, type } = options.output;

  // SVG output - no conversion needed
  if (format === 'svg') {
    if (type === 'string') {
      return svgString;
    }
    // type === 'dataURL'
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }

  // Raster output (PNG) - delegate to converter (swapped at build time, async)
  return await convertSvgToRaster(svgString, options);
}
