/**
 * Tests for Color Audit Utility
 */

import { describe, it, expect } from 'vitest';
import {
  runColorAudit,
  generateAuditReport,
  getFailingPairs,
  getRecommendations,
} from '../colorAudit';

describe('runColorAudit', () => {
  it('should return a complete audit report', () => {
    const audit = runColorAudit();

    expect(audit).toBeDefined();
    expect(audit.categories).toBeDefined();
    expect(audit.summary).toBeDefined();
    expect(audit.timestamp).toBeDefined();
  });

  it('should have multiple audit categories', () => {
    const audit = runColorAudit();

    expect(audit.categories.length).toBeGreaterThan(0);
    expect(audit.categories[0].name).toBeDefined();
    expect(audit.categories[0].pairs).toBeDefined();
  });

  it('should calculate summary statistics correctly', () => {
    const audit = runColorAudit();

    expect(audit.summary.total).toBeGreaterThan(0);
    expect(audit.summary.aaCompliant).toBeGreaterThanOrEqual(0);
    expect(audit.summary.aaaCompliant).toBeGreaterThanOrEqual(0);
    expect(audit.summary.failing).toBeGreaterThanOrEqual(0);

    // Total should equal sum of compliant and failing
    const total = audit.summary.aaCompliant + audit.summary.failing;
    expect(audit.summary.total).toBe(total);
  });

  it('should audit primary text on backgrounds', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Primary Text on Backgrounds');

    expect(category).toBeDefined();
    expect(category!.pairs.length).toBeGreaterThan(0);
  });

  it('should audit accent colors on backgrounds', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Accent Colors on Backgrounds');

    expect(category).toBeDefined();
    expect(category!.pairs.length).toBeGreaterThan(0);
  });

  it('should audit semantic colors', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Semantic Colors on Backgrounds');

    expect(category).toBeDefined();
    expect(category!.pairs.length).toBeGreaterThan(0);
  });

  it('should audit button text (inverse colors)', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Button Text (Inverse on Accents)');

    expect(category).toBeDefined();
    expect(category!.pairs.length).toBeGreaterThan(0);
  });

  it('should have valid timestamp', () => {
    const audit = runColorAudit();
    const timestamp = new Date(audit.timestamp);

    expect(timestamp.getTime()).not.toBeNaN();
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('generateAuditReport', () => {
  it('should generate a markdown report', () => {
    const report = generateAuditReport();

    expect(report).toBeDefined();
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it('should include summary section', () => {
    const report = generateAuditReport();

    expect(report).toContain('Summary');
    expect(report).toContain('Total Color Pairs');
    expect(report).toContain('WCAG AA Compliant');
    expect(report).toContain('WCAG AAA Compliant');
    expect(report).toContain('Failing');
  });

  it('should include category headers', () => {
    const report = generateAuditReport();

    expect(report).toContain('Primary Text on Backgrounds');
    expect(report).toContain('Accent Colors on Backgrounds');
    expect(report).toContain('Semantic Colors on Backgrounds');
  });

  it('should include table headers', () => {
    const report = generateAuditReport();

    expect(report).toContain('Foreground');
    expect(report).toContain('Background');
    expect(report).toContain('Ratio');
    expect(report).toContain('Status');
    expect(report).toContain('Usage');
  });

  it('should include status emojis', () => {
    const report = generateAuditReport();

    // Should have either ✅ or ❌ emojis
    expect(report.match(/[✅❌]/g)).not.toBeNull();
  });
});

describe('getFailingPairs', () => {
  it('should return an array', () => {
    const failing = getFailingPairs();

    expect(Array.isArray(failing)).toBe(true);
  });

  it('should only include failing pairs', () => {
    const failing = getFailingPairs();

    failing.forEach((pair) => {
      expect(pair.aaCompliantNormal).toBe(false);
    });
  });

  it('should have complete pair information', () => {
    const failing = getFailingPairs();

    if (failing.length > 0) {
      const pair = failing[0];
      expect(pair.foreground).toBeDefined();
      expect(pair.background).toBeDefined();
      expect(pair.ratio).toBeDefined();
      expect(pair.usage).toBeDefined();
    }
  });
});

describe('getRecommendations', () => {
  it('should return an array of strings', () => {
    const recommendations = getRecommendations();

    expect(Array.isArray(recommendations)).toBe(true);
    recommendations.forEach((rec) => {
      expect(typeof rec).toBe('string');
    });
  });

  it('should include contrast ratio in recommendations', () => {
    const recommendations = getRecommendations();

    if (recommendations.length > 0) {
      expect(recommendations[0]).toContain(':1');
    }
  });

  it('should include color hex codes', () => {
    const recommendations = getRecommendations();

    if (recommendations.length > 0) {
      expect(recommendations[0]).toMatch(/#[0-9a-fA-F]{6}/);
    }
  });

  it('should mention WCAG AA requirements', () => {
    const recommendations = getRecommendations();

    if (recommendations.length > 0) {
      expect(recommendations[0]).toContain('WCAG AA');
      expect(recommendations[0]).toContain('4.5:1');
    }
  });
});

describe('Color compliance', () => {
  it('should have high AA compliance rate', () => {
    const audit = runColorAudit();
    const complianceRate = (audit.summary.aaCompliant / audit.summary.total) * 100;

    // Expect at least 70% AA compliance
    expect(complianceRate).toBeGreaterThan(70);
  });

  it('should validate white text on dark backgrounds', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Primary Text on Backgrounds');

    expect(category).toBeDefined();

    // All primary text (white) on dark backgrounds should pass
    category!.pairs.forEach((pair) => {
      if (pair.foreground === '#ffffff') {
        expect(pair.aaCompliantNormal).toBe(true);
        expect(pair.ratio).toBeGreaterThan(10);
      }
    });
  });

  it('should validate cyan accent on dark backgrounds', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Accent Colors on Backgrounds');

    expect(category).toBeDefined();

    // Find cyan on dark background
    const cyanPair = category!.pairs.find(
      (p) => p.foreground === '#00ffff' && p.background === '#0a0a0f'
    );

    expect(cyanPair).toBeDefined();
    expect(cyanPair!.aaCompliantNormal).toBe(true);
  });

  it('should validate semantic colors meet minimum standards', () => {
    const audit = runColorAudit();
    const category = audit.categories.find((c) => c.name === 'Semantic Colors on Backgrounds');

    expect(category).toBeDefined();

    // Most semantic colors should pass AA on dark backgrounds
    const passingCount = category!.pairs.filter((p) => p.aaCompliantNormal).length;
    const totalCount = category!.pairs.length;

    expect(passingCount / totalCount).toBeGreaterThan(0.7);
  });
});
