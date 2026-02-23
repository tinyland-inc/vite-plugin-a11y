



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


const DEFAULT_OPTIONS: ResolvedOptions = {
  enabled: true,
  failOnError: process.env.NODE_ENV === 'production',
  wcagLevel: 'AA',
  runPropertyTests: process.env.NODE_ENV === 'production',
  propertyTestRuns: 100,
  reportPath: './accessibility-report.md',
  include: ['**/*.svelte'],
  exclude: ['node_modules/**'],
  maxFileSize: 1024 * 1024 
};




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

      
      errors.length = 0;
      warnings.length = 0;

      
      if (opts.runPropertyTests && isDevelopment) {
        console.log(`⚡ Property-based tests disabled (requires fast-check)`);
      }
    },

    async transform(code: string, id: string) {
      if (!opts.enabled) return null;
      if (!id.endsWith('.svelte')) return null;
      if (opts.exclude.some((pattern) => id.includes(pattern.replace('**/', '')))) return null;

      
      try {
        const stats = fs.statSync(id);
        if (stats.size > opts.maxFileSize) {
          if (isDevelopment) {
            console.log(`⏭️  Skipping large file (${(stats.size / 1024).toFixed(1)}KB): ${id}`);
          }
          return null;
        }
      } catch {
        
      }

      const s = new MagicString(code);
      let hasChanges = false;

      try {
        
        const ast = parse(code, { filename: id });

        
        const colorPairs = extractColorPairs(code, id);

        
        const contrastResults = validateColorContrast(colorPairs, opts.wcagLevel, id);
        for (const result of contrastResults) {
          if (result.severity === 'error') {
            if (opts.failOnError) {
              errors.push(result);
            } else {
              warnings.push(result);
            }

            
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

        
        const ariaResults = checkAriaLabels(ast, code, id);
        warnings.push(...ariaResults);

        
        const keyboardResults = checkKeyboardNavigation(ast, code, id);
        warnings.push(...keyboardResults);

        
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
