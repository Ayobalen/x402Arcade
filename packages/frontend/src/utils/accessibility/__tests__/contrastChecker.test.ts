/**
 * Tests for Contrast Checker Utility
 */

import { describe, it, expect } from 'vitest';
import {
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAG,
  checkColorPair,
  formatRatio,
  getContrastStatus,
  WCAGLevel,
  TextSize,
  WCAG_REQUIREMENTS,
} from '../contrastChecker';

describe('getRelativeLuminance', () => {
  it('should calculate luminance for black (#000000)', () => {
    const luminance = getRelativeLuminance('#000000');
    expect(luminance).toBe(0);
  });

  it('should calculate luminance for white (#ffffff)', () => {
    const luminance = getRelativeLuminance('#ffffff');
    expect(luminance).toBe(1);
  });

  it('should calculate luminance for cyan (#00ffff)', () => {
    const luminance = getRelativeLuminance('#00ffff');
    expect(luminance).toBeGreaterThan(0.5);
    expect(luminance).toBeLessThan(1);
  });

  it('should calculate luminance for magenta (#ff00ff)', () => {
    const luminance = getRelativeLuminance('#ff00ff');
    expect(luminance).toBeGreaterThan(0.2);
    expect(luminance).toBeLessThan(0.8);
  });

  it('should handle hex codes without # prefix', () => {
    const withHash = getRelativeLuminance('#ffffff');
    const withoutHash = getRelativeLuminance('ffffff');
    expect(withHash).toBe(withoutHash);
  });

  it('should calculate luminance for dark purple (#0a0a0f)', () => {
    const luminance = getRelativeLuminance('#0a0a0f');
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(0.1);
  });
});

describe('getContrastRatio', () => {
  it('should return 21:1 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 21:1 for white on black', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 1:1 for identical colors', () => {
    const ratio = getContrastRatio('#00ffff', '#00ffff');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('should calculate ratio for white on dark purple', () => {
    const ratio = getContrastRatio('#ffffff', '#0a0a0f');
    expect(ratio).toBeGreaterThan(15);
  });

  it('should calculate ratio for cyan on dark purple', () => {
    const ratio = getContrastRatio('#00ffff', '#0a0a0f');
    expect(ratio).toBeGreaterThan(10);
  });

  it('should be symmetric (order should not matter)', () => {
    const ratio1 = getContrastRatio('#00ffff', '#0a0a0f');
    const ratio2 = getContrastRatio('#0a0a0f', '#00ffff');
    expect(ratio1).toBeCloseTo(ratio2, 2);
  });
});

describe('WCAG_REQUIREMENTS', () => {
  it('should have correct AA requirements for normal text', () => {
    expect(WCAG_REQUIREMENTS[WCAGLevel.AA][TextSize.Normal]).toBe(4.5);
  });

  it('should have correct AA requirements for large text', () => {
    expect(WCAG_REQUIREMENTS[WCAGLevel.AA][TextSize.Large]).toBe(3.0);
  });

  it('should have correct AAA requirements for normal text', () => {
    expect(WCAG_REQUIREMENTS[WCAGLevel.AAA][TextSize.Normal]).toBe(7.0);
  });

  it('should have correct AAA requirements for large text', () => {
    expect(WCAG_REQUIREMENTS[WCAGLevel.AAA][TextSize.Large]).toBe(4.5);
  });
});

describe('meetsWCAG', () => {
  it('should pass AA for 4.5:1 ratio on normal text', () => {
    expect(meetsWCAG(4.5, WCAGLevel.AA, TextSize.Normal)).toBe(true);
  });

  it('should fail AA for 4.4:1 ratio on normal text', () => {
    expect(meetsWCAG(4.4, WCAGLevel.AA, TextSize.Normal)).toBe(false);
  });

  it('should pass AA for 3.0:1 ratio on large text', () => {
    expect(meetsWCAG(3.0, WCAGLevel.AA, TextSize.Large)).toBe(true);
  });

  it('should fail AA for 2.9:1 ratio on large text', () => {
    expect(meetsWCAG(2.9, WCAGLevel.AA, TextSize.Large)).toBe(false);
  });

  it('should pass AAA for 7.0:1 ratio on normal text', () => {
    expect(meetsWCAG(7.0, WCAGLevel.AAA, TextSize.Normal)).toBe(true);
  });

  it('should fail AAA for 6.9:1 ratio on normal text', () => {
    expect(meetsWCAG(6.9, WCAGLevel.AAA, TextSize.Normal)).toBe(false);
  });

  it('should pass AAA for 4.5:1 ratio on large text', () => {
    expect(meetsWCAG(4.5, WCAGLevel.AAA, TextSize.Large)).toBe(true);
  });
});

describe('checkColorPair', () => {
  it('should return complete color pair information', () => {
    const pair = checkColorPair('#ffffff', '#000000', 'Test case');

    expect(pair.foreground).toBe('#ffffff');
    expect(pair.background).toBe('#000000');
    expect(pair.ratio).toBeCloseTo(21, 0);
    expect(pair.aaCompliantNormal).toBe(true);
    expect(pair.aaCompliantLarge).toBe(true);
    expect(pair.aaaCompliantNormal).toBe(true);
    expect(pair.aaaCompliantLarge).toBe(true);
    expect(pair.usage).toBe('Test case');
  });

  it('should identify failing color pairs', () => {
    // Gray on slightly darker gray (low contrast)
    const pair = checkColorPair('#888888', '#777777', 'Low contrast test');

    expect(pair.ratio).toBeLessThan(4.5);
    expect(pair.aaCompliantNormal).toBe(false);
  });

  it('should correctly identify AA-passing but AAA-failing pairs', () => {
    // A pair that passes AA but not AAA
    const pair = checkColorPair('#ffffff', '#5e5e5e', 'Mid contrast test');

    expect(pair.ratio).toBeGreaterThan(4.5);
    expect(pair.ratio).toBeLessThan(7.0);
    expect(pair.aaCompliantNormal).toBe(true);
    expect(pair.aaaCompliantNormal).toBe(false);
  });
});

describe('formatRatio', () => {
  it('should format ratio with 2 decimal places', () => {
    expect(formatRatio(4.5)).toBe('4.50:1');
    expect(formatRatio(21)).toBe('21.00:1');
    expect(formatRatio(3.14159)).toBe('3.14:1');
  });
});

describe('getContrastStatus', () => {
  it('should return "AAA (Excellent)" for high contrast', () => {
    expect(getContrastStatus(21, TextSize.Normal)).toBe('AAA (Excellent)');
    expect(getContrastStatus(7.5, TextSize.Normal)).toBe('AAA (Excellent)');
  });

  it('should return "AA (Good)" for medium contrast', () => {
    expect(getContrastStatus(5.0, TextSize.Normal)).toBe('AA (Good)');
    expect(getContrastStatus(6.5, TextSize.Normal)).toBe('AA (Good)');
  });

  it('should return "Fail" for low contrast', () => {
    expect(getContrastStatus(3.0, TextSize.Normal)).toBe('Fail');
    expect(getContrastStatus(1.5, TextSize.Normal)).toBe('Fail');
  });

  it('should evaluate differently for large text', () => {
    expect(getContrastStatus(3.5, TextSize.Large)).toBe('AA (Good)');
    expect(getContrastStatus(3.5, TextSize.Normal)).toBe('Fail');
  });
});

describe('Real-world color combinations', () => {
  it('should validate white text on dark purple (primary bg)', () => {
    const pair = checkColorPair('#ffffff', '#0a0a0f', 'Primary text');
    expect(pair.aaCompliantNormal).toBe(true);
    expect(pair.ratio).toBeGreaterThan(15);
  });

  it('should validate cyan accent on dark purple', () => {
    const pair = checkColorPair('#00ffff', '#0a0a0f', 'Cyan accent');
    expect(pair.aaCompliantNormal).toBe(true);
    expect(pair.ratio).toBeGreaterThan(10);
  });

  it('should validate magenta accent on dark purple', () => {
    const pair = checkColorPair('#ff00ff', '#0a0a0f', 'Magenta accent');
    // Magenta may have lower contrast than cyan
    expect(pair.ratio).toBeGreaterThan(4);
  });

  it('should validate secondary text (#e0e0e0) on dark purple', () => {
    const pair = checkColorPair('#e0e0e0', '#0a0a0f', 'Secondary text');
    expect(pair.aaCompliantNormal).toBe(true);
  });
});
