/**
 * Unit Tests - Constants
 * 
 * Validates QR specification constants and lookup tables.
 */

import { describe, it, expect } from 'vitest';
import { 
  TOTAL_DATA_CODEWORDS, 
  EC_CODEWORDS_PER_BLOCK,
  BLOCK_STRUCTURE,
  ALPHANUMERIC_CHARSET,
  getQRSize,
  getCharCountBits
} from '../../src/internal/core/constants';

describe('QR Constants', () => {
  describe('getQRSize', () => {
    it('should calculate correct size for version 1', () => {
      expect(getQRSize(1)).toBe(21);
    });
    
    it('should calculate correct size for version 10', () => {
      expect(getQRSize(10)).toBe(57);
    });
    
    it('should follow formula: version * 4 + 17', () => {
      for (let v = 1; v <= 10; v++) {
        expect(getQRSize(v)).toBe(v * 4 + 17);
      }
    });
  });
  
  describe('TOTAL_DATA_CODEWORDS', () => {
    it('should have all error correction levels', () => {
      expect(TOTAL_DATA_CODEWORDS).toHaveProperty('L');
      expect(TOTAL_DATA_CODEWORDS).toHaveProperty('M');
      expect(TOTAL_DATA_CODEWORDS).toHaveProperty('Q');
      expect(TOTAL_DATA_CODEWORDS).toHaveProperty('H');
    });
    
    it('should have 10 versions for each EC level', () => {
      expect(TOTAL_DATA_CODEWORDS.L).toHaveLength(10);
      expect(TOTAL_DATA_CODEWORDS.M).toHaveLength(10);
      expect(TOTAL_DATA_CODEWORDS.Q).toHaveLength(10);
      expect(TOTAL_DATA_CODEWORDS.H).toHaveLength(10);
    });
    
    it('should have increasing capacity with version', () => {
      const levels = ['L', 'M', 'Q', 'H'] as const;
      
      for (const level of levels) {
        const codewords = TOTAL_DATA_CODEWORDS[level];
        for (let i = 1; i < codewords.length; i++) {
          expect(codewords[i]).toBeGreaterThan(codewords[i - 1]);
        }
      }
    });
    
    it('should have L > M > Q > H capacity (for same version)', () => {
      // Higher EC level means less data capacity
      for (let v = 0; v < 10; v++) {
        expect(TOTAL_DATA_CODEWORDS.L[v]).toBeGreaterThan(TOTAL_DATA_CODEWORDS.M[v]);
        expect(TOTAL_DATA_CODEWORDS.M[v]).toBeGreaterThan(TOTAL_DATA_CODEWORDS.Q[v]);
        expect(TOTAL_DATA_CODEWORDS.Q[v]).toBeGreaterThan(TOTAL_DATA_CODEWORDS.H[v]);
      }
    });
  });
  
  describe('EC_CODEWORDS_PER_BLOCK', () => {
    it('should have all error correction levels', () => {
      expect(EC_CODEWORDS_PER_BLOCK).toHaveProperty('L');
      expect(EC_CODEWORDS_PER_BLOCK).toHaveProperty('M');
      expect(EC_CODEWORDS_PER_BLOCK).toHaveProperty('Q');
      expect(EC_CODEWORDS_PER_BLOCK).toHaveProperty('H');
    });
    
    it('should have 10 versions for each EC level', () => {
      expect(EC_CODEWORDS_PER_BLOCK.L).toHaveLength(10);
      expect(EC_CODEWORDS_PER_BLOCK.M).toHaveLength(10);
      expect(EC_CODEWORDS_PER_BLOCK.Q).toHaveLength(10);
      expect(EC_CODEWORDS_PER_BLOCK.H).toHaveLength(10);
    });
  });
  
  describe('BLOCK_STRUCTURE', () => {
    it('should have correct structure format', () => {
      const levels = ['L', 'M', 'Q', 'H'] as const;
      
      for (const level of levels) {
        for (const structure of BLOCK_STRUCTURE[level]) {
          expect(structure).toHaveLength(4);
          expect(structure.every(n => n >= 0)).toBe(true);
        }
      }
    });
    
    it('should have valid block counts', () => {
      const levels = ['L', 'M', 'Q', 'H'] as const;
      
      for (const level of levels) {
        for (const [g1Blocks, , g2Blocks, g2Data] of BLOCK_STRUCTURE[level]) {
          expect(g1Blocks).toBeGreaterThanOrEqual(0);
          if (g2Blocks > 0) {
            expect(g2Data).toBeGreaterThan(0);
          }
        }
      }
    });
  });
  
  describe('ALPHANUMERIC_CHARSET', () => {
    it('should contain digits 0-9', () => {
      for (let i = 0; i <= 9; i++) {
        expect(ALPHANUMERIC_CHARSET).toContain(i.toString());
      }
    });
    
    it('should contain uppercase A-Z', () => {
      for (let i = 65; i <= 90; i++) {
        expect(ALPHANUMERIC_CHARSET).toContain(String.fromCharCode(i));
      }
    });
    
    it('should contain special characters', () => {
      expect(ALPHANUMERIC_CHARSET).toContain(' ');
      expect(ALPHANUMERIC_CHARSET).toContain('$');
      expect(ALPHANUMERIC_CHARSET).toContain('%');
      expect(ALPHANUMERIC_CHARSET).toContain('*');
      expect(ALPHANUMERIC_CHARSET).toContain('+');
      expect(ALPHANUMERIC_CHARSET).toContain('-');
      expect(ALPHANUMERIC_CHARSET).toContain('.');
      expect(ALPHANUMERIC_CHARSET).toContain('/');
      expect(ALPHANUMERIC_CHARSET).toContain(':');
    });
    
    it('should have exactly 45 characters', () => {
      expect(ALPHANUMERIC_CHARSET.length).toBe(45);
    });
  });
  
  describe('getCharCountBits', () => {
    it('should return correct bits for numeric mode', () => {
      expect(getCharCountBits(1, 1)).toBe(10); // version 1-9
      expect(getCharCountBits(1, 10)).toBe(12); // version 10-26
    });
    
    it('should return correct bits for alphanumeric mode', () => {
      expect(getCharCountBits(2, 1)).toBe(9);
      expect(getCharCountBits(2, 10)).toBe(11);
    });
    
    it('should return correct bits for byte mode', () => {
      expect(getCharCountBits(4, 1)).toBe(8);
      expect(getCharCountBits(4, 10)).toBe(16);
    });
  });
});
