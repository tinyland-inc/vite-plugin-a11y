




export interface RGB {
  r: number;
  g: number;
  b: number;
}


export interface RGBA extends RGB {
  a: number;
}


export interface AccessibilityOptions {
  
  enabled?: boolean;
  
  failOnError?: boolean;
  
  wcagLevel?: 'AA' | 'AAA';
  
  runPropertyTests?: boolean;
  
  propertyTestRuns?: number;
  
  reportPath?: string;
  
  include?: string[];
  
  exclude?: string[];
  
  maxFileSize?: number;
}


export interface ColorPair {
  foreground: string;
  background: string;
  element: string;
  line: number;
  column: number;
}


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


export interface ValidationReport {
  timestamp: string;
  totalFiles: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  passed: number;
  failed: number;
}


export interface ResolvedOptions extends Required<Omit<AccessibilityOptions, 'maxFileSize'>> {
  maxFileSize: number;
}
