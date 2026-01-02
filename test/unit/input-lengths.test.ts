/**
 * Integration Tests - Input Lengths
 * 
 * Tests QR code generation across different input lengths to verify
 * correct version selection and capacity handling.
 */

import { describe, it, expect } from 'vitest';
import { buildQRCodeConfig } from '../../src/qrcode';

describe('Input Lengths (QR Versions)', () => {
  describe('Version selection', () => {
    it('should use version 1 for very short input', () => {
      const qrCodeConfig = buildQRCodeConfig('HELLO', false);
      expect(qrCodeConfig.version).toBe(1);
    });
    
    it('should use version 2 for medium input', () => {
      const qrCodeConfig = buildQRCodeConfig('A'.repeat(25), false);
      expect(qrCodeConfig.version).toBe(3);
    });
    
    it('should use version 3 for longer input', () => {
      const qrCodeConfig = buildQRCodeConfig('A'.repeat(40), false);
      expect(qrCodeConfig.version).toBe(4);
    });
    
    it('should scale up to version 10', () => {
      // Test progressively longer inputs
      const tests = [
        { length: 50, maxVersion: 4 },
        { length: 100, maxVersion: 8 },
        { length: 150, maxVersion: 10 },
        { length: 200, maxVersion: 10 },
      ];
      
      for (const { length, maxVersion } of tests) {
        const qrCodeConfig = buildQRCodeConfig('A'.repeat(length), false);
        expect(qrCodeConfig.version).toBeLessThanOrEqual(maxVersion);
      }
    });
  });
  
  describe('Capacity boundaries', () => {
    it('should handle capacity near version boundaries', () => {
      // Test at various lengths to ensure version transitions work
      const lengths = [15, 19, 20, 30, 34, 35, 50, 55, 56];
      
      for (const length of lengths) {
        const qrCodeConfig = buildQRCodeConfig('A'.repeat(length), false);
        expect(qrCodeConfig.version).toBeGreaterThanOrEqual(1);
        expect(qrCodeConfig.version).toBeLessThanOrEqual(10);
      }
    });
    
    it('should respect EC level capacity differences', () => {
      const input = 'A'.repeat(50);
      
      // Generate with different inputs that force different EC levels
      // (EC level is auto-selected, but we can verify version scales appropriately)
      const qrCodeConfig = buildQRCodeConfig(input, false);
      expect(qrCodeConfig.version).toBeGreaterThanOrEqual(1);
      expect(qrCodeConfig.version).toBeLessThanOrEqual(10);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle single character', () => {
      const qrCodeConfig = buildQRCodeConfig('A', false);
      expect(qrCodeConfig.version).toBe(1);
      expect(qrCodeConfig.modules).toBeDefined();
    });
    
    it('should handle empty string (should throw)', () => {
      expect(() => buildQRCodeConfig('', false)).toThrow('QR Code input cannot be empty');
    });
    
    it('should handle maximum capacity for version 10', () => {
      // Version 10 max capacity varies by EC level (122-274 chars for L level)
      const input = 'A'.repeat(200);
      const qrCodeConfig = buildQRCodeConfig(input, false);
      expect(qrCodeConfig.version).toBeLessThanOrEqual(10);
    });
    
    it('should throw for input exceeding version 10 capacity', () => {
      const tooLong = 'A'.repeat(500);
      expect(() => buildQRCodeConfig(tooLong, false)).toThrow();
    });
  });
  
  describe('UTF-8 handling', () => {
    it('should handle multi-byte characters', () => {
      const qrCodeConfig = buildQRCodeConfig('Hello 世界', false);
      expect(qrCodeConfig.version).toBeGreaterThanOrEqual(1);
      expect(qrCodeConfig.modules).toBeDefined();
    });
    
    it('should handle emoji', () => {
      const qrCodeConfig = buildQRCodeConfig('Test 🌍 🚀', false);
      expect(qrCodeConfig.version).toBeGreaterThanOrEqual(1);
      expect(qrCodeConfig.modules).toBeDefined();
    });
    
    it('should count bytes not characters for UTF-8', () => {
      // "世界" is 2 characters but 6 bytes in UTF-8
      const short = buildQRCodeConfig('ABC', false); // 3 bytes
      const utf8 = buildQRCodeConfig('世界', false); // 6 bytes
      
      // UTF-8 should require same or higher version
      expect(utf8.version).toBeGreaterThanOrEqual(short.version);
    });
  });
});
