



import type { ColorPair, ValidationResult } from './types.js';
import { getContrastRatio } from './colorContrast.js';

interface SvelteASTNode {
  type: string;
  name?: string;
  start?: number;
  attributes?: SvelteASTAttribute[];
  children?: SvelteASTNode[];
  data?: string;
}

interface SvelteASTAttribute {
  name: string;
  value?: SvelteASTValue[];
}

interface SvelteASTValue {
  type: string;
  data?: string;
}

interface SvelteAST {
  html?: SvelteASTNode;
}




export function getLineColumn(code: string, position: number): { line: number; column: number } {
  const lines = code.substring(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}




export function extractColorPairs(code: string, _filename: string): ColorPair[] {
  const pairs: ColorPair[] = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  const colorRegex = /(color|background-color|background|border-color):\s*([^;]+);/g;

  let styleMatch;
  while ((styleMatch = styleRegex.exec(code)) !== null) {
    const styleContent = styleMatch[1];
    const styleStart = styleMatch.index + styleMatch[0].indexOf(styleContent);

    
    const selectorRegex = /([^{]+)\s*{([^}]+)}/g;

    let selectorMatch;
    while ((selectorMatch = selectorRegex.exec(styleContent)) !== null) {
      const currentSelector = selectorMatch[1].trim();
      const rules = selectorMatch[2];

      const colors: { [key: string]: string } = {};

      let colorMatch;
      while ((colorMatch = colorRegex.exec(rules)) !== null) {
        const property = colorMatch[1];
        const value = colorMatch[2].trim();

        if (property.includes('background')) {
          colors.background = value;
        } else {
          colors.foreground = value;
        }
      }

      
      if (colors.foreground && colors.background) {
        const position = getLineColumn(code, styleStart + selectorMatch.index);
        pairs.push({
          foreground: colors.foreground,
          background: colors.background,
          element: currentSelector,
          line: position.line,
          column: position.column
        });
      }
    }
  }

  return pairs;
}




export function validateColorContrast(
  pairs: ColorPair[],
  wcagLevel: 'AA' | 'AAA',
  filename: string
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const required = wcagLevel === 'AA' ? 4.5 : 7;

  for (const pair of pairs) {
    const ratio = getContrastRatio(pair.foreground, pair.background);

    if (ratio < required) {
      results.push({
        valid: false,
        message:
          `Low contrast ratio (${ratio.toFixed(2)}) in ${filename}:${pair.line}:${pair.column}\n` +
          `  Foreground: ${pair.foreground}\n` +
          `  Background: ${pair.background}\n` +
          `  Required: ${required} (WCAG ${wcagLevel})\n` +
          `  Element: ${pair.element}`,
        severity: 'error',
        location: {
          file: filename,
          line: pair.line,
          column: pair.column
        }
      });
    }
  }

  return results;
}




export function checkAriaLabels(ast: SvelteAST, code: string, filename: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  
  const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];

  function walkNode(node: SvelteASTNode) {
    if (node.type === 'Element' && node.name && interactiveElements.includes(node.name)) {
      const hasAriaLabel = node.attributes?.some(
        (attr) => attr.name === 'aria-label' || attr.name === 'aria-labelledby'
      );

      const hasTextContent = node.children?.some(
        (child) => child.type === 'Text' && child.data?.trim()
      );

      if (!hasAriaLabel && !hasTextContent && node.start !== undefined) {
        const position = getLineColumn(code, node.start);
        results.push({
          valid: false,
          message: `Missing accessible label for <${node.name}> in ${filename}:${position.line}:${position.column}`,
          severity: 'warning',
          location: {
            file: filename,
            line: position.line,
            column: position.column
          }
        });
      }
    }

    if (node.children) {
      node.children.forEach(walkNode);
    }
  }

  if (ast.html) {
    walkNode(ast.html);
  }

  return results;
}




export function checkKeyboardNavigation(
  ast: SvelteAST,
  code: string,
  filename: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  function walkNode(node: SvelteASTNode) {
    
    if (node.type === 'Element' && node.attributes) {
      const hasOnClick = node.attributes.some(
        (attr) => attr.name === 'on:click' || attr.name === 'onclick'
      );

      const hasKeyHandler = node.attributes.some(
        (attr) => attr.name === 'on:keydown' || attr.name === 'on:keyup' || attr.name === 'on:keypress'
      );

      const isNativelyKeyboardAccessible =
        node.name && ['button', 'a', 'input', 'select', 'textarea'].includes(node.name);

      if (hasOnClick && !hasKeyHandler && !isNativelyKeyboardAccessible && node.start !== undefined) {
        const position = getLineColumn(code, node.start);
        results.push({
          valid: false,
          message: `Element with click handler lacks keyboard support in ${filename}:${position.line}:${position.column}`,
          severity: 'warning',
          location: {
            file: filename,
            line: position.line,
            column: position.column
          }
        });
      }

      
      const tabindexAttr = node.attributes.find((attr) => attr.name === 'tabindex');
      if (tabindexAttr && tabindexAttr.value && tabindexAttr.value[0]) {
        const tabindexValue = parseInt(tabindexAttr.value[0].data || '0');
        if (tabindexValue > 0 && node.start !== undefined) {
          const position = getLineColumn(code, node.start);
          results.push({
            valid: false,
            message: `Avoid positive tabindex values (found ${tabindexValue}) in ${filename}:${position.line}:${position.column}`,
            severity: 'warning',
            location: {
              file: filename,
              line: position.line,
              column: position.column
            }
          });
        }
      }
    }

    if (node.children) {
      node.children.forEach(walkNode);
    }
  }

  if (ast.html) {
    walkNode(ast.html);
  }

  return results;
}




export function checkColorOnlyInfo(ast: SvelteAST, code: string, filename: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const colorWords = [
    'red',
    'green',
    'blue',
    'yellow',
    'orange',
    'purple',
    'pink',
    'brown',
    'black',
    'white',
    'gray',
    'grey'
  ];

  function walkNode(node: SvelteASTNode) {
    if (node.type === 'Text' && node.data) {
      const text = node.data.toLowerCase();
      const foundColors = colorWords.filter((color) => text.includes(color));

      if (
        foundColors.length > 0 &&
        (text.includes('click') || text.includes('select') || text.includes('choose')) &&
        node.start !== undefined
      ) {
        const position = getLineColumn(code, node.start);
        results.push({
          valid: false,
          message: `Possible color-only information in ${filename}:${position.line}:${position.column}: "${text.substring(0, 50)}..."`,
          severity: 'warning',
          location: {
            file: filename,
            line: position.line,
            column: position.column
          }
        });
      }
    }

    if (node.children) {
      node.children.forEach(walkNode);
    }
  }

  if (ast.html) {
    walkNode(ast.html);
  }

  return results;
}
