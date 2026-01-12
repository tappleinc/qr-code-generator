/**
 * Browser SVG to Raster Converter
 *
 * Uses Canvas API for SVG → PNG conversion.
 * Zero dependencies - uses native browser APIs only.
 */

import { MergedImageOptions } from '../core/defaults';

export async function convertSvgToRaster(
  svgString: string,
  options: MergedImageOptions
): Promise<string | Uint8Array> {
  const { output, size, margin, border } = options;

  // Calculate total dimensions
  const borderWidth = border.width;
  const totalSize = size + 2 * margin + 2 * borderWidth;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const img = new Image();
    let url: string | null = null;

    try {
      const blob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      url = URL.createObjectURL(blob);
    } catch {
      reject(new Error('Failed to create SVG blob for rasterization'));
      return;
    }

    img.onload = () => {
      if (url) URL.revokeObjectURL(url);
      ctx.drawImage(img, 0, 0, totalSize, totalSize);

      if (output.type === 'dataURL') {
        // Return PNG data URL directly
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } else {
        // type === 'buffer' - convert to Uint8Array
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert PNG to blob'));
            return;
          }
          blob.arrayBuffer().then((buffer) => {
            resolve(new Uint8Array(buffer));
          });
        }, 'image/png');
      }
    };

    img.onerror = () => {
      if (url) URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for rasterization'));
    };

    img.src = url;
  });
}
