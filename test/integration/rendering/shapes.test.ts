/**
 * Rendering Tests - Shape Rendering
 * 
 * Tests different eye frame and data dot shape rendering.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../../src/index';
import { EyeFrameShape, DotShape } from '../../../src/types';

describe('Shape Rendering', () => {
  const testInput = 'Hello World';
  
  describe('Eye frame shapes', () => {
    it('should render square eye frames', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUARE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render squircle eye frames', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUIRCLE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render all eye frame shapes', async () => {
      const shapes = Object.values(EyeFrameShape);
      
      for (const shape of shapes) {
        const svg = await genQrImage(testInput, { 
          eyes: { shape },
          output: { format: 'svg', type: 'string' }
        }) as string;
        
        expect(svg).toContain('<svg');
      }
    });
  });
  
  describe('Data dot shapes', () => {
    it('should render classic dots', async () => {
      const svg = await genQrImage(testInput, { 
        dots: { shape: DotShape.CLASSIC },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render circular dots', async () => {
      const svg = await genQrImage(testInput, { 
        dots: { shape: DotShape.DOTS },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render square dots', async () => {
      const svg = await genQrImage(testInput, { 
        dots: { shape: DotShape.SQUARE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render all data dot shapes', async () => {
      const shapes = Object.values(DotShape);
      
      for (const shape of shapes) {
        const svg = await genQrImage(testInput, { 
          dots: { shape },
          output: { format: 'svg', type: 'string' }
        }) as string;
        
        expect(svg).toContain('<svg');
      }
    });
  });
  
  describe('Shape combinations', () => {
    it('should handle all eye × dot combinations', async () => {
      const eyeShapes = Object.values(EyeFrameShape);
      const dotShapes = Object.values(DotShape);
      
      for (const eyeShape of eyeShapes) {
        for (const dotShape of dotShapes) {
          const svg = await genQrImage(testInput, { 
            eyes: { shape: eyeShape },
            dots: { shape: dotShape },
            output: { format: 'svg', type: 'string' }
          }) as string;
          
          expect(svg).toContain('<svg');
        }
      }
    });
    
    it('should generate different output for different shapes', async () => {
      const square = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUARE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      const squircle = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUIRCLE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Different shapes should produce different SVG
      expect(square).not.toBe(squircle);
    });
  });
  
  describe('Shape colors', () => {
    it('should apply custom colors to eye frames', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { 
          shape: EyeFrameShape.SQUARE,
          color: '#FF0000'
        },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('#FF0000');
    });
    
    it('should apply custom colors to pupils', async () => {
      const svg = await genQrImage(testInput, { 
        pupils: { color: '#00FF00' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('#00FF00');
    });
    
    it('should apply custom colors to data dots', async () => {
      const svg = await genQrImage(testInput, { 
        dots: { 
          shape: DotShape.DOTS,
          color: '#0000FF'
        },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('#0000FF');
    });
    
    it('should apply different colors to different elements', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUARE, color: '#FF0000' },
        pupils: { color: '#00FF00' },
        dots: { shape: DotShape.CLASSIC, color: '#0000FF' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('#FF0000');
      expect(svg).toContain('#00FF00');
      expect(svg).toContain('#0000FF');
    });
  });
  
  describe('PNG shape rendering', () => {
    it('should render shapes in PNG format', async () => {
      const eyeShapes = Object.values(EyeFrameShape);
      const dotShapes = Object.values(DotShape);
      
      for (const eyeShape of eyeShapes) {
        for (const dotShape of dotShapes) {
          const buffer = await genQrImage(testInput, { 
            eyes: { shape: eyeShape },
            dots: { shape: dotShape },
            output: { format: 'png', type: 'buffer' }
          }) as Uint8Array;
          
          expect(buffer).toBeInstanceOf(Uint8Array);
          expect(buffer.length).toBeGreaterThan(0);
        }
      }
    });
  });
  
  describe('Shape consistency', () => {
    it('should produce consistent output for same shape', async () => {
      const svg1 = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUIRCLE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      const svg2 = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUIRCLE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg1).toBe(svg2);
    });
  });
  
  describe('Default shapes', () => {
    it('should use default shapes when not specified', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should allow partial shape specification', async () => {
      const svgEyesOnly = await genQrImage(testInput, { 
        eyes: { shape: EyeFrameShape.SQUIRCLE },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      const svgDotsOnly = await genQrImage(testInput, { 
        dots: { shape: DotShape.DOTS },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svgEyesOnly).toContain('<svg');
      expect(svgDotsOnly).toContain('<svg');
    });
  });
});
