/**
 * Main Vite plugin implementation for accessibility validation
 */

import type { Plugin } from 'vite';
import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';
import * as fs from 'fs';
import type { AccessibilityOptions, ResolvedOptions, ValidationResult } from './types.js';
import {
  extractColorPairs,
  validateColorContrast,
  checkAriaLabels,
  checkKeyboardNavigation,
  checkColorOnlyInfo
} from './validators.js';

/** Default configuration */
const DEFAULT_OPTIONS: ResolvedOptions = {
  enabled: true,
  failOnError: process.env.NODE_ENV === 'production',
  wcagLevel: 'AA',
  runPropertyTests: process.env.NODE_ENV === 'production',
  propertyTestRuns: 100,
  reportPath: './accessibility-report.md',
  include: ['**/*.svelte'],
  exclude: ['node_modules/**'],
  maxFileSize: 1024 * 1024 // 1MB
};

/**
 * Resolve options with defaults
 */
function resolveOptions(options: AccessibilityOptions): ResolvedOptions {
  return {
    enabled: options.enabled ?? DEFAULT_OPTIONS.enabled,
    failOnError: options.failOnError ?? DEFAULT_OPTIONS.failOnError,
    wcagLevel: options.wcagLevel ?? DEFAULT_OPTIONS.wcagLevel,
    runPropertyTests: options.runPropertyTests ?? DEFAULT_OPTIONS.runPropertyTests,
    propertyTestRuns: options.propertyTestRuns ?? DEFAULT_OPTIONS.propertyTestRuns,
    reportPath: options.reportPath ?? DEFAULT_OPTIONS.reportPath,
    include: options.include ?? DEFAULT_OPTIONS.include,
    exclude: options.exclude ?? DEFAULT_OPTIONS.exclude,
    maxFileSize: options.maxFileSize ?? DEFAULT_OPTIONS.maxFileSize
  };
}

/**
 * Vite plugin for accessibility validation
 *
 * @param options - Plugin configuration options
 * @returns Vite plugin
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
 */
export function accessibilityPlugin(options: AccessibilityOptions = {}): Plugin {
  const opts = resolveOptions(options);

  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];
  const isDevelopment =
    process.env.NODE_ENV === 'development' || process.env.VITE_DEBUG === 'true';

  return {
    name: 'vite-plugin-a11y',
    enforce: 'pre',

    async buildStart() {
      if (!opts.enabled) return;

      if (isDevelopment) {
        console.log('\n🔍 Running accessibility validation...');
      }

      // Clear previous results
      errors.length = 0;
      warnings.length = 0;

      // Property-based tests are optional and require fast-check
      if (opts.runPropertyTests && isDevelopment) {
        console.log(`⚡ Property-based tests disabled (requires fast-check)`);
      }
    },

    async transform(code: string, id: string) {
      if (!opts.enabled) return null;
      if (!id.endsWith('.svelte')) return null;
      if (opts.exclude.some((pattern) => id.includes(pattern.replace('**/', '')))) return null;

      // Skip large files to avoid memory issues
      try {
        const stats = fs.statSync(id);
        if (stats.size > opts.maxFileSize) {
          if (isDevelopment) {
            console.log(`⏭️  Skipping large file (${(stats.size / 1024).toFixed(1)}KB): ${id}`);
          }
          return null;
        }
      } catch {
        // If we can't stat the file, continue anyway
      }

      const s = new MagicString(code);
      let hasChanges = false;

      try {
        // Parse Svelte component
        const ast = parse(code, { filename: id });

        // Extract color pairs from styles
        const colorPairs = extractColorPairs(code, id);

        // Validate color contrast
        const contrastResults = validateColorContrast(colorPairs, opts.wcagLevel, id);
        for (const result of contrastResults) {
          if (result.severity === 'error') {
            if (opts.failOnError) {
              errors.push(result);
            } else {
              warnings.push(result);
            }

            // Add warning comment in development
            if (isDevelopment && result.location) {
              const element = colorPairs.find(
                (p) => p.line === result.location!.line && p.column === result.location!.column
              );
              if (element) {
                const ratio = result.message.match(/\(([0-9.]+)\)/)?.[1] || '?';
                const required = opts.wcagLevel === 'AA' ? '4.5' : '7';
                const warningComment = `/* ⚠️ LOW CONTRAST: ${ratio} (needs ${required}) */`;

                const styleIndex = code.indexOf(element.element);
                if (styleIndex !== -1) {
                  s.appendLeft(styleIndex, warningComment + '\n  ');
                  hasChanges = true;
                }
              }
            }
          }
        }

        // Check for missing ARIA labels
        const ariaResults = checkAriaLabels(ast, code, id);
        warnings.push(...ariaResults);

        // Check for keyboard navigation issues
        const keyboardResults = checkKeyboardNavigation(ast, code, id);
        warnings.push(...keyboardResults);

        // Check for color-only information
        const colorOnlyResults = checkColorOnlyInfo(ast, code, id);
        warnings.push(...colorOnlyResults);
      } catch (error) {
        if (isDevelopment) {
          console.error(`Error processing ${id}:`, error);
        }
      }

      return hasChanges
        ? {
            code: s.toString(),
            map: s.generateMap({ hires: true })
          }
        : null;
    },

    buildEnd() {
      if (!opts.enabled) return;

      // Report all errors and warnings (only in development or when errors exist)
      if (errors.length > 0) {
        if (isDevelopment) {
          console.error('\n❌ Accessibility Errors:');
          errors.forEach((error) => console.error(error.message));
        }

        if (opts.failOnError) {
          throw new Error(
            `Found ${errors.length} accessibility error(s). ` +
              'Fix them or set failOnError: false to continue.'
          );
        }
      }

      if (warnings.length > 0 && isDevelopment) {
        console.warn('\n⚠️  Accessibility Warnings:');
        warnings.forEach((warning) => console.warn(warning.message));
      }

      // Summary (only in development)
      if (isDevelopment) {
        console.log('\n📊 Accessibility Validation Summary:');
        console.log(`   Errors: ${errors.length}`);
        console.log(`   Warnings: ${warnings.length}`);

        if (errors.length === 0 && warnings.length === 0) {
          console.log('\n✅ All accessibility checks passed!');
        }
      }
    }
  };
}

export default accessibilityPlugin;
