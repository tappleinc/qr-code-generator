# Test Suite

Comprehensive test suite for the QR code generator library using Vitest.

## Running Tests

```bash
# Run all tests (source code)
npm test

# Run by category (faster, focused testing)
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E/scannability tests only
npm run test:fast          # Unit + Integration (skip slow e2e tests)

# Test built distribution packages (requires `npm run build`)
npm run test:dist          # Test all built bundles
npm run test:dist:node     # Test Node.js bundles only
npm run test:dist:browser  # Test browser bundle only (uses Playwright)

# Development modes
npm run test:watch         # Watch mode - reruns on file changes
npm run test:ui            # Interactive UI for exploring tests

# Run specific test file
npx vitest run test/unit/data-encoder.test.ts

# Run tests matching pattern
npx vitest run --grep "scannability"
```

**Recommended workflow:**
- During development: `npm run test:fast` (quick feedback loop)
- Before commit: `npm test` (full suite including visual validation)
- Debugging specific area: `npm run test:unit` or `npm run test:rendering`

## Test Organization

### 📁 **unit/** - Unit Tests (Fast, Isolated)
Tests individual modules and pure functions without external dependencies.

- **data-encoder.test.ts** - Mode detection, version calculation, data encoding
- **error-correction.test.ts** - Reed-Solomon EC, block interleaving
- **matrix-generation.test.ts** - Matrix generation, masking, function patterns (HIGH RISK MODULE)
- **constants.test.ts** - QR specification tables and lookup functions
- **encoding-modes.test.ts** - Encoding mode detection and selection
- **input-lengths.test.ts** - Input length validation and capacity checks
- **spec-validation.test.ts** - QR specification compliance tests

**Purpose**: Catch logic errors in isolated components. Fast execution (~100-200ms total).

---

### 📁 **integration/** - Integration Tests (Complete Pipeline)
Tests end-to-end functionality through the generation pipeline.

- **data-types.test.ts** - Structured content (URL, phone, email, WiFi, vCard, calendar)
- **options.test.ts** - Style options (size in pixels, margin in pixels, border width, colors, shapes)
- **rendering/** - Rendering output formats (subfolder)
  - **svg.test.ts** - SVG string/dataURL structure and validity
  - **png.test.ts** - PNG buffer/dataURL generation and binary format
  - **ascii.test.ts** - ASCII text rendering and character handling
  - **shapes.test.ts** - Eye frame and data dot shape variations

**Purpose**: Verify components work together correctly. Tests the `buildQRCodeConfig()` function and all output renderers.

---

### 📁 **e2e/** - End-to-End Tests (Scannability)
Tests actual QR code scanning using dual decoders (jsQR + @nuintun/qrcode).

- **scannability.test.ts** - End-to-end generate → render → scan validation

**Purpose**: **Most critical test** - verifies QR codes actually work with real scanners.
Tests representative samples across encoding modes, versions, and shape combinations.

---

### 📁 **dist/** - Distribution Package Tests
Tests built npm packages (`dist/`) to ensure packaging works correctly.

- **node-esm.test.ts** - Test `dist/node.mjs` (ESM, resvg PNG)
- **node-cjs.test.ts** - Test `dist/node.cjs` (CJS, resvg PNG)
- **browser-e2e.test.ts** - Test `dist/browser.mjs` in real browser (Playwright, Canvas PNG)

**Purpose**: Validates built artifacts work in target environments with correct exports and PNG generation.

---

### 📁 **helpers/** - Shared Test Utilities

- **qr-scanner.ts** - Dual QR scanner helper (jsQR + @nuintun/qrcode)

## Test Statistics

```
Source Tests (npm test):
- Test Files: 15
- Tests: 254
- Duration: ~6s

Dist Tests (npm run test:dist):
- Test Files: 3
- Tests: 26 (20 Node.js + 6 browser)
- Duration: ~3s
```

## Coverage

To run tests with coverage:

```bash
npx vitest run --coverage
```

**Note**: You'll need to install `@vitest/coverage-v8` first:

```bash
npm install -D @vitest/coverage-v8
```

Coverage excludes:
- `node_modules/`
- `dist/`
- `*.d.ts` files
- Config files

## Writing New Tests

### Unit Test Example:
```typescript
import { describe, it, expect } from 'vitest';
import { detectEncodingMode } from '../../src/internal/encoding/data-encoder';
import { EncodingMode } from '../../src/internal/core/types';

describe('Function Name', () => {
  it('should do specific thing', () => {
    const result = detectEncodingMode('123');
    expect(result).toBe(EncodingMode.NUMERIC);
  });
});
```

### Integration Test Example:
```typescript
import { describe, it, expect } from 'vitest';
import { buildQRCodeConfig } from '../../src/qrcode';

describe('Feature', () => {
  it('should handle use case', () => {
    const qr = buildQRCodeConfig('Test', false);
    expect(qr.version).toBe(1);
    expect(qr.matrix).toBeDefined();
  });
});
```

### E2E Test Example:
```typescript
import { describe, it, expect } from 'vitest';
import { buildQRCodeConfig } from '../../src/qrcode';
import { renderPNGBuffer } from '../../src/internal/rendering/png-renderer';
import { mergeImageOptions } from '../../src/internal/core/defaults';
import { ImageOptions } from '../../src/types';  // Public types from src/types
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

describe('Scannability', () => {
  it('should scan correctly', () => {
    // Merge options once - single source of truth
    const mergedOptions = mergeImageOptions({ size: 1000 });
    const qr = buildQRCodeConfig('Test', false);
    const buffer = renderPNGBuffer(qr, mergedOptions);
    const png = PNG.sync.read(Buffer.from(buffer));
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    
    expect(code?.data).toBe('Test');
  });
});
```

**Important Testing Pattern:**
- Import `mergeImageOptions` or `mergeTextOptions` from `src/internal/core/defaults.ts`
- Use public types from `src/types.ts`: `ImageOptions`, `TextOptions`, etc.
- Use internal types from `src/internal/core/types.ts`: `QRCodeConfig`, `ErrorCorrectionLevel`, etc.
- Call merge function once at entry point (single authority pattern)
- Pass merged options to internal functions
- Options are flat - no `style` wrapper: `{ eyes: { shape: ... } }` not `{ style: { eyes: ... } }`

## Test Guidelines

1. **Unit tests**: Test pure functions, no side effects, fast
2. **Integration tests**: Test complete workflows, verify components integrate, includes rendering output validation
3. **E2E tests**: Use sparingly (slow), test representative samples only - validates actual scannability

## Priority Order for New Tests

1. **E2E/scannability** - Does it actually work?
2. **Unit/input-lengths** - Correct version selection?
3. **Unit/matrix** - High-risk module per project docs
4. **Unit/encoding-modes** - Mode detection correct?
5. **Integration/rendering** - Output format validity

## Continuous Integration

All tests run on:
- Pre-commit (via git hooks if configured)
- Pull requests
- Main branch pushes

Target: All tests pass, >80% code coverage

