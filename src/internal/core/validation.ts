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
// Normalization Functions
// ============================================================================

/**
 * Normalize empty strings to undefined for ImageOptions
 * Returns a new object without mutating the input
 */
function normalizeImageOptions(options: ImageOptions): ImageOptions {
  const normalized: ImageOptions = { ...options };
  
  if (normalized.backgroundColor === '') {
    normalized.backgroundColor = undefined;
  }
  
  if (normalized.eyes) {
    normalized.eyes = { ...normalized.eyes };
    if ((normalized.eyes.shape as any) === '') normalized.eyes.shape = undefined;
    if (normalized.eyes.color === '') normalized.eyes.color = undefined;
  }
  
  if (normalized.pupils) {
    normalized.pupils = { ...normalized.pupils };
    if (normalized.pupils.color === '') normalized.pupils.color = undefined;
  }
  
  if (normalized.dots) {
    normalized.dots = { ...normalized.dots };
    if ((normalized.dots.shape as any) === '') normalized.dots.shape = undefined;
    if (normalized.dots.color === '') normalized.dots.color = undefined;
  }
  
  if (normalized.border) {
    normalized.border = { ...normalized.border };
    if ((normalized.border.shape as any) === '') normalized.border.shape = undefined;
    if (normalized.border.color === '') normalized.border.color = undefined;
    if ((normalized.border.style as any) === '') normalized.border.style = undefined;
  }
  
  // Note: logo.src is intentionally NOT normalized - it's a required field when logo is provided
  
  return normalized;
}

/**
 * Normalize empty strings to undefined for TextOptions
 * Returns a new object without mutating the input
 */
function normalizeTextOptions(options: TextOptions): TextOptions {
  const normalized: TextOptions = { ...options };
  
  if (normalized.darkChar === '') {
    normalized.darkChar = undefined;
  }
  
  if (normalized.lightChar === '') {
    normalized.lightChar = undefined;
  }
  
  return normalized;
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
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (hexPattern.test(trimmed)) {
    return null;
  }

  // RGB/RGBA: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbPattern = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
  const rgbMatch = trimmed.match(rgbPattern);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    const red = parseInt(r, 10);
    const green = parseInt(g, 10);
    const blue = parseInt(b, 10);
    
    if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
      return {
        field,
        value,
        message: `RGB values must be between 0-255`,
      };
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
  const hslPattern = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/;
  const hslMatch = trimmed.match(hslPattern);
  if (hslMatch) {
    const [, h, s, l, a] = hslMatch;
    const hue = parseInt(h, 10);
    const sat = parseInt(s, 10);
    const light = parseInt(l, 10);
    
    if (hue < 0 || hue > 360) {
      return {
        field,
        value,
        message: `HSL hue must be between 0-360`,
      };
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

  // Named colors (CSS Level 3 standard colors + transparent)
  const namedColors = [
    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
    'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
    'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
    'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgrey', 'darkgreen', 'darkkhaki',
    'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
    'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
    'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
    'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
    'gray', 'grey', 'green', 'greenyellow', 'honeydew', 'hotpink', 'indianred', 'indigo',
    'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
    'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgrey', 'lightgreen',
    'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
    'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta',
    'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
    'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
    'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
    'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
    'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink',
    'plum', 'powderblue', 'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
    'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
    'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle',
    'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
    'transparent'
  ];
  
  if (namedColors.includes(trimmed.toLowerCase())) {
    return null;
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
    return {
      field,
      value,
      message: `must be one of: ${validValues}`,
    };
  }
  return null;
}

/**
 * Validate logo src format (data URL or SVG string)
 */
function validateLogoSrc(value: string, field: string): ValidationError | null {
  // Check for data URL format
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

  // For data URLs: validate base64 encoding
  if (value.startsWith('data:')) {
    const parts = value.split(',');
    if (parts.length !== 2) {
      return {
        field,
        value: '[truncated]',
        message: 'data URL format is invalid (missing comma separator)',
      };
    }
    const base64Part = parts[1];
    if (!base64Part || !isValidBase64(base64Part)) {
      return {
        field,
        value: '[truncated]',
        message: 'data URL contains invalid base64 encoding',
      };
    }
  }

  // For SVG strings: basic validation
  if (isSvgString) {
    if (!value.includes('</svg>')) {
      return {
        field,
        value: '[truncated]',
        message: 'SVG string is incomplete (missing closing </svg> tag)',
      };
    }
  }

  return null;
}

/**
 * Validate base64 encoding
 */
function isValidBase64(str: string): boolean {
  try {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str) && str.length % 4 === 0;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
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

// ============================================================================
// Public Validation Functions
// ============================================================================

/**
 * Validate ImageOptions before processing
 * Throws QRValidationError if any validation fails
 */
export function validateImageOptions(options: ImageOptions): ImageOptions {
  // Normalize empty strings to undefined first
  const normalized = normalizeImageOptions(options);
  
  const errors: ValidationError[] = [];

  // Size: minimum 21 pixels (smallest generally supported QR code), no max (let platform decide memory limits)
  if (normalized.size !== undefined) {
    const err = validateNumber(normalized.size, 'size', 21, null, true);
    if (err) errors.push(err);
  }

  // Margin: non-negative integer
  if (normalized.margin !== undefined) {
    const err = validateNumber(normalized.margin, 'margin', 0, null, true);
    if (err) errors.push(err);
  }

  // Background color
  if (normalized.backgroundColor !== undefined) {
    const err = validateColor(normalized.backgroundColor, 'backgroundColor');
    if (err) errors.push(err);
  }

  // Eyes
  if (normalized.eyes?.shape !== undefined) {
    const err = validateEnum(normalized.eyes.shape, 'eyes.shape', EyeFrameShapes);
    if (err) errors.push(err);
  }
  if (normalized.eyes?.color !== undefined) {
    const err = validateColor(normalized.eyes.color, 'eyes.color');
    if (err) errors.push(err);
  }

  // Pupils
  if (normalized.pupils?.color !== undefined) {
    const err = validateColor(normalized.pupils.color, 'pupils.color');
    if (err) errors.push(err);
  }

  // Dots
  if (normalized.dots?.shape !== undefined) {
    const err = validateEnum(normalized.dots.shape, 'dots.shape', DotShapes);
    if (err) errors.push(err);
  }
  if (normalized.dots?.color !== undefined) {
    const err = validateColor(normalized.dots.color, 'dots.color');
    if (err) errors.push(err);
  }
  if (normalized.dots?.scale !== undefined) {
    const err = validateNumber(
      normalized.dots.scale,
      'dots.scale',
      0.75,
      1.25,
      false
    );
    if (err) errors.push(err);
  }

  // Border
  if (normalized.border?.shape !== undefined) {
    // 'none' is a special case - not in BorderShapes but valid
    if (normalized.border.shape !== 'none') {
      const err = validateEnum(
        normalized.border.shape,
        'border.shape',
        BorderShapes
      );
      if (err) errors.push(err);
    }
  }
  if (normalized.border?.width !== undefined) {
    const err = validateNumber(
      normalized.border.width,
      'border.width',
      0,
      null,
      true
    );
    if (err) errors.push(err);
  }
  if (normalized.border?.color !== undefined) {
    const err = validateColor(normalized.border.color, 'border.color');
    if (err) errors.push(err);
  }
  if (normalized.border?.style !== undefined) {
    if (
      typeof normalized.border.style !== 'string' ||
      (normalized.border.style !== 'solid' && normalized.border.style !== 'dashed')
    ) {
      errors.push({
        field: 'border.style',
        value: normalized.border.style,
        message: 'must be either "solid" or "dashed"',
      });
    }
  }

  // Logo
  if (normalized.logo) {
    if (!normalized.logo.src || typeof normalized.logo.src !== 'string') {
      errors.push({
        field: 'logo.src',
        value: normalized.logo.src,
        message: 'must be a non-empty string',
      });
    } else {
      // Validate logo src format
      const err = validateLogoSrc(normalized.logo.src, 'logo.src');
      if (err) errors.push(err);
    }
    if (normalized.logo.scale !== undefined) {
      const err = validateNumber(
        normalized.logo.scale,
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
  
  return normalized;
}

/**
 * Validate TextOptions before processing
 * Throws QRValidationError if any validation fails
 */
export function validateTextOptions(options: TextOptions): TextOptions {
  // Normalize empty strings to undefined first
  const normalized = normalizeTextOptions(options);
  
  const errors: ValidationError[] = [];

  if (normalized.margin !== undefined) {
    const err = validateNumber(normalized.margin, 'margin', 0, null, true);
    if (err) errors.push(err);
  }

  if (normalized.darkChar !== undefined && typeof normalized.darkChar !== 'string') {
    errors.push({
      field: 'darkChar',
      value: normalized.darkChar,
      message: 'must be a string',
    });
  }

  if (
    normalized.lightChar !== undefined &&
    typeof normalized.lightChar !== 'string'
  ) {
    errors.push({
      field: 'lightChar',
      value: normalized.lightChar,
      message: 'must be a string',
    });
  }

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

  // String input validation
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

  // Structured input validation - must be an object with a type property
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
    case 'wifi': {
      const wifiInput = input as Extract<QRInput, { type: 'wifi' }>;
      validateWiFiData(wifiInput.data, errors);
      break;
    }
    case 'vcard': {
      const vcardInput = input as Extract<QRInput, { type: 'vcard' }>;
      validateVCardData(vcardInput.data, errors);
      break;
    }
    case 'calendar': {
      const calendarInput = input as Extract<QRInput, { type: 'calendar' }>;
      validateCalendarData(calendarInput.data, errors);
      break;
    }
    case 'email': {
      const emailInput = input as Extract<QRInput, { type: 'email' }>;
      validateEmailInput(emailInput, errors);
      break;
    }
    case 'sms': {
      const smsInput = input as Extract<QRInput, { type: 'sms' }>;
      validateSMSInput(smsInput, errors);
      break;
    }
    case 'phone': {
      const phoneInput = input as Extract<QRInput, { type: 'phone' }>;
      validatePhoneInput(phoneInput, errors);
      break;
    }
    case 'url': {
      const urlInput = input as Extract<QRInput, { type: 'url' }>;
      validateURLInput(urlInput, errors);
      break;
    }
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
  // Runtime check: ensure data is an object
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'wifi.data',
      value: data,
      message: 'must be an object',
    });
    return;
  }

  // Use Partial since we're validating potentially incomplete data
  const wifi = data as Partial<WiFiData>;

  // Validate ssid
  if (!wifi.ssid || typeof wifi.ssid !== 'string' || !wifi.ssid.trim()) {
    errors.push({
      field: 'wifi.ssid',
      value: wifi.ssid,
      message: 'is required and must be non-empty',
    });
  }

  // Validate password
  if (!wifi.password || typeof wifi.password !== 'string') {
    errors.push({
      field: 'wifi.password',
      value: wifi.password,
      message: 'is required and must be a string',
    });
  }

  // Validate encryption type
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

  // Hidden must be boolean
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
  // Runtime check: ensure data is an object
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'vcard.data',
      value: data,
      message: 'must be an object',
    });
    return;
  }

  // Use Partial since we're validating potentially incomplete data
  const vcard = data as Partial<VCardData>;

  // Validate required name
  if (!vcard.name || typeof vcard.name !== 'string' || !vcard.name.trim()) {
    errors.push({
      field: 'vcard.name',
      value: vcard.name,
      message: 'is required and must be non-empty',
    });
  }

  // Email format validation
  if (vcard.email !== undefined) {
    if (typeof vcard.email !== 'string' || !isValidEmail(vcard.email)) {
      errors.push({
        field: 'vcard.email',
        value: vcard.email,
        message: 'must be a valid email address',
      });
    }
  }

  // Phone format validation
  if (vcard.phone !== undefined) {
    if (typeof vcard.phone !== 'string' || !isValidPhone(vcard.phone)) {
      errors.push({
        field: 'vcard.phone',
        value: vcard.phone,
        message: 'must be a valid phone number (e.g., +1-555-123-4567)',
      });
    }
  }

  // URL format validation
  if (vcard.url !== undefined) {
    if (typeof vcard.url !== 'string' || !isValidURL(vcard.url)) {
      errors.push({
        field: 'vcard.url',
        value: vcard.url,
        message: 'must be a valid URL',
      });
    }
  }

  // Address validation
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
  // Runtime check: ensure data is an object
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'calendar.data',
      value: data,
      message: 'must be an object',
    });
    return;
  }

  // Use Partial since we're validating potentially incomplete data
  const calendar = data as Partial<CalendarData>;

  // Validate required title
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

  // Validate required startDate
  const startDate = parseDate(calendar.startDate);
  if (!startDate) {
    errors.push({
      field: 'calendar.startDate',
      value: calendar.startDate,
      message: 'is required and must be a valid Date object or ISO string',
    });
  }

  // Validate optional endDate
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
  // Use Partial since we're validating potentially incomplete data
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
  // Use Partial since we're validating potentially incomplete data
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
  // Use Partial since we're validating potentially incomplete data
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
  // Use Partial since we're validating potentially incomplete data
  const data = input as Partial<Extract<QRInput, { type: 'url' }>>;

  if (!data.url || typeof data.url !== 'string' || !isValidURL(data.url)) {
    errors.push({
      field: 'url.url',
      value: data.url,
      message: 'is required and must be a valid URL',
    });
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
