/**
 * Default Options and Merge Utilities
 *
 * Single source of truth for all default styling values.
 * Provides merge functions to combine user options with defaults,
 * ensuring complete option objects throughout the pipeline.
 *
 * This eliminates code duplication and makes defaults easy to maintain.
 */

import {
  ImageOptions,
  TextOptions,
  BorderShape,
  BorderStyle,
  OutputConfig,
} from '../../types';
import { validateImageOptions, validateTextOptions } from './validation';

// ============================================================================
// Default Values - Image Rendering (PNG/SVG)
// ============================================================================

/**
 * Default style options for image-based rendering (PNG/SVG)
 */
export const DEFAULT_IMAGE_OPTIONS = {
  size: 300,
  margin: 24,
  backgroundColor: '#ffffff',
  eyes: {
    shape: 'square' as 'square' | 'squircle',
    color: '#000000',
  },
  pupils: {
    color: '#000000',
  },
  dots: {
    shape: 'classic' as 'classic' | 'dots' | 'square',
    color: '#000000',
    scale: 1.0,
  },
  logo: {
    scale: 0.2, // 20% of QR code size - safe default with EC level H (30% error recovery)
    // Allows logo to cover ~12-15% of modules while maintaining scannability
    // Maximum recommended: 0.3 (30%) with high error correction
  },
  border: {
    shape: BorderShape.NONE,
    width: 10,
    color: '#000000',
    style: BorderStyle.SOLID,
  },
  output: {
    format: 'png' as const,
    type: 'buffer' as const,
  },
} as const;

/**
 * Type for fully merged image options (all required fields + optional logo)
 */
export type MergedImageOptions = {
  size: number;
  margin: number;
  backgroundColor: string;
  eyes: {
    shape: 'square' | 'squircle';
    color: string;
  };
  pupils: {
    color: string;
  };
  dots: {
    shape: 'classic' | 'dots' | 'square';
    color: string;
    scale: number;
  };
  logo?: {
    src: string;
    scale: number; // Always required after merge
  };
  border: {
    shape: BorderShape;
    width: number;
    color: string;
    style: BorderStyle;
  };
  output: OutputConfig;
};

// ============================================================================
// Default Values - Text Rendering (ASCII)
// ============================================================================

/**
 * Default style options for text-based rendering (ASCII)
 */
export const DEFAULT_TEXT_OPTIONS = {
  margin: 2,
  darkChar: '██',
  lightChar: '  ',
} as const;

/**
 * Type for fully merged text options (all fields required)
 */
export type MergedTextOptions = {
  margin: number;
  darkChar: string;
  lightChar: string;
};

// ============================================================================
// Merge Functions
// ============================================================================

/**
 * Merge user-provided image options with defaults
 * Returns a complete options object with all fields populated
 * @throws {QRValidationError} If validation fails
 */
export function mergeImageOptions(options?: ImageOptions): MergedImageOptions {
  if (!options) {
    // Return defaults without logo (logo requires src which has no default)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo, ...defaults } = DEFAULT_IMAGE_OPTIONS;
    return defaults as MergedImageOptions;
  }

  // Validate and normalize options before merging
  const normalized = validateImageOptions(options);

  const result: MergedImageOptions = {
    size: normalized.size ?? DEFAULT_IMAGE_OPTIONS.size,
    margin: normalized.margin ?? DEFAULT_IMAGE_OPTIONS.margin,
    backgroundColor:
      normalized.backgroundColor ?? DEFAULT_IMAGE_OPTIONS.backgroundColor,
    eyes: {
      shape: normalized.eyes?.shape ?? DEFAULT_IMAGE_OPTIONS.eyes.shape,
      color: normalized.eyes?.color ?? DEFAULT_IMAGE_OPTIONS.eyes.color,
    },
    pupils: {
      color: normalized.pupils?.color ?? DEFAULT_IMAGE_OPTIONS.pupils.color,
    },
    dots: {
      shape: normalized.dots?.shape ?? DEFAULT_IMAGE_OPTIONS.dots.shape,
      color: normalized.dots?.color ?? DEFAULT_IMAGE_OPTIONS.dots.color,
      scale: normalized.dots?.scale ?? DEFAULT_IMAGE_OPTIONS.dots.scale,
    },
    logo: normalized.logo
      ? {
          src: normalized.logo.src,
          scale: normalized.logo.scale ?? DEFAULT_IMAGE_OPTIONS.logo.scale,
        }
      : undefined,
    border: {
      shape: normalized.border?.shape ?? DEFAULT_IMAGE_OPTIONS.border.shape,
      width: normalized.border?.width ?? DEFAULT_IMAGE_OPTIONS.border.width,
      color: normalized.border?.color ?? DEFAULT_IMAGE_OPTIONS.border.color,
      style: normalized.border?.style ?? DEFAULT_IMAGE_OPTIONS.border.style,
    },
    output: normalized.output ?? DEFAULT_IMAGE_OPTIONS.output,
  };

  return result;
}

/**
 * Merge user-provided text options with defaults
 * Returns a complete options object with all fields populated
 * @throws {QRValidationError} If validation fails
 */
export function mergeTextOptions(options?: TextOptions): MergedTextOptions {
  if (!options) return { ...DEFAULT_TEXT_OPTIONS };

  // Validate and normalize options before merging
  const normalized = validateTextOptions(options);

  return {
    margin: normalized.margin ?? DEFAULT_TEXT_OPTIONS.margin,
    darkChar: normalized.darkChar ?? DEFAULT_TEXT_OPTIONS.darkChar,
    lightChar: normalized.lightChar ?? DEFAULT_TEXT_OPTIONS.lightChar,
  };
}
