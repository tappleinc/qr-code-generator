/**
 * Integration Tests - Encoding Modes
 * 
 * Tests automatic encoding mode detection and switching between
 * numeric, alphanumeric, and byte modes.
 */

import { describe, it, expect } from 'vitest';
import { buildQRCodeConfig } from '../../src/qrcode';
import { EncodingMode } from '../../src/internal/core/types';
import { detectEncodingMode } from '../../src/internal/encoding/data-encoder';

describe('Encoding Modes', () => {
  describe('Numeric mode', () => {
    it('should encode pure digits in numeric mode', () => {
      const inputs = ['12345', '0987654321', '1', '999999999'];
      
      for (const input of inputs) {
        const mode = detectEncodingMode(input);
        const qrCodeConfig = buildQRCodeConfig(input, false);
        
        expect(mode).toBe(EncodingMode.NUMERIC);
        expect(qrCodeConfig.modules).toBeDefined();
      }
    });
    
    it('should be most efficient for digits', () => {
      const numeric = buildQRCodeConfig('12345678901234567890', false);
      const alpha = buildQRCodeConfig('ABCDEFGHIJKLMNOPQRST', false);
      
      // Numeric should be more compact (lower version for same length)
      expect(numeric.version).toBeLessThanOrEqual(alpha.version);
    });
  });
  
  describe('Alphanumeric mode', () => {
    it('should encode valid alphanumeric in alphanumeric mode', () => {
      const inputs = [
        'HELLO',
        'ABC123',
        'TEST DATA',
        'VERSION 1.0',
        'PRICE: $99',
        'ROUTE 66',
      ];
      
      for (const input of inputs) {
        const mode = detectEncodingMode(input);
        const qrCodeConfig = buildQRCodeConfig(input, false);
        
        expect(mode).toBe(EncodingMode.ALPHANUMERIC);
        expect(qrCodeConfig.modules).toBeDefined();
      }
    });
    
    it('should support all alphanumeric special characters', () => {
      const specialChars = ' $%*+-./:';
      const qrCodeConfig = buildQRCodeConfig(`ABC${specialChars}123`, false);
      
      expect(qrCodeConfig.modules).toBeDefined();
    });
  });
  
  describe('Byte mode', () => {
    it('should encode lowercase letters in byte mode', () => {
      const mode = detectEncodingMode('hello');
      const qrCodeConfig = buildQRCodeConfig('hello world', false);
      
      expect(mode).toBe(EncodingMode.BYTE);
      expect(qrCodeConfig.modules).toBeDefined();
    });
    
    it('should encode special characters in byte mode', () => {
      const inputs = [
        'Hello, World!',
        'test@example.com',
        'Price: $19.99',
        'Line 1\nLine 2',
      ];
      
      for (const input of inputs) {
        const qrCodeConfig = buildQRCodeConfig(input, false);
        expect(qrCodeConfig.modules).toBeDefined();
      }
    });
    
    it('should encode UTF-8 characters in byte mode', () => {
      const inputs = [
        'Hello 世界',
        'Café ☕',
        '🚀 Rocket',
        'Привет мир',
      ];
      
      for (const input of inputs) {
        const mode = detectEncodingMode(input);
        const qrCodeConfig = buildQRCodeConfig(input, false);
        
        expect(mode).toBe(EncodingMode.BYTE);
        expect(qrCodeConfig.modules).toBeDefined();
      }
    });
  });
  
  describe('Mode efficiency comparison', () => {
    it('should use most efficient mode automatically', () => {
      // Same content length, different modes
      const tests = [
        { input: '12345678901234567890', mode: EncodingMode.NUMERIC },
        { input: 'ABCDEFGHIJKLMNOPQRST', mode: EncodingMode.ALPHANUMERIC },
        { input: 'abcdefghijklmnopqrst', mode: EncodingMode.BYTE },
      ];
      
      for (const { input, mode } of tests) {
        expect(detectEncodingMode(input)).toBe(mode);
      }
    });
    
    it('should generate valid QR codes in all modes', () => {
      const numeric = buildQRCodeConfig('12345', false);
      const alphanumeric = buildQRCodeConfig('HELLO', false);
      const byte = buildQRCodeConfig('hello', false);
      
      expect(numeric.modules).toBeDefined();
      expect(alphanumeric.modules).toBeDefined();
      expect(byte.modules).toBeDefined();
    });
  });
  
  describe('Mode detection edge cases', () => {
    it('should fallback to byte mode for mixed case', () => {
      const mode = detectEncodingMode('Hello');
      expect(mode).toBe(EncodingMode.BYTE);
    });
    
    it('should use alphanumeric for uppercase with allowed chars', () => {
      const mode = detectEncodingMode('HELLO WORLD');
      expect(mode).toBe(EncodingMode.ALPHANUMERIC);
    });
    
    it('should use byte mode for punctuation not in alphanumeric set', () => {
      const mode = detectEncodingMode('HELLO, WORLD!');
      expect(mode).toBe(EncodingMode.BYTE);
    });
  });
});
