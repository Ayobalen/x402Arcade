/**
 * Accessibility Testing Utilities - Tests and Examples
 *
 * This file serves two purposes:
 * 1. Tests for the a11y-utils module itself
 * 2. Examples of how to use accessibility testing in component tests
 *
 * @module __tests__/utils/a11y-utils.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  checkA11y,
  runA11yCheck,
  createA11yChecker,
  toHaveNoViolations,
  DEFAULT_AXE_CONFIG,
  A11Y_PRESETS,
  WCAG_CONFIGS,
  summarizeViolations,
  createA11yReport,
  runOnlyRules,
  excludeRules,
  isTestableElement,
  checkA11yWhenReady,
  type A11yCheckResult,
  type A11yCheckConfig,
} from './a11y-utils';

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST COMPONENTS
// ============================================================================

/**
 * Accessible button component
 */
function AccessibleButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * Accessible form component
 */
function AccessibleForm() {
  return (
    <form aria-label="Contact form">
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" type="text" name="name" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Accessible image component
 */
function AccessibleImage() {
  return (
    <figure>
      <img src="/test.jpg" alt="A descriptive alt text for the image" />
      <figcaption>Image caption</figcaption>
    </figure>
  );
}

/**
 * Inaccessible button - missing text content
 */
function InaccessibleButton() {
  return (
    <button type="button" aria-label="">
      {/* Intentionally empty for testing */}
    </button>
  );
}

/**
 * Inaccessible form - missing labels
 */
function InaccessibleForm() {
  return (
    <form>
      {/* Input without label - accessibility violation */}
      <input type="text" name="name" />
      <input type="email" name="email" />
      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Inaccessible image - missing alt text
 */
function InaccessibleImage() {
  return <img src="/test.jpg" />;
}

/**
 * Complex accessible component
 */
function AccessibleCard() {
  return (
    <article aria-labelledby="card-title">
      <header>
        <h2 id="card-title">Card Title</h2>
      </header>
      <p>Card content goes here.</p>
      <footer>
        <button type="button">Action 1</button>
        <button type="button">Action 2</button>
      </footer>
    </article>
  );
}

/**
 * Navigation component
 */
function AccessibleNavigation() {
  return (
    <nav aria-label="Main navigation">
      <ul role="menubar">
        <li role="none">
          <a href="/home" role="menuitem">Home</a>
        </li>
        <li role="none">
          <a href="/about" role="menuitem">About</a>
        </li>
        <li role="none">
          <a href="/contact" role="menuitem">Contact</a>
        </li>
      </ul>
    </nav>
  );
}

// ============================================================================
// UNIT TESTS FOR A11Y UTILITIES
// ============================================================================

describe('a11y-utils', () => {
  describe('DEFAULT_AXE_CONFIG', () => {
    it('should have expected default rules', () => {
      expect(DEFAULT_AXE_CONFIG.rules).toBeDefined();
      expect(DEFAULT_AXE_CONFIG.runOnly).toBeDefined();
    });

    it('should disable region rule by default', () => {
      const rules = DEFAULT_AXE_CONFIG.rules as Record<string, { enabled: boolean }>;
      expect(rules.region?.enabled).toBe(false);
    });

    it('should disable bypass rule by default', () => {
      const rules = DEFAULT_AXE_CONFIG.rules as Record<string, { enabled: boolean }>;
      expect(rules.bypass?.enabled).toBe(false);
    });
  });

  describe('A11Y_PRESETS', () => {
    it('should have strict preset', () => {
      expect(A11Y_PRESETS.strict).toBeDefined();
      expect(A11Y_PRESETS.strict.axeOptions?.rules).toBeDefined();
    });

    it('should have component preset', () => {
      expect(A11Y_PRESETS.component).toBeDefined();
      expect(A11Y_PRESETS.component.disabledRules).toBeDefined();
    });

    it('should have arcade preset with relaxed rules', () => {
      expect(A11Y_PRESETS.arcade).toBeDefined();
      expect(A11Y_PRESETS.arcade.disabledRules).toContain('color-contrast');
      expect(A11Y_PRESETS.arcade.minImpact).toBe('serious');
    });

    it('should have form preset', () => {
      expect(A11Y_PRESETS.form).toBeDefined();
    });

    it('should have image preset', () => {
      expect(A11Y_PRESETS.image).toBeDefined();
    });

    it('should have contrast preset', () => {
      expect(A11Y_PRESETS.contrast).toBeDefined();
    });
  });

  describe('WCAG_CONFIGS', () => {
    it('should have wcag2a config', () => {
      expect(WCAG_CONFIGS.wcag2a).toBeDefined();
    });

    it('should have wcag2aa config', () => {
      expect(WCAG_CONFIGS.wcag2aa).toBeDefined();
    });

    it('should have wcag21aa config', () => {
      expect(WCAG_CONFIGS.wcag21aa).toBeDefined();
    });

    it('should have all config', () => {
      expect(WCAG_CONFIGS.all).toBeDefined();
    });
  });

  describe('runOnlyRules', () => {
    it('should create config with specific rules only', () => {
      const config = runOnlyRules(['image-alt', 'button-name']);
      expect(config.axeOptions?.runOnly).toEqual({
        type: 'rule',
        values: ['image-alt', 'button-name'],
      });
    });
  });

  describe('excludeRules', () => {
    it('should create config with disabled rules', () => {
      const config = excludeRules(['color-contrast', 'region']);
      expect(config.disabledRules).toEqual(['color-contrast', 'region']);
    });
  });

  describe('isTestableElement', () => {
    it('should return true for DOM Element', () => {
      const div = document.createElement('div');
      expect(isTestableElement(div)).toBe(true);
    });

    it('should return true for Document', () => {
      expect(isTestableElement(document)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isTestableElement(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTestableElement(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isTestableElement('<div></div>')).toBe(false);
    });
  });

  describe('toHaveNoViolations', () => {
    it('should be a valid matcher', () => {
      expect(toHaveNoViolations).toBeDefined();
      expect(typeof toHaveNoViolations.toHaveNoViolations).toBe('function');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - ACCESSIBLE COMPONENTS
// ============================================================================

describe('Accessibility Testing - Accessible Components', () => {
  describe('AccessibleButton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton onClick={() => {}}>
          Click me
        </AccessibleButton>
      );
      await checkA11y(container, A11Y_PRESETS.component);
    });

    it('should pass runA11yCheck', async () => {
      const { container } = render(
        <AccessibleButton>Submit</AccessibleButton>
      );
      const result = await runA11yCheck(container, A11Y_PRESETS.component);
      expect(result.passes).toBe(true);
      expect(result.violationCount).toBe(0);
    });
  });

  describe('AccessibleForm', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleForm />);
      await checkA11y(container, A11Y_PRESETS.component);
    });

    it('should pass form-specific checks', async () => {
      const { container } = render(<AccessibleForm />);
      await checkA11y(container, A11Y_PRESETS.form);
    });
  });

  describe('AccessibleImage', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleImage />);
      await checkA11y(container, A11Y_PRESETS.component);
    });

    it('should pass image-specific checks', async () => {
      const { container } = render(<AccessibleImage />);
      await checkA11y(container, A11Y_PRESETS.image);
    });
  });

  describe('AccessibleCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleCard />);
      await checkA11y(container, A11Y_PRESETS.component);
    });
  });

  describe('AccessibleNavigation', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleNavigation />);
      await checkA11y(container, A11Y_PRESETS.component);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - DETECTING VIOLATIONS
// ============================================================================

describe('Accessibility Testing - Violation Detection', () => {
  describe('InaccessibleButton', () => {
    it('should detect missing button text', async () => {
      const { container } = render(<InaccessibleButton />);
      const result = await runA11yCheck(container, A11Y_PRESETS.component);

      // Should detect violations
      expect(result.passes).toBe(false);
      expect(result.violationCount).toBeGreaterThan(0);
    });

    it('should throw with checkA11y', async () => {
      const { container } = render(<InaccessibleButton />);

      await expect(
        checkA11y(container, A11Y_PRESETS.component)
      ).rejects.toThrow(/accessibility violation/i);
    });
  });

  describe('InaccessibleForm', () => {
    it('should detect missing form labels', async () => {
      const { container } = render(<InaccessibleForm />);
      const result = await runA11yCheck(container, A11Y_PRESETS.component);

      // Should detect label violations
      expect(result.passes).toBe(false);

      // Should have violations related to labels
      const hasLabelViolation = result.violations.some(
        v => v.id.includes('label')
      );
      expect(hasLabelViolation).toBe(true);
    });
  });

  describe('InaccessibleImage', () => {
    it('should detect missing alt text', async () => {
      const { container } = render(<InaccessibleImage />);
      const result = await runA11yCheck(container, A11Y_PRESETS.image);

      expect(result.passes).toBe(false);

      // Should have image-alt violation
      const hasAltViolation = result.violations.some(
        v => v.id === 'image-alt'
      );
      expect(hasAltViolation).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - CUSTOM CHECKERS
// ============================================================================

describe('Custom A11y Checkers', () => {
  it('should create custom checker with base config', async () => {
    const checkGameA11y = createA11yChecker(A11Y_PRESETS.arcade);

    const { container } = render(<AccessibleButton>Play</AccessibleButton>);
    await checkGameA11y(container);
  });

  it('should allow override config', async () => {
    const checkWithMinorIssues = createA11yChecker({
      minImpact: 'serious',
    });

    const { container } = render(<AccessibleButton>Click</AccessibleButton>);
    await checkWithMinorIssues(container);
  });

  it('should merge disabled rules', async () => {
    const checker = createA11yChecker({
      disabledRules: ['color-contrast'],
    });

    const { container } = render(<AccessibleButton>Test</AccessibleButton>);
    await checker(container, { disabledRules: ['region'] });
  });
});

// ============================================================================
// INTEGRATION TESTS - RESULT HELPERS
// ============================================================================

describe('A11y Result Helpers', () => {
  describe('summarizeViolations', () => {
    it('should group violations by impact', async () => {
      const { container } = render(<InaccessibleButton />);
      const result = await runA11yCheck(container, A11Y_PRESETS.component);

      const summary = summarizeViolations(result);

      expect(summary).toHaveProperty('critical');
      expect(summary).toHaveProperty('serious');
      expect(summary).toHaveProperty('moderate');
      expect(summary).toHaveProperty('minor');
      expect(summary).toHaveProperty('unknown');
    });

    it('should return empty arrays when no violations', async () => {
      const { container } = render(<AccessibleButton>Test</AccessibleButton>);
      const result = await runA11yCheck(container, A11Y_PRESETS.component);

      const summary = summarizeViolations(result);

      expect(summary.critical).toHaveLength(0);
      expect(summary.serious).toHaveLength(0);
      expect(summary.moderate).toHaveLength(0);
      expect(summary.minor).toHaveLength(0);
    });
  });

  describe('createA11yReport', () => {
    it('should create passing report when no violations', async () => {
      const { container } = render(<AccessibleButton>Test</AccessibleButton>);
      const result = await runA11yCheck(container, A11Y_PRESETS.component);

      const report = createA11yReport(result);

      expect(report).toContain('passed');
      expect(report).toContain('No violations found');
    });

    it('should create detailed report for violations', async () => {
      const { container } = render(<InaccessibleImage />);
      const result = await runA11yCheck(container, A11Y_PRESETS.image);

      const report = createA11yReport(result);

      expect(report).toContain('failed');
      expect(report).toContain('violation');
      expect(report).toContain('URL:');
      expect(report).toContain('Affected elements:');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - WCAG LEVELS
// ============================================================================

describe('WCAG Level Testing', () => {
  it('should test against WCAG 2.0 Level A', async () => {
    const { container } = render(<AccessibleButton>Test</AccessibleButton>);
    await checkA11y(container, WCAG_CONFIGS.wcag2a);
  });

  it('should test against WCAG 2.0 Level AA', async () => {
    const { container } = render(<AccessibleForm />);
    await checkA11y(container, WCAG_CONFIGS.wcag2aa);
  });

  it('should test against WCAG 2.1 Level AA', async () => {
    const { container } = render(<AccessibleCard />);
    await checkA11y(container, WCAG_CONFIGS.wcag21aa);
  });
});

// ============================================================================
// EXAMPLE TESTS - HOW TO USE IN YOUR COMPONENTS
// ============================================================================

describe('Example: How to add a11y tests to your components', () => {
  /**
   * Basic example - simple component test
   */
  it('Example 1: Basic accessibility test', async () => {
    // Render your component
    const { container } = render(<AccessibleButton>Click me</AccessibleButton>);

    // Check accessibility - throws if violations found
    await checkA11y(container, A11Y_PRESETS.component);
  });

  /**
   * Form example - using form preset
   */
  it('Example 2: Form accessibility test', async () => {
    const { container } = render(<AccessibleForm />);

    // Use form preset for form-specific checks
    await checkA11y(container, A11Y_PRESETS.form);
  });

  /**
   * Image example - checking alt text
   */
  it('Example 3: Image accessibility test', async () => {
    const { container } = render(<AccessibleImage />);

    // Use image preset for image-specific checks
    await checkA11y(container, A11Y_PRESETS.image);
  });

  /**
   * Arcade/Game component example - relaxed rules
   */
  it('Example 4: Game component with relaxed a11y', async () => {
    const { container } = render(
      <div data-testid="game-canvas">
        {/* Game canvas would go here */}
        <button type="button">Start Game</button>
      </div>
    );

    // Use arcade preset - doesn't check color contrast, etc.
    await checkA11y(container, A11Y_PRESETS.arcade);
  });

  /**
   * Custom rules example
   */
  it('Example 5: Custom rule configuration', async () => {
    const { container } = render(<AccessibleButton>Test</AccessibleButton>);

    // Run with custom configuration
    await checkA11y(container, {
      disabledRules: ['region', 'landmark-one-main'],
      minImpact: 'moderate',
    });
  });

  /**
   * Getting detailed results example
   */
  it('Example 6: Getting detailed a11y results', async () => {
    const { container } = render(<AccessibleButton>Test</AccessibleButton>);

    // Get detailed results without throwing
    const result = await runA11yCheck(container, A11Y_PRESETS.component);

    // Check results manually
    expect(result.passes).toBe(true);
    expect(result.violationCount).toBe(0);
    expect(result.violations).toHaveLength(0);

    // Can also get a summary
    const summary = summarizeViolations(result);
    expect(summary.critical).toHaveLength(0);
  });

  /**
   * Reusable checker example
   */
  it('Example 7: Creating a reusable checker for your app', async () => {
    // Create a checker for your specific app context
    const checkAppA11y = createA11yChecker({
      disabledRules: ['region', 'bypass'],
      minImpact: 'moderate',
    });

    const { container } = render(<AccessibleCard />);
    await checkAppA11y(container);
  });
});
