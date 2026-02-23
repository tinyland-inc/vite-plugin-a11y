






























export { accessibilityPlugin, accessibilityPlugin as default } from './plugin.js';


export type {
  RGB,
  RGBA,
  AccessibilityOptions,
  ColorPair,
  ValidationResult,
  ValidationReport,
  ResolvedOptions
} from './types.js';


export {
  hexToRgb,
  rgbToHex,
  getLuminance,
  parseColor,
  getContrastRatio,
  applyTransparency,
  meetsWCAG,
  adjustColorForContrast
} from './colorContrast.js';


export {
  getLineColumn,
  extractColorPairs,
  validateColorContrast,
  checkAriaLabels,
  checkKeyboardNavigation,
  checkColorOnlyInfo
} from './validators.js';
