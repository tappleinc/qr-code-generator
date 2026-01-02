/**
 * ABSTRACTION LAYER - This file provides TypeScript types only.
 * At runtime, esbuild alias swaps imports to 'svg-to-raster-converter'
 * with actual browser or node implementation.
 *
 * Import pattern in other files:
 *   import { convertSvgToRaster } from 'svg-to-raster-converter';
 *
 * esbuild config:
 *   alias: { 'svg-to-raster-converter': '/path/to/svg-to-raster-browser.ts' }
 */

import { MergedImageOptions } from '../core/defaults';

export async function convertSvgToRaster(
  _svgString: string,
  _options: MergedImageOptions
): Promise<string | Buffer | Uint8Array> {
  throw new Error(
    'Converter not configured. This should be replaced by esbuild alias during build.'
  );
}
