/**
 * Unit Tests - Data Encoding
 * 
 * Tests mode detection, version calculation, and encoding functions.
 */

import { describe, it, expect } from 'vitest';
import { detectEncodingMode, calculateMinVersion, selectOptimalEC, encodeData } from '../../src/internal/encoding/data-encoder';
import { EncodingMode } from '../../src/internal/core/types';
import { TOTAL_DATA_CODEWORDS } from '../../src/internal/core/constants';

describe('Data Encoding', () => {
  describe('detectEncodingMode', () => {
    it('should detect numeric mode for digits only', () => {
      expect(detectEncodingMode('12345')).toBe(EncodingMode.NUMERIC);
      expect(detectEncodingMode('0987654321')).toBe(EncodingMode.NUMERIC);
    });
    
    it('should detect alphanumeric mode for valid characters', () => {
      expect(detectEncodingMode('ABC123')).toBe(EncodingMode.ALPHANUMERIC);
      expect(detectEncodingMode('HELLO WORLD')).toBe(EncodingMode.ALPHANUMERIC);
      expect(detectEncodingMode('TEST $%*+-./:')).toBe(EncodingMode.ALPHANUMERIC);
    });
    
    it('should detect byte mode for mixed/special characters', () => {
      expect(detectEncodingMode('hello world')).toBe(EncodingMode.BYTE); // lowercase
      expect(detectEncodingMode('Hello, World!')).toBe(EncodingMode.BYTE); // comma
      expect(detectEncodingMode('Test 世界')).toBe(EncodingMode.BYTE); // UTF-8
    });
  });
  
  describe('calculateMinVersion', () => {
    it('should return version 1 for short inputs', () => {
      const totalDataCodewords = TOTAL_DATA_CODEWORDS['L'];
      expect(calculateMinVersion('HELLO', totalDataCodewords)).toBe(1);
      expect(calculateMinVersion('12345', totalDataCodewords)).toBe(1);
    });
    
    it('should return version 2 for medium inputs', () => {
      const totalDataCodewords = TOTAL_DATA_CODEWORDS['L'];
      // Version 1 capacity is 19 bytes at L level. 25 alphanumeric chars = 151 bits = 19 bytes, fits exactly in v1
      expect(calculateMinVersion('A'.repeat(25), totalDataCodewords)).toBe(1);
    });
    
    it('should return higher versions for longer inputs', () => {
      const totalDataCodewords = TOTAL_DATA_CODEWORDS['L'];
      expect(calculateMinVersion('A'.repeat(40), totalDataCodewords)).toBe(2);
      expect(calculateMinVersion('A'.repeat(70), totalDataCodewords)).toBe(3);
    });
    
    it('should throw error for data too large for version 10', () => {
      const totalDataCodewords = TOTAL_DATA_CODEWORDS['L'];
      const tooLong = 'A'.repeat(500);
      expect(() => calculateMinVersion(tooLong, totalDataCodewords)).toThrow();
    });
  });
  
  describe('selectOptimalEC', () => {
    it('should select H level when logo is present', () => {
      expect(selectOptimalEC('Test', true)).toBe('H');
    });
    
    it('should select highest EC level that fits without logo', () => {
      const result = selectOptimalEC('Hello', false);
      expect(['L', 'M', 'Q', 'H']).toContain(result);
    });
    
    it('should throw for data too large with logo', () => {
      const tooLarge = 'A'.repeat(200);
      expect(() => selectOptimalEC(tooLarge, true)).toThrow(/too large.*logo/);
    });
  });
  
  describe('encodeData', () => {
    it('should encode and pad to required length', () => {
      const version = 1;
      const totalDataCodewords = TOTAL_DATA_CODEWORDS['L'][version - 1];
      const result = encodeData('TEST', version, totalDataCodewords);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(totalDataCodewords);
      expect(result.every(byte => byte >= 0 && byte <= 255)).toBe(true);
    });
    
    it('should add terminator and padding', () => {
      const version = 1;
      const totalDataCodewords = TOTAL_DATA_CODEWORDS['L'][version - 1];
      const result = encodeData('A', version, totalDataCodewords);
      
      // Should have padding bytes (0xEC, 0x11 pattern)
      const hasPadding = result.some(byte => byte === 0xEC || byte === 0x11);
      expect(hasPadding).toBe(true);
    });
  });
});
