/**
 * Type declarations for svg-to-raster-converter module
 * This module is resolved via esbuild alias at build time
 */

declare module 'svg-to-raster-converter' {
  import { MergedImageOptions } from './internal/core/defaults';

  export function convertSvgToRaster(
    svgString: string,
    options: MergedImageOptions
  ): Promise<string | Buffer | Uint8Array>;
}
