/**
 * Shared QR Code Scanning Utilities
 * 
 * Validates QR codes using multiple decoders to ensure broad compatibility.
 */

import jsQR from 'jsqr';
import { Decoder, Detector, binarize, grayscale } from '@nuintun/qrcode';
import { PNG } from 'pngjs';

export interface ScanResult {
  jsQRSuccess: boolean;
  nuintunSuccess: boolean;
  jsQRDecoded: string | null;
  nuintunDecoded: string | null;
  success: boolean; // Both scanners succeeded
}

/**
 * Scan a PNG buffer with both jsQR and @nuintun/qrcode decoders
 */
export function scanQRCode(buffer: Buffer | Uint8Array, expectedData: string): ScanResult {
  const png = PNG.sync.read(Buffer.from(buffer));
  
  // Test with jsQR
  const jsQRResult = jsQR(
    new Uint8ClampedArray(png.data),
    png.width,
    png.height,
    { inversionAttempts: 'attemptBoth' }
  );
  const jsQRSuccess = jsQRResult !== null && jsQRResult.data === expectedData;
  const jsQRDecoded = jsQRResult?.data ?? null;
  
  // Test with @nuintun/qrcode
  let nuintunSuccess = false;
  let nuintunDecoded: string | null = null;
  
  try {
    const imageData = {
      data: new Uint8ClampedArray(png.data),
      width: png.width,
      height: png.height
    };
    
    const luminances = grayscale(imageData as ImageData);
    const binarized = binarize(luminances, png.width, png.height);
    const detector = new Detector();
    const detected = detector.detect(binarized);
    const decoder = new Decoder();
    
    let current = detected.next();
    
    while (!current.done && !nuintunSuccess) {
      try {
        const detect = current.value;
        const decoded = decoder.decode(detect.matrix);
        nuintunDecoded = decoded.content;
        nuintunSuccess = decoded.content === expectedData;
        
        if (nuintunSuccess) break;
      } catch {
        // Try next detection
      }
      
      current = detected.next();
    }
  } catch {
    nuintunSuccess = false;
  }
  
  return {
    jsQRSuccess,
    nuintunSuccess,
    jsQRDecoded,
    nuintunDecoded,
    success: jsQRSuccess && nuintunSuccess
  };
}
