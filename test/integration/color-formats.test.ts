/**
 * Color Format Integration Tests
 *
 * Verifies that QR codes render correctly with various CSS color formats
 * and remain scannable.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage, genQrText } from '../../src/index';
import { scanQRCode } from '../helpers/qr-scanner';

describe('Color Formats', () => {
  const testData = 'Color Format Test';

  describe('Hex Colors', () => {
    it('should render with 3-digit hex colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: '#fff',
        dots: { color: '#000' },
        eyes: { color: '#f00' },
        pupils: { color: '#00f' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="#fff"');
      expect(result).toContain('fill="#000"');
      expect(result).toContain('fill="#f00"');
      expect(result).toContain('fill="#00f"');
    });

    it('should render with 6-digit hex colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: '#ffffff',
        dots: { color: '#000000' },
        eyes: { color: '#ff0000' },
        pupils: { color: '#0000ff' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="#ffffff"');
      expect(result).toContain('fill="#000000"');
      expect(result).toContain('fill="#ff0000"');
      expect(result).toContain('fill="#0000ff"');
    });

    it('should produce scannable QR codes with hex colors', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: '#fff',
        dots: { color: '#000' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });
  });

  describe('RGB/RGBA Colors', () => {
    it('should render with rgb colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: 'rgb(255, 255, 255)',
        dots: { color: 'rgb(0, 0, 0)' },
        eyes: { color: 'rgb(255, 0, 0)' },
        pupils: { color: 'rgb(0, 0, 255)' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="rgb(255, 255, 255)"');
      expect(result).toContain('fill="rgb(0, 0, 0)"');
      expect(result).toContain('fill="rgb(255, 0, 0)"');
      expect(result).toContain('fill="rgb(0, 0, 255)"');
    });

    it('should render with rgba colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        dots: { color: 'rgba(0, 0, 0, 1)' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="rgba(255, 255, 255, 0.95)"');
      expect(result).toContain('fill="rgba(0, 0, 0, 1)"');
    });

    it('should produce scannable QR codes with rgb colors', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: 'rgb(255, 255, 255)',
        dots: { color: 'rgb(0, 0, 0)' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });

    it('should produce scannable QR codes with high-opacity rgba colors', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        dots: { color: 'rgba(0, 0, 0, 0.95)' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });
  });

  describe('HSL/HSLA Colors', () => {
    it('should render with hsl colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: 'hsl(0, 0%, 100%)',
        dots: { color: 'hsl(0, 0%, 0%)' },
        eyes: { color: 'hsl(0, 100%, 50%)' },
        pupils: { color: 'hsl(240, 100%, 50%)' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="hsl(0, 0%, 100%)"');
      expect(result).toContain('fill="hsl(0, 0%, 0%)"');
      expect(result).toContain('fill="hsl(0, 100%, 50%)"');
      expect(result).toContain('fill="hsl(240, 100%, 50%)"');
    });

    it('should render with hsla colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: 'hsla(0, 0%, 100%, 0.9)',
        dots: { color: 'hsla(0, 0%, 0%, 1)' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="hsla(0, 0%, 100%, 0.9)"');
      expect(result).toContain('fill="hsla(0, 0%, 0%, 1)"');
    });

    it('should produce scannable QR codes with hsl colors', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: 'hsl(0, 0%, 100%)',
        dots: { color: 'hsl(0, 0%, 0%)' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });
  });

  describe('Named Colors', () => {
    it('should render with named colors', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: 'white',
        dots: { color: 'black' },
        eyes: { color: 'red' },
        pupils: { color: 'blue' },
        border: { cornerRadius: 0, width: 10, color: 'green' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="white"');
      expect(result).toContain('fill="black"');
      expect(result).toContain('fill="red"');
      expect(result).toContain('fill="blue"');
      expect(result).toContain('stroke="green"');
    });

    it('should produce scannable QR codes with named colors', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: 'white',
        dots: { color: 'black' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });

    it('should support grayscale named colors', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: 'whitesmoke',
        dots: { color: 'dimgray' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });
  });

  describe('Mixed Color Formats', () => {
    it('should support mixing different color formats', async () => {
      const result = await genQrImage(testData, {
        backgroundColor: '#ffffff',
        dots: { color: 'rgb(0, 0, 0)' },
        eyes: { color: 'hsl(0, 100%, 50%)' },
        pupils: { color: 'blue' },
        border: { cornerRadius: 0, width: 10, color: 'rgba(0, 128, 0, 0.8)' },
        output: { format: 'svg', type: 'string' },
      });

      expect(result).toContain('fill="#ffffff"');
      expect(result).toContain('fill="rgb(0, 0, 0)"');
      expect(result).toContain('fill="hsl(0, 100%, 50%)"');
      expect(result).toContain('fill="blue"');
      expect(result).toContain('stroke="rgba(0, 128, 0, 0.8)"');
    });

    it('should produce scannable QR codes with mixed formats', async () => {
      const png = await genQrImage(testData, {
        backgroundColor: 'white',
        dots: { color: '#000000' },
        eyes: { color: 'rgb(50, 50, 50)' },
        pupils: { color: 'hsl(0, 0%, 20%)' },
        output: { format: 'png', type: 'buffer' },
      });

      const result = scanQRCode(png as Buffer, testData);
      expect(result.success).toBe(true);
    });
  });

  describe('ASCII Rendering (No Color Impact)', () => {
    it('should render ASCII regardless of color format', () => {
      // ASCII rendering ignores colors - just verifying it doesn't break
      const ascii = genQrText(testData);
      expect(ascii).toBeTruthy();
      expect(typeof ascii).toBe('string');
    });
  });
});
