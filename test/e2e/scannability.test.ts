/**
 * Visual Tests - QR Code Scannability
 * 
 * Tests actual QR code scanning using jsQR to verify generated codes
 * are readable by standard QR decoders. This is the most critical test
 * as it validates end-to-end functionality.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../src/index';
import { EyeFrameShape, DotShape, ImageOptions } from '../../src/types';
import { scanQRCode as scanQRHelper } from '../helpers/qr-scanner';

/**
 * Helper: Generate QR and scan it with both jsQR and @nuintun/qrcode
 */
async function scanQRCode(input: string, options?: ImageOptions): Promise<{ 
  success: boolean; 
  decoded: string | null; 
  version: number;
  error?: string;
  warning?: string;
}> {
  try {
    // Generate PNG buffer using new API
    const buffer = await genQrImage(input, {
      size: 1000,
      output: { format: 'png', type: 'buffer' },
      ...options,
    }) as Uint8Array | Buffer;
    
    // Use shared scanner helper
    const scanResult = scanQRHelper(buffer, input);
    
    // If at least one scanner succeeds, mark as success with warning if needed
    const overallSuccess = scanResult.jsQRSuccess || scanResult.nuintunSuccess;
    let warning: string | undefined;
    
    if (overallSuccess && !scanResult.jsQRSuccess) {
      warning = 'jsQR failed to scan, but @nuintun/qrcode succeeded';
    } else if (overallSuccess && !scanResult.nuintunSuccess) {
      warning = '@nuintun/qrcode failed to scan, but jsQR succeeded';
    }
    
    // Get version from QR config (we need to parse from the matrix size)
    // Version = (matrixSize - 21) / 4 + 1
    const PNG = await import('pngjs').then(m => m.PNG);
    const png = PNG.sync.read(Buffer.from(buffer));
    const matrixSize = Math.sqrt(png.width); // Approximate - not exact but good for test
    const version = Math.round((matrixSize - 21) / 4 + 1);
    
    return {
      success: overallSuccess,
      decoded: scanResult.jsQRSuccess ? scanResult.jsQRDecoded : scanResult.nuintunDecoded,
      version,
      warning
    };
  } catch (error) {
    return {
      success: false,
      decoded: null,
      version: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

describe('QR Code Scannability', () => {
  describe('Basic scanning', () => {
    // Test cases for each QR version (1-10)
    // Input lengths calculated from TOTAL_DATA_CODEWORDS capacity tables
    // Using alphanumeric encoding with EC auto-selection (tries H→Q→M→L)
    // Ranges: v1(1-10), v2(11-20), v3(21-35), v4(36-50), v5(51-64),
    //         v6(65-84), v7(85-93), v8(94-122), v9(123-143), v10(144-174 at EC H)
    const versionTestCases = [
      { version: 1, length: 5, description: 'version 1 (1-10 chars)' },
      { version: 2, length: 15, description: 'version 2 (11-20 chars)' },
      { version: 3, length: 28, description: 'version 3 (21-35 chars)' },
      { version: 4, length: 43, description: 'version 4 (36-50 chars)' },
      { version: 5, length: 57, description: 'version 5 (51-64 chars)' },
      { version: 6, length: 74, description: 'version 6 (65-84 chars)' },
      { version: 7, length: 89, description: 'version 7 (85-93 chars)' },
      { version: 8, length: 108, description: 'version 8 (94-122 chars)' },
      { version: 9, length: 133, description: 'version 9 (123-143 chars)' },
      { version: 10, length: 159, description: 'version 10 (144-174 chars)' },
    ];
    
    versionTestCases.forEach(({ length, description }) => {
      it(`should scan ${description} with ${length} characters`, async () => {
        // Use alphanumeric characters for predictable encoding
        const input = 'A'.repeat(length);
        const result = await scanQRCode(input);
        
        if (result.warning) {
          console.warn(`⚠️  ${result.warning}`);
        }
        
        expect(result.success).toBe(true);
        expect(result.decoded).toBe(input);
      });
    });
    
    it('should scan simple text', async () => {
      const result = await scanQRCode('Hello World');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('Hello World');
    });
    
    it('should scan single character', async () => {
      const result = await scanQRCode('A');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('A');
    });
    
    it('should scan numeric data', async () => {
      const result = await scanQRCode('12345678901234567890');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('12345678901234567890');
    });
  });
  
  describe('Encoding modes', () => {
    it('should scan numeric mode', async () => {
      const result = await scanQRCode('123456789');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('123456789');
    });
    
    it('should scan alphanumeric mode', async () => {
      const result = await scanQRCode('HELLO WORLD 123');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('HELLO WORLD 123');
    });
    
    it('should scan byte mode', async () => {
      const result = await scanQRCode('Hello, World!');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('Hello, World!');
    });
    
    it('should scan UTF-8 content', async () => {
      const input = 'Hello 世界';
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
  });
  
  describe('Different input lengths', () => {
    it('should scan short input (version 1)', async () => {
      const result = await scanQRCode('TEST');
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
    });
    
    it('should scan medium input (version 2-5)', async () => {
      const input = 'A'.repeat(50);
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
    
    it('should scan long input (version 6-10)', async () => {
      const input = 'A'.repeat(150);
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
  });
  
  describe('Shape variations', () => {
    it('should scan with square eye frames', async () => {
      const result = await scanQRCode('Shape test', { 
        eyes: { shape: EyeFrameShape.SQUARE } 
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
    });
    
    it('should scan with squircle eye frames', async () => {
      const result = await scanQRCode('Shape test', { 
        eyes: { shape: EyeFrameShape.SQUIRCLE } 
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
    });
    
    it('should scan with circular dots', async () => {
      const result = await scanQRCode('Dot test', { 
        dots: { shape: DotShape.DOTS } 
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
    });
    
    it('should scan with square dots', async () => {
      const result = await scanQRCode('Dot test', { 
        dots: { shape: DotShape.SQUARE } 
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Shape combinations (sample)', () => {
    // Test representative combinations, not exhaustive
    it('should scan squircle eyes + circular dots', async () => {
      const result = await scanQRCode('Combo test', { 
        eyes: { shape: EyeFrameShape.SQUIRCLE },
        dots: { shape: DotShape.DOTS }
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Data types', () => {
    it('should scan URLs', async () => {
      const url = 'https://example.com/path?query=value';
      const result = await scanQRCode(url);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(url);
    });
    
    it('should scan phone numbers', async () => {
      const phone = 'tel:+1-555-123-4567';
      const result = await scanQRCode(phone);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(phone);
    });
    
    it('should scan email addresses', async () => {
      const email = 'mailto:test@example.com?subject=Hello';
      const result = await scanQRCode(email);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(email);
    });
    
    it('should scan WiFi credentials', async () => {
      const wifi = 'WIFI:T:WPA;S:MyNetwork;P:password;;';
      const result = await scanQRCode(wifi);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(wifi);
    });
  });
  
  describe('Special characters', () => {
    it('should scan with newlines', async () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
    
    it('should scan with special symbols', async () => {
      const input = 'Test & <Special> "Chars"';
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
    
    it('should scan with emoji', async () => {
      const input = 'Hello 🌍 🚀 ☕';
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
  });
  
  describe('Edge cases', () => {
    it('should scan maximum capacity content', async () => {
      // Test near-max capacity for version 10
      const input = 'A'.repeat(200);
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
    
    it('should handle content with all encoding modes', async () => {
      // Mix numeric, alphanumeric, and byte characters
      const input = '123 ABC xyz @#$';
      const result = await scanQRCode(input);
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(input);
    });
  });
  
  describe('Consistency', () => {
    it('should produce scannable output consistently', async () => {
      const input = 'Consistency test';
      
      const result1 = await scanQRCode(input);
      const result2 = await scanQRCode(input);
      const result3 = await scanQRCode(input);
      
      if (result1.warning) {
        console.warn(`⚠️  ${result1.warning}`);
      }
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      
      expect(result1.decoded).toBe(input);
      expect(result2.decoded).toBe(input);
      expect(result3.decoded).toBe(input);
    });
  });

  describe('Border scannability', () => {
    it('should scan QR with circle border', async () => {
      const result = await scanQRCode('CircleBorder', {
        border: { shape: 'circle' as any, width: 30 },
        margin: 10
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('CircleBorder');
    });
    
    it('should scan QR with border and minimal margin', async () => {
      const result = await scanQRCode('MinimalMargin', {
        border: { shape: 'circle' as any, width: 20 },
        margin: 5
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('MinimalMargin');
    });
    
    it('should scan QR with squircle border', async () => {
      const result = await scanQRCode('SquircleBorder', {
        border: { shape: 'squircle' as any, width: 25 },
        margin: 8
      });
      
      if (result.warning) {
        console.warn(`⚠️  ${result.warning}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('SquircleBorder');
    });
  });
  });
