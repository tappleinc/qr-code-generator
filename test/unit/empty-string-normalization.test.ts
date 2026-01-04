/**
 * Empty String Normalization Tests
 *
 * Tests that empty strings are treated as undefined for optional fields,
 * providing convenience for dynamic UIs where clearing a field should revert to default.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage, genQrText, BorderShape } from '../../src/index';

describe('Empty String Normalization', () => {
  const testInput = 'Test';

  describe('ImageOptions - Color fields', () => {
    it('should treat empty backgroundColor as undefined (use default)', async () => {
      const result = await genQrImage(testInput, {
        backgroundColor: '',
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
      // Should use default #ffffff
      expect(result).toContain('fill="#ffffff"');
    });

    it('should treat empty eyes.color as undefined (use default)', async () => {
      const result = await genQrImage(testInput, {
        eyes: { color: '' },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
      // Should render successfully with default color
    });

    it('should treat empty pupils.color as undefined (use default)', async () => {
      const result = await genQrImage(testInput, {
        pupils: { color: '' },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });

    it('should treat empty dots.color as undefined (use default)', async () => {
      const result = await genQrImage(testInput, {
        dots: { color: '' },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });

    it('should treat empty border.color as undefined (use default)', async () => {
      const result = await genQrImage(testInput, {
        border: { color: '', shape: BorderShape.SQUARE },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });
  });

  describe('ImageOptions - Mixed empty strings', () => {
    it('should handle multiple empty string color fields', async () => {
      const result = await genQrImage(testInput, {
        backgroundColor: '',
        eyes: { color: '' },
        pupils: { color: '' },
        dots: { color: '' },
        border: { color: '', shape: BorderShape.SQUARE },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });

    it('should mix empty strings with valid values', async () => {
      const result = await genQrImage(testInput, {
        backgroundColor: '', // Empty = use default
        eyes: { color: '#FF0000' }, // Valid custom color
        dots: { color: '' }, // Empty = use default
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
      // Should contain custom eye color
      expect(result).toContain('#FF0000');
    });
  });

  describe('TextOptions - String fields', () => {
    it('should treat empty darkChar as undefined (use default)', () => {
      const result = genQrText(testInput, {
        darkChar: '',
      });
      expect(result).toBeTruthy();
      // Should use default '██'
      expect(result).toContain('██');
    });

    it('should treat empty lightChar as undefined (use default)', () => {
      const result = genQrText(testInput, {
        lightChar: '',
      });
      expect(result).toBeTruthy();
      // Should use default '  ' (two spaces)
    });

    it('should handle both empty string fields', () => {
      const result = genQrText(testInput, {
        darkChar: '',
        lightChar: '',
      });
      expect(result).toBeTruthy();
      expect(result).toContain('██');
    });
  });

  describe('Logo.src - Should NOT normalize (required field)', () => {
    it('should reject empty logo.src (required when logo is provided)', async () => {
      await expect(
        genQrImage(testInput, {
          logo: { src: '' },
          output: { format: 'svg', type: 'string' },
        })
      ).rejects.toThrow(/logo\.src.*must be a non-empty string/);
    });

    it('should reject logo with empty src even with scale', async () => {
      await expect(
        genQrImage(testInput, {
          logo: { src: '', scale: 0.2 },
          output: { format: 'svg', type: 'string' },
        })
      ).rejects.toThrow(/logo\.src/);
    });
  });

  describe('Backward compatibility', () => {
    it('should still accept valid non-empty string values', async () => {
      const result = await genQrImage(testInput, {
        backgroundColor: '#FF0000',
        eyes: { color: '#00FF00' },
        pupils: { color: '#0000FF' },
        dots: { color: '#FFFF00' },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });

    it('should still accept undefined values', async () => {
      const result = await genQrImage(testInput, {
        backgroundColor: undefined,
        eyes: { color: undefined },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });

    it('should still accept omitted values', async () => {
      const result = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only strings (not normalized, should fail validation)', async () => {
      await expect(
        genQrImage(testInput, {
          backgroundColor: '   ',
          output: { format: 'svg', type: 'string' },
        })
      ).rejects.toThrow();
    });

    it('should normalize nested empty color strings', async () => {
      const result = await genQrImage(testInput, {
        eyes: {
          color: '',
        },
        pupils: {
          color: '',
        },
        output: { format: 'svg', type: 'string' },
      });
      expect(result).toContain('<svg');
    });
  });
});
