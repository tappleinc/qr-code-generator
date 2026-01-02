/**
 * Rendering Tests - PNG Output
 * 
 * Tests PNG buffer/data URL generation and binary format validation.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../../src/index';
import { BorderShape } from '../../../src/types';

describe('PNG Rendering', () => {
  const testInput = 'Hello World';
  
  describe('PNG buffer', () => {
    it('should generate Uint8Array buffer', async () => {
      const buffer = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
    });
    
    it('should have PNG signature', async () => {
      const buffer = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4E);
      expect(buffer[3]).toBe(0x47);
    });
    
    it('should have IHDR chunk', async () => {
      const buffer = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      const str = String.fromCharCode(...buffer.slice(12, 16));
      
      expect(str).toBe('IHDR');
    });
    
    it('should have IEND chunk at end', async () => {
      const buffer = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      const str = String.fromCharCode(...buffer.slice(-8, -4));
      
      expect(str).toBe('IEND');
    });
    
    it('should have reasonable file size', async () => {
      const buffer = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      // PNG should be at least a few hundred bytes
      expect(buffer.length).toBeGreaterThan(200);
      
      // But not unreasonably large (< 10MB for QR codes)
      expect(buffer.length).toBeLessThan(10000000);
    });
  });
  
  describe('PNG data URL', () => {
    it('should generate valid PNG data URL', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      
      expect(dataURL).toMatch(/^data:image\/png;base64,/);
    });
    
    it('should be base64 encoded', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      const base64Part = dataURL.replace('data:image/png;base64,', '');
      
      // Base64 should only contain valid characters
      expect(base64Part).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
    
    it('should decode to valid PNG buffer', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      const base64Part = dataURL.replace('data:image/png;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64');
      
      // Should have PNG signature
      expect(decoded[0]).toBe(0x89);
      expect(decoded[1]).toBe(0x50);
      expect(decoded[2]).toBe(0x4E);
      expect(decoded[3]).toBe(0x47);
    });
    
    it('should be usable in img src', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      
      // Verify format suitable for HTML img element
      expect(dataURL.substring(0, 22)).toBe('data:image/png;base64,');
    });
  });
  
  describe('Size options', () => {
    it('should respect custom size', async () => {
      const buffer300 = await genQrImage(testInput, { 
        size: 300, 
        output: { format: 'png', type: 'buffer' } 
      }) as Uint8Array;
      const buffer600 = await genQrImage(testInput, { 
        size: 600, 
        output: { format: 'png', type: 'buffer' } 
      }) as Uint8Array;
      
      // Larger size should produce larger file
      expect(buffer600.length).toBeGreaterThan(buffer300.length);
    });
    
    it('should handle various sizes', async () => {
      const sizes = [100, 200, 500, 1000];
      
      for (const size of sizes) {
        const buffer = await genQrImage(testInput, { 
          size, 
          output: { format: 'png', type: 'buffer' } 
        }) as Uint8Array;
        expect(buffer).toBeInstanceOf(Uint8Array);
        expect(buffer.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Consistency', () => {
    it('should produce same output for same input', async () => {
      const buffer1 = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      const buffer2 = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer1.length).toBe(buffer2.length);
      expect(Array.from(buffer1)).toEqual(Array.from(buffer2));
    });
    
    it('should produce different output for different input', async () => {
      const buffer1 = await genQrImage('Hello', {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      const buffer2 = await genQrImage('World', {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(Array.from(buffer1)).not.toEqual(Array.from(buffer2));
    });
  });
  
  describe('Format validation', () => {
    it('should be scannable format (tested separately)', async () => {
      // This is validated in visual/scannability.test.ts
      // Here we just verify it generates valid PNG
      const buffer = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89); // PNG signature
    });
    
    it('should handle colors correctly', async () => {
      const buffer = await genQrImage(testInput, { 
        backgroundColor: '#FFFFFF', 
        dots: { color: '#000000' },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle minimum input', async () => {
      const buffer = await genQrImage('A', {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);
    });
    
    it('should handle long input', async () => {
      const buffer = await genQrImage('A'.repeat(100), {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);
    });
    
    it('should handle UTF-8 input', async () => {
      const buffer = await genQrImage('Hello 世界 🌍', {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
  
  describe('Border rendering', () => {
    it('should generate valid PNG with square border', async () => {
      const buffer = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUARE, width: 10, color: '#FF0000' },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89);
      expect(buffer.length).toBeGreaterThan(200);
    });
    
    it('should generate valid PNG with squircle border', async () => {
      const buffer = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUIRCLE, width: 10, color: '#00FF00' },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89);
      expect(buffer.length).toBeGreaterThan(200);
    });
    
    it('should generate valid PNG with circle border', async () => {
      const buffer = await genQrImage(testInput, {
        border: { shape: BorderShape.CIRCLE, width: 10, color: '#0000FF' },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89);
      expect(buffer.length).toBeGreaterThan(200);
    });
    
    it('should generate valid PNG without border by default', async () => {
      const bufferWithBorder = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUARE, width: 10, color: '#000000' },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      const bufferWithoutBorder = await genQrImage(testInput, {
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(bufferWithBorder).toBeInstanceOf(Uint8Array);
      expect(bufferWithoutBorder).toBeInstanceOf(Uint8Array);
      // Both should be valid PNGs
      expect(bufferWithBorder[0]).toBe(0x89);
      expect(bufferWithoutBorder[0]).toBe(0x89);
    });
  });

  describe('Border rendering (PNG)', () => {
    it('should generate valid PNG with circle border', async () => {
      const buffer = await genQrImage(testInput, {
        border: { shape: BorderShape.CIRCLE, width: 20 },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89); // PNG signature
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4E);
      expect(buffer[3]).toBe(0x47);
    });
    
    it('should generate valid PNG with border and zero margin', async () => {
      const buffer = await genQrImage(testInput, {
        margin: 0,
        border: { shape: BorderShape.CIRCLE, width: 30 },
        output: { format: 'png', type: 'buffer' }
      }) as Uint8Array;
      
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer[0]).toBe(0x89); // PNG signature
    });
    
    it('should generate valid PNG dataURL with border', async () => {
      const dataURL = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUIRCLE, width: 20 },
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      
      expect(dataURL).toMatch(/^data:image\/png;base64,/);
      
      const base64Part = dataURL.replace('data:image/png;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64');
      expect(decoded[0]).toBe(0x89); // PNG signature
    });
  });
  });
