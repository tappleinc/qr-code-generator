/**
 * Generate PNG files for failed scannability tests
 * Saves QR codes to /tmp for manual inspection
 */

import { writeFileSync } from 'fs';
import { genQrImage } from '../../src/index';
import { DotShape, ImageOptions } from '../../src/types';

interface TestCase {
  name: string;
  input: string;
  options?: ImageOptions;
}

const failedTests: TestCase[] = [
  {
    name: 'circular-dots',
    input: 'Dot test',
    options: { dots: { shape: DotShape.DOTS } }
  },
  {
    name: 'square-dots',
    input: 'Dot test',
    options: { dots: { shape: DotShape.SQUARE } }
  },
  {
    name: 'rounded-eyes-circular-dots',
    input: 'Combo test',
    options: {
      eyes: { cornerRadius: 0.25 },
      dots: { shape: DotShape.DOTS }
    }
  }
];

console.log('Generating failed test QR codes...\n');

async function generateTests() {
  for (const test of failedTests) {
    try {
      const buffer = await genQrImage(test.input, {
        size: 1000,
        output: { format: 'png', type: 'buffer' },
        ...test.options
      }) as Uint8Array | Buffer;
      
      const filename = `/tmp/qr-failed-${test.name}.png`;
      writeFileSync(filename, buffer);
      
      console.log(`✓ Generated: ${filename}`);
      console.log(`  Input: "${test.input}"`);
      console.log(`  Options: ${JSON.stringify(test.options)}`);
      console.log();
    } catch (error) {
      console.error(`✗ Failed to generate ${test.name}:`, error);
      console.log();
    }
  }

  console.log('Done! Files saved to /tmp/qr-failed-*.png');
}

generateTests();
