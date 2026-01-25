/**
 * Contrast Ratio Checker Utility
 *
 * Implements WCAG 2.1 contrast ratio calculations for accessibility compliance.
 * Supports both AA and AAA levels for normal and large text.
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @param hex - Hex color code (e.g., '#00ffff')
 * @returns Relative luminance value (0-1)
 */
export function getRelativeLuminance(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Apply sRGB gamma correction
  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter color and L2 is the darker color
 *
 * @param foreground - Foreground color hex code
 * @param background - Background color hex code
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG Compliance Levels
 */
export enum WCAGLevel {
  /** WCAG 2.1 Level AA */
  AA = 'AA',
  /** WCAG 2.1 Level AAA */
  AAA = 'AAA',
}

/**
 * Text Size Categories
 */
export enum TextSize {
  /** Normal text (< 18pt or < 14pt bold) */
  Normal = 'normal',
  /** Large text (>= 18pt or >= 14pt bold) */
  Large = 'large',
}

/**
 * WCAG Contrast Requirements
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export const WCAG_REQUIREMENTS = {
  [WCAGLevel.AA]: {
    [TextSize.Normal]: 4.5,
    [TextSize.Large]: 3.0,
  },
  [WCAGLevel.AAA]: {
    [TextSize.Normal]: 7.0,
    [TextSize.Large]: 4.5,
  },
} as const;

/**
 * Check if a contrast ratio meets WCAG requirements
 *
 * @param ratio - Contrast ratio to check
 * @param level - WCAG level (AA or AAA)
 * @param textSize - Text size category
 * @returns True if the ratio meets requirements
 */
export function meetsWCAG(ratio: number, level: WCAGLevel, textSize: TextSize): boolean {
  const requirement = WCAG_REQUIREMENTS[level][textSize];
  return ratio >= requirement;
}

/**
 * Color pair with contrast information
 */
export interface ColorPair {
  /** Foreground color hex code */
  foreground: string;
  /** Background color hex code */
  background: string;
  /** Calculated contrast ratio */
  ratio: number;
  /** AA compliance for normal text */
  aaCompliantNormal: boolean;
  /** AA compliance for large text */
  aaCompliantLarge: boolean;
  /** AAA compliance for normal text */
  aaaCompliantNormal: boolean;
  /** AAA compliance for large text */
  aaaCompliantLarge: boolean;
  /** Usage context (e.g., 'Button text', 'Body text') */
  usage: string;
}

/**
 * Check contrast ratio for a color pair and return detailed information
 *
 * @param foreground - Foreground color hex code
 * @param background - Background color hex code
 * @param usage - Usage context description
 * @returns ColorPair with contrast details
 */
export function checkColorPair(foreground: string, background: string, usage: string): ColorPair {
  const ratio = getContrastRatio(foreground, background);

  return {
    foreground,
    background,
    ratio,
    aaCompliantNormal: meetsWCAG(ratio, WCAGLevel.AA, TextSize.Normal),
    aaCompliantLarge: meetsWCAG(ratio, WCAGLevel.AA, TextSize.Large),
    aaaCompliantNormal: meetsWCAG(ratio, WCAGLevel.AAA, TextSize.Normal),
    aaaCompliantLarge: meetsWCAG(ratio, WCAGLevel.AAA, TextSize.Large),
    usage,
  };
}

/**
 * Format contrast ratio for display
 *
 * @param ratio - Contrast ratio
 * @returns Formatted string (e.g., '4.5:1')
 */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Get status badge for contrast ratio
 *
 * @param ratio - Contrast ratio
 * @param textSize - Text size category
 * @returns Status description
 */
export function getContrastStatus(ratio: number, textSize: TextSize = TextSize.Normal): string {
  if (meetsWCAG(ratio, WCAGLevel.AAA, textSize)) {
    return 'AAA (Excellent)';
  }
  if (meetsWCAG(ratio, WCAGLevel.AA, textSize)) {
    return 'AA (Good)';
  }
  return 'Fail';
}

/**
 * Suggest a lighter or darker shade to meet contrast requirements
 *
 * @param color - Hex color to adjust
 * @param targetLuminance - Target relative luminance
 * @returns Adjusted hex color
 */
export function adjustColorForContrast(color: string, targetLuminance: number): string {
  const cleanHex = color.replace('#', '');
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  // Simple adjustment: scale RGB values
  const currentLuminance = getRelativeLuminance(color);
  const scale = Math.sqrt(targetLuminance / currentLuminance);

  r = Math.min(255, Math.round(r * scale));
  g = Math.min(255, Math.round(g * scale));
  b = Math.min(255, Math.round(b * scale));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
