/**
 * Visual Tests - QR Code Scannability
 * 
 * Tests actual QR code scanning using jsQR to verify generated codes
 * are readable by standard QR decoders. This is the most critical test
 * as it validates end-to-end functionality.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../src/index';
import { DotShape, ImageOptions } from '../../src/types';
import { scanQRCode } from '../helpers/qr-scanner';
import { logWarning } from '../helpers/test-utils';

/**
 * Helper: Generate QR and scan it with both jsQR and @nuintun/qrcode
 * Returns detailed scan results with automatic warning logging
 */
async function generateAndScan(input: string, options?: ImageOptions) {
  // Generate PNG buffer
  const buffer = await genQrImage(input, {
    size: 1000,
    output: { format: 'png', type: 'buffer' },
    ...options,
  }) as Uint8Array | Buffer;
  
  // Scan with both decoders
  const scanResult = scanQRCode(buffer, input);
  
  // Auto-log warnings if only one scanner succeeds
  if (scanResult.jsQRSuccess && !scanResult.nuintunSuccess) {
    logWarning('@nuintun/qrcode failed to scan, but jsQR succeeded');
  } else if (!scanResult.jsQRSuccess && scanResult.nuintunSuccess) {
    logWarning('jsQR failed to scan, but @nuintun/qrcode succeeded');
  }
  
  // Return result with success=true if at least one scanner worked
  return {
    success: scanResult.jsQRSuccess || scanResult.nuintunSuccess,
    jsQRDecoded: scanResult.jsQRDecoded,
    nuintunDecoded: scanResult.nuintunDecoded,
    bothScannersSuccess: scanResult.success,
  };
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
        const result = await generateAndScan(input);
        
        expect(result.success).toBe(true);
        expect(result.jsQRDecoded).toBe(input);
      });
    });
    
    it('should scan simple text', async () => {
      const result = await generateAndScan('Hello World');
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('Hello World');
    });
    
    it('should scan single character', async () => {
      const result = await generateAndScan('A');
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('A');
    });
    
    it('should scan numeric data', async () => {
      const result = await generateAndScan('12345678901234567890');
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('12345678901234567890');
    });
  });
  
  describe('Encoding modes', () => {
    it('should scan numeric mode', async () => {
      const result = await generateAndScan('123456789');
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('123456789');
    });
    
    it('should scan alphanumeric mode', async () => {
      const result = await generateAndScan('HELLO WORLD 123');
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('HELLO WORLD 123');
    });
    
    it('should scan byte mode', async () => {
      const result = await generateAndScan('Hello, World!');
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('Hello, World!');
    });
    
    it('should scan UTF-8 content', async () => {
      const input = 'Hello 世界';
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
  });
  
  describe('Different input lengths', () => {
    it('should scan short input (version 1)', async () => {
      const result = await generateAndScan('TEST');
      
      expect(result.success).toBe(true);
    });
    
    it('should scan medium input (version 2-5)', async () => {
      const input = 'A'.repeat(50);
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
    
    it('should scan long input (version 6-10)', async () => {
      const input = 'A'.repeat(150);
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
  });
  
  describe('Shape variations', () => {
    it('should scan with square eye frames (cornerRadius: 0)', async () => {
      const result = await generateAndScan('Shape test', { 
        eyes: { cornerRadius: 0 } 
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should scan with circular eye frames (cornerRadius: 0.5)', async () => {
      const result = await generateAndScan('Shape test', { 
        eyes: { cornerRadius: 0.5 } 
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should scan with circular dots', async () => {
      const result = await generateAndScan('Dot test', { 
        dots: { shape: DotShape.DOTS } 
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should scan with square dots', async () => {
      const result = await generateAndScan('Dot test', { 
        dots: { shape: DotShape.SQUARE } 
      });
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Shape combinations (sample)', () => {
    // Test representative combinations, not exhaustive
    it('should scan rounded eyes + circular dots', async () => {
      const result = await generateAndScan('Combo test', { 
        eyes: { cornerRadius: 0.25 },
        dots: { shape: DotShape.DOTS }
      });
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Data types', () => {
    it('should scan URLs', async () => {
      const url = 'https://example.com/path?query=value';
      const result = await generateAndScan(url);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(url);
    });
    
    it('should scan phone numbers', async () => {
      const phone = 'tel:+1-555-123-4567';
      const result = await generateAndScan(phone);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(phone);
    });
    
    it('should scan email addresses', async () => {
      const email = 'mailto:test@example.com?subject=Hello';
      const result = await generateAndScan(email);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(email);
    });
    
    it('should scan WiFi credentials', async () => {
      const wifi = 'WIFI:T:WPA;S:MyNetwork;P:password;;';
      const result = await generateAndScan(wifi);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(wifi);
    });
  });
  
  describe('Special characters', () => {
    it('should scan with newlines', async () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
    
    it('should scan with special symbols', async () => {
      const input = 'Test & <Special> "Chars"';
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
    
    it('should scan with emoji', async () => {
      const input = 'Hello 🌍 🚀 ☕';
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
  });
  
  describe('Edge cases', () => {
    it('should scan maximum capacity content', async () => {
      // Test near-max capacity for version 10
      const input = 'A'.repeat(200);
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
    
    it('should handle content with all encoding modes', async () => {
      // Mix numeric, alphanumeric, and byte characters
      const input = '123 ABC xyz @#$';
      const result = await generateAndScan(input);
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe(input);
    });
  });
  
  describe('Consistency', () => {
    it('should produce scannable output consistently', async () => {
      const input = 'Consistency test';
      
      const result1 = await generateAndScan(input);
      const result2 = await generateAndScan(input);
      const result3 = await generateAndScan(input);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      
      expect(result1.jsQRDecoded).toBe(input);
      expect(result2.jsQRDecoded).toBe(input);
      expect(result3.jsQRDecoded).toBe(input);
    });
  });

  describe('Border scannability', () => {
    it('should scan QR with circle border', async () => {
      const result = await generateAndScan('CircleBorder', {
        border: { cornerRadius: 0.5, width: 30 },
        margin: 10
      });
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('CircleBorder');
    });
    
    it('should scan QR with border and minimal margin', async () => {
      const result = await generateAndScan('MinimalMargin', {
        border: { cornerRadius: 0.5, width: 20 },
        margin: 5
      });
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('MinimalMargin');
    });
    
    it('should scan QR with squircle border', async () => {
      const result = await generateAndScan('SquircleBorder', {
        border: { cornerRadius: 0.19, width: 25 },
        margin: 8
      });
      
      expect(result.success).toBe(true);
      expect(result.jsQRDecoded).toBe('SquircleBorder');
    });
  });
  });
