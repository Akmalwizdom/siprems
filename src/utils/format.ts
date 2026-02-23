/**
 * Formatting utilities for the SIPREMS frontend.
 */

/**
 * Formats large numbers in Indonesian style (e.g., 1.5jt, 2rb, 1M).
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  } else if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  } else if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
};

/**
 * Formats numbers without currency prefix.
 */
export const formatNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}M`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}jt`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}rb`;
  }
  return value.toLocaleString('id-ID');
};
