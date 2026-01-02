/**
 * QR Content Formatters
 *
 * Converts structured content types (vCard, WiFi, Calendar, etc.) into
 * properly formatted strings for QR code encoding.
 *
 * These formatters implement standard QR code content formats that are
 * recognized by most QR code readers/scanners.
 */

import { VCardData, WiFiData, CalendarData, QRInput } from '../../types';

/**
 * Convert QRInput to string for encoding
 */
export function formatQRInput(input: QRInput): string {
  if (typeof input === 'string') {
    return input;
  }

  switch (input.type) {
    case 'url':
      return formatURL(input.url);
    case 'vcard':
      return formatVCard(input.data);
    case 'wifi':
      return formatWiFi(input.data);
    case 'calendar':
      return formatCalendar(input.data);
    case 'email':
      return formatEmail(input.email, input.subject, input.body);
    case 'sms':
      return formatSMS(input.phone, input.message);
    case 'phone':
      return formatPhone(input.phone);
  }
}

/**
 * Format URL (ensures https:// prefix if missing)
 */
function formatURL(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Format vCard contact data (vCard 3.0 format)
 */
function formatVCard(data: VCardData): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${data.name}`];

  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.url) lines.push(`URL:${data.url}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.note) lines.push(`NOTE:${data.note}`);

  if (data.address) {
    const { street, city, state, zip, country } = data.address;
    // ADR format: ;;street;city;state;zip;country
    const parts = [
      '',
      '',
      street || '',
      city || '',
      state || '',
      zip || '',
      country || '',
    ];
    lines.push(`ADR:${parts.join(';')}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Format WiFi network credentials (WIFI: format)
 */
function formatWiFi(data: WiFiData): string {
  const type = data.encryption || 'WPA';
  const hidden = data.hidden ? 'H:true;' : '';

  // Escape special characters in SSID and password
  const ssid = escapeWiFiString(data.ssid);
  const password = escapeWiFiString(data.password);

  return `WIFI:T:${type};S:${ssid};P:${password};${hidden};`;
}

/**
 * Escape special characters in WiFi strings (per WiFi QR spec)
 */
function escapeWiFiString(str: string): string {
  return str.replace(/([\\;,":])/g, '\\$1');
}

/**
 * Format calendar event (vCalendar/iCalendar format)
 */
function formatCalendar(data: CalendarData): string {
  const formatDate = (d: Date | string): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    // Format as YYYYMMDDTHHMMSSZ (UTC)
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${data.title}`,
    `DTSTART:${formatDate(data.startDate)}`,
    `DTEND:${formatDate(data.endDate)}`,
  ];

  if (data.location) lines.push(`LOCATION:${data.location}`);
  if (data.description) lines.push(`DESCRIPTION:${data.description}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

/**
 * Format email address with optional subject and body
 */
function formatEmail(email: string, subject?: string, body?: string): string {
  let url = `mailto:${email}`;
  const params: string[] = [];

  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  return url;
}

/**
 * Format SMS with optional message
 */
function formatSMS(phone: string, message?: string): string {
  if (message) {
    return `sms:${phone}:${message}`;
  }
  return `sms:${phone}`;
}

/**
 * Format phone number (tel: URI scheme)
 */
function formatPhone(phone: string): string {
  return `tel:${phone}`;
}
