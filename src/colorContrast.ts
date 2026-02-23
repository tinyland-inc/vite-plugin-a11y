




import type { RGB, RGBA } from './types.js';




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




export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}





export function getLuminance(color: string | RGB): number {
  let rgb: RGB | null;

  if (typeof color === 'string') {
    rgb = parseColor(color);
    if (!rgb) return 0;
  } else {
    rgb = color;
  }

  
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}




export function parseColor(color: string): RGB | null {
  
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }

  
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  return null;
}





export function getContrastRatio(color1: string | RGB, color2: string | RGB): number {
  const rgb1: RGB | null = typeof color1 === 'string' ? parseColor(color1) : color1;
  const rgb2: RGB | null = typeof color2 === 'string' ? parseColor(color2) : color2;

  if (!rgb1 || !rgb2) {
    return 1.0; 
  }

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}





export function applyTransparency(foreground: RGBA, background: RGB): string {
  const alpha = foreground.a;

  
  const r = Math.round(foreground.r * alpha + background.r * (1 - alpha));
  const g = Math.round(foreground.g * alpha + background.g * (1 - alpha));
  const b = Math.round(foreground.b * alpha + background.b * (1 - alpha));

  return rgbToHex({ r, g, b });
}




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

    
    if (
      (preferLighter && adjustedRgb.r === 255 && adjustedRgb.g === 255 && adjustedRgb.b === 255) ||
      (!preferLighter && adjustedRgb.r === 0 && adjustedRgb.g === 0 && adjustedRgb.b === 0)
    ) {
      break;
    }

    attempts++;
  }

  
  return rgbToHex(adjustedRgb);
}
