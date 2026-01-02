/**
 * Integration Tests - Data Types
 * 
 * Tests structured content types (URL, phone, email, WiFi, vCard, calendar).
 */

import { describe, it, expect } from 'vitest';
import { genQrImage } from '../../src/index';

describe('Data Types', () => {
  describe('URL', () => {
    it('should handle plain URLs', async () => {
      const url = 'https://example.com';
      const result = await genQrImage(url, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle URLs with paths and query params', async () => {
      const url = 'https://example.com/path?foo=bar&baz=qux';
      const result = await genQrImage(url, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle structured URL input', async () => {
      const result = await genQrImage({ type: 'url', url: 'https://example.com' }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
  });
  
  describe('Phone', () => {
    it('should handle phone numbers', async () => {
      const result = await genQrImage({ type: 'phone', phone: '+1-555-123-4567' }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle international formats', async () => {
      const phones = ['+1234567890', '+44 20 1234 5678', '+81-3-1234-5678'];
      
      for (const phone of phones) {
        const result = await genQrImage({ type: 'phone', phone }, {
          output: { format: 'svg', type: 'string' }
        }) as string;
        expect(result).toContain('<svg');
      }
    });
  });
  
  describe('Email', () => {
    it('should handle basic email', async () => {
      const result = await genQrImage({ 
        type: 'email', 
        email: 'test@example.com' 
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle email with subject and body', async () => {
      const result = await genQrImage({ 
        type: 'email', 
        email: 'test@example.com',
        subject: 'Hello',
        body: 'This is a test'
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
  });
  
  describe('SMS', () => {
    it('should handle SMS with message', async () => {
      const result = await genQrImage({ 
        type: 'sms', 
        phone: '+1234567890',
        message: 'Hello from QR code'
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
  });
  
  describe('WiFi', () => {
    it('should handle WiFi credentials', async () => {
      const result = await genQrImage({ 
        type: 'wifi', 
        data: {
          ssid: 'MyNetwork',
          password: 'SecurePassword123',
          encryption: 'WPA'
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle hidden networks', async () => {
      const result = await genQrImage({ 
        type: 'wifi', 
        data: {
          ssid: 'HiddenNetwork',
          password: 'password',
          encryption: 'WPA2',
          hidden: true
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should escape special characters in WiFi data', async () => {
      const result = await genQrImage({ 
        type: 'wifi', 
        data: {
          ssid: 'Network;With:Special"Chars',
          password: 'Pass\\word',
          encryption: 'WPA'
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
  });
  
  describe('vCard', () => {
    it('should handle basic vCard', async () => {
      const result = await genQrImage({ 
        type: 'vcard', 
        data: {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com'
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle full vCard with all fields', async () => {
      const result = await genQrImage({ 
        type: 'vcard', 
        data: {
          name: 'Jane Smith',
          phone: '+1234567890',
          email: 'jane@example.com',
          organization: 'Acme Corp',
          title: 'CEO',
          url: 'https://example.com',
          note: 'Met at conference',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
          }
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
  });
  
  describe('Calendar Event', () => {
    it('should handle calendar events', async () => {
      const result = await genQrImage({ 
        type: 'calendar', 
        data: {
          title: 'Team Meeting',
          startDate: new Date('2024-12-28T10:00:00Z'),
          endDate: new Date('2024-12-28T11:00:00Z'),
          location: 'Conference Room A',
          description: 'Weekly team sync'
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
    
    it('should handle all-day events', async () => {
      const result = await genQrImage({ 
        type: 'calendar', 
        data: {
          title: 'Holiday',
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-26')
        }
      }, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      
      expect(result).toContain('<svg');
    });
  });
  
  describe('Cross-format compatibility', () => {
    it('should generate QR codes in multiple output formats', async () => {
      const data = { type: 'url' as const, url: 'https://example.com' };
      
      const svg = await genQrImage(data, {
        output: { format: 'svg', type: 'string' }
      }) as string;
      const png = await genQrImage(data, {
        output: { format: 'png', type: 'dataURL' }
      }) as string;
      
      expect(svg).toContain('<svg');
      expect(png).toMatch(/^data:image\/png;base64,/);
    });
  });
});
