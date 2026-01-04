/**
 * Distribution Tests - Node.js CommonJS Bundle
 * 
 * Tests the built Node.js CJS bundle (dist/node.cjs) to ensure:
 * - Module requires without errors
 * - All public exports are present
 * - PNG generation works via resvg
 * - SVG generation works
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { 
  testModuleExports, 
  testSVGGeneration, 
  testPNGGeneration, 
  testPNGScannability, 
  testASCIIGeneration 
} from '../helpers/dist-test-patterns';

const DIST_PATH = join(process.cwd(), 'dist/node.cjs');

describe('Node.js CommonJS Bundle (dist/node.cjs)', () => {
  beforeAll(() => {
    if (!existsSync(DIST_PATH)) {
      throw new Error(
        'dist/node.cjs not found. Run `npm run build` before running these tests.'
      );
    }
  });

  describe('Module loading', () => {
    it('should require module successfully', async () => {
      const module = await import(DIST_PATH);
      expect(module).toBeDefined();
    });

    it('should export all required functions and types', async () => {
      const module = await import(DIST_PATH);
      testModuleExports(module);
    });
  });

  describe('SVG generation', () => {
    it('should generate SVG outputs', async () => {
      const { genQrImage } = await import(DIST_PATH);
      await testSVGGeneration(genQrImage);
    });
  });

  describe('PNG generation (via resvg)', () => {
    it('should generate PNG outputs', async () => {
      const { genQrImage } = await import(DIST_PATH);
      await testPNGGeneration(genQrImage);
    });

    it('should generate scannable PNG QR code', async () => {
      const { genQrImage } = await import(DIST_PATH);
      await testPNGScannability(genQrImage, 'Node CJS Bundle Test');
    });
  });

  describe('ASCII generation', () => {
    it('should generate ASCII text', async () => {
      const { genQrText } = await import(DIST_PATH);
      testASCIIGeneration(genQrText);
    });
  });
});
