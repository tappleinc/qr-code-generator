/**
 * Validation Tests
 *
 * Tests for input validation of public API options
 */

import { describe, it, expect } from 'vitest';
import {
  genQrImage,
  QRValidationError,
  DotShape,
} from '../../src/index';

describe('Input Validation', () => {
  describe('ImageOptions validation', () => {
    it('should accept valid options', async () => {
      await expect(
        genQrImage('test', {
          size: 300,
          margin: 24,
          backgroundColor: '#ffffff',
          eyes: { cornerRadius: 0, color: '#000000' },
          dots: { scale: 1.0 },
          border: { cornerRadius: 0, width: 10 },
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
        genQrImage('test', { border: { cornerRadius: 0, width: 10.3 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid borderWidth (negative)', async () => {
      await expect(
        genQrImage('test', { border: { cornerRadius: 0, width: -5 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid hex color format', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'ffffff' }) // Missing #
      ).rejects.toThrow(QRValidationError);
    });

    it('should accept 3-digit hex colors', async () => {
      await expect(
        genQrImage('test', { backgroundColor: '#fff' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: '#F0A' })
      ).resolves.not.toThrow();
    });

    it('should accept 6-digit hex colors', async () => {
      await expect(
        genQrImage('test', { backgroundColor: '#ffffff' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: '#FF00AA' })
      ).resolves.not.toThrow();
    });

    it('should accept rgb colors', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'rgb(255, 255, 255)' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { dots: { color: 'rgb(0, 0, 0)' } })
      ).resolves.not.toThrow();
    });

    it('should accept rgba colors with valid alpha', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'rgba(255, 255, 255, 0.9)' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: 'rgba(255, 255, 255, 1)' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: 'rgba(255, 255, 255, 0)' })
      ).resolves.not.toThrow();
    });

    it('should reject rgb colors with out of range values', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'rgb(256, 0, 0)' })
      ).rejects.toThrow(QRValidationError);
      await expect(
        genQrImage('test', { backgroundColor: 'rgb(-1, 0, 0)' })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject rgba colors with invalid alpha', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'rgba(255, 255, 255, 1.5)' })
      ).rejects.toThrow(QRValidationError);
      await expect(
        genQrImage('test', { backgroundColor: 'rgba(255, 255, 255, -0.1)' })
      ).rejects.toThrow(QRValidationError);
    });

    it('should accept hsl colors', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'hsl(0, 0%, 100%)' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { eyes: { color: 'hsl(240, 100%, 50%)' } })
      ).resolves.not.toThrow();
    });

    it('should accept hsla colors with valid alpha', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'hsla(0, 0%, 100%, 0.8)' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: 'hsla(120, 50%, 50%, 1)' })
      ).resolves.not.toThrow();
    });

    it('should reject hsl colors with out of range values', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'hsl(361, 50%, 50%)' })
      ).rejects.toThrow(QRValidationError);
      await expect(
        genQrImage('test', { backgroundColor: 'hsl(180, 101%, 50%)' })
      ).rejects.toThrow(QRValidationError);
      await expect(
        genQrImage('test', { backgroundColor: 'hsl(180, 50%, 101%)' })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject hsla colors with invalid alpha', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'hsla(0, 0%, 100%, 2)' })
      ).rejects.toThrow(QRValidationError);
    });

    it('should accept named colors', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'white' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { dots: { color: 'black' } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { eyes: { color: 'red' } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { pupils: { color: 'blue' } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { border: { cornerRadius: 0, color: 'green' } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: 'transparent' })
      ).resolves.not.toThrow();
    });

    it('should reject invalid named colors', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'notacolor' })
      ).rejects.toThrow(QRValidationError);
    });

    it('should accept colors with various spacing', async () => {
      await expect(
        genQrImage('test', { backgroundColor: 'rgb(255,255,255)' })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { backgroundColor: 'rgb( 255 , 255 , 255 )' })
      ).resolves.not.toThrow();
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

    it('should reject invalid eye cornerRadius (out of range)', async () => {
      await expect(
        genQrImage('test', { eyes: { cornerRadius: -0.1 } })
      ).rejects.toThrow(QRValidationError);
      await expect(
        genQrImage('test', { eyes: { cornerRadius: 0.6 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid dot shape', async () => {
      await expect(
        // @ts-expect-error Testing invalid shape
        genQrImage('test', { dots: { shape: 'invalid' } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid border cornerRadius', async () => {
      await expect(
        // @ts-expect-error Testing invalid cornerRadius
        genQrImage('test', { border: { cornerRadius: -0.1 } })
      ).rejects.toThrow(QRValidationError);
      await expect(
        // @ts-expect-error Testing invalid cornerRadius
        genQrImage('test', { border: { cornerRadius: 0.6 } })
      ).rejects.toThrow(QRValidationError);
    });

    it('should reject invalid border style', async () => {
      await expect(
        // @ts-expect-error Testing invalid style
        genQrImage('test', { border: { cornerRadius: 0, style: 'invalid' } })
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

    it('should accept valid eye cornerRadius values', async () => {
      await expect(
        genQrImage('test', { eyes: { cornerRadius: 0 } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { eyes: { cornerRadius: 0.25 } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { eyes: { cornerRadius: 0.5 } })
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

    it('should accept valid border cornerRadius values', async () => {
      await expect(
        genQrImage('test', { border: { cornerRadius: 0 } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { border: { cornerRadius: 0.19 } })
      ).resolves.not.toThrow();
      await expect(
        genQrImage('test', { border: { cornerRadius: 0.5 } })
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
