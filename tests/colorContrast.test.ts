



import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  getLuminance,
  parseColor,
  getContrastRatio,
  meetsWCAG,
  adjustColorForContrast
} from '../src/colorContrast.js';

describe('hexToRgb', () => {
  it('converts hex to RGB', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('handles hex without hash', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('invalid')).toBeNull();
    expect(hexToRgb('#fff')).toBeNull(); 
  });
});

describe('rgbToHex', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });
});

describe('getLuminance', () => {
  it('calculates luminance for white', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
  });

  it('calculates luminance for black', () => {
    expect(getLuminance('#000000')).toBeCloseTo(0, 2);
  });

  it('calculates luminance for gray', () => {
    const luminance = getLuminance('#808080');
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });

  it('accepts RGB object', () => {
    expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
  });
});

describe('parseColor', () => {
  it('parses hex colors', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses rgb() colors', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses rgba() colors (ignores alpha)', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns null for invalid colors', () => {
    expect(parseColor('invalid')).toBeNull();
    expect(parseColor('hsl(0, 100%, 50%)')).toBeNull();
  });
});

describe('getContrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 21 for white on black', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for same colors', () => {
    const ratio = getContrastRatio('#808080', '#808080');
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('returns 1 for invalid colors', () => {
    const ratio = getContrastRatio('invalid', '#ffffff');
    expect(ratio).toBe(1);
  });
});

describe('meetsWCAG', () => {
  it('passes AA for high contrast', () => {
    expect(meetsWCAG('#000000', '#ffffff', 'AA', 'normal')).toBe(true);
  });

  it('passes AAA for high contrast', () => {
    expect(meetsWCAG('#000000', '#ffffff', 'AAA', 'normal')).toBe(true);
  });

  it('fails AA for low contrast', () => {
    expect(meetsWCAG('#777777', '#888888', 'AA', 'normal')).toBe(false);
  });

  it('has lower threshold for large text', () => {
    
    const color1 = '#767676'; 
    expect(meetsWCAG(color1, '#ffffff', 'AA', 'large')).toBe(true);
  });
});

describe('adjustColorForContrast', () => {
  it('returns original color if contrast is sufficient', () => {
    const result = adjustColorForContrast('#000000', '#ffffff', 4.5);
    expect(result).toBe('#000000');
  });

  it('lightens color to meet contrast when preferLighter is true', () => {
    const result = adjustColorForContrast('#777777', '#ffffff', 4.5, true);
    
    expect(getLuminance(result)).toBeGreaterThan(getLuminance('#777777'));
  });

  it('darkens color to meet contrast when preferLighter is false', () => {
    
    
    
    const result = adjustColorForContrast('#aaaaaa', '#ffffff', 4.5, false);
    
    expect(result).not.toBe('#aaaaaa');
    
    expect(getLuminance(result)).toBeLessThan(getLuminance('#aaaaaa'));
  });
});
