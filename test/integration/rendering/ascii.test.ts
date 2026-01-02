/**
 * Rendering Tests - ASCII Output
 * 
 * Tests ASCII string generation and text rendering.
 */

import { describe, it, expect } from 'vitest';
import { genQrText } from '../../../src/index';

describe('ASCII Rendering', () => {
  const testInput = 'Hello World';
  
  describe('Basic output', () => {
    it('should generate ASCII string', () => {
      const ascii = genQrText(testInput);
      
      expect(typeof ascii).toBe('string');
      expect(ascii.length).toBeGreaterThan(0);
    });
    
    it('should contain newlines for rows', () => {
      const ascii = genQrText(testInput);
      
      expect(ascii).toContain('\n');
    });
    
    it('should be roughly square (equal rows)', () => {
      const ascii = genQrText(testInput, { margin: 0 });
      const lines = ascii.trim().split('\n');
      
      // All lines should have similar length (allowing for character width)
      const lengths = lines.map(line => line.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      
      for (const length of lengths) {
        expect(Math.abs(length - avgLength)).toBeLessThan(avgLength * 0.1);
      }
    });
  });
  
  describe('Custom characters', () => {
    it('should use default characters', () => {
      const ascii = genQrText(testInput);
      
      // Should contain either block or space characters
      expect(ascii.length).toBeGreaterThan(0);
    });
    
    it('should respect custom dark character', () => {
      const ascii = genQrText(testInput, { 
        darkChar: '█' 
      });
      
      expect(ascii).toContain('█');
    });
    
    it('should respect custom light character', () => {
      const ascii = genQrText(testInput, { 
        lightChar: '.' 
      });
      
      expect(ascii).toContain('.');
    });
    
    it('should handle multi-character strings', () => {
      const ascii = genQrText(testInput, { 
        darkChar: '##', 
        lightChar: '  ' 
      });
      
      expect(ascii).toContain('##');
    });
    
    it('should handle ASCII art characters', () => {
      const charSets = [
        { darkChar: '@', lightChar: ' ' },
        { darkChar: 'X', lightChar: '_' },
        { darkChar: '0', lightChar: '.' },
      ];
      
      for (const { darkChar, lightChar } of charSets) {
        const ascii = genQrText(testInput, { 
          darkChar, lightChar 
        });
        
        expect(ascii).toBeTruthy();
      }
    });
  });
  
  describe('Margin', () => {
    it('should add margin when specified', () => {
      const noMargin = genQrText(testInput, { margin: 0 });
      const withMargin = genQrText(testInput, { margin: 2 });
      
      // With margin should have more lines
      expect(withMargin.split('\n').length).toBeGreaterThan(noMargin.split('\n').length);
    });
    
    it('should handle zero margin', () => {
      const ascii = genQrText(testInput, { margin: 0 });
      
      expect(ascii.length).toBeGreaterThan(0);
    });
    
    it('should handle various margin sizes', () => {
      const margins = [0, 1, 2, 4];
      
      for (const margin of margins) {
        const ascii = genQrText(testInput, { margin });
        expect(ascii.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Size scaling', () => {
    it('should scale with input length', () => {
      const short = genQrText('A', { margin: 0 });
      const long = genQrText('A'.repeat(50), { margin: 0 });
      
      // Longer input requires larger QR version, more lines
      expect(long.split('\n').length).toBeGreaterThan(short.split('\n').length);
    });
    
    it('should be consistent for same input', () => {
      const ascii1 = genQrText(testInput);
      const ascii2 = genQrText(testInput);
      
      expect(ascii1).toBe(ascii2);
    });
  });
  
  describe('Visual structure', () => {
    it('should have finder patterns (corners)', () => {
      const ascii = genQrText(testInput, { 
        darkChar: '█', 
        lightChar: ' ',
        margin: 1
      });
      
      const lines = ascii.trim().split('\n');
      
      // Top-left corner should have dark modules
      expect(lines[0]).toContain('█');
      
      // Should have content (not all the same character)
      const uniqueChars = new Set(ascii.replace(/\n/g, ''));
      expect(uniqueChars.size).toBeGreaterThan(1);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle minimum input', () => {
      const ascii = genQrText('A');
      
      expect(ascii.length).toBeGreaterThan(0);
    });
    
    it('should handle UTF-8 input', () => {
      const ascii = genQrText('Hello 世界');
      
      expect(ascii.length).toBeGreaterThan(0);
    });
    
    it('should handle special characters in input', () => {
      const ascii = genQrText('Test & <Special>');
      
      expect(ascii.length).toBeGreaterThan(0);
    });
  });
  
  describe('Output format', () => {
    it('should be printable to console', () => {
      const ascii = genQrText(testInput);
      
      // Should not contain control characters except newlines
      const withoutNewlines = ascii.replace(/\n/g, '');
      // eslint-disable-next-line no-control-regex
      expect(withoutNewlines).not.toMatch(/[\x00-\x09\x0B-\x1F\x7F]/);
    });
    
    it('should be suitable for terminal display', () => {
      const ascii = genQrText(testInput);
      
      // Should have reasonable dimensions for terminal
      const lines = ascii.trim().split('\n');
      expect(lines.length).toBeLessThan(200); // Not too tall
      expect(lines[0].length).toBeLessThan(500); // Not too wide
    });
  });
});
