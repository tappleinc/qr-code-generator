/**
 * Public API Type Definitions
 *
 * This file contains all types, interfaces, and enums that are part of the public API.
 * Internal types used only within the library are in internal/core/types.ts
 */

// ============================================================================
// Shape Enums (Public API)
// ============================================================================

/**
 * Eye frame (outer 7x7 position marker) shape options
 */
export enum EyeFrameShape {
  SQUARE = 'square',
  SQUIRCLE = 'squircle',
}

/**
 * Data dot (module) shape options
 */
export enum DotShape {
  CLASSIC = 'classic',
  DOTS = 'dots',
  SQUARE = 'square',
}

/**
 * Border shape options
 */
export enum BorderShape {
  NONE = 'none',
  SQUARE = 'square',
  SQUIRCLE = 'squircle',
  CIRCLE = 'circle',
}

/**
 * Border style options
 */
export enum BorderStyle {
  SOLID = 'solid',
  DASHED = 'dashed',
}

// ============================================================================
// Structured Content Types (Public API)
// ============================================================================

/**
 * vCard contact information
 */
export interface VCardData {
  /** Full name (required) */
  name: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Organization/company name */
  organization?: string;
  /** Website URL */
  url?: string;
  /** Postal address */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  /** Job title */
  title?: string;
  /** Notes/additional info */
  note?: string;
}

/**
 * WiFi network credentials
 */
export interface WiFiData {
  /** Network SSID (name) */
  ssid: string;
  /** Network password */
  password: string;
  /** Encryption type (default: 'WPA') */
  encryption?: 'WPA' | 'WPA2' | 'WEP' | 'nopass';
  /** Whether network is hidden (default: false) */
  hidden?: boolean;
}

/**
 * Calendar event data
 */
export interface CalendarData {
  /** Event title (required) */
  title: string;
  /** Event start date/time */
  startDate: Date | string;
  /** Event end date/time */
  endDate: Date | string;
  /** Event location */
  location?: string;
  /** Event description */
  description?: string;
}

/**
 * QR Code input - accepts either raw string or structured content types
 */
export type QRInput =
  | string
  | { type: 'url'; url: string }
  | { type: 'vcard'; data: VCardData }
  | { type: 'wifi'; data: WiFiData }
  | { type: 'calendar'; data: CalendarData }
  | { type: 'email'; email: string; subject?: string; body?: string }
  | { type: 'sms'; phone: string; message?: string }
  | { type: 'phone'; phone: string };

// ============================================================================
// Output Configuration (Public API)
// ============================================================================

/**
 * Output format and type configuration
 * Uses union type to prevent invalid combinations
 */
export type OutputConfig =
  | {
      format: 'png';
      type: 'dataURL' | 'buffer';
    }
  | {
      format: 'svg';
      type: 'dataURL' | 'string';
    };

// ============================================================================
// Rendering Options (Public API)
// ============================================================================

/**
 * Image-based rendering options for PNG and SVG (public API)
 * All fields are optional - unspecified values use defaults from internal/core/defaults.ts
 */
export interface ImageOptions {
  /** QR code matrix size in pixels (default: 300) - margin and border are added to this */
  size?: number;
  /** Margin around QR code in pixels (default: 24) */
  margin?: number;
  /** Background color - supports hex (#fff, #ffffff), rgb/rgba, hsl/hsla, or named colors (default: '#ffffff') */
  backgroundColor?: string;
  /** Eye (outer frame) styling */
  eyes?: {
    /** Eye frame shape (default: 'square') */
    shape?: EyeFrameShape;
    /** Eye frame color - supports hex (#fff, #ffffff), rgb/rgba, hsl/hsla, or named colors (default: '#000000') */
    color?: string;
  };
  /** Pupil (inner core) styling */
  pupils?: {
    /** Pupil color - supports hex (#fff, #ffffff), rgb/rgba, hsl/hsla, or named colors (default: '#000000') */
    color?: string;
  };
  /** Data dot (module) styling */
  dots?: {
    /** Data dot shape (default: 'classic') */
    shape?: DotShape;
    /** Data dot color - supports hex (#fff, #ffffff), rgb/rgba, hsl/hsla, or named colors (default: '#000000') */
    color?: string;
    /** Data dot scale (0.75 to 1.25, default: 1.0) - adjusts visual size of dots while keeping overall dimensions fixed */
    scale?: number;
  };
  /** Logo image to place in center of QR code (jpg, png, svg, or webp) */
  logo?: {
    /** Image source - data URL (recommended) or raw SVG string */
    src: string;
    /** Logo scale as percentage of QR code width (0-1, default: 0.2 = 20%, max: 0.3 = 30%) */
    scale?: number;
  };
  /** Border styling (surrounds margin area) */
  border?: {
    /** Border shape (default: 'none') */
    shape?: BorderShape;
    /**
     * Border width in pixels (default: 10)
     * Total output size = size + 2×margin + 2×width
     */
    width?: number;
    /** Border color - supports hex (#fff, #ffffff), rgb/rgba, hsl/hsla, or named colors (default: '#000000') */
    color?: string;
    /** Border style - solid or dashed pattern (default: 'solid') */
    style?: BorderStyle;
  };
  /** Output format and type (default: { format: 'png', type: 'buffer' }) */
  output?: OutputConfig;
}

/**
 * Text-based rendering options for ASCII (public API)
 * All fields are optional - unspecified values use defaults from internal/core/defaults.ts
 */
export interface TextOptions {
  /** Margin in modules (default: 2) */
  margin?: number;
  /** Dark character(s) for modules (default: '██') */
  darkChar?: string;
  /** Light/background character(s) (default: '  ') */
  lightChar?: string;
}
