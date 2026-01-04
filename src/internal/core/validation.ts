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
    } else {
      // Validate logo src format
      const err = validateLogoSrc(options.logo.src, 'logo.src');
      if (err) errors.push(err);
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
