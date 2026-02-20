/**
 * Type definitions for accessibility validation plugin
 */

/** RGB color representation */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** RGBA color representation */
export interface RGBA extends RGB {
  a: number;
}

/** Plugin configuration options */
export interface AccessibilityOptions {
  /** Enable the plugin (default: true) */
  enabled?: boolean;
  /** Fail build on accessibility errors (default: true in production) */
  failOnError?: boolean;
  /** WCAG compliance level (default: 'AA') */
  wcagLevel?: 'AA' | 'AAA';
  /** Run property-based tests (default: false in dev, true in prod) */
  runPropertyTests?: boolean;
  /** Number of property test iterations (default: 100) */
  propertyTestRuns?: number;
  /** Path to save accessibility report (default: './accessibility-report.md') */
  reportPath?: string;
  /** File patterns to include (default: ['**\/*.svelte']) */
  include?: string[];
  /** File patterns to exclude (default: ['node_modules/**']) */
  exclude?: string[];
  /** Maximum file size to process in bytes (default: 1MB) - helps with memory issues */
  maxFileSize?: number;
}

/** Represents a color pair found in styles */
export interface ColorPair {
  foreground: string;
  background: string;
  element: string;
  line: number;
  column: number;
}

/** Validation result for a single check */
export interface ValidationResult {
  valid: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: {
    file: string;
    line: number;
    column: number;
  };
}

/** Aggregated validation report */
export interface ValidationReport {
  timestamp: string;
  totalFiles: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  passed: number;
  failed: number;
}

/** Resolved configuration with defaults applied */
export interface ResolvedOptions extends Required<Omit<AccessibilityOptions, 'maxFileSize'>> {
  maxFileSize: number;
}
