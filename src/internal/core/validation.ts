/**
 * Input Validation for Public API Options
 *
 * Validates user inputs and provides clear error messages.
 * Prevents runtime errors and ensures safe parameter values.
 */

import { ImageOptions, TextOptions } from '../../types';
import { EyeFrameShapes, DotShapes, BorderShapes } from '../rendering/shapes';

// ============================================================================
// Types and Error Classes
// ============================================================================

export interface ValidationError {
  field: string;
  value: unknown;
  message: string;
}

/**
 * Custom error for validation failures
 * Contains array of all validation errors found
 */
export class QRValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const errorList = errors
      .map((e) => `  - ${e.field}: ${e.message}`)
      .join('\n');
    super(`QR Code validation failed:\n${errorList}`);
    this.name = 'QRValidationError';
    this.errors = errors;
  }
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate numeric option with bounds checking
 */
function validateNumber(
  value: unknown,
  field: string,
  min: number,
  max: number | null,
  mustBeInteger: boolean = false
): ValidationError | null {
  if (typeof value !== 'number' || !isFinite(value)) {
    return { field, value, message: `must be a finite number` };
  }
  if (mustBeInteger && !Number.isInteger(value)) {
    return { field, value, message: `must be an integer` };
  }
  if (value < min) {
    return { field, value, message: `must be at least ${min}` };
  }
  if (max !== null && value > max) {
    return { field, value, message: `must be at most ${max}` };
  }
  return null;
}

/**
 * Validate hex color format
 */
function validateColor(value: unknown, field: string): ValidationError | null {
  if (typeof value !== 'string') {
    return { field, value, message: `must be a string` };
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return {
      field,
      value,
      message: `must be a valid hex color (e.g., #000000)`,
    };
  }
  return null;
}

/**
 * Validate enum value against implementation keys
 */
function validateEnum<T extends Record<string, unknown>>(
  value: unknown,
  field: string,
  enumObj: T
): ValidationError | null {
  if (typeof value !== 'string') {
    return { field, value, message: `must be a string` };
  }
  if (!(value in enumObj)) {
    const validValues = Object.keys(enumObj).join(', ');
    return {
      field,
      value,
      message: `must be one of: ${validValues}`,
    };
  }
  return null;
}

// ============================================================================
// Public Validation Functions
// ============================================================================

/**
 * Validate ImageOptions before processing
 * Throws QRValidationError if any validation fails
 */
export function validateImageOptions(options: ImageOptions): void {
  const errors: ValidationError[] = [];

  // Size: minimum 21 pixels (smallest generally supported QR code), no max (let platform decide memory limits)
  if (options.size !== undefined) {
    const err = validateNumber(options.size, 'size', 21, null, true);
    if (err) errors.push(err);
  }

  // Margin: non-negative integer
  if (options.margin !== undefined) {
    const err = validateNumber(options.margin, 'margin', 0, null, true);
    if (err) errors.push(err);
  }

  // Background color
  if (options.backgroundColor !== undefined) {
    const err = validateColor(options.backgroundColor, 'backgroundColor');
    if (err) errors.push(err);
  }

  // Eyes
  if (options.eyes?.shape !== undefined) {
    const err = validateEnum(options.eyes.shape, 'eyes.shape', EyeFrameShapes);
    if (err) errors.push(err);
  }
  if (options.eyes?.color !== undefined) {
    const err = validateColor(options.eyes.color, 'eyes.color');
    if (err) errors.push(err);
  }

  // Pupils
  if (options.pupils?.color !== undefined) {
    const err = validateColor(options.pupils.color, 'pupils.color');
    if (err) errors.push(err);
  }

  // Dots
  if (options.dots?.shape !== undefined) {
    const err = validateEnum(options.dots.shape, 'dots.shape', DotShapes);
    if (err) errors.push(err);
  }
  if (options.dots?.color !== undefined) {
    const err = validateColor(options.dots.color, 'dots.color');
    if (err) errors.push(err);
  }
  if (options.dots?.scale !== undefined) {
    const err = validateNumber(
      options.dots.scale,
      'dots.scale',
      0.75,
      1.25,
      false
    );
    if (err) errors.push(err);
  }

  // Border
  if (options.border?.shape !== undefined) {
    // 'none' is a special case - not in BorderShapes but valid
    if (options.border.shape !== 'none') {
      const err = validateEnum(
        options.border.shape,
        'border.shape',
        BorderShapes
      );
      if (err) errors.push(err);
    }
  }
  if (options.border?.width !== undefined) {
    const err = validateNumber(
      options.border.width,
      'border.width',
      0,
      null,
      true
    );
    if (err) errors.push(err);
  }
  if (options.border?.color !== undefined) {
    const err = validateColor(options.border.color, 'border.color');
    if (err) errors.push(err);
  }
  if (options.border?.style !== undefined) {
    if (
      typeof options.border.style !== 'string' ||
      (options.border.style !== 'solid' && options.border.style !== 'dashed')
    ) {
      errors.push({
        field: 'border.style',
        value: options.border.style,
        message: 'must be either "solid" or "dashed"',
      });
    }
  }

  // Logo
  if (options.logo) {
    if (!options.logo.src || typeof options.logo.src !== 'string') {
      errors.push({
        field: 'logo.src',
        value: options.logo.src,
        message: 'must be a non-empty string',
      });
    }
    if (options.logo.scale !== undefined) {
      const err = validateNumber(
        options.logo.scale,
        'logo.scale',
        0.1,
        0.3,
        false
      );
      if (err) errors.push(err);
    }
  }

  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }
}

/**
 * Validate TextOptions before processing
 * Throws QRValidationError if any validation fails
 */
export function validateTextOptions(options: TextOptions): void {
  const errors: ValidationError[] = [];

  if (options.margin !== undefined) {
    const err = validateNumber(options.margin, 'margin', 0, null, true);
    if (err) errors.push(err);
  }

  if (options.darkChar !== undefined && typeof options.darkChar !== 'string') {
    errors.push({
      field: 'darkChar',
      value: options.darkChar,
      message: 'must be a string',
    });
  }

  if (
    options.lightChar !== undefined &&
    typeof options.lightChar !== 'string'
  ) {
    errors.push({
      field: 'lightChar',
      value: options.lightChar,
      message: 'must be a string',
    });
  }

  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }
}
