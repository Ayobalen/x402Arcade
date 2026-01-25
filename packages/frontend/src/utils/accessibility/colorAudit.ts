/**
 * Color Accessibility Audit
 *
 * Comprehensive audit of all color pairs used in the application.
 * Documents contrast ratios and WCAG compliance for the design system.
 */

import { checkColorPair, formatRatio, getContrastStatus, type ColorPair } from './contrastChecker';
import {
  backgrounds,
  text,
  primary,
  secondary,
  semantic,
  surfaces,
  borders,
} from '../../styles/tokens/colors';

/**
 * Audit Category
 */
export interface AuditCategory {
  /** Category name */
  name: string;
  /** Color pairs in this category */
  pairs: ColorPair[];
}

/**
 * Complete audit report
 */
export interface AuditReport {
  /** All audit categories */
  categories: AuditCategory[];
  /** Summary statistics */
  summary: {
    total: number;
    aaCompliant: number;
    aaaCompliant: number;
    failing: number;
  };
  /** Timestamp of audit */
  timestamp: string;
}

/**
 * Run complete color accessibility audit
 *
 * @returns Complete audit report
 */
export function runColorAudit(): AuditReport {
  const categories: AuditCategory[] = [];

  // ========================================
  // 1. PRIMARY TEXT ON BACKGROUNDS
  // ========================================
  categories.push({
    name: 'Primary Text on Backgrounds',
    pairs: [
      checkColorPair(text.primary, backgrounds.primary, 'Primary text on darkest background'),
      checkColorPair(text.primary, backgrounds.secondary, 'Primary text on secondary background'),
      checkColorPair(text.primary, backgrounds.tertiary, 'Primary text on tertiary background'),
      checkColorPair(text.primary, backgrounds.surface, 'Primary text on surface background'),
      checkColorPair(text.primary, backgrounds.main, 'Primary text on main background'),
    ],
  });

  // ========================================
  // 2. SECONDARY TEXT ON BACKGROUNDS
  // ========================================
  categories.push({
    name: 'Secondary Text on Backgrounds',
    pairs: [
      checkColorPair(text.secondary, backgrounds.primary, 'Secondary text on darkest background'),
      checkColorPair(
        text.secondary,
        backgrounds.secondary,
        'Secondary text on secondary background'
      ),
      checkColorPair(text.secondary, backgrounds.tertiary, 'Secondary text on tertiary background'),
      checkColorPair(text.secondary, backgrounds.surface, 'Secondary text on surface background'),
    ],
  });

  // ========================================
  // 3. TERTIARY & MUTED TEXT ON BACKGROUNDS
  // ========================================
  categories.push({
    name: 'Tertiary & Muted Text on Backgrounds',
    pairs: [
      checkColorPair(text.tertiary, backgrounds.primary, 'Tertiary text on darkest background'),
      checkColorPair(text.muted, backgrounds.primary, 'Muted text on darkest background'),
      checkColorPair(text.disabled, backgrounds.primary, 'Disabled text on darkest background'),
    ],
  });

  // ========================================
  // 4. ACCENT TEXT ON BACKGROUNDS
  // ========================================
  categories.push({
    name: 'Accent Colors on Backgrounds',
    pairs: [
      checkColorPair(primary.DEFAULT, backgrounds.primary, 'Cyan accent on darkest background'),
      checkColorPair(
        secondary.DEFAULT,
        backgrounds.primary,
        'Magenta accent on darkest background'
      ),
      checkColorPair(primary['400'], backgrounds.primary, 'Lighter cyan on darkest background'),
      checkColorPair(
        secondary['400'],
        backgrounds.primary,
        'Lighter magenta on darkest background'
      ),
    ],
  });

  // ========================================
  // 5. SEMANTIC COLORS ON BACKGROUNDS
  // ========================================
  categories.push({
    name: 'Semantic Colors on Backgrounds',
    pairs: [
      checkColorPair(semantic.success, backgrounds.primary, 'Success green on darkest background'),
      checkColorPair(semantic.warning, backgrounds.primary, 'Warning orange on darkest background'),
      checkColorPair(semantic.error, backgrounds.primary, 'Error red on darkest background'),
      checkColorPair(semantic.info, backgrounds.primary, 'Info blue on darkest background'),
      checkColorPair(
        semantic.successLight,
        backgrounds.primary,
        'Light success on darkest background'
      ),
      checkColorPair(
        semantic.warningLight,
        backgrounds.primary,
        'Light warning on darkest background'
      ),
      checkColorPair(semantic.errorLight, backgrounds.primary, 'Light error on darkest background'),
    ],
  });

  // ========================================
  // 6. TEXT ON SURFACES
  // ========================================
  categories.push({
    name: 'Text on Surface Colors',
    pairs: [
      checkColorPair(text.primary, surfaces.primary, 'Primary text on primary surface'),
      checkColorPair(text.secondary, surfaces.primary, 'Secondary text on primary surface'),
      checkColorPair(text.primary, surfaces.secondary, 'Primary text on secondary surface'),
      checkColorPair(text.primary, surfaces.tertiary, 'Primary text on tertiary surface'),
    ],
  });

  // ========================================
  // 7. BUTTON TEXT (INVERSE TEXT ON ACCENTS)
  // ========================================
  categories.push({
    name: 'Button Text (Inverse on Accents)',
    pairs: [
      checkColorPair(text.inverse, primary.DEFAULT, 'Dark text on cyan button'),
      checkColorPair(text.inverse, secondary.DEFAULT, 'Dark text on magenta button'),
      checkColorPair(text.inverse, semantic.success, 'Dark text on success button'),
      checkColorPair(text.inverse, semantic.error, 'Dark text on error button'),
      checkColorPair(backgrounds.primary, primary.DEFAULT, 'Dark bg on cyan button'),
      checkColorPair(backgrounds.primary, secondary.DEFAULT, 'Dark bg on magenta button'),
    ],
  });

  // ========================================
  // 8. BORDERS
  // ========================================
  categories.push({
    name: 'Border Colors',
    pairs: [
      checkColorPair(borders.default, backgrounds.primary, 'Default border on darkest background'),
      checkColorPair(borders.subtle, backgrounds.primary, 'Subtle border on darkest background'),
      checkColorPair(borders.focus, backgrounds.primary, 'Focus border on darkest background'),
    ],
  });

  // ========================================
  // 9. PRIMARY BUTTON GRADIENTS (approximation)
  // ========================================
  categories.push({
    name: 'Primary Buttons (Gradient Text)',
    pairs: [
      checkColorPair(text.inverse, primary['500'], 'Text on cyan gradient button'),
      checkColorPair(backgrounds.primary, primary['500'], 'Dark text on cyan gradient button'),
    ],
  });

  // Calculate summary
  let total = 0;
  let aaCompliant = 0;
  let aaaCompliant = 0;
  let failing = 0;

  categories.forEach((category) => {
    category.pairs.forEach((pair) => {
      total++;
      if (pair.aaCompliantNormal) {
        aaCompliant++;
      }
      if (pair.aaaCompliantNormal) {
        aaaCompliant++;
      }
      if (!pair.aaCompliantNormal) {
        failing++;
      }
    });
  });

  return {
    categories,
    summary: {
      total,
      aaCompliant,
      aaaCompliant,
      failing,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a human-readable audit report
 *
 * @returns Markdown-formatted audit report
 */
export function generateAuditReport(): string {
  const audit = runColorAudit();
  let report = '# Color Accessibility Audit Report\n\n';
  report += `**Generated:** ${new Date(audit.timestamp).toLocaleString()}\n\n`;
  report += '## Summary\n\n';
  report += `- **Total Color Pairs:** ${audit.summary.total}\n`;
  report += `- **WCAG AA Compliant:** ${audit.summary.aaCompliant} (${Math.round((audit.summary.aaCompliant / audit.summary.total) * 100)}%)\n`;
  report += `- **WCAG AAA Compliant:** ${audit.summary.aaaCompliant} (${Math.round((audit.summary.aaaCompliant / audit.summary.total) * 100)}%)\n`;
  report += `- **Failing:** ${audit.summary.failing} (${Math.round((audit.summary.failing / audit.summary.total) * 100)}%)\n\n`;

  report += '---\n\n';

  audit.categories.forEach((category) => {
    report += `## ${category.name}\n\n`;
    report += '| Foreground | Background | Ratio | Status | Usage |\n';
    report += '|------------|------------|-------|--------|-------|\n';

    category.pairs.forEach((pair) => {
      const status = getContrastStatus(pair.ratio);
      const statusEmoji = pair.aaCompliantNormal ? '✅' : '❌';
      report += `| ${pair.foreground} | ${pair.background} | ${formatRatio(pair.ratio)} | ${statusEmoji} ${status} | ${pair.usage} |\n`;
    });

    report += '\n';
  });

  return report;
}

/**
 * Get all failing color pairs
 *
 * @returns Array of failing color pairs
 */
export function getFailingPairs(): ColorPair[] {
  const audit = runColorAudit();
  const failing: ColorPair[] = [];

  audit.categories.forEach((category) => {
    category.pairs.forEach((pair) => {
      if (!pair.aaCompliantNormal) {
        failing.push(pair);
      }
    });
  });

  return failing;
}

/**
 * Get recommendations for fixing failing color pairs
 *
 * @returns Array of recommendations
 */
export function getRecommendations(): string[] {
  const failing = getFailingPairs();
  const recommendations: string[] = [];

  failing.forEach((pair) => {
    recommendations.push(
      `⚠️ ${pair.usage}: Contrast ratio ${formatRatio(pair.ratio)} fails WCAG AA. ` +
        `Foreground: ${pair.foreground}, Background: ${pair.background}. ` +
        `Needs at least 4.5:1 for normal text.`
    );
  });

  return recommendations;
}
