/**
 * Shared Distribution Test Patterns
 * 
 * Common test cases for validating built distribution bundles.
 * Used by Node.js (ESM/CJS) and browser bundle tests.
 */

import { expect } from 'vitest';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { validatePNGBuffer, validateSVGString, validateSVGDataURL, validatePNGDataURL } from './test-utils';

/**
 * Test module exports presence
 */
export function testModuleExports(module: Record<string, unknown>): void {
  expect(module.genQrImage).toBeDefined();
  expect(typeof module.genQrImage).toBe('function');
  
  expect(module.genQrText).toBeDefined();
  expect(typeof module.genQrText).toBe('function');
  
  expect(module.EyeFrameShape).toBeDefined();
  expect(module.DotShape).toBeDefined();
  expect(module.BorderShape).toBeDefined();
  expect(module.BorderStyle).toBeDefined();
}

/**
 * Test SVG generation
 */
export async function testSVGGeneration(genQrImage: (input: string, options?: Record<string, unknown>) => Promise<string | Buffer | Uint8Array>): Promise<void> {
  // Test SVG string
  const svg = await genQrImage('Hello World', {
    output: { format: 'svg', type: 'string' }
  }) as string;

  expect(typeof svg).toBe('string');
  validateSVGString(svg);
  
  // Test SVG dataURL
  const dataURL = await genQrImage('Hello World', {
    output: { format: 'svg', type: 'dataURL' }
  }) as string;

  expect(typeof dataURL).toBe('string');
  validateSVGDataURL(dataURL);
}

/**
 * Test PNG generation
 */
export async function testPNGGeneration(genQrImage: (input: string, options?: Record<string, unknown>) => Promise<string | Buffer | Uint8Array>): Promise<void> {
  // Test PNG buffer
  const buffer = await genQrImage('Hello World', {
    size: 500,
    output: { format: 'png', type: 'buffer' }
  }) as Buffer | Uint8Array;

  expect(buffer).toBeDefined();
  expect(buffer instanceof Uint8Array || Buffer.isBuffer(buffer)).toBe(true);
  validatePNGBuffer(buffer);
  
  // Test PNG dataURL
  const dataURL = await genQrImage('Hello World', {
    size: 500,
    output: { format: 'png', type: 'dataURL' }
  }) as string;

  expect(typeof dataURL).toBe('string');
  validatePNGDataURL(dataURL);
}

/**
 * Test PNG scannability with jsQR
 */
export async function testPNGScannability(genQrImage: (input: string, options?: Record<string, unknown>) => Promise<string | Buffer | Uint8Array>, testData: string): Promise<void> {
  const buffer = await genQrImage(testData, {
    size: 1000,
    output: { format: 'png', type: 'buffer' }
  }) as Buffer | Uint8Array;

  // Decode PNG and scan with jsQR
  const png = PNG.sync.read(Buffer.from(buffer));
  const result = jsQR(
    new Uint8ClampedArray(png.data),
    png.width,
    png.height,
    { inversionAttempts: 'attemptBoth' }
  );

  expect(result).not.toBeNull();
  expect(result?.data).toBe(testData);
}

/**
 * Test ASCII generation
 */
export function testASCIIGeneration(genQrText: (input: string, options?: Record<string, unknown>) => string): void {
  const ascii = genQrText('Hello World');

  expect(typeof ascii).toBe('string');
  expect(ascii.length).toBeGreaterThan(0);
  expect(ascii).toMatch(/[█░]/); // Contains ASCII block characters
}
