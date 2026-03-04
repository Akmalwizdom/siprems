/**
 * WIB (Waktu Indonesia Barat / UTC+7) Timezone Utilities
 *
 * Centralizes all WIB-aware date/time formatting using Intl.DateTimeFormat
 * which is more robust than manual offset calculations.
 */

/**
 * Returns the current WIB date and time as a full ISO 8601 timestamp.
 * Example: "2026-03-04T09:37:32+07:00"
 */
export function formatWibIsoTimestamp(): string {
  const now = new Date();
  
  // Use en-ZA or en-CA for YYYY-MM-DD format
  const formatter = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value;

  const year = findPart('year');
  const month = findPart('month');
  const day = findPart('day');
  const hour = findPart('hour');
  const minute = findPart('minute');
  const second = findPart('second');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
}

/**
 * Returns the current WIB date as a plain date string.
 * Example: "2026-03-04"
 */
export function formatWibDateString(): string {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value;

  return `${findPart('year')}-${findPart('month')}-${findPart('day')}`;
}
