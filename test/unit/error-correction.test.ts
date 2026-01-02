/**
 * Unit Tests - Error Correction
 * 
 * Tests Reed-Solomon error correction and block interleaving.
 */

import { describe, it, expect } from 'vitest';
import { generateErrorCorrection, interleaveBlocks } from '../../src/internal/encoding/error-correction';

describe('Error Correction', () => {
  describe('generateErrorCorrection', () => {
    it('should generate error correction codewords', () => {
      const dataCodewords = [0x40, 0x20, 0x0C, 0x56, 0x61, 0x80, 0xEC, 0x11, 0xEC];
      const ecCodewordsPerBlock = 7;
      const blockStructure = [1, 9, 0, 0]; // 1 block of 9 data codewords
      
      const result = generateErrorCorrection(dataCodewords, ecCodewordsPerBlock, blockStructure);
      
      expect(result.dataBlocks).toHaveLength(1);
      expect(result.ecBlocks).toHaveLength(1);
      expect(result.dataBlocks[0]).toEqual(dataCodewords);
      expect(result.ecBlocks[0]).toHaveLength(ecCodewordsPerBlock);
      expect(result.ecBlocks[0].every(byte => byte >= 0 && byte <= 255)).toBe(true);
    });
    
    it('should handle multiple blocks', () => {
      const dataCodewords = new Array(32).fill(0x40);
      const ecCodewordsPerBlock = 10;
      const blockStructure = [2, 16, 0, 0]; // 2 blocks of 16 data codewords each
      
      const result = generateErrorCorrection(dataCodewords, ecCodewordsPerBlock, blockStructure);
      
      expect(result.dataBlocks).toHaveLength(2);
      expect(result.ecBlocks).toHaveLength(2);
      expect(result.dataBlocks[0]).toHaveLength(16);
      expect(result.dataBlocks[1]).toHaveLength(16);
      expect(result.ecBlocks[0]).toHaveLength(ecCodewordsPerBlock);
      expect(result.ecBlocks[1]).toHaveLength(ecCodewordsPerBlock);
    });
    
    it('should handle mixed block sizes (group 1 and group 2)', () => {
      const dataCodewords = new Array(34).fill(0x40);
      const ecCodewordsPerBlock = 10;
      const blockStructure = [1, 16, 1, 18]; // 1 block of 16 + 1 block of 18
      
      const result = generateErrorCorrection(dataCodewords, ecCodewordsPerBlock, blockStructure);
      
      expect(result.dataBlocks).toHaveLength(2);
      expect(result.dataBlocks[0]).toHaveLength(16);
      expect(result.dataBlocks[1]).toHaveLength(18);
    });
  });
  
  describe('interleaveBlocks', () => {
    it('should interleave single block correctly', () => {
      const dataBlocks = [[1, 2, 3]];
      const ecBlocks = [[4, 5]];
      
      const result = interleaveBlocks(dataBlocks, ecBlocks);
      
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should interleave multiple equal-sized blocks', () => {
      const dataBlocks = [[1, 2], [3, 4]];
      const ecBlocks = [[5, 6], [7, 8]];
      
      const result = interleaveBlocks(dataBlocks, ecBlocks);
      
      // Data interleaved: 1, 3, 2, 4, then EC interleaved: 5, 7, 6, 8
      expect(result).toEqual([1, 3, 2, 4, 5, 7, 6, 8]);
    });
    
    it('should handle unequal block sizes correctly', () => {
      const dataBlocks = [[1, 2], [3, 4, 5]];
      const ecBlocks = [[6, 7], [8, 9]];
      
      const result = interleaveBlocks(dataBlocks, ecBlocks);
      
      // Interleave common length first, then remaining
      expect(result).toEqual([1, 3, 2, 4, 5, 6, 8, 7, 9]);
    });
  });
});
