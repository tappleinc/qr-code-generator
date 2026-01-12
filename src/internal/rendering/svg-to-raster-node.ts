/**
 * Node.js SVG to Raster Converter
 *
 * Uses @resvg/resvg-js for SVG → PNG conversion.
 * This is the only file that imports resvg.
 */

import { MergedImageOptions } from '../core/defaults';

// Type for resvg's Resvg class
interface ResvgInstance {
  render(): { asPng(): Uint8Array };
}

interface ResvgConstructor {
  new (
    svg: string,
    options: { fitTo: { mode: string; value: number } }
  ): ResvgInstance;
}

let ResvgClass: ResvgConstructor | null = null;
let importAttempted = false;

async function getResvg(): Promise<ResvgConstructor> {
  if (ResvgClass) {
    return ResvgClass;
  }

  if (importAttempted) {
    throw new Error(
      'PNG generation in Node.js requires @resvg/resvg-js. ' +
        'Install with: npm install @resvg/resvg-js'
    );
  }

  importAttempted = true;
  try {
    const resvgModule = await import('@resvg/resvg-js');
    ResvgClass = resvgModule.Resvg as unknown as ResvgConstructor;
    return ResvgClass;
  } catch {
    throw new Error(
      'PNG generation in Node.js requires @resvg/resvg-js. ' +
        'Install with: npm install @resvg/resvg-js'
    );
  }
}

export async function convertSvgToRaster(
  svgString: string,
  options: MergedImageOptions
): Promise<string | Buffer> {
  const { output, size, margin, border } = options;

  // Calculate total dimensions
  const borderWidth = border.width;
  const totalSize = size + 2 * margin + 2 * borderWidth;

  // Get resvg (lazy load)
  const Resvg = await getResvg();

  // Render PNG with resvg
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: totalSize,
    },
  });

  const rendered = resvg.render();
  const pngData = rendered.asPng();
  const pngBuffer = Buffer.from(pngData);

  // Return based on type
  if (output.type === 'dataURL') {
    const base64 = pngBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  }

  return pngBuffer; // type === 'buffer'
}
