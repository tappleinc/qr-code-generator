/**
 * Input Validation for Public API Options
 *
 * Validates user inputs and provides clear error messages.
 * Prevents runtime errors and ensures safe parameter values.
 */

import {
  ImageOptions,
  TextOptions,
  WiFiData,
  VCardData,
  CalendarData,
  QRInput,
} from '../../types';
import { DotShapes } from '../rendering/shapes';

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
// Schema-Based Validation Engine
// ============================================================================

type ValidationRule = {
  type:
    | 'number'
    | 'color'
    | 'enum'
    | 'string'
    | 'boolean'
    | 'logoSrc'
    | 'borderStyle';
  min?: number;
  max?: number | null;
  integer?: boolean;
  enumObj?: Record<string, unknown>;
  optional?: boolean;
};

type ValidationSchema = Record<string, ValidationRule>;

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return value;
}

/**
 * Normalize empty strings to undefined recursively
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEmptyStrings(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized: any = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in normalized) {
    if (normalized[key] === '') {
      normalized[key] = undefined;
    } else if (
      typeof normalized[key] === 'object' &&
      normalized[key] !== null
    ) {
      normalized[key] = normalizeEmptyStrings(normalized[key]);
    }
  }

  return normalized;
}

/**
 * Validate a single field against a rule
 */
function validateField(
  value: unknown,
  field: string,
  rule: ValidationRule
): ValidationError | null {
  // Skip validation if value is undefined and field is optional
  if (value === undefined && rule.optional) {
    return null;
  }

  switch (rule.type) {
    case 'number':
      return validateNumber(
        value,
        field,
        rule.min ?? 0,
        rule.max ?? null,
        rule.integer ?? false
      );
    case 'color':
      return validateColor(value, field);
    case 'enum':
      return validateEnum(value, field, rule.enumObj!);
    case 'string':
      if (typeof value !== 'string') {
        return { field, value, message: 'must be a string' };
      }
      return null;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field, value, message: 'must be a boolean' };
      }
      return null;
    case 'logoSrc':
      if (typeof value !== 'string' || !value) {
        return { field, value, message: 'must be a non-empty string' };
      }
      return validateLogoSrc(value, field);
    case 'borderStyle':
      if (
        typeof value !== 'string' ||
        (value !== 'solid' && value !== 'dashed' && value !== 'dotted' && value !== 'double')
      ) {
        return { field, value, message: 'must be "solid", "dashed", "dotted", or "double"' };
      }
      return null;
    default:
      return null;
  }
}

/**
 * Validate object against schema
 */
function validateSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  schema: ValidationSchema
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [path, rule] of Object.entries(schema)) {
    const value = getNestedValue(data, path);
    const err = validateField(value, path, rule);
    if (err) errors.push(err);
  }

  return errors;
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
 * Validate CSS color format
 * Supports: hex (#fff, #ffffff), rgb, rgba, hsl, hsla, and named colors
 */
function validateColor(value: unknown, field: string): ValidationError | null {
  if (typeof value !== 'string') {
    return { field, value, message: `must be a string` };
  }

  const trimmed = value.trim();

  // Hex colors: #fff or #ffffff
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) {
    return null;
  }

  // RGB/RGBA: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/
  );
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    const red = parseInt(r, 10);
    const green = parseInt(g, 10);
    const blue = parseInt(b, 10);

    if (
      red < 0 ||
      red > 255 ||
      green < 0 ||
      green > 255 ||
      blue < 0 ||
      blue > 255
    ) {
      return { field, value, message: `RGB values must be between 0-255` };
    }

    if (a !== undefined) {
      const alpha = parseFloat(a);
      if (isNaN(alpha) || alpha < 0 || alpha > 1) {
        return {
          field,
          value,
          message: `RGBA alpha value must be between 0-1`,
        };
      }
    }

    return null;
  }

  // HSL/HSLA: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = trimmed.match(
    /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/
  );
  if (hslMatch) {
    const [, h, s, l, a] = hslMatch;
    const hue = parseInt(h, 10);
    const sat = parseInt(s, 10);
    const light = parseInt(l, 10);

    if (hue < 0 || hue > 360) {
      return { field, value, message: `HSL hue must be between 0-360` };
    }

    if (sat < 0 || sat > 100 || light < 0 || light > 100) {
      return {
        field,
        value,
        message: `HSL saturation and lightness must be between 0-100%`,
      };
    }

    if (a !== undefined) {
      const alpha = parseFloat(a);
      if (isNaN(alpha) || alpha < 0 || alpha > 1) {
        return {
          field,
          value,
          message: `HSLA alpha value must be between 0-1`,
        };
      }
    }

    return null;
  }

  // Named colors - compact check using first letter filter + regex
  const lower = trimmed.toLowerCase();
  const validStart = /^[abcdefghilmnoprstvwy]/.test(lower);
  if (validStart) {
    // Check against common named colors using compact pattern matching
    const namedColorPattern =
      /^(aliceblue|antiquewhite|aqua(marine)?|azure|beige|bisque|black|blanchedalmond|blue(violet)?|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|dark(blue|cyan|goldenrod|gray|grey|green|khaki|magenta|olivegreen|orange|orchid|red|salmon|seagreen|slateblue|slategray|slategrey|turquoise|violet)|deep(pink|skyblue)|dim(gray|grey)|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold(enrod)?|gray|grey|green(yellow)?|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender(blush)?|lawngreen|lemonchiffon|light(blue|coral|cyan|goldenrodyellow|gray|grey|green|pink|salmon|seagreen|skyblue|slategray|slategrey|steelblue|yellow)|lime(green)?|linen|magenta|maroon|medium(aquamarine|blue|orchid|purple|seagreen|slateblue|springgreen|turquoise|violetred)|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive(drab)?|orange(red)?|orchid|pale(goldenrod|green|turquoise|violetred)|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slate(gray|grey)|snow|springgreen|steelblue|tan|teal|thistle|tomato|transparent|turquoise|violet|wheat|white(smoke)?|yellow(green)?)$/;

    if (namedColorPattern.test(lower)) {
      return null;
    }
  }

  // Invalid format
  return {
    field,
    value,
    message: `must be a valid CSS color (hex: #fff or #ffffff, rgb/rgba, hsl/hsla, or named color)`,
  };
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
    return { field, value, message: `must be one of: ${validValues}` };
  }
  return null;
}

/**
 * Validate logo src format (data URL or SVG string)
 */
function validateLogoSrc(value: string, field: string): ValidationError | null {
  const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/i;
  const isSvgString = value.trim().startsWith('<svg');

  if (!dataUrlRegex.test(value) && !isSvgString) {
    return {
      field,
      value: '[truncated]',
      message:
        'must be a data URL (data:image/...;base64,...) or SVG string (<svg...)',
    };
  }

  if (value.startsWith('data:')) {
    const parts = value.split(',');
    if (
      parts.length !== 2 ||
      !parts[1] ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(parts[1]) ||
      parts[1].length % 4 !== 0
    ) {
      return {
        field,
        value: '[truncated]',
        message: 'data URL contains invalid base64 encoding',
      };
    }
  }

  if (isSvgString && !value.includes('</svg>')) {
    return {
      field,
      value: '[truncated]',
      message: 'SVG string is incomplete (missing closing </svg> tag)',
    };
  }

  return null;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number format
 */
function isValidPhone(phone: string): boolean {
  return /^[\d\s\-+()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

/**
 * Validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse Date from Date object or ISO string
 */
function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
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
export function validateImageOptions(options: ImageOptions): ImageOptions {
  const normalized = normalizeEmptyStrings(options) as ImageOptions;

  const schema: ValidationSchema = {
    size: { type: 'number', min: 21, integer: true, optional: true },
    margin: { type: 'number', min: 0, integer: true, optional: true },
    backgroundColor: { type: 'color', optional: true },
    'eyes.cornerRadius': { type: 'number', min: 0, max: 0.5, optional: true },
    'eyes.color': { type: 'color', optional: true },
    'eyes.strokeWidth': { type: 'number', min: 0.9, max: 1.1, optional: true },
    'pupils.color': { type: 'color', optional: true },
    'dots.shape': { type: 'enum', enumObj: DotShapes, optional: true },
    'dots.color': { type: 'color', optional: true },
    'dots.scale': { type: 'number', min: 0.75, max: 1.25, optional: true },
    'border.cornerRadius': { type: 'number', min: 0, max: 0.5, optional: true },
    'border.color': { type: 'color', optional: true },
    'border.width': { type: 'number', min: 0, integer: true, optional: true },
    'border.style': { type: 'borderStyle', optional: true },
    'logo.scale': { type: 'number', min: 0.1, max: 0.3, optional: true },
  };

  const errors = validateSchema(normalized, schema);

  // Special handling for logo.src (required when logo provided)
  if (normalized.logo) {
    const err = validateField(normalized.logo.src, 'logo.src', {
      type: 'logoSrc',
      optional: false,
    });
    if (err) errors.push(err);
  }

  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }

  return normalized;
}

/**
 * Validate TextOptions before processing
 * Throws QRValidationError if any validation fails
 */
export function validateTextOptions(options: TextOptions): TextOptions {
  const normalized = normalizeEmptyStrings(options) as TextOptions;

  const schema: ValidationSchema = {
    margin: { type: 'number', min: 0, integer: true, optional: true },
    darkChar: { type: 'string', optional: true },
    lightChar: { type: 'string', optional: true },
  };

  const errors = validateSchema(normalized, schema);

  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }

  return normalized;
}

/**
 * Validate QRInput (string or structured content) before processing
 * Throws QRValidationError if any validation fails
 */
export function validateQRInput(input: unknown): void {
  const errors: ValidationError[] = [];

  if (typeof input === 'string') {
    if (!input) {
      errors.push({
        field: 'input',
        value: input,
        message: 'string input cannot be empty',
      });
    }
    if (errors.length > 0) {
      throw new QRValidationError(errors);
    }
    return;
  }

  if (!input || typeof input !== 'object' || !('type' in input)) {
    errors.push({
      field: 'input',
      value: input,
      message:
        'must be a string or structured content object with a type property',
    });
    throw new QRValidationError(errors);
  }

  const inputWithType = input as { type: unknown };

  switch (inputWithType.type) {
    case 'wifi':
      validateWiFiData(
        (input as Extract<QRInput, { type: 'wifi' }>).data,
        errors
      );
      break;
    case 'vcard':
      validateVCardData(
        (input as Extract<QRInput, { type: 'vcard' }>).data,
        errors
      );
      break;
    case 'calendar':
      validateCalendarData(
        (input as Extract<QRInput, { type: 'calendar' }>).data,
        errors
      );
      break;
    case 'email':
      validateEmailInput(input as object, errors);
      break;
    case 'sms':
      validateSMSInput(input as object, errors);
      break;
    case 'phone':
      validatePhoneInput(input as object, errors);
      break;
    case 'url':
      validateURLInput(input as object, errors);
      break;
    default:
      errors.push({
        field: 'input.type',
        value: inputWithType.type,
        message:
          'must be one of: url, vcard, wifi, calendar, email, sms, phone',
      });
  }

  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }
}

/**
 * Validate WiFi data structure
 */
function validateWiFiData(data: unknown, errors: ValidationError[]): void {
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'wifi.data',
      value: data,
      message: 'must be an object',
    });
    return;
  }

  const wifi = data as Partial<WiFiData>;

  if (!wifi.ssid || typeof wifi.ssid !== 'string' || !wifi.ssid.trim()) {
    errors.push({
      field: 'wifi.ssid',
      value: wifi.ssid,
      message: 'is required and must be non-empty',
    });
  }

  if (!wifi.password || typeof wifi.password !== 'string') {
    errors.push({
      field: 'wifi.password',
      value: wifi.password,
      message: 'is required and must be a string',
    });
  }

  if (wifi.encryption !== undefined) {
    const validEncryption: Array<WiFiData['encryption']> = [
      'WPA',
      'WPA2',
      'WEP',
      'nopass',
    ];
    if (!validEncryption.includes(wifi.encryption)) {
      errors.push({
        field: 'wifi.encryption',
        value: wifi.encryption,
        message: `must be one of: ${validEncryption.join(', ')}`,
      });
    }
  }

  if (wifi.hidden !== undefined && typeof wifi.hidden !== 'boolean') {
    errors.push({
      field: 'wifi.hidden',
      value: wifi.hidden,
      message: 'must be a boolean',
    });
  }
}

/**
 * Validate vCard data structure
 */
function validateVCardData(data: unknown, errors: ValidationError[]): void {
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'vcard.data',
      value: data,
      message: 'must be an object',
    });
    return;
  }

  const vcard = data as Partial<VCardData>;

  if (!vcard.name || typeof vcard.name !== 'string' || !vcard.name.trim()) {
    errors.push({
      field: 'vcard.name',
      value: vcard.name,
      message: 'is required and must be non-empty',
    });
  }

  if (
    vcard.email !== undefined &&
    (typeof vcard.email !== 'string' || !isValidEmail(vcard.email))
  ) {
    errors.push({
      field: 'vcard.email',
      value: vcard.email,
      message: 'must be a valid email address',
    });
  }

  if (
    vcard.phone !== undefined &&
    (typeof vcard.phone !== 'string' || !isValidPhone(vcard.phone))
  ) {
    errors.push({
      field: 'vcard.phone',
      value: vcard.phone,
      message: 'must be a valid phone number (e.g., +1-555-123-4567)',
    });
  }

  if (
    vcard.url !== undefined &&
    (typeof vcard.url !== 'string' || !isValidURL(vcard.url))
  ) {
    errors.push({
      field: 'vcard.url',
      value: vcard.url,
      message: 'must be a valid URL',
    });
  }

  if (vcard.address !== undefined && typeof vcard.address !== 'object') {
    errors.push({
      field: 'vcard.address',
      value: vcard.address,
      message: 'must be an object',
    });
  }
}

/**
 * Validate calendar data structure
 */
function validateCalendarData(data: unknown, errors: ValidationError[]): void {
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'calendar.data',
      value: data,
      message: 'must be an object',
    });
    return;
  }

  const calendar = data as Partial<CalendarData>;

  if (
    !calendar.title ||
    typeof calendar.title !== 'string' ||
    !calendar.title.trim()
  ) {
    errors.push({
      field: 'calendar.title',
      value: calendar.title,
      message: 'is required and must be non-empty',
    });
  }

  const startDate = parseDate(calendar.startDate);
  if (!startDate) {
    errors.push({
      field: 'calendar.startDate',
      value: calendar.startDate,
      message: 'is required and must be a valid Date object or ISO string',
    });
  }

  if (calendar.endDate !== undefined) {
    const endDate = parseDate(calendar.endDate);
    if (!endDate) {
      errors.push({
        field: 'calendar.endDate',
        value: calendar.endDate,
        message: 'must be a valid Date object or ISO string',
      });
    } else if (startDate && endDate < startDate) {
      errors.push({
        field: 'calendar.endDate',
        value: calendar.endDate,
        message: 'must be after startDate',
      });
    }
  }
}

/**
 * Validate email input
 */
function validateEmailInput(input: object, errors: ValidationError[]): void {
  const data = input as Partial<Extract<QRInput, { type: 'email' }>>;

  if (
    !data.email ||
    typeof data.email !== 'string' ||
    !isValidEmail(data.email)
  ) {
    errors.push({
      field: 'email.email',
      value: data.email,
      message: 'is required and must be a valid email address',
    });
  }

  if (data.subject !== undefined && typeof data.subject !== 'string') {
    errors.push({
      field: 'email.subject',
      value: data.subject,
      message: 'must be a string',
    });
  }

  if (data.body !== undefined && typeof data.body !== 'string') {
    errors.push({
      field: 'email.body',
      value: data.body,
      message: 'must be a string',
    });
  }
}

/**
 * Validate SMS input
 */
function validateSMSInput(input: object, errors: ValidationError[]): void {
  const data = input as Partial<Extract<QRInput, { type: 'sms' }>>;

  if (
    !data.phone ||
    typeof data.phone !== 'string' ||
    !isValidPhone(data.phone)
  ) {
    errors.push({
      field: 'sms.phone',
      value: data.phone,
      message: 'is required and must be a valid phone number',
    });
  }

  if (data.message !== undefined && typeof data.message !== 'string') {
    errors.push({
      field: 'sms.message',
      value: data.message,
      message: 'must be a string',
    });
  }
}

/**
 * Validate phone input
 */
function validatePhoneInput(input: object, errors: ValidationError[]): void {
  const data = input as Partial<Extract<QRInput, { type: 'phone' }>>;

  if (
    !data.phone ||
    typeof data.phone !== 'string' ||
    !isValidPhone(data.phone)
  ) {
    errors.push({
      field: 'phone.phone',
      value: data.phone,
      message: 'is required and must be a valid phone number',
    });
  }
}

/**
 * Validate URL input
 */
function validateURLInput(input: object, errors: ValidationError[]): void {
  const data = input as Partial<Extract<QRInput, { type: 'url' }>>;

  if (!data.url || typeof data.url !== 'string' || !isValidURL(data.url)) {
    errors.push({
      field: 'url.url',
      value: data.url,
      message: 'is required and must be a valid URL',
    });
  }
}
