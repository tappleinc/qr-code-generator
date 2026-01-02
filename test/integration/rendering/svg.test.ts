/**
 * Rendering Tests - SVG Output
 * 
 * Tests SVG string generation and structure validation.
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../../src/index';
import { BorderShape, BorderStyle } from '../../../src/types';

describe('SVG Rendering', () => {
  const testInput = 'Hello World';
  
  describe('SVG structure', () => {
    it('should generate valid SVG opening and closing tags', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toMatch(/^<svg/);
      expect(svg).toContain('</svg>');
    });
    
    it('should include SVG namespace', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
    
    it('should include viewBox attribute', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toMatch(/viewBox="[^"]+"/);
    });
    
    it('should be valid XML', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Basic XML validation - no unclosed tags
      const openTags = (svg.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (svg.match(/<\/[^>]+>/g) || []).length;
      const selfClosing = (svg.match(/<[^>]+\/>/g) || []).length;
      
      expect(openTags - selfClosing).toBe(closeTags);
    });
  });
  
  describe('Size and dimensions', () => {
    it('should respect custom size', async () => {
      const size = 500;
      const svg = await genQrImage(testInput, { 
        size,
        output: { format: 'svg', type: 'string' }
      }) as string;
      // totalSize = size + 2×margin (default margin is 24px)
      const expectedTotal = size + 48;
      
      expect(svg).toContain(`width="${expectedTotal}"`);
      expect(svg).toContain(`height="${expectedTotal}"`);
    });
    
    it('should default to reasonable size when not specified', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toMatch(/width="\d+"/);
      expect(svg).toMatch(/height="\d+"/);
    });
    
    it('should handle various sizes', async () => {
      const sizes = [100, 200, 500, 1000];
      
      for (const size of sizes) {
        const svg = await genQrImage(testInput, { 
          size,
          output: { format: 'svg', type: 'string' }
        }) as string;
        // totalSize = size + 2×margin (default margin is 24px)
        const expectedTotal = size + 48;
        expect(svg).toContain(`width="${expectedTotal}"`);
        expect(svg).toContain(`height="${expectedTotal}"`);
      }
    });
  });
  
  describe('Colors', () => {
    it('should use custom dark color', async () => {
      const color = '#FF0000';
      const svg = await genQrImage(testInput, { 
        dots: { color },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain(color);
    });
    
    it('should include background color', async () => {
      const backgroundColor = '#F0F0F0';
      const svg = await genQrImage(testInput, { 
        backgroundColor,
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain(backgroundColor);
    });
    
    it('should handle various color formats', async () => {
      const colors = ['#000000', '#FFFFFF', '#FF5733', '#123ABC'];
      
      for (const color of colors) {
        const svg = await genQrImage(testInput, { 
          dots: { color },
          output: { format: 'svg', type: 'string' }
        }) as string;
        expect(svg).toContain('<svg');
      }
    });
  });
  
  describe('SVG data URL', () => {
    it('should generate valid SVG data URL', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'svg', type: 'dataURL' }
      }) as string;
      
      expect(dataURL).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    });
    
    it('should encode SVG content in data URL', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'svg', type: 'dataURL' }
      }) as string;
      const decoded = decodeURIComponent(dataURL.replace('data:image/svg+xml;charset=utf-8,', ''));
      
      expect(decoded).toContain('<svg');
      expect(decoded).toContain('</svg>');
    });
    
    it('should be usable in img src', async () => {
      const dataURL = await genQrImage(testInput, {
        output: { format: 'svg', type: 'dataURL' }
      }) as string;
      
      // Verify it has the correct structure for img src usage
      expect(dataURL).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
    });
  });
  
  describe('Content validation', () => {
    it('should contain path or rect elements', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // SVG should contain drawing elements
      const hasDrawingElements = svg.includes('<path') || 
                                 svg.includes('<rect') || 
                                 svg.includes('<circle') ||
                                 svg.includes('<polygon');
      
      expect(hasDrawingElements).toBe(true);
    });
    
    it('should scale with input length', async () => {
      const short = await genQrImage('A', {
        output: { format: 'svg', type: 'string' }
      }) as string;
      const long = await genQrImage('A'.repeat(50), {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Longer input should result in larger/more complex SVG
      expect(long.length).toBeGreaterThanOrEqual(short.length);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle minimum input', async () => {
      const svg = await genQrImage('A', {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });
    
    it('should handle special characters in input', async () => {
      const svg = await genQrImage('Test & <Special> "Chars"', {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
    
    it('should handle UTF-8 input', async () => {
      const svg = await genQrImage('Hello 世界 🌍', {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('<svg');
    });
  });
  
  describe('Border rendering', () => {
    it('should not render border by default', async () => {
      const svg = await genQrImage(testInput, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should not contain border shapes when border is disabled
      expect(svg).not.toMatch(/fill-rule="evenodd".*fill-rule="evenodd"/);
    });
    
    it('should render square border', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUARE, width: 10, color: '#FF0000' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('fill-rule="evenodd"');
      expect(svg).toContain('#FF0000');
    });
    
    it('should render squircle border', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUIRCLE, width: 10, color: '#00FF00' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Squircle now uses stroke instead of fill-rule evenodd for better visual quality
      expect(svg).toContain('stroke="#00FF00"');
      expect(svg).toContain('fill="none"');
    });
    
    it('should render circle border', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.CIRCLE, width: 10, color: '#0000FF' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(svg).toContain('fill-rule="evenodd"');
      expect(svg).toContain('#0000FF');
    });
    
    it('should not render border with width 0', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUARE, width: 0, color: '#000000' },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should not contain border elements
      expect(svg).not.toMatch(/fill-rule="evenodd".*fill-rule="evenodd"/);
    });
  });

  describe('Border layering', () => {
    it('should include background rect when border exists', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.CIRCLE, width: 20 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should have QR background rect positioned after border and before QR group
      expect(svg).toContain('fill-rule="evenodd"/><rect x="44" y="44" width="300" height="300" fill="#ffffff"/><g transform');
    });
    
    it('should work with square border', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUARE, width: 20 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should have QR background rect
      expect(svg).toMatch(/<rect x="\d+" y="\d+" width="\d+" height="\d+" fill="#ffffff"\/><g transform/);
    });
    
    it('should work with squircle border', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.SQUIRCLE, width: 20 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should have QR background rect
      expect(svg).toMatch(/<rect x="\d+" y="\d+" width="\d+" height="\d+" fill="#ffffff"\/><g transform/);
    });
    
    it('should work with dashed border', async () => {
      const svg = await genQrImage(testInput, {
        border: { 
          shape: BorderShape.CIRCLE, 
          width: 20, 
          style: BorderStyle.DASHED
        },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should have dashed border AND QR background rect
      expect(svg).toContain('stroke-dasharray');
      expect(svg).toMatch(/<rect x="\d+" y="\d+" width="\d+" height="\d+" fill="#ffffff"\/><g transform/);
    });
    
    it('should work with zero margin', async () => {
      const svg = await genQrImage(testInput, {
        margin: 0,
        border: { shape: BorderShape.CIRCLE, width: 20 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // Should have QR background rect
      expect(svg).toMatch(/<rect x="\d+" y="\d+" width="\d+" height="\d+" fill="#ffffff"\/><g transform/);
      // With margin=0, QR offset should equal borderWidth
      expect(svg).toContain('translate(20, 20)');
    });
    
    it('should NOT render QR background rect when border shape is NONE', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.NONE, width: 20 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // When border is NONE, there's only canvas background + QR content (no extra rect)
      const rects = svg.match(/<rect[^>]*>/g) || [];
      // Should only have: 1 canvas background + 9 eye rects (3 eyes × 3 layers each) = 10 total
      expect(rects.length).toBe(10);
    });
    
    it('should NOT render QR background rect when border width is 0', async () => {
      const svg = await genQrImage(testInput, {
        border: { shape: BorderShape.CIRCLE, width: 0 },
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      // When border width is 0, no border is rendered, so no QR background rect needed
      const rects = svg.match(/<rect[^>]*>/g) || [];
      // Should only have: 1 canvas background + 9 eye rects (3 eyes × 3 layers each) = 10 total
      expect(rects.length).toBe(10);
    });
  });
});