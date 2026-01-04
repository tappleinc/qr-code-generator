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

    describe('logo.src validation', () => {
      it('should accept valid data URL', async () => {
        await expect(
          genQrImage('test', {
            logo: { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }
          })
        ).resolves.not.toThrow();
      });

      it('should accept valid SVG string', async () => {
        await expect(
          genQrImage('test', {
            logo: { src: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>' }
          })
        ).resolves.not.toThrow();
      });

      it('should reject invalid logo src (not data URL or SVG)', async () => {
        await expect(
          genQrImage('test', { logo: { src: 'invalid-logo-source' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid base64 in data URL', async () => {
        await expect(
          genQrImage('test', { logo: { src: 'data:image/png;base64,!!!invalid!!!' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject data URL with missing comma separator', async () => {
        await expect(
          genQrImage('test', { logo: { src: 'data:image/png;base64invalid' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject incomplete SVG string', async () => {
        await expect(
          genQrImage('test', { logo: { src: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/>' } })
        ).rejects.toThrow(QRValidationError);
      });
    });
  });

  describe('QRInput validation', () => {
    describe('string input', () => {
      it('should accept non-empty string', async () => {
        await expect(genQrImage('Hello World')).resolves.not.toThrow();
      });

      it('should reject empty string', async () => {
        await expect(genQrImage('')).rejects.toThrow(QRValidationError);
      });
    });

    describe('WiFi input', () => {
      it('should accept valid WiFi data', async () => {
        await expect(
          genQrImage({
            type: 'wifi',
            data: { ssid: 'MyNetwork', password: 'password123' }
          })
        ).resolves.not.toThrow();
      });

      it('should accept WiFi with encryption type', async () => {
        await expect(
          genQrImage({
            type: 'wifi',
            data: { ssid: 'MyNetwork', password: 'password123', encryption: 'WPA2' }
          })
        ).resolves.not.toThrow();
      });

      it('should reject missing ssid', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'wifi', data: { password: 'password123' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject empty ssid', async () => {
        await expect(
          genQrImage({ type: 'wifi', data: { ssid: '', password: 'password123' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject missing password', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'wifi', data: { ssid: 'MyNetwork' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid encryption type', async () => {
        await expect(
          genQrImage({
            type: 'wifi',
            // @ts-expect-error Testing invalid encryption
            data: { ssid: 'MyNetwork', password: 'password123', encryption: 'INVALID' }
          })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid hidden value', async () => {
        await expect(
          genQrImage({
            type: 'wifi',
            // @ts-expect-error Testing invalid hidden value
            data: { ssid: 'MyNetwork', password: 'password123', hidden: 'yes' }
          })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('vCard input', () => {
      it('should accept valid vCard data', async () => {
        await expect(
          genQrImage({
            type: 'vcard',
            data: { name: 'John Doe', email: 'john@example.com', phone: '+1-555-123-4567' }
          })
        ).resolves.not.toThrow();
      });

      it('should reject missing name', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'vcard', data: { email: 'john@example.com' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject empty name', async () => {
        await expect(
          genQrImage({ type: 'vcard', data: { name: '   ' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid email format', async () => {
        await expect(
          genQrImage({ type: 'vcard', data: { name: 'John Doe', email: 'not-an-email' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid phone format', async () => {
        await expect(
          genQrImage({ type: 'vcard', data: { name: 'John Doe', phone: 'abc' } })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid URL', async () => {
        await expect(
          genQrImage({ type: 'vcard', data: { name: 'John Doe', url: 'not a url' } })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('calendar input', () => {
      it('should accept valid calendar data with Date objects', async () => {
        await expect(
          genQrImage({
            type: 'calendar',
            data: {
              title: 'Meeting',
              startDate: new Date('2026-01-15T14:00:00'),
              endDate: new Date('2026-01-15T15:00:00')
            }
          })
        ).resolves.not.toThrow();
      });

      it('should accept valid calendar data with ISO strings', async () => {
        await expect(
          genQrImage({
            type: 'calendar',
            data: {
              title: 'Meeting',
              startDate: '2026-01-15T14:00:00',
              endDate: '2026-01-15T15:00:00'
            }
          })
        ).resolves.not.toThrow();
      });

      it('should reject missing title', async () => {
        await expect(
          genQrImage({
            type: 'calendar',
            // @ts-expect-error Testing missing required field
            data: {
              startDate: new Date('2026-01-15T14:00:00'),
              endDate: new Date('2026-01-15T15:00:00')
            }
          })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject missing startDate', async () => {
        await expect(
          genQrImage({
            type: 'calendar',
            // @ts-expect-error Testing missing required field
            data: {
              title: 'Meeting',
              endDate: new Date('2026-01-15T15:00:00')
            }
          })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid startDate', async () => {
        await expect(
          genQrImage({
            type: 'calendar',
            data: {
              title: 'Meeting', 
              startDate: 'invalid-date',
              endDate: new Date('2026-01-15T15:00:00')
            }
          })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject endDate before startDate', async () => {
        await expect(
          genQrImage({
            type: 'calendar',
            data: {
              title: 'Meeting',
              startDate: new Date('2026-01-15T15:00:00'),
              endDate: new Date('2026-01-15T14:00:00')
            }
          })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('email input', () => {
      it('should accept valid email', async () => {
        await expect(
          genQrImage({ type: 'email', email: 'test@example.com' })
        ).resolves.not.toThrow();
      });

      it('should accept email with subject and body', async () => {
        await expect(
          genQrImage({
            type: 'email',
            email: 'test@example.com',
            subject: 'Hello',
            body: 'Test message'
          })
        ).resolves.not.toThrow();
      });

      it('should reject missing email', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'email', subject: 'Hello' })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid email format', async () => {
        await expect(
          genQrImage({ type: 'email', email: 'not-an-email' })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('sms input', () => {
      it('should accept valid SMS', async () => {
        await expect(
          genQrImage({ type: 'sms', phone: '+1-555-123-4567', message: 'Hello' })
        ).resolves.not.toThrow();
      });

      it('should reject missing phone', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'sms', message: 'Hello' })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid phone format', async () => {
        await expect(
          genQrImage({ type: 'sms', phone: 'abc', message: 'Hello' })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('phone input', () => {
      it('should accept valid phone', async () => {
        await expect(
          genQrImage({ type: 'phone', phone: '+1-555-123-4567' })
        ).resolves.not.toThrow();
      });

      it('should reject missing phone', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'phone' })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid phone format', async () => {
        await expect(
          genQrImage({ type: 'phone', phone: 'abc' })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('url input', () => {
      it('should accept valid URL', async () => {
        await expect(
          genQrImage({ type: 'url', url: 'https://example.com' })
        ).resolves.not.toThrow();
      });

      it('should reject missing URL', async () => {
        await expect(
          // @ts-expect-error Testing missing required field
          genQrImage({ type: 'url' })
        ).rejects.toThrow(QRValidationError);
      });

      it('should reject invalid URL', async () => {
        await expect(
          genQrImage({ type: 'url', url: 'not a url' })
        ).rejects.toThrow(QRValidationError);
      });
    });

    describe('invalid input type', () => {
      it('should reject unknown input type', async () => {
        await expect(
          // @ts-expect-error Testing invalid type
          genQrImage({ type: 'unknown', data: {} })
        ).rejects.toThrow(QRValidationError);
      });
    });
  });
});
