/**
 * Rendering Tests - Shape Rendering
 * 
 * Tests different eye frame corner radius and data dot shape rendering.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../../src/index';
import { DotShape } from '../../../src/types';

describe('Shape Rendering', () => {
  const testInput = 'Hello World';
  
  describe('Eye frame corner radius', () => {
    it('should render square eye frames (cornerRadius: 0)', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('rx="0"');
    });
    
    it('should render rounded eye frames (cornerRadius: 0.25)', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0.25 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render circular eye frames (cornerRadius: 0.5)', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0.5 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should render various corner radius values', async () => {
      const radii = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
      
      for (const cornerRadius of radii) {
        const svg = await genQrImage(testInput, { 
          eyes: { cornerRadius },
          output: { format: 'svg', type: 'string' }
        }) as string;
        
        expect(svg).toContain('<svg');
      }
    });
  });
  
  describe('Eye frame stroke width', () => {
    it('should render standard eye frames (strokeWidth: 1.0)', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { strokeWidth: 1.0 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('fill=');
    });
    
    it('should render thicker eye frames (strokeWidth: 1.1)', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { strokeWidth: 1.1 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('fill=');
    });
    
    it('should render various stroke widths', async () => {
      const strokeWidths = [0.9, 0.95, 1.0, 1.05, 1.1];
      
      for (const strokeWidth of strokeWidths) {
        const svg = await genQrImage(testInput, { 
          eyes: { strokeWidth },
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
    it('should handle eye cornerRadius × dot combinations', async () => {
      const eyeRadii = [0, 0.25, 0.5];
      const dotShapes = Object.values(DotShape);
      
      for (const cornerRadius of eyeRadii) {
        for (const dotShape of dotShapes) {
          const svg = await genQrImage(testInput, { 
            eyes: { cornerRadius },
            dots: { shape: dotShape },
            output: { format: 'svg', type: 'string' }
          }) as string;
          
          expect(svg).toContain('<svg');
        }
      }
    });
    
    it('should handle cornerRadius × strokeWidth combinations', async () => {
      const cornerRadii = [0, 0.25, 0.5];
      const strokeWidths = [0.9, 1.0, 1.1];
      
      for (const cornerRadius of cornerRadii) {
        for (const strokeWidth of strokeWidths) {
          const svg = await genQrImage(testInput, { 
            eyes: { cornerRadius, strokeWidth },
            output: { format: 'svg', type: 'string' }
          }) as string;
          
          expect(svg).toContain('<svg');
        }
      }
    });
    
    it('should generate different output for different corner radii', async () => {
      const square = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      const rounded = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0.5 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Different radii should produce different SVG
      expect(square).not.toBe(rounded);
    });
  });
  
  describe('Shape colors', () => {
    it('should apply custom colors to eye frames', async () => {
      const svg = await genQrImage(testInput, { 
        eyes: { 
          cornerRadius: 0,
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
        eyes: { cornerRadius: 0, color: '#FF0000' },
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
      const eyeRadii = [0, 0.25, 0.5];
      const dotShapes = Object.values(DotShape);
      
      for (const cornerRadius of eyeRadii) {
        for (const dotShape of dotShapes) {
          const buffer = await genQrImage(testInput, { 
            eyes: { cornerRadius },
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
    it('should produce consistent output for same corner radius', async () => {
      const svg1 = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0.25 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      const svg2 = await genQrImage(testInput, { 
        eyes: { cornerRadius: 0.25 },
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
        eyes: { cornerRadius: 0.25 },
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
