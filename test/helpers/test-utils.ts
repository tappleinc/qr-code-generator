/**
 * Shared Test Utilities
 * 
 * Common patterns and utilities used across test suites.
 */

import { PNG } from 'pngjs';

/**
 * Validate PNG buffer signature and structure
 */
export function validatePNGBuffer(buffer: Buffer | Uint8Array): void {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
    throw new Error('Invalid PNG signature');
  }
  
  // Check for IHDR chunk
  const ihdrChunk = String.fromCharCode(...Array.from(buffer.slice(12, 16)));
  if (ihdrChunk !== 'IHDR') {
    throw new Error('Missing IHDR chunk');
  }
  
  // Check for IEND chunk at end
  const iendChunk = String.fromCharCode(...Array.from(buffer.slice(-8, -4)));
  if (iendChunk !== 'IEND') {
    throw new Error('Missing IEND chunk');
  }
}

/**
 * Check if buffer is a valid PNG with proper signature
 */
export function isPNGBuffer(buffer: Buffer | Uint8Array): boolean {
  return buffer[0] === 0x89 && 
         buffer[1] === 0x50 && 
         buffer[2] === 0x4E && 
         buffer[3] === 0x47;
}

/**
 * Validate PNG data URL format
 */
export function validatePNGDataURL(dataURL: string): Buffer {
  if (!dataURL.match(/^data:image\/png;base64,/)) {
    throw new Error('Invalid PNG data URL format');
  }
  
  const base64Part = dataURL.replace('data:image/png;base64,', '');
  
  // Validate base64
  if (!base64Part.match(/^[A-Za-z0-9+/=]+$/)) {
    throw new Error('Invalid base64 encoding');
  }
  
  const buffer = Buffer.from(base64Part, 'base64');
  validatePNGBuffer(buffer);
  
  return buffer;
}

/**
 * Validate SVG string structure
 */
export function validateSVGString(svg: string): void {
  if (!svg.match(/^<svg/)) {
    throw new Error('SVG must start with <svg tag');
  }
  
  if (!svg.includes('</svg>')) {
    throw new Error('SVG must have closing </svg> tag');
  }
}

/**
 * Validate SVG data URL format
 */
export function validateSVGDataURL(dataURL: string): void {
  if (!dataURL.match(/^data:image\/svg\+xml/)) {
    throw new Error('Invalid SVG data URL format');
  }
}

/**
 * Get PNG dimensions from buffer
 */
export function getPNGDimensions(buffer: Buffer | Uint8Array): { width: number; height: number } {
  const png = PNG.sync.read(Buffer.from(buffer));
  return { width: png.width, height: png.height };
}

/**
 * Log warning with emoji prefix
 */
export function logWarning(message: string): void {
  console.warn(`⚠️  ${message}`);
}
