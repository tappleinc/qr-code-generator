/**
 * Validation Tests
 *
 * Tests for input validation of public API options
 */

import { describe, it, expect } from 'vitest';
import {
  genQrImage,
  QRValidationError,
  EyeFrameShape,
  DotShape,
  BorderShape,
} from '../../src/index';

describe('Input Validation', () => {
  describe('ImageOptions validation', () => {
    it('should accept valid options', async () => {
      await expect(
        genQrImage('test', {
          size: 300,
          margin: 24,
          backgroundColor: '#ffffff',
          eyes: { shape: EyeFrameShape.SQUARE, color: '#000000' },
          dots: { scale: 1.0 },
          border: { shape: BorderShape.SQUARE, width: 10 },
          output: { format: 'png', type: 'buffer' },
        })
      ).resolves.not.toThrow();
    });

    it('should reject invalid size (decimal)', async () => {
      await expect(
        genQrImage('test', { size: 300.5 })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid size (negative)', async () => {
      await expect(
        genQrImage('test', { size: -100 })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid margin (decimal)', async () => {
      await expect(
        genQrImage('test', { margin: 24.7 })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid margin (negative)', async () => {
      await expect(
        genQrImage('test', { margin: -10 })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid borderWidth (decimal)', async () => {
      await expect(
        genQrImage('test', { border: { shape: BorderShape.SQUARE, width: 10.3 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid borderWidth (negative)', async () => {
      await expect(
        genQrImage('test', { border: { shape: BorderShape.SQUARE, width: -5 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid hex color format', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'ffffff' }) // Missing #
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid hex color (too short)', async () => {
      await expect(
        genQrImage('test', { backgroundColor: '#fff' })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject dots.scale below 0.75', async () => {
      await expect(
        genQrImage('test', { dots: { scale: 0.5 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject dots.scale above 1.25', async () => {
      await expect(
        genQrImage('test', { dots: { scale: 1.5 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should accept dots.scale at boundaries', async () => {
      await expect(
        genQrImage('test', { dots: { scale: 0.75 } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { dots: { scale: 1.25 } })
      ).resolves.not.toThrow();
    });

    it('should reject logo.scale below 0.1', async () => {
      await expect(
        genQrImage('test', {
          logo: { src: 'data:image/png;base64,test', scale: 0.05 },
        })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject logo.scale above 0.3', async () => {
      await expect(
        genQrImage('test', {
          logo: { src: 'data:image/png;base64,test', scale: 0.5 },
        })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid eye shape', async () => {
      await expect(
        // @ts-expect-error Testing invalid shape
        genQrImage('test', { eyes: { shape: 'invalid' } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid dot shape', async () => {
      await expect(
        // @ts-expect-error Testing invalid shape
        genQrImage('test', { dots: { shape: 'invalid' } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid border shape', async () => {
      await expect(
        // @ts-expect-error Testing invalid shape
        genQrImage('test', { border: { shape: 'invalid' } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid border style', async () => {
      await expect(
        // @ts-expect-error Testing invalid style
        genQrImage('test', { border: { shape: BorderShape.SQUARE, style: 'invalid' } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should report multiple errors at once', async () => {
      try {
        await genQrImage('test', {
          size: 300.5, // Invalid: decimal
          margin: -10, // Invalid: negative
          backgroundColor: 'ffffff', // Invalid: missing #
        });
        expect.fail('Should have thrown QRValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(QRValidationError);
        const qrError = error as QRValidationError;
        expect(qrError.errors).toHaveLength(3);
        expect(qrError.errors.map((e) => e.field)).toContain('size');
        expect(qrError.errors.map((e) => e.field)).toContain('margin');
        expect(qrError.errors.map((e) => e.field)).toContain('backgroundColor');
      }
    });

    it('should accept valid eye shapes', async () => {
      await expect(
        genQrImage('test', { eyes: { shape: EyeFrameShape.SQUARE } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { eyes: { shape: EyeFrameShape.SQUIRCLE } })
      ).resolves.not.toThrow();
    });

    it('should accept valid dot shapes', async () => {
      await expect(
        genQrImage('test', { dots: { shape: DotShape.CLASSIC } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { dots: { shape: DotShape.DOTS } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { dots: { shape: DotShape.SQUARE } })
      ).resolves.not.toThrow();
    });

    it('should accept valid border shapes', async () => {
      await expect(
        genQrImage('test', { border: { shape: BorderShape.NONE } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { border: { shape: BorderShape.SQUARE } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { border: { shape: BorderShape.SQUIRCLE } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { border: { shape: BorderShape.CIRCLE } })
      ).resolves.not.toThrow();
    });


  });
});
