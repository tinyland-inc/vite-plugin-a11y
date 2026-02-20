/**
 * Color Contrast Utilities for Accessibility Testing
 * Implements WCAG color contrast calculations
 */

import type { RGB, RGBA } from './types.js';

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getLuminance(color: string | RGB): number {
  let rgb: RGB | null;

  if (typeof color === 'string') {
    rgb = parseColor(color);
    if (!rgb) return 0;
  } else {
    rgb = color;
  }

  // Convert RGB to sRGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse RGB/RGBA color string to RGB object
 */
export function parseColor(color: string): RGB | null {
  // Handle rgb() and rgba() format
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }

  // Handle hex format
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  return null;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string | RGB, color2: string | RGB): number {
  const rgb1: RGB | null = typeof color1 === 'string' ? parseColor(color1) : color1;
  const rgb2: RGB | null = typeof color2 === 'string' ? parseColor(color2) : color2;

  if (!rgb1 || !rgb2) {
    return 1.0; // Return minimum contrast if colors can't be parsed
  }

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Apply transparency to a color over a background
 * Returns the effective color after blending
 */
export function applyTransparency(foreground: RGBA, background: RGB): string {
  const alpha = foreground.a;

  // Alpha compositing formula
  const r = Math.round(foreground.r * alpha + background.r * (1 - alpha));
  const g = Math.round(foreground.g * alpha + background.g * (1 - alpha));
  const b = Math.round(foreground.b * alpha + background.b * (1 - alpha));

  return rgbToHex({ r, g, b });
}

/**
 * Check if a color combination meets WCAG requirements
 */
export function meetsWCAG(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  fontSize: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AA') {
    return fontSize === 'normal' ? ratio >= 4.5 : ratio >= 3;
  } else {
    return fontSize === 'normal' ? ratio >= 7 : ratio >= 4.5;
  }
}

/**
 * Find the closest color that meets contrast requirements
 */
export function adjustColorForContrast(
  color: string,
  background: string,
  targetRatio: number = 4.5,
  preferLighter: boolean = true
): string {
  const currentRatio = getContrastRatio(color, background);

  if (currentRatio >= targetRatio) {
    return color;
  }

  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const step = preferLighter ? 1 : -1;

  // Adjust color brightness until target ratio is met
  const adjustedRgb = { ...rgb };
  let attempts = 0;
  const maxAttempts = 255;

  while (attempts < maxAttempts) {
    adjustedRgb.r = Math.max(0, Math.min(255, adjustedRgb.r + step));
    adjustedRgb.g = Math.max(0, Math.min(255, adjustedRgb.g + step));
    adjustedRgb.b = Math.max(0, Math.min(255, adjustedRgb.b + step));

    const newRatio = getContrastRatio(adjustedRgb, background);
    if (newRatio >= targetRatio) {
      return rgbToHex(adjustedRgb);
    }

    // If we've reached pure white or black, stop
    if (
      (preferLighter && adjustedRgb.r === 255 && adjustedRgb.g === 255 && adjustedRgb.b === 255) ||
      (!preferLighter && adjustedRgb.r === 0 && adjustedRgb.g === 0 && adjustedRgb.b === 0)
    ) {
      break;
    }

    attempts++;
  }

  // If we couldn't meet the target, return the best we could do
  return rgbToHex(adjustedRgb);
}
