/**
 * Integration Tests - Options
 * 
 * Tests style options, colors, sizes, margins, and shape configurations.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage, genQrText, DotShape } from '../../src/index';

describe('Options', () => {
  const testInput = 'Hello World';
  
  describe('Size options', () => {
    it('should accept custom size for PNG', async () => {
      const result = await genQrImage(testInput, { 
        size: 500,
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
    
    it('should accept custom size for SVG', async () => {
      const result = await genQrImage(testInput, { 
        size: 400,
        output: { format: 'svg', type: 'string' }
      }) as string;
      // totalSize = size + 2×margin (default margin is 24px)
      expect(result).toContain('width="448"');
      expect(result).toContain('height="448"');
    });
    
    it('should handle various sizes', async () => {
      const sizes = [100, 200, 500, 1000];
      
      for (const size of sizes) {
        const result = await genQrImage(testInput, { 
          size,
          output: { format: 'svg', type: 'string' }
        }) as string;
        // totalSize = size + 2×margin (default margin is 24px)
        const expectedTotal = size + 48;
        expect(result).toContain(`width="${expectedTotal}"`);
      }
    });
  });
  
  describe('Margin options', () => {
    it('should accept custom margin for PNG', async () => {
      const result = await genQrImage(testInput, { 
        margin: 4,
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
    
    it('should accept custom margin for ASCII', () => {
      const result = genQrText(testInput, { margin: 2 });
      expect(result).toBeTruthy();
    });
    
    it('should handle zero margin', async () => {
      const result = await genQrImage(testInput, { 
        margin: 0,
        output: { format: 'svg', type: 'string' }
      }) as string;
      expect(result).toContain('<svg');
    });
  });
  
  describe('Color options', () => {
    it('should accept custom colors for PNG', async () => {
      const result = await genQrImage(testInput, { 
        backgroundColor: '#FFFFFF',
        eyes: { color: '#000000' },
        pupils: { color: '#000000' },
        dots: { color: '#000000' },
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
    
    it('should accept custom colors for SVG', async () => {
      const result = await genQrImage(testInput, { 
        backgroundColor: '#F0F0F0',
        eyes: { color: '#333333' },
        pupils: { color: '#333333' },
        dots: { color: '#333333' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      expect(result).toContain('fill="#333333"');
    });
    
    it('should handle hex color formats', async () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#123456'];
      
      for (const color of colors) {
        const result = await genQrImage(testInput, { 
          eyes: { color },
          pupils: { color },
          dots: { color },
          output: { format: 'svg', type: 'string' }
        }) as string;
        expect(result).toContain('<svg');
      }
    });
  });
  
  describe('Shape options', () => {
    it('should accept eye frame corner radius values', async () => {
      const radii = [0, 0.1, 0.25, 0.5];
      
      for (const cornerRadius of radii) {
        const result = await genQrImage(testInput, { 
          eyes: { cornerRadius },
          output: { format: 'svg', type: 'string' }
        }) as string;
        expect(result).toContain('<svg');
      }
    });
    
    it('should accept data dot shapes', async () => {
      const shapes = Object.values(DotShape);
      
      for (const shape of shapes) {
        const result = await genQrImage(testInput, { 
          dots: { shape },
          output: { format: 'svg', type: 'string' }
        }) as string;
        expect(result).toContain('<svg');
      }
    });
    
    it('should accept shape combinations', async () => {
      const result = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0.25 },
        dots: { shape: DotShape.DOTS },
        output: { format: 'svg', type: 'string' }
      }) as string;
      expect(result).toContain('<svg');
    });
    
    it('should accept custom colors for shapes', async () => {
      const result = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0, color: '#FF0000' },
        pupils: { color: '#00FF00' },
        dots: { shape: DotShape.CLASSIC, color: '#0000FF' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      expect(result).toContain('<svg');
    });
  });
  
  describe('ASCII style options', () => {
    it('should accept custom characters', () => {
      const result = genQrText(testInput, { 
        darkChar: '█', 
        lightChar: ' ' 
      });
      expect(result).toContain('█');
    });
    
    it('should accept alternative character sets', () => {
      const charSets = [
        { darkChar: '##', lightChar: '  ' },
        { darkChar: '@@', lightChar: '..' },
        { darkChar: 'XX', lightChar: '__' },
      ];
      
      for (const { darkChar, lightChar } of charSets) {
        const result = genQrText(testInput, { 
          darkChar, lightChar 
        });
        expect(result).toBeTruthy();
      }
    });
  });
  
  describe('Combined options', () => {
    it('should accept multiple options together', async () => {
      const result = await genQrImage(testInput, { 
        size: 500,
        margin: 4,
        backgroundColor: '#FFFFFF',
        eyes: { cornerRadius: 0.25, color: '#FF0000' },
        pupils: { color: '#000000' },
        dots: { shape: DotShape.DOTS, color: '#000000' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
      // totalSize = size + 2×margin (custom margin is 4px)
      expect(result).toContain('width="508"');
    });
  });
  
  describe('Default options', () => {
    it('should work without any options', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      const png = await genQrImage(testInput, {
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      const ascii = genQrText(testInput);
      
      expect(svg).toContain('<svg');
      expect(png).toMatch(/^data:image\/png;base64,/);
      expect(ascii).toBeTruthy();
    });
  });
});
