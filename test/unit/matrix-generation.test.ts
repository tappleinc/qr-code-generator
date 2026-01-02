/**
 * Unit Tests - Matrix Generation
 * 
 * Tests matrix creation, function patterns, and masking.
 * This module is flagged as HIGH RISK in the project docs.
 */

import { describe, it, expect } from 'vitest';
import { generateMatrix } from '../../src/internal/matrix/matrix';
import { createMatrix, createFunctionPattern } from '../../src/internal/matrix/matrix-core';
import { applyMask } from '../../src/internal/matrix/mask-selection';
import { getQRSize } from '../../src/internal/core/constants';

describe('Matrix Generation', () => {
  describe('createMatrix', () => {
    it('should create matrix with correct size', () => {
      const version = 1;
      const matrix = createMatrix(version);
      const expectedSize = getQRSize(version); // 21x21 for version 1
      
      expect(matrix).toHaveLength(expectedSize);
      expect(matrix[0]).toHaveLength(expectedSize);
    });
    
    it('should initialize all modules to false', () => {
      const matrix = createMatrix(1);
      const allFalse = matrix.every(row => row.every(cell => cell === false));
      expect(allFalse).toBe(true);
    });
    
    it('should scale size correctly with version', () => {
      expect(createMatrix(1)).toHaveLength(21); // v1: 21x21
      expect(createMatrix(2)).toHaveLength(25); // v2: 25x25
      expect(createMatrix(10)).toHaveLength(57); // v10: 57x57
    });
  });
  
  describe('createFunctionPattern', () => {
    it('should mark finder pattern areas', () => {
      const version = 1;
      const pattern = createFunctionPattern(version);
      
      // Top-left finder (0-7, 0-7)
      expect(pattern[0][0]).toBe(true);
      expect(pattern[7][7]).toBe(true);
      
      // Top-right finder
      expect(pattern[0][pattern.length - 1]).toBe(true);
      
      // Bottom-left finder
      expect(pattern[pattern.length - 1][0]).toBe(true);
    });
    
    it('should mark timing patterns', () => {
      const pattern = createFunctionPattern(1);
      
      // Horizontal timing (row 6, cols 8 to size-8)
      expect(pattern[6][10]).toBe(true);
      
      // Vertical timing (col 6, rows 8 to size-8)
      expect(pattern[10][6]).toBe(true);
    });
    
    it('should mark dark module', () => {
      const version = 1;
      const pattern = createFunctionPattern(version);
      
      // Dark module at (4*version + 9, 8)
      expect(pattern[4 * version + 9][8]).toBe(true);
    });
    
    it('should mark format information areas', () => {
      const pattern = createFunctionPattern(1);
      
      // Format info around top-left finder
      expect(pattern[8][0]).toBe(true);
      expect(pattern[0][8]).toBe(true);
    });
  });
  
  describe('applyMask', () => {
    it('should apply mask pattern 0 correctly', () => {
      const matrix = createMatrix(1);
      const functionPattern = createFunctionPattern(1);
      
      // Set some data modules to true
      matrix[10][10] = true;
      
      applyMask(matrix, functionPattern, 0);
      
      // Mask 0: (row + col) % 2 === 0
      // (10 + 10) % 2 === 0, so should flip to false
      expect(matrix[10][10]).toBe(false);
    });
    
    it('should not mask function pattern areas', () => {
      const matrix = createMatrix(1);
      const functionPattern = createFunctionPattern(1);
      
      // Set a finder pattern module
      matrix[0][0] = true;
      functionPattern[0][0] = true;
      
      applyMask(matrix, functionPattern, 0);
      
      // Should not be masked (remains true)
      expect(matrix[0][0]).toBe(true);
    });
    
    it('should handle all 8 mask patterns', () => {
      for (let pattern = 0; pattern < 8; pattern++) {
        const matrix = createMatrix(1);
        const functionPattern = createFunctionPattern(1);
        
        expect(() => applyMask(matrix, functionPattern, pattern)).not.toThrow();
      }
    });
  });
  
  describe('generateMatrix', () => {
    it('should generate complete matrix with valid structure', () => {
      const version = 1;
      const ecLevel = 'L';
      const bitStream = new Array(152).fill(false); // Dummy bit stream
      
      const result = generateMatrix(version, ecLevel, bitStream);
      
      expect(result.matrix).toHaveLength(getQRSize(version));
      expect(result.mask).toBeGreaterThanOrEqual(0);
      expect(result.mask).toBeLessThanOrEqual(7);
    });
    
    it('should auto-select mask pattern when not specified', () => {
      const version = 1;
      const ecLevel = 'L';
      const bitStream = new Array(152).fill(false);
      
      const result = generateMatrix(version, ecLevel, bitStream);
      
      expect(typeof result.mask).toBe('number');
      expect(result.mask).toBeGreaterThanOrEqual(0);
      expect(result.mask).toBeLessThanOrEqual(7);
    });
    
    it('should use specified mask pattern when provided', () => {
      const version = 1;
      const ecLevel = 'L';
      const bitStream = new Array(152).fill(false);
      const maskPattern = 3;
      
      const result = generateMatrix(version, ecLevel, bitStream, maskPattern);
      
      expect(result.mask).toBe(maskPattern);
    });
    
    it('should include debug data when requested', () => {
      const version = 1;
      const ecLevel = 'L';
      const bitStream = new Array(152).fill(false);
      
      const result = generateMatrix(version, ecLevel, bitStream, undefined, true);
      
      expect(result.formatInfo).toBeDefined();
      expect(result.unmaskedMatrix).toBeDefined();
    });
  });
});
