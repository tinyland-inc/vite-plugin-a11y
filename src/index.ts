/**
 * @tinyland/vite-plugin-a11y
 *
 * Vite plugin for accessibility validation of Svelte components.
 * Performs WCAG compliance checking at build time including:
 * - Color contrast validation (AA/AAA)
 * - ARIA label checking
 * - Keyboard navigation verification
 * - Color-only information detection
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { accessibilityPlugin } from '@tinyland/vite-plugin-a11y';
 *
 * export default defineConfig({
 *   plugins: [
 *     accessibilityPlugin({
 *       enabled: true,
 *       failOnError: process.env.NODE_ENV === 'production',
 *       wcagLevel: 'AA'
 *     }),
 *     sveltekit()
 *   ]
 * });
 * ```
 *
 * @packageDocumentation
 */

// Main plugin export
export { accessibilityPlugin, accessibilityPlugin as default } from './plugin.js';

// Type exports
export type {
  RGB,
  RGBA,
  AccessibilityOptions,
  ColorPair,
  ValidationResult,
  ValidationReport,
  ResolvedOptions
} from './types.js';

// Color contrast utilities
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

// Validators
export {
  getLineColumn,
  extractColorPairs,
  validateColorContrast,
  checkAriaLabels,
  checkKeyboardNavigation,
  checkColorOnlyInfo
} from './validators.js';
