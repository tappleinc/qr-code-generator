# Tapple QR

A lightweight QR code generator with full TypeScript support. Generate QR codes as SVG, PNG, or ASCII with extensive customization options.

[![npm version](https://img.shields.io/npm/v/@tapple.io/qr-code-generator.svg)](https://www.npmjs.com/package/@tapple.io/qr-code-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**[🎨 Try the Interactive Demo →](https://tappleinc.github.io/qr-code-generator/demo/)**

## Features

- 🚀 **Platform-optimized architecture** - Zero browser dependencies (native Canvas API) + one Node.js dependency (`@resvg/resvg-js`)
- 🌐 **Universal API** - Identical API across Node.js, browsers, and bundlers (ESM & CommonJS)
- 🎯 **Multiple outputs** - Generate SVG, PNG (Buffer/DataURL), or ASCII art in any environment
- 🎨 **Highly customizable** - Control colors, shapes, borders, logos, and more
- 📱 **Smart formatting** - Built-in support for WiFi, vCards, URLs, SMS, and calendar events
- 🔒 **Type-safe** - Full TypeScript support with comprehensive type definitions
- ⚡ **Auto-optimized** - Automatic version selection, error correction, and mask patterns

## Installation

```bash
npm install @tapple.io/qr-code-generator
```

That's it! The package automatically provides platform-optimized bundles:

- **Browser**: Zero dependencies - uses native Canvas API
- **Node.js**: One dependency (`@resvg/resvg-js`) - installed automatically

**Why this matters:** Many QR libraries bundle heavy dependencies (2MB+) that work everywhere but bloat browser bundles. We use environment-specific implementations - Canvas API in browsers (built-in) and `@resvg/resvg-js` in Node.js - automatically delivering the optimal solution for your platform.

## Quick Start

The following examples work universally in both Node.js and browsers:

```typescript
import { genQrImage, genQrText } from '@tapple.io/qr-code-generator';

// Generate PNG buffer (default)
const pngBuffer = await genQrImage('https://tapple.io');

// Generate PNG data URL
const pngDataUrl = await genQrImage('https://tapple.io', {
  output: { format: 'png', type: 'dataURL' }
});

// Generate SVG string
const svg = await genQrImage('Hello World', {
  output: { format: 'svg', type: 'string' }
});

// Generate SVG data URL
const svgDataUrl = await genQrImage('Hello World', {
  output: { format: 'svg', type: 'dataURL' }
});

// Generate ASCII art (synchronous)
const ascii = genQrText('Terminal QR');
console.log(ascii);
```

### Platform-Specific Examples

#### Saving to File (Node.js)

```typescript
import { genQrImage } from '@tapple.io/qr-code-generator';
import fs from 'fs';

// Save PNG to file
const buffer = await genQrImage('https://www.qrcode.com/en/history/', {
  output: { format: 'png', type: 'buffer' }
});
fs.writeFileSync('qrcode.png', buffer);

// Save SVG to file
const svg = await genQrImage('https://www.qrcode.com/en/history/', {
  output: { format: 'svg', type: 'string' }
});
fs.writeFileSync('qrcode.svg', svg);
```

#### Using in HTML (Browser)

```typescript
import { genQrImage } from '@tapple.io/qr-code-generator';

// Display PNG as image (returns dataURL string)
const img = document.getElementById('qr-image');
img.src = await genQrImage('https://www.qrcode.com/en/history/', {
  output: { format: 'png', type: 'dataURL' }
});

// Or use SVG data URL
img.src = await genQrImage('https://www.qrcode.com/en/history/', {
  output: { format: 'svg', type: 'dataURL' }
});
```

## API Reference

### Render Functions

#### `genQrImage(input, options?)`

Generates a QR code image. Returns a Promise that resolves to the output format specified.

**Return types:**
- PNG buffer: `Buffer` (Node.js) or `Uint8Array` (browser)
- PNG dataURL: `string`
- SVG string: `string`
- SVG dataURL: `string`

```typescript
// Default: PNG buffer
const buffer = await genQrImage('https://en.wikipedia.org/wiki/QR_code');

// PNG data URL
const dataURL = await genQrImage('https://en.wikipedia.org/wiki/QR_code', {
  size: 400,
  output: { format: 'png', type: 'dataURL' }
});

// SVG string
const svg = await genQrImage('https://en.wikipedia.org/wiki/QR_code', {
  output: { format: 'svg', type: 'string' }
});

// SVG data URL
const svgDataURL = await genQrImage('https://en.wikipedia.org/wiki/QR_code', {
  output: { format: 'svg', type: 'dataURL' }
});
```

#### `genQrText(input, options?)`

Generates ASCII art representation. This function is synchronous.

```typescript
const ascii = genQrText('Hello', { 
  margin: 2,
  darkChar: '██',
  lightChar: '  '
});
```

## Customization Options

### Image Options (PNG & SVG)

```typescript
import { genQrImage, DotShape, BorderStyle } from '@tapple.io/qr-code-generator';

const options = {
  size: 300,                    // QR matrix size in pixels  
  margin: 24,                   // Margin in pixels
  backgroundColor: 'white',     // CSS color: hex, rgb, rgba, hsl, hsla, or named
  
  // Eye (position marker) styling
  eyes: {
    cornerRadius: 0.5,          // 0 = square, 0.5 = circle (default: 0.2)
    color: '#0066ff',           // Supports all CSS color formats
    strokeWidth: 1.0            // 0.9-1.1, controls border thickness (default: 1.0)
  },
  
  // Pupil (center of eyes) styling
  pupils: {
    color: 'rgb(0, 0, 0)'            // Can mix color formats
  },
  
  // Data dot styling
  dots: {
    shape: DotShape.DOTS,       // 'classic' | 'dots' | 'square'
    color: 'hsl(0, 0%, 0%)',    // HSL format supported
    scale: 1.0                  // 0.75 to 1.25
  },
  
  // Add a logo in the center
  logo: {
    src: 'data:image/png;base64,...',  // Data URL or SVG string
    scale: 0.2                         // 0.1 to 0.3 
  },
  
  // Border styling
  border: {
    cornerRadius: 0.19,           // 0 = square, 0.5 = circle, 0.19 = squircle (default: 0.04)
    width: 10,                    // Border width in pixels (default: 0 = no border)
    color: 'rgba(0, 0, 0, 0.8)',  // RGBA with transparency supported
    style: BorderStyle.SOLID      // 'solid' | 'dashed' | 'dotted' | 'double'
  },
  
  // Output configuration
  output: {
    format: 'png',               // 'png' | 'svg'
    type: 'buffer'               // 'buffer' | 'dataURL' for PNG; 'string' | 'dataURL' for SVG
  }
};

const qr = await genQrImage('https://en.wikipedia.org/wiki/QR_code', options);
```

### ImageOptions Reference

Complete reference for PNG and SVG rendering options:

| Option | Type | Default | Valid Range | Description |
|--------|------|---------|-------------|-------------|
| `size` | number | `300` | >= 21 | QR matrix size in pixels |
| `margin` | number | `24` | >= 0 | Spacing around QR code in pixels |
| `backgroundColor` | string | `'#ffffff'` | CSS color | Background color (supports hex, rgb/rgba, hsl/hsla, named colors) |
| **Eyes (Position Markers)** |
| `eyes.cornerRadius` | number | `0.2` | 0 - 0.5 | Corner radius scale: 0 = square, 0.5 = circle |
| `eyes.color` | string | `'#000000'` | CSS color | Color of eye frames (supports hex, rgb/rgba, hsl/hsla, named colors) |
| `eyes.strokeWidth` | number | `1.0` | 0.9 - 1.1 | Border thickness scale: 1.0 = standard, 1.1 = 10% thicker, 0.9 = 10% thinner |
| **Pupils (Eye Centers)** |
| `pupils.color` | string | `'#000000'` | CSS color | Color of pupil (inner square of eyes) |
| **Dots (Data Modules)** |
| `dots.shape` | enum | `'classic'` | `'classic'` \| `'dots'` \| `'square'` | Shape of data modules |
| `dots.color` | string | `'#000000'` | CSS color | Color of data modules |
| `dots.scale` | number | `1.0` | 0.75 - 1.25 | Visual size multiplier |
| **Logo** |
| `logo.src` | string | - | Data URL or SVG string | Image source |
| `logo.scale` | number | `0.2` | 0.1 - 0.3 | Logo size as percentage of QR width |
| **Border** |
| `border.cornerRadius` | number | `0.04` | 0 - 0.5 | Corner radius scale: 0 = square, 0.5 = circle, 0.19 = squircle |
| `border.width` | number | `0` | >=0 | Border thickness in pixels (0 = no border) |
| `border.color` | string | `'#000000'` | CSS color | Border color (supports hex, rgb/rgba, hsl/hsla, named colors) |
| `border.style` | enum | `'solid'` | `'solid'` \| `'dashed'` \| `'dotted'` \| `'double'` | Border line style |
| **Output** |
| `output.format` | enum | `'png'` | `'png'` \| `'svg'` | Output image format |
| `output.type` | enum | `'buffer'` | `'buffer'` \| `'dataURL'` (png), `'string'` \| `'dataURL'` (svg) | Output type |

> **Note:** Error correction level is automatically selected based on input length and logo presence (not user-configurable).

### Color Format Support

All color properties (`backgroundColor`, `eyes.color`, `pupils.color`, `dots.color`, `border.color`) support multiple CSS color formats:

#### Supported Formats

**Hexadecimal (3 or 6 digits)**
```typescript
backgroundColor: '#fff'      // 3-digit shorthand
backgroundColor: '#ffffff'   // 6-digit full
```

**RGB / RGBA**
```typescript
dots: { color: 'rgb(0, 0, 0)' }
dots: { color: 'rgba(0, 0, 0, 0.8)' }  // With transparency
```

**HSL / HSLA**
```typescript
eyes: { color: 'hsl(240, 100%, 50%)' }
eyes: { color: 'hsla(240, 100%, 50%, 0.9)' }  // With transparency
```

**Named Colors**
```typescript
backgroundColor: 'white'
dots: { color: 'black' }
border: { color: 'red' }
// Supports all 147 CSS3 named colors + 'transparent'
```

**Mixed Formats**
```typescript
// You can mix different formats in the same QR code
const qr = await genQrImage('Hello', {
  backgroundColor: 'white',
  eyes: { cornerRadius: 0.5, color: '#0066ff' },
  pupils: { color: 'rgb(0, 0, 0)' },
  dots: { color: 'hsl(0, 0%, 20%)' },
  border: { cornerRadius: 0.5, width: 10, color: 'rgba(0, 0, 0, 0.5)' }
});
```

> **Note on Transparency:** When using alpha channels (RGBA/HSLA), ensure sufficient contrast for QR code scannability. Alpha values below 0.8 may reduce scan reliability.

### TextOptions Reference

Options for ASCII text rendering:

| Option | Type | Default | Valid Range | Description |
|--------|------|---------|-------------|-------------|
| `margin` | number | `2` | >= 0 | Margin in modules (not pixels) |
| `darkChar` | string | `'██'` | Any string | Character(s) representing dark modules |
| `lightChar` | string | `'  '` | Any string | Character(s) representing light modules |

## Structured Content Types

### WiFi Network

```typescript
const qr = await genQrImage({
  type: 'wifi',
  data: {
    ssid: 'MyNetwork',
    password: 'SecurePassword123',
    encryption: 'WPA',    // 'WPA' | 'WPA2' | 'WEP' | 'nopass'
    hidden: false
  }
});
```

### Contact Card (vCard)

```typescript
const qr = await genQrImage({
  type: 'vcard',
  data: {
    name: 'John Doe',
    phone: '+1-555-123-4567',
    email: 'john@tapple.io',
    organization: 'Acme Corp',
    title: 'Software Engineer',
    url: 'https://johndoe.com',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA'
    }
  }
});
```

### Calendar Event

```typescript
const qr = await genQrImage({
  type: 'calendar',
  data: {
    title: 'Team Meeting',
    startDate: new Date('2024-12-30T14:00:00'),
    endDate: new Date('2024-12-30T15:00:00'),
    location: 'Conference Room A',
    description: 'Quarterly planning session'
  }
});
```

### Email, SMS, Phone

```typescript
// Email with subject and body
const emailQR = await genQrImage({
  type: 'email',
  email: 'support@tapple.io',
  subject: 'Support Request',
  body: 'I need help with...'
});

// SMS message
const smsQR = await genQrImage({
  type: 'sms',
  phone: '+1-555-123-4567',
  message: 'Hello from QR code!'
});

// Phone number
const phoneQR = await genQrImage({
  type: 'phone',
  phone: '+1-555-123-4567'
});
```

### URL (explicit)

```typescript
const qr = await genQrImage({
  type: 'url',
  url: 'https://en.wikipedia.org/wiki/Denso'
});

// Or just pass the URL directly:
const qr = await genQrImage('https://en.wikipedia.org/wiki/Denso');
```

## Enums

Import enums for type-safe customization:

```typescript
import { DotShape, BorderStyle } from '@tapple.io/qr-code-generator';

// Dot shapes
DotShape.CLASSIC  // Classic square modules
DotShape.DOTS     // Circular dots
DotShape.SQUARE   // Rounded squares

// Border styles
BorderStyle.SOLID   // Solid line
BorderStyle.DASHED  // Dashed line
BorderStyle.DOTTED  // Dotted line
BorderStyle.DOUBLE  // Double line (concentric strokes)
```

## Advanced Examples

### Custom Styled QR Code

```typescript
import { genQrImage, DotShape, BorderStyle } from '@tapple.io/qr-code-generator';

const styledQR = await genQrImage('https://en.wikipedia.org/wiki/Denso', {
  size: 500,
  margin: 30,
  backgroundColor: '#f8f9fa',
  eyes: {
    cornerRadius: 0.5,
    color: '#0066ff'
  },
  pupils: {
    color: '#ff6600'
  },
  dots: {
    shape: DotShape.DOTS,
    color: '#333333',
    scale: 0.9
  },
  border: {
    cornerRadius: 0.19,
    width: 15,
    color: '#0066ff',
    style: BorderStyle.SOLID
  },
  output: { format: 'png', type: 'dataURL' }
});
```

### QR Code with Logo

```typescript
import { genQrImage } from '@tapple.io/qr-code-generator';
import fs from 'fs';

// Load logo as data URL
const logoBuffer = fs.readFileSync('logo.png');
const logoDataURL = `data:image/png;base64,${logoBuffer.toString('base64')}`;

const qr = await genQrImage('https://en.wikipedia.org/wiki/QR_code', {
  size: 400,
  logo: {
    src: logoDataURL,
    scale: 0.25  // Logo takes up 25% of QR width
  },
  output: { format: 'png', type: 'dataURL' }
});
```

## Browser Usage

### Via Module Bundler (Recommended)

```typescript
import { genQrImage } from '@tapple.io/qr-code-generator';

const qr = await genQrImage('https://en.wikipedia.org/wiki/QR_code', {
  output: { format: 'png', type: 'dataURL' }
});
document.querySelector('#qr-image').src = qr;
```

### Via CDN (ESM)

```html
<script type="module">
  import { genQrImage } from 'https://cdn.jsdelivr.net/npm/@tapple.io/qr-code-generator/+esm';
  
  const qr = await genQrImage('https://tapple.io', {
    output: { format: 'png', type: 'dataURL' }
  });
  document.querySelector('#qr-image').src = qr;
</script>
```

## Technical Details

- **QR Versions**: Supports QR versions 1-10 (automatically selected based on input length)
- **Error Correction**: Levels L, M, Q, H (automatically optimized)
- **Encoding Modes**: Numeric, Alphanumeric, Byte (automatically detected)
- **Mask Patterns**: All 8 patterns with automatic penalty score optimization
- **Architecture**: SVG-first rendering with environment-specific raster conversion
  - **Browser**: Uses native Canvas API for SVG→PNG conversion
  - **Node.js**: Uses `@resvg/resvg-js` for high-quality SVG→PNG conversion

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { ImageOptions, QRInput, VCardData, OutputConfig } from '@tapple.io/qr-code-generator';

const options: ImageOptions = {
  size: 400,
  backgroundColor: '#ffffff',
  output: { format: 'svg', type: 'string' }
};

const input: QRInput = {
  type: 'vcard',
  data: { name: 'John Doe' }
};
```

## Performance

- **Small bundle size** - Zero browser dependencies means minimal footprint
- **Tree-shakeable** - Only import what you need with full ESM support
- **Efficient architecture** - SVG-first rendering with environment-specific raster conversion
- **No DOM dependency** - Works in Node.js, browsers, and Web Workers
- **Fast execution** - Optimized algorithms for matrix generation and mask selection


## Development

### Available Scripts

```bash
# Building
npm run build              # Full build (types + bundles)
npm run clean              # Remove build artifacts

# Testing
npm test                   # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end scannability tests
npm run test:dist         # Test built packages (requires build)
npm run test:fast         # Skip slow e2e tests
npm run test:watch        # Watch mode
npm run test:ui           # Interactive test UI

# Demo
npm run demo              # Build and serve interactive demo at localhost:8080

# Code Quality
npm run lint              # Check code for issues
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code with Prettier
npm run format:check      # Check formatting without changes
```

### Project Structure

```
src/
├── index.ts              - Public API exports
├── qrcode.ts            - Render function implementations
├── types.ts             - Public type definitions
└── internal/            - Private implementation
    ├── core/            - Constants, defaults, validation
    ├── encoding/        - Data encoding & error correction
    ├── matrix/          - QR matrix generation & masking
    └── rendering/       - Output format renderers
        ├── svg-renderer.ts       - SVG generation
        ├── ascii-renderer.ts     - ASCII text output
        ├── output-handler.ts     - Output routing (SVG/PNG)
        ├── svg-to-raster-browser.ts - Browser PNG converter (Canvas API)
        └── svg-to-raster-node.ts    - Node.js PNG converter (resvg)
```

## Testing

The library includes comprehensive test coverage:
- **Unit tests**: Core encoding, error correction, matrix generation
- **Integration tests**: Full pipeline rendering across all formats
- **E2E tests**: QR code scannability validation with dual decoders (jsQR + @nuintun/qrcode)
- **Distribution tests**: Validates built packages work in Node.js and browser environments

## Interactive Demo

The demo showcases real-time QR code generation with all available options including colors, shapes, borders, logos, and more.

**Try it locally:**

```bash
# Clone the repository
git clone https://github.com/tappleinc/qr-code-generator.git
cd qr-code-generator

# Install dependencies and run demo
npm install
npm run demo
```

Then open [http://localhost:8080/demo/](http://localhost:8080/demo/) in your browser.

**Quick try without cloning:**

You can also experiment using online playgrounds like [CodeSandbox](https://codesandbox.io) or [StackBlitz](https://stackblitz.com) by creating a new project and installing `@tapple.io/qr-code-generator`.

## License

MIT © [Tapple Inc.](https://github.com/tappleinc)

## Support

- 🐛 [Report Issues](https://github.com/tappleinc/qr-code-generator/issues)
- 📖 [View Documentation](https://github.com/tappleinc/qr-code-generator)
- 💬 Questions? Open an issue for discussion

---

Made with ❤️ by [Tapple.io](https://tapple.io)
