



import { describe, it, expect } from 'vitest';
import {
  getLineColumn,
  extractColorPairs,
  validateColorContrast
} from '../src/validators.js';

describe('getLineColumn', () => {
  it('returns correct line and column for single line', () => {
    const code = 'hello world';
    const result = getLineColumn(code, 6);
    expect(result).toEqual({ line: 1, column: 7 });
  });

  it('returns correct line and column for multi-line', () => {
    const code = 'line 1\nline 2\nline 3';
    const result = getLineColumn(code, 14);
    expect(result).toEqual({ line: 3, column: 1 });
  });

  it('handles empty string', () => {
    const result = getLineColumn('', 0);
    expect(result).toEqual({ line: 1, column: 1 });
  });
});

describe('extractColorPairs', () => {
  it('extracts color pairs from style block', () => {
    const code = `
      <style>
        .test {
          color: #000000;
          background-color: #ffffff;
        }
      </style>
    `;

    const pairs = extractColorPairs(code, 'test.svelte');
    expect(pairs.length).toBe(1);
    expect(pairs[0].foreground).toBe('#000000');
    expect(pairs[0].background).toBe('#ffffff');
    expect(pairs[0].element).toBe('.test');
  });

  it('handles multiple selectors', () => {
    const code = `
      <style>
        .a {
          color: #111111;
          background-color: #eeeeee;
        }
        .b {
          color: #222222;
          background-color: #dddddd;
        }
      </style>
    `;

    const pairs = extractColorPairs(code, 'test.svelte');
    expect(pairs.length).toBe(2);
  });

  it('returns empty array when no pairs found', () => {
    const code = `
      <style>
        .test {
          color: #000000;
        }
      </style>
    `;

    const pairs = extractColorPairs(code, 'test.svelte');
    expect(pairs.length).toBe(0);
  });

  it('ignores non-style content', () => {
    const code = '<div class="test">Hello</div>';
    const pairs = extractColorPairs(code, 'test.svelte');
    expect(pairs.length).toBe(0);
  });
});

describe('validateColorContrast', () => {
  it('reports error for low contrast', () => {
    const pairs = [
      {
        foreground: '#777777',
        background: '#888888',
        element: '.test',
        line: 1,
        column: 1
      }
    ];

    const results = validateColorContrast(pairs, 'AA', 'test.svelte');
    expect(results.length).toBe(1);
    expect(results[0].valid).toBe(false);
    expect(results[0].severity).toBe('error');
  });

  it('passes for high contrast', () => {
    const pairs = [
      {
        foreground: '#000000',
        background: '#ffffff',
        element: '.test',
        line: 1,
        column: 1
      }
    ];

    const results = validateColorContrast(pairs, 'AA', 'test.svelte');
    expect(results.length).toBe(0);
  });

  it('respects AAA level', () => {
    const pairs = [
      {
        foreground: '#767676', 
        background: '#ffffff',
        element: '.test',
        line: 1,
        column: 1
      }
    ];

    const aaResults = validateColorContrast(pairs, 'AA', 'test.svelte');
    const aaaResults = validateColorContrast(pairs, 'AAA', 'test.svelte');

    expect(aaResults.length).toBe(0);
    expect(aaaResults.length).toBe(1);
  });

  it('includes location in results', () => {
    const pairs = [
      {
        foreground: '#777777',
        background: '#888888',
        element: '.test',
        line: 10,
        column: 5
      }
    ];

    const results = validateColorContrast(pairs, 'AA', 'test.svelte');
    expect(results[0].location).toEqual({
      file: 'test.svelte',
      line: 10,
      column: 5
    });
  });
});
