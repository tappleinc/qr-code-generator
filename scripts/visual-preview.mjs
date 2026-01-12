/**
 * Visual Preview Generator
 * 
 * Generates a comprehensive visual preview of QR codes for manual review.
 * Tests both Node.js and Browser distributions with various inputs and options.
 * 
 * Usage: npm run visual-preview
 * Output: visual-preview-output/[timestamp]/index.html
 */

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { platform } from 'os';

const DIST_NODE_PATH = join(process.cwd(), 'dist/node.mjs');
const DIST_BROWSER_PATH = join(process.cwd(), 'dist/browser.mjs');
const OUTPUT_BASE = join(process.cwd(), 'visual-preview-output');
const DEMO_LOGO_PNG = join(process.cwd(), 'demo/logo.png');
const DEMO_LOGO_SVG = join(process.cwd(), 'demo/logo.svg');

// ============================================================================
// Test Matrix
// ============================================================================

const TEST_MATRIX = [
  // Category: Input Types
  {
    category: 'input-types',
    name: 'simple-text',
    input: 'Hello World',
    description: 'Simple text',
  },
  {
    category: 'input-types',
    name: 'url',
    input: 'https://tapple.io/products?ref=qr',
    description: 'URL with query params',
  },
  {
    category: 'input-types',
    name: 'vcard',
    input: {
      type: 'vcard',
      data: {
        name: 'John Smith',
        phone: '+1-555-0123',
        email: 'john@example.com',
        organization: 'Tapple Inc',
      },
    },
    description: 'vCard contact',
  },
  {
    category: 'input-types',
    name: 'wifi',
    input: {
      type: 'wifi',
      data: {
        ssid: 'TappleGuest',
        password: 'welcome2024',
        encryption: 'WPA2',
      },
    },
    description: 'WiFi credentials',
  },
  {
    category: 'input-types',
    name: 'email',
    input: {
      type: 'email',
      email: 'support@tapple.io',
      subject: 'QR Code Inquiry',
      body: 'Hello, I scanned your QR code!',
    },
    description: 'Email with subject/body',
  },
  {
    category: 'input-types',
    name: 'sms',
    input: {
      type: 'sms',
      phone: '+1-555-0199',
      message: 'Thanks for scanning!',
    },
    description: 'SMS message',
  },
  {
    category: 'input-types',
    name: 'phone',
    input: {
      type: 'phone',
      phone: '+1-800-TAPPLE',
    },
    description: 'Phone number',
  },
  {
    category: 'input-types',
    name: 'long-text',
    input: 'A'.repeat(150),
    description: 'Long text (150 chars, version 10)',
  },
  {
    category: 'input-types',
    name: 'unicode',
    input: '你好世界 🌍 Здравствуй мир',
    description: 'Unicode text',
  },

  // Category: Shapes
  {
    category: 'shapes',
    name: 'square-classic',
    input: 'Shape Test',
    options: {
      eyes: { shape: 'square' },
      dots: { shape: 'classic' },
    },
    description: 'Square eyes, classic dots',
  },
  {
    category: 'shapes',
    name: 'square-dots',
    input: 'Shape Test',
    options: {
      eyes: { shape: 'square' },
      dots: { shape: 'dots' },
    },
    description: 'Square eyes, round dots',
  },
  {
    category: 'shapes',
    name: 'square-square',
    input: 'Shape Test',
    options: {
      eyes: { shape: 'square' },
      dots: { shape: 'square' },
    },
    description: 'Square eyes, square dots',
  },
  {
    category: 'shapes',
    name: 'squircle-classic',
    input: 'Shape Test',
    options: {
      eyes: { shape: 'squircle' },
      dots: { shape: 'classic' },
    },
    description: 'Squircle eyes, classic dots',
  },
  {
    category: 'shapes',
    name: 'squircle-dots',
    input: 'Shape Test',
    options: {
      eyes: { shape: 'squircle' },
      dots: { shape: 'dots' },
    },
    description: 'Squircle eyes, round dots',
  },
  {
    category: 'shapes',
    name: 'squircle-square',
    input: 'Shape Test',
    options: {
      eyes: { shape: 'squircle' },
      dots: { shape: 'square' },
    },
    description: 'Squircle eyes, square dots',
  },

  // Category: Colors
  {
    category: 'colors',
    name: 'monochrome',
    input: 'Color Test',
    options: {
      backgroundColor: '#FFFFFF',
      eyes: { color: '#000000' },
      pupils: { color: '#000000' },
      dots: { color: '#000000' },
    },
    description: 'Black on white',
  },
  {
    category: 'colors',
    name: 'colorful',
    input: 'Color Test',
    options: {
      backgroundColor: '#FFEAA7',
      eyes: { color: '#D63031' },
      pupils: { color: '#0984E3' },
      dots: { color: '#6C5CE7' },
    },
    description: 'Multi-color design',
  },
  {
    category: 'colors',
    name: 'grayscale',
    input: 'Color Test',
    options: {
      backgroundColor: '#F5F5F5',
      eyes: { color: '#333333' },
      pupils: { color: '#666666' },
      dots: { color: '#999999' },
    },
    description: 'Grayscale palette',
  },
  {
    category: 'colors',
    name: 'high-contrast',
    input: 'Color Test',
    options: {
      backgroundColor: '#FFFF00',
      eyes: { color: '#FF0000' },
      pupils: { color: '#0000FF' },
      dots: { color: '#000000' },
    },
    description: 'High contrast colors',
  },

  // Category: Sizes
  {
    category: 'sizes',
    name: 'small',
    input: 'Size Test',
    options: { size: 200 },
    description: 'Small (200px)',
  },
  {
    category: 'sizes',
    name: 'medium',
    input: 'Size Test',
    options: { size: 500 },
    description: 'Medium (500px)',
  },
  {
    category: 'sizes',
    name: 'large',
    input: 'Size Test',
    options: { size: 1000 },
    description: 'Large (1000px)',
  },

  // Category: Borders
  {
    category: 'borders',
    name: 'none',
    input: 'Border Test',
    options: {
      border: { width: 0 },
    },
    description: 'No border',
  },
  {
    category: 'borders',
    name: 'square-solid',
    input: 'Border Test',
    options: {
      border: { cornerRadius: 0, width: 10, color: '#000000', style: 'solid' },
    },
    description: 'Square solid border',
  },
  {
    category: 'borders',
    name: 'squircle-dashed',
    input: 'Border Test',
    options: {
      border: { cornerRadius: 0.19, width: 15, color: '#0984E3', style: 'dashed' },
    },
    description: 'Squircle dashed border',
  },
  {
    category: 'borders',
    name: 'circle-solid',
    input: 'Border Test',
    options: {
      border: { cornerRadius: 0.5, width: 12, color: '#D63031', style: 'solid' },
    },
    description: 'Circle solid border',
  },

  // Category: Logo
  {
    category: 'logo',
    name: 'png-default',
    input: 'Logo Test',
    options: {
      logo: {
        src: pngToDataURL(DEMO_LOGO_PNG),
      },
    },
    description: 'PNG logo with default scale (20%)',
  },
  {
    category: 'logo',
    name: 'png-small',
    input: 'Logo Test',
    options: {
      logo: {
        src: pngToDataURL(DEMO_LOGO_PNG),
        scale: 0.15,
      },
    },
    description: 'PNG logo scaled to 15%',
  },
  {
    category: 'logo',
    name: 'png-large',
    input: 'Logo Test',
    options: {
      logo: {
        src: pngToDataURL(DEMO_LOGO_PNG),
        scale: 0.3,
      },
    },
    description: 'PNG logo scaled to 30% (max)',
  },
  {
    category: 'logo',
    name: 'svg-dataurl-default',
    input: 'Logo Test',
    options: {
      logo: {
        src: svgToDataURL(DEMO_LOGO_SVG),
      },
    },
    description: 'SVG data URL logo with default scale (20%)',
  },
  {
    category: 'logo',
    name: 'svg-dataurl-small',
    input: 'Logo Test',
    options: {
      logo: {
        src: svgToDataURL(DEMO_LOGO_SVG),
        scale: 0.15,
      },
    },
    description: 'SVG data URL logo scaled to 15%',
  },
  {
    category: 'logo',
    name: 'svg-dataurl-large',
    input: 'Logo Test',
    options: {
      logo: {
        src: svgToDataURL(DEMO_LOGO_SVG),
        scale: 0.3,
      },
    },
    description: 'SVG data URL logo scaled to 30% (max)',
  },
  {
    category: 'logo',
    name: 'svg-string-default',
    input: 'Logo Test',
    options: {
      logo: {
        src: svgToString(DEMO_LOGO_SVG),
      },
    },
    description: 'SVG raw string logo with default scale (20%)',
  },
  {
    category: 'logo',
    name: 'svg-string-small',
    input: 'Logo Test',
    options: {
      logo: {
        src: svgToString(DEMO_LOGO_SVG),
        scale: 0.15,
      },
    },
    description: 'SVG raw string logo scaled to 15%',
  },
  {
    category: 'logo',
    name: 'svg-string-large',
    input: 'Logo Test',
    options: {
      logo: {
        src: svgToString(DEMO_LOGO_SVG),
        scale: 0.3,
      },
    },
    description: 'SVG raw string logo scaled to 30% (max)',
  },
  {
    category: 'logo',
    name: 'logo-with-shapes',
    input: 'Logo Test',
    options: {
      eyes: { shape: 'squircle', color: '#667eea' },
      pupils: { color: '#764ba2' },
      dots: { shape: 'dots', color: '#333333' },
      logo: {
        src: pngToDataURL(DEMO_LOGO_PNG),
        scale: 0.25,
      },
    },
    description: 'Logo with custom shapes and colors',
  },
  {
    category: 'logo',
    name: 'logo-with-border',
    input: 'Logo Test',
    options: {
      border: { cornerRadius: 0.19, width: 12, color: '#667eea', style: 'solid' },
      logo: {
        src: pngToDataURL(DEMO_LOGO_PNG),
      },
    },
    description: 'Logo with border',
  },

  // Category: Edge Cases
  {
    category: 'edge-cases',
    name: 'zero-margin',
    input: 'Edge Case Test',
    options: { margin: 0 },
    description: 'Zero margin',
  },
  {
    category: 'edge-cases',
    name: 'max-data',
    input: 'A'.repeat(174),
    options: {},
    description: 'Maximum data capacity (v10)',
  },
  {
    category: 'edge-cases',
    name: 'scaled-dots',
    input: 'Edge Case Test',
    options: {
      dots: { scale: 1.25 },
    },
    description: 'Scaled dots (125%)',
  },
  {
    category: 'edge-cases',
    name: 'all-options',
    input: 'Kitchen Sink',
    options: {
      size: 600,
      margin: 32,
      backgroundColor: '#F0F0F0',
      eyes: { cornerRadius: 0.19, color: '#2D3436' },
      pupils: { color: '#0984E3' },
      dots: { shape: 'dots', color: '#6C5CE7', scale: 1.1 },
      border: { cornerRadius: 0.19, width: 10, color: '#DFE6E9', style: 'solid' },
    },
    description: 'All options combined',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getTimestamp() {
  const now = new Date();
  return now
    .toISOString()
    .replace(/T/, '-')
    .replace(/:/g, '-')
    .replace(/\..+/, '');
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function formatInput(input) {
  if (typeof input === 'string') {
    return input.length > 50 ? input.substring(0, 47) + '...' : input;
  }
  return JSON.stringify(input);
}

function pngToDataURL(filePath) {
  const buffer = readFileSync(filePath);
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

function svgToString(filePath) {
  return readFileSync(filePath, 'utf8');
}

function svgToDataURL(filePath) {
  const svgString = readFileSync(filePath, 'utf8');
  const base64 = Buffer.from(svgString).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function openBrowser(filePath) {
  const url = `file://${filePath}`;
  const os = platform();
  
  let command;
  if (os === 'darwin') {
    command = `open "${url}"`;
  } else if (os === 'win32') {
    command = `start "${url}"`;
  } else {
    // Linux
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`\n⚠️  Could not auto-open browser. Please manually open:\n${url}\n`);
    }
  });
}

// ============================================================================
// Node.js Output Generation
// ============================================================================

async function generateNodeOutputs(testCases, outputDir) {
  console.log('📦 Generating Node.js outputs...');
  
  const { genQrImage } = await import(DIST_NODE_PATH);
  
  for (const test of testCases) {
    const baseName = `${test.category}-${test.name}`;
    
    // Generate PNG
    try {
      const pngBuffer = await genQrImage(test.input, {
        size: 500,
        ...test.options,
        output: { format: 'png', type: 'buffer' },
      });
      const pngPath = join(outputDir, `${baseName}-png.png`);
      writeFileSync(pngPath, pngBuffer);
      console.log(`  ✓ ${baseName}-png.png`);
    } catch (error) {
      console.error(`  ✗ ${baseName}-png.png: ${error.message}`);
    }
    
    // Generate SVG
    try {
      const svgString = await genQrImage(test.input, {
        size: 500,
        ...test.options,
        output: { format: 'svg', type: 'string' },
      });
      const svgPath = join(outputDir, `${baseName}-svg.svg`);
      writeFileSync(svgPath, svgString);
      console.log(`  ✓ ${baseName}-svg.svg`);
    } catch (error) {
      console.error(`  ✗ ${baseName}-svg.svg: ${error.message}`);
    }
  }
  
  console.log('✅ Node.js outputs complete\n');
}

// ============================================================================
// Browser Output Generation
// ============================================================================

async function generateBrowserOutputs(testCases, outputDir) {
  console.log('🌐 Generating Browser outputs...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // NOTE: Port 3001 kept in sync with playwright.config.ts to avoid conflicts.
  // While route interception handles all content delivery, page.goto() still
  // attempts an initial connection. Using a clean, consistent port prevents
  // conflicts with other serve processes that may be running on port 3000.
  // Intercept all requests BEFORE navigating
  await page.route('**/*', async route => {
    const url = route.request().url();
    
    if (url.includes('/dist/browser.mjs')) {
      const { readFileSync } = await import('fs');
      const content = readFileSync(DIST_BROWSER_PATH, 'utf8');
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: content,
      });
    } else if (url === 'http://localhost:3001/' || url === 'http://localhost:3001') {
      // Serve the HTML page
      const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Browser Preview Generator</title>
</head>
<body>
  <script type="module">
    import { genQrImage } from '/dist/browser.mjs';
    window.genQrImage = genQrImage;
    window.ready = true;
  </script>
</body>
</html>`;
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: testHtml,
      });
    } else {
      await route.abort();
    }
  });
  
  // Now navigate
  await page.goto('http://localhost:3001/');
  await page.waitForFunction(() => window.ready, { timeout: 10000 });
  
  for (const test of testCases) {
    const baseName = `${test.category}-${test.name}`;
    
    // Generate PNG
    try {
      const pngDataURL = await page.evaluate(async ({ input, options }) => {
        return await window.genQrImage(input, {
          size: 500,
          ...options,
          output: { format: 'png', type: 'dataURL' },
        });
      }, { input: test.input, options: test.options || {} });
      
      // Convert dataURL to buffer
      const base64 = pngDataURL.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const pngPath = join(outputDir, `${baseName}-png.png`);
      writeFileSync(pngPath, buffer);
      console.log(`  ✓ ${baseName}-png.png`);
    } catch (error) {
      console.error(`  ✗ ${baseName}-png.png: ${error.message}`);
    }
    
    // Generate SVG
    try {
      const svgString = await page.evaluate(async ({ input, options }) => {
        return await window.genQrImage(input, {
          size: 500,
          ...options,
          output: { format: 'svg', type: 'string' },
        });
      }, { input: test.input, options: test.options || {} });
      
      const svgPath = join(outputDir, `${baseName}-svg.svg`);
      writeFileSync(svgPath, svgString);
      console.log(`  ✓ ${baseName}-svg.svg`);
    } catch (error) {
      console.error(`  ✗ ${baseName}-svg.svg: ${error.message}`);
    }
  }
  
  await browser.close();
  console.log('✅ Browser outputs complete\n');
}

// ============================================================================
// HTML Viewer Generation
// ============================================================================

function generateHTMLViewer(testCases, outputDir) {
  console.log('📄 Generating HTML viewer...');
  
  const categories = [...new Set(testCases.map(t => t.category))];
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Visual Preview</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }

    header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .controls {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .filter-group {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-group label {
      font-weight: 600;
      margin-right: 10px;
    }

    .filter-group select {
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }

    .filter-group select:hover {
      border-color: #667eea;
    }

    .stats {
      background: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      gap: 30px;
      align-items: center;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .stat-value {
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    .test-grid {
      display: grid;
      gap: 20px;
    }

    .test-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .test-header {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .test-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }

    .test-description {
      font-size: 14px;
      color: #666;
    }

    .test-input {
      font-size: 12px;
      color: #999;
      font-family: 'Courier New', monospace;
      margin-top: 5px;
      word-break: break-all;
    }

    .qr-comparison {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .qr-group {
      text-align: center;
    }

    .qr-group-title {
      font-size: 12px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .qr-pair {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .qr-item {
      flex: 1;
      text-align: center;
    }

    .qr-label {
      font-size: 11px;
      color: #999;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .qr-image {
      width: 100%;
      height: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .qr-image:hover {
      transform: scale(1.05);
      border-color: #667eea;
    }

    .category-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #667eea;
      color: white;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }

    .modal.active {
      display: flex;
    }

    .modal-content {
      max-width: 90%;
      max-height: 90%;
    }

    .modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      font-size: 40px;
      cursor: pointer;
      background: none;
      border: none;
    }

    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <header>
    <h1>🎨 QR Code Visual Preview</h1>
    <p>Manual review of QR code outputs across Node.js and Browser distributions</p>
  </header>

  <div class="controls">
    <div class="filter-group">
      <div>
        <label for="categoryFilter">Category:</label>
        <select id="categoryFilter">
          <option value="all">All Categories</option>
          ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('\n')}
        </select>
      </div>
      <div>
        <label for="formatFilter">Format:</label>
        <select id="formatFilter">
          <option value="all">All Formats</option>
          <option value="png">PNG Only</option>
          <option value="svg">SVG Only</option>
        </select>
      </div>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="stat-label">Total Tests:</span>
      <span class="stat-value" id="totalTests">${testCases.length}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Visible:</span>
      <span class="stat-value" id="visibleTests">${testCases.length}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Categories:</span>
      <span class="stat-value">${categories.length}</span>
    </div>
  </div>

  <div class="test-grid" id="testGrid">
    ${testCases.map(test => {
      const baseName = `${test.category}-${test.name}`;
      return `
    <div class="test-card" data-category="${test.category}" data-name="${test.name}">
      <div class="test-header">
        <span class="category-badge">${test.category}</span>
        <div class="test-title">${test.name}</div>
        <div class="test-description">${test.description}</div>
        <div class="test-input">Input: ${formatInput(test.input)}</div>
      </div>
      <div class="qr-comparison">
        <div class="qr-group">
          <div class="qr-group-title">Node.js</div>
          <div class="qr-pair">
            <div class="qr-item" data-format="png">
              <div class="qr-label">PNG</div>
              <img class="qr-image" src="node/${baseName}-png.png" alt="${baseName} Node PNG" onclick="openModal(this.src)">
            </div>
            <div class="qr-item" data-format="svg">
              <div class="qr-label">SVG</div>
              <img class="qr-image" src="node/${baseName}-svg.svg" alt="${baseName} Node SVG" onclick="openModal(this.src)">
            </div>
          </div>
        </div>
        <div class="qr-group">
          <div class="qr-group-title">Browser</div>
          <div class="qr-pair">
            <div class="qr-item" data-format="png">
              <div class="qr-label">PNG</div>
              <img class="qr-image" src="browser/${baseName}-png.png" alt="${baseName} Browser PNG" onclick="openModal(this.src)">
            </div>
            <div class="qr-item" data-format="svg">
              <div class="qr-label">SVG</div>
              <img class="qr-image" src="browser/${baseName}-svg.svg" alt="${baseName} Browser SVG" onclick="openModal(this.src)">
            </div>
          </div>
        </div>
      </div>
    </div>
      `;
    }).join('\n')}
  </div>

  <div class="modal" id="modal" onclick="closeModal()">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <img class="modal-content" id="modalImage">
  </div>

  <script>
    const categoryFilter = document.getElementById('categoryFilter');
    const formatFilter = document.getElementById('formatFilter');
    const testGrid = document.getElementById('testGrid');
    const visibleTestsSpan = document.getElementById('visibleTests');

    function filterTests() {
      const category = categoryFilter.value;
      const format = formatFilter.value;
      const cards = testGrid.querySelectorAll('.test-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const cardCategory = card.dataset.category;
        const categoryMatch = category === 'all' || cardCategory === category;
        
        if (categoryMatch) {
          card.classList.remove('hidden');
          
          // Show/hide format-specific items
          if (format !== 'all') {
            const items = card.querySelectorAll('.qr-item');
            items.forEach(item => {
              const itemFormat = item.dataset.format;
              if (itemFormat === format) {
                item.classList.remove('hidden');
              } else {
                item.classList.add('hidden');
              }
            });
          } else {
            const items = card.querySelectorAll('.qr-item');
            items.forEach(item => item.classList.remove('hidden'));
          }
          
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      visibleTestsSpan.textContent = visibleCount;
    }

    categoryFilter.addEventListener('change', filterTests);
    formatFilter.addEventListener('change', filterTests);

    function openModal(src) {
      const modal = document.getElementById('modal');
      const modalImage = document.getElementById('modalImage');
      modalImage.src = src;
      modal.classList.add('active');
    }

    function closeModal() {
      const modal = document.getElementById('modal');
      modal.classList.remove('active');
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;
  
  const htmlPath = join(outputDir, 'index.html');
  writeFileSync(htmlPath, html);
  console.log('✅ HTML viewer generated\n');
}

// ============================================================================
// Manifest Generation
// ============================================================================

function generateManifest(testCases, outputDir, timestamp) {
  const manifest = {
    timestamp,
    generated: new Date().toISOString(),
    testCount: testCases.length,
    categories: [...new Set(testCases.map(t => t.category))],
    tests: testCases.map(test => ({
      category: test.category,
      name: test.name,
      description: test.description,
      input: formatInput(test.input),
      options: test.options || {},
    })),
  };
  
  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('📋 Manifest generated\n');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Starting Visual Preview Generation\n');
  
  // Check if dist files exist
  if (!existsSync(DIST_NODE_PATH) || !existsSync(DIST_BROWSER_PATH)) {
    console.error('❌ Distribution files not found. Run `npm run build` first.');
    process.exit(1);
  }
  
  // Create output directories
  const timestamp = getTimestamp();
  const outputDir = join(OUTPUT_BASE, timestamp);
  const nodeDir = join(outputDir, 'node');
  const browserDir = join(outputDir, 'browser');
  
  ensureDir(nodeDir);
  ensureDir(browserDir);
  
  console.log(`📁 Output directory: ${outputDir}\n`);
  
  try {
    // Generate outputs
    await generateNodeOutputs(TEST_MATRIX, nodeDir);
    await generateBrowserOutputs(TEST_MATRIX, browserDir);
    
    // Generate HTML viewer and manifest
    generateHTMLViewer(TEST_MATRIX, outputDir);
    generateManifest(TEST_MATRIX, outputDir, timestamp);
    
    console.log('✨ Visual preview generation complete!\n');
    
    const htmlPath = join(outputDir, 'index.html');
    console.log(`🌐 Opening: file://${htmlPath}\n`);
    console.log('💡 Tip: Scan QR codes with your smartphone to verify scannability\n');
    
    // Auto-open browser
    openBrowser(htmlPath);
  } catch (error) {
    console.error('❌ Error during generation:', error);
    process.exit(1);
  }
}

main();
