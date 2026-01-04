# Tapple QR Code Generator - Interactive Demo

This demo showcases all the customization options available in the `@tapple.io/qr-code-generator` library.

## Running the Demo

From the root of the repository:

```bash
npm run demo
```

This will:
1. Build the library (`npm run build`)
2. Start a local web server
3. Open the demo in your browser

## What You Can Test

The interactive demo allows you to customize:

### Content Options
- **QR Code Content**: Enter any text, URL, or structured data
- **Error Correction Level**: L (7%), M (15%), Q (25%), H (30%)

### Visual Styling
- **Size & Margin**: Adjust QR matrix pixel size and margin spacing (in pixels)
- **Colors**: Customize background, eyes, pupils, and dots with any CSS color format (hex, rgb, rgba, hsl, hsla, named colors)
- **Shapes**: Choose from multiple eye, dot, and border shapes
- **Dot Scale**: Fine-tune visual dot size (0.75-1.25)
- **Border**: Add decorative borders with custom shapes, widths (in pixels), and styles

### Advanced Features
- **Logo Embedding**: Add a logo to the center of your QR code
- **Logo Scale**: Control logo size (10-30% of QR width)
- **Format Support**: Download as PNG or SVG

## Implementation Notes

This demo:
- Imports from the **built package** (`../dist/index.mjs`), not source files
- Uses only the public API surface
- Demonstrates real-world usage patterns
- Validates that consumers will be able to use the library the same way

## Architecture

The demo is a **standalone HTML file** with:
- Zero build dependencies
- Vanilla JavaScript (no frameworks)
- Inline CSS for simplicity
- ES6 module imports from the built bundle

This approach ensures the demo is:
- Easy to run and modify
- Representative of actual library usage
- Simple for contributors to understand
- Compatible with any modern browser

## Testing Your Changes

After modifying the library:

1. Rebuild the library: `npm run build`
2. Refresh the demo page
3. Test the changes interactively

The demo automatically uses the latest build output.

## Links

- [Main Documentation](../README.md)
- [API Reference](../README.md#api)
- [GitHub Repository](https://github.com/tappleinc/qr-code-generator)
