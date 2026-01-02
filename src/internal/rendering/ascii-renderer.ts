/**
 * ASCII Renderer
 *
 * Handles generation of ASCII/Text output for terminal usage.
 */

import { QRCodeConfig } from '../core/types';
import { MergedTextOptions } from '../core/defaults';

/**
 * Render QR code as ASCII text
 */
export function renderASCIIString(
  qrCodeConfig: QRCodeConfig,
  options: MergedTextOptions
): string {
  // All options already merged with defaults - no extraction needed
  const { margin, lightChar, darkChar } = options;

  let result = '';

  // Top margin
  const lineWidth = qrCodeConfig.matrixSize + margin * 2;
  for (let i = 0; i < margin; i++) {
    result += lightChar.repeat(lineWidth) + '\n';
  }

  // QR code rows
  for (let row = 0; row < qrCodeConfig.matrixSize; row++) {
    result += lightChar.repeat(margin);
    for (let col = 0; col < qrCodeConfig.matrixSize; col++) {
      result += qrCodeConfig.modules[row][col] ? darkChar : lightChar;
    }
    result += lightChar.repeat(margin) + '\n';
  }

  // Bottom margin
  for (let i = 0; i < margin; i++) {
    result += lightChar.repeat(lineWidth) + '\n';
  }

  return result;
}
