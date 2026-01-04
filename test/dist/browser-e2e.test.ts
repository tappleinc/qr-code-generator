/**
 * Distribution Tests - Browser Bundle E2E
 * 
 * Tests the built browser bundle (dist/browser.mjs) in a real browser to ensure:
 * - Module imports without errors in browser environment
 * - PNG generation works via Canvas API (not resvg)
 * - Generated QR codes are actually scannable
 * - SVG generation works
 */

import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { join } from 'path';
import { scanQRCode } from '../helpers/qr-scanner';
import { validateSVGString } from '../helpers/test-utils';

// Extend Window interface for browser test bundle
declare global {
  interface Window {
    testBrowserBundle: {
      hasCanvas(): boolean;
      generateSVG(data: string): Promise<string>;
      generatePNGDataURL(data: string, options?: Record<string, unknown>): Promise<string>;
      generatePNGBuffer(data: string, options?: Record<string, unknown>): Promise<number[]>;
    };
  }
}

const DIST_PATH = join(process.cwd(), 'dist/browser.mjs');

test.describe('Browser Bundle (dist/browser.mjs)', () => {
  test.beforeAll(() => {
    if (!existsSync(DIST_PATH)) {
      throw new Error(
        'dist/browser.mjs not found. Run `npm run build` before running these tests.'
      );
    }
  });

  test('should load browser bundle without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/test/dist/fixtures/browser-test.html');
    await page.waitForFunction(() => window.testBrowserBundle !== undefined, { timeout: 5000 })
      .catch(async () => {
        const content = await page.content();
        console.log('Page HTML:', content);
        throw new Error(`testBrowserBundle not defined. Errors: ${errors.join(', ')}`);
      });

    expect(errors).toEqual([]);
    
    const status = await page.textContent('#status');
    expect(status).toBe('Ready');
  });

  test('should have Canvas API available', async ({ page }) => {
    await page.goto('/test/dist/fixtures/browser-test.html');
    await page.waitForFunction(() => window.testBrowserBundle !== undefined);

    const hasCanvas = await page.evaluate(() => {
      return window.testBrowserBundle.hasCanvas();
    });

    expect(hasCanvas).toBe(true);
  });

  test('should generate SVG string', async ({ page }) => {
    await page.goto('/test/dist/fixtures/browser-test.html');
    await page.waitForFunction(() => window.testBrowserBundle !== undefined);

    const svg = await page.evaluate(async () => {
      return await window.testBrowserBundle.generateSVG('Hello Browser');
    });

    expect(typeof svg).toBe('string');
    validateSVGString(svg);
  });

  test('should generate PNG dataURL via Canvas API', async ({ page }) => {
    await page.goto('/test/dist/fixtures/browser-test.html');
    await page.waitForFunction(() => window.testBrowserBundle !== undefined);

    const dataURL = await page.evaluate(async () => {
      return await window.testBrowserBundle.generatePNGDataURL('Hello Browser', {
        size: 500
      });
    });

    expect(typeof dataURL).toBe('string');
    expect(dataURL).toMatch(/^data:image\/png;base64,/);
  });

  test('should generate scannable PNG QR code via Canvas API', async ({ page }) => {
    await page.goto('/test/dist/fixtures/browser-test.html');
    await page.waitForFunction(() => window.testBrowserBundle !== undefined);

    const testData = 'Browser Canvas API Test';

    // Generate PNG in browser (uses Canvas API)
    const pngArray = await page.evaluate(async (data) => {
      return await window.testBrowserBundle.generatePNGBuffer(data, {
        size: 1000
      });
    }, testData);

    // Scan with both decoders
    const buffer = Buffer.from(pngArray);
    const result = scanQRCode(buffer, testData);
    
    expect(result.jsQRSuccess, 'jsQR should scan QR code').toBe(true);
    expect(result.nuintunSuccess, '@nuintun/qrcode should scan QR code').toBe(true);
    expect(result.success, 'Both scanners should succeed').toBe(true);
  });

  test('should generate scannable QR codes with different options', async ({ page }) => {
    await page.goto('/test/dist/fixtures/browser-test.html');
    await page.waitForFunction(() => window.testBrowserBundle !== undefined);

    const testCases = [
      { data: 'Simple text', options: { size: 800 } },
      { data: 'https://example.com', options: { size: 1000 } },
      { data: 'With custom colors', options: { size: 1000, dots: { color: '#333333' } } },
    ];

    for (const testCase of testCases) {
      const pngArray = await page.evaluate(async ({ data, options }) => {
        return await window.testBrowserBundle.generatePNGBuffer(data, options);
      }, testCase);

      const buffer = Buffer.from(pngArray);
      const result = scanQRCode(buffer, testCase.data);
      
      expect(result.jsQRSuccess, `jsQR should scan: ${testCase.data}`).toBe(true);
      expect(result.nuintunSuccess, `@nuintun/qrcode should scan: ${testCase.data}`).toBe(true);
    }
  });
});
