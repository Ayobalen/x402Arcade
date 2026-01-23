/**
 * Accessibility Testing Utilities
 *
 * Provides automated accessibility testing with jest-axe (works with Vitest).
 * Uses axe-core under the hood for WCAG compliance checking.
 *
 * @example
 * ```tsx
 * import { checkA11y, toHaveNoViolations } from '../utils/a11y-utils';
 *
 * // Extend Vitest matchers
 * expect.extend(toHaveNoViolations);
 *
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   await checkA11y(container);
 * });
 * ```
 */

import { axe, toHaveNoViolations as jestAxeToHaveNoViolations } from 'jest-axe';
import type { AxeResults, RunOptions, Spec, Result } from 'axe-core';

// Re-export the matchers for Vitest/Jest extend
export const toHaveNoViolations = jestAxeToHaveNoViolations;

/**
 * Severity levels for accessibility violations
 */
export type A11yImpact = 'minor' | 'moderate' | 'serious' | 'critical';

/**
 * Configuration for accessibility checks
 */
export interface A11yCheckConfig {
  /**
   * axe-core run options
   * @see https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter
   */
  axeOptions?: RunOptions;

  /**
   * Rule IDs to disable for this check
   * @example ['color-contrast', 'landmark-one-main']
   */
  disabledRules?: string[];

  /**
   * Minimum impact level to report (violations below this level are ignored)
   * @default 'minor'
   */
  minImpact?: A11yImpact;

  /**
   * Whether to include incomplete results (need manual review)
   * @default false
   */
  includeIncomplete?: boolean;

  /**
   * Custom rules to enable/disable
   */
  rules?: Record<string, { enabled: boolean }>;
}

/**
 * Formatted violation for easier reading
 */
export interface FormattedViolation {
  id: string;
  impact: A11yImpact | undefined;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    failureSummary: string | undefined;
    target: string[];
  }>;
}

/**
 * Result of an accessibility check
 */
export interface A11yCheckResult {
  /** Whether the check passed (no violations) */
  passes: boolean;
  /** Number of violations found */
  violationCount: number;
  /** Formatted violations for display */
  violations: FormattedViolation[];
  /** Raw axe-core results */
  raw: AxeResults;
  /** Items that need manual review */
  incomplete: FormattedViolation[];
}

/**
 * Impact severity order for filtering
 */
const IMPACT_ORDER: Record<A11yImpact, number> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};

/**
 * Default axe-core configuration optimized for React applications
 */
export const DEFAULT_AXE_CONFIG: RunOptions = {
  rules: {
    // Disable region rule - often triggers false positives in test environments
    region: { enabled: false },
    // Disable bypass rule - not relevant for component testing
    bypass: { enabled: false },
    // Disable page-has-heading-one - not relevant for component testing
    'page-has-heading-one': { enabled: false },
  },
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  },
};

/**
 * Known issues that can be excluded from checks.
 * Add rules here when you have documented exceptions.
 */
export const KNOWN_ISSUES: Record<string, string> = {
  // Example: 'color-contrast': 'Neon arcade theme intentionally uses high-contrast colors',
};

/**
 * Format a single axe violation for readable output
 */
function formatViolation(violation: Result): FormattedViolation {
  return {
    id: violation.id,
    impact: violation.impact as A11yImpact | undefined,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node) => ({
      html: node.html,
      failureSummary: node.failureSummary,
      target: node.target as string[],
    })),
  };
}

/**
 * Filter violations by minimum impact level
 */
function filterByImpact(
  violations: Result[],
  minImpact: A11yImpact
): Result[] {
  const minLevel = IMPACT_ORDER[minImpact];
  return violations.filter((v) => {
    if (!v.impact) return true; // Include if impact is undefined
    return IMPACT_ORDER[v.impact as A11yImpact] >= minLevel;
  });
}

/**
 * Build axe options from config
 */
function buildAxeOptions(config: A11yCheckConfig = {}): RunOptions {
  const options: RunOptions = {
    ...DEFAULT_AXE_CONFIG,
    ...config.axeOptions,
  };

  // Merge disabled rules
  if (config.disabledRules?.length) {
    const rulesConfig: Record<string, { enabled: boolean }> = {
      ...(options.rules as Record<string, { enabled: boolean }> || {}),
    };
    for (const ruleId of config.disabledRules) {
      rulesConfig[ruleId] = { enabled: false };
    }
    options.rules = rulesConfig;
  }

  // Merge custom rules
  if (config.rules) {
    options.rules = {
      ...(options.rules as Record<string, { enabled: boolean }> || {}),
      ...config.rules,
    };
  }

  return options;
}

/**
 * Run accessibility check on an element
 *
 * @param element - DOM element to check (usually container from render())
 * @param config - Configuration options
 * @returns Promise resolving to A11yCheckResult
 *
 * @example
 * ```tsx
 * const { container } = render(<Button>Click me</Button>);
 * const result = await runA11yCheck(container);
 * console.log(result.violations);
 * ```
 */
export async function runA11yCheck(
  element: Element | Document,
  config: A11yCheckConfig = {}
): Promise<A11yCheckResult> {
  const options = buildAxeOptions(config);
  const results = await axe(element as HTMLElement, options);

  // Filter violations by impact
  const minImpact = config.minImpact || 'minor';
  const filteredViolations = filterByImpact(results.violations, minImpact);

  const violations = filteredViolations.map(formatViolation);
  const incomplete = config.includeIncomplete
    ? results.incomplete.map(formatViolation)
    : [];

  return {
    passes: violations.length === 0,
    violationCount: violations.length,
    violations,
    raw: results,
    incomplete,
  };
}

/**
 * Assert that an element has no accessibility violations
 *
 * This is the primary function for a11y testing. It throws if violations are found.
 *
 * @param element - DOM element to check
 * @param config - Configuration options
 * @throws Error with detailed violation information if check fails
 *
 * @example
 * ```tsx
 * it('should be accessible', async () => {
 *   const { container } = render(<MyComponent />);
 *   await checkA11y(container);
 * });
 * ```
 */
export async function checkA11y(
  element: Element | Document,
  config: A11yCheckConfig = {}
): Promise<void> {
  const result = await runA11yCheck(element, config);

  if (!result.passes) {
    const violationMessages = result.violations.map((v) => {
      const nodeDetails = v.nodes
        .map((n) => `  - ${n.target.join(', ')}: ${n.html}`)
        .join('\n');
      return `\n[${v.impact?.toUpperCase() || 'UNKNOWN'}] ${v.id}: ${v.help}\n${nodeDetails}\nMore info: ${v.helpUrl}`;
    });

    throw new Error(
      `Found ${result.violationCount} accessibility violation(s):${violationMessages.join('\n')}`
    );
  }
}

/**
 * Create a custom checker with preset configuration
 *
 * @param baseConfig - Base configuration to use for all checks
 * @returns Configured checkA11y function
 *
 * @example
 * ```tsx
 * const checkGameA11y = createA11yChecker({
 *   disabledRules: ['color-contrast'], // Games use special colors
 *   minImpact: 'serious',
 * });
 *
 * it('should be accessible', async () => {
 *   const { container } = render(<GameCanvas />);
 *   await checkGameA11y(container);
 * });
 * ```
 */
export function createA11yChecker(baseConfig: A11yCheckConfig) {
  return async (
    element: Element | Document,
    overrideConfig: A11yCheckConfig = {}
  ): Promise<void> => {
    const mergedConfig: A11yCheckConfig = {
      ...baseConfig,
      ...overrideConfig,
      disabledRules: [
        ...(baseConfig.disabledRules || []),
        ...(overrideConfig.disabledRules || []),
      ],
      rules: {
        ...baseConfig.rules,
        ...overrideConfig.rules,
      },
    };
    await checkA11y(element, mergedConfig);
  };
}

/**
 * Helper to check specific WCAG levels
 */
export const WCAG_CONFIGS = {
  /** WCAG 2.0 Level A only */
  wcag2a: {
    axeOptions: {
      runOnly: { type: 'tag' as const, values: ['wcag2a'] },
    },
  },
  /** WCAG 2.0 Level AA (includes A) */
  wcag2aa: {
    axeOptions: {
      runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] },
    },
  },
  /** WCAG 2.1 Level AA (includes 2.0) */
  wcag21aa: {
    axeOptions: {
      runOnly: {
        type: 'tag' as const,
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    },
  },
  /** All WCAG rules plus best practices */
  all: {
    axeOptions: {
      runOnly: {
        type: 'tag' as const,
        values: [
          'wcag2a',
          'wcag2aa',
          'wcag21a',
          'wcag21aa',
          'wcag22aa',
          'best-practice',
        ],
      },
    },
  },
};

/**
 * Presets for common testing scenarios
 */
export const A11Y_PRESETS = {
  /**
   * Strict checking - all rules enabled, no exceptions
   */
  strict: {
    axeOptions: {
      rules: {
        region: { enabled: true },
        bypass: { enabled: true },
        'page-has-heading-one': { enabled: true },
      },
    },
  },

  /**
   * Component testing - disables page-level rules
   */
  component: {
    disabledRules: ['region', 'bypass', 'page-has-heading-one', 'landmark-one-main'],
  },

  /**
   * Interactive element testing - focuses on keyboard and focus
   */
  interactive: {
    axeOptions: {
      runOnly: {
        type: 'tag' as const,
        values: ['keyboard', 'focus'],
      },
    },
  },

  /**
   * Form testing - focuses on form-related rules
   */
  form: {
    axeOptions: {
      runOnly: {
        type: 'rule' as const,
        values: [
          'label',
          'label-title-only',
          'input-button-name',
          'select-name',
          'autocomplete-valid',
          'form-field-multiple-labels',
        ],
      },
    },
  },

  /**
   * Image testing - focuses on alt text and image rules
   */
  image: {
    axeOptions: {
      runOnly: {
        type: 'rule' as const,
        values: [
          'image-alt',
          'image-redundant-alt',
          'input-image-alt',
          'role-img-alt',
          'svg-img-alt',
        ],
      },
    },
  },

  /**
   * Color contrast only
   */
  contrast: {
    axeOptions: {
      runOnly: {
        type: 'rule' as const,
        values: ['color-contrast', 'color-contrast-enhanced'],
      },
    },
  },

  /**
   * Arcade/gaming preset - relaxed rules for game interfaces
   * Games often have non-standard UI that doesn't follow typical a11y patterns
   */
  arcade: {
    disabledRules: [
      'color-contrast', // Neon theme uses intentional contrast
      'region', // Game canvas doesn't have landmarks
      'bypass', // Game doesn't have skip links
      'page-has-heading-one',
      'landmark-one-main',
    ],
    minImpact: 'serious' as A11yImpact,
  },
};

/**
 * Get a summary of violations grouped by impact
 */
export function summarizeViolations(
  result: A11yCheckResult
): Record<A11yImpact | 'unknown', string[]> {
  const summary: Record<A11yImpact | 'unknown', string[]> = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
    unknown: [],
  };

  for (const violation of result.violations) {
    const impact = violation.impact || 'unknown';
    summary[impact].push(`${violation.id}: ${violation.help}`);
  }

  return summary;
}

/**
 * Create a report string from check results
 */
export function createA11yReport(result: A11yCheckResult): string {
  if (result.passes) {
    return 'Accessibility check passed. No violations found.';
  }

  const lines: string[] = [
    `Accessibility check failed with ${result.violationCount} violation(s):`,
    '',
  ];

  for (const violation of result.violations) {
    lines.push(`[${violation.impact?.toUpperCase() || 'UNKNOWN'}] ${violation.id}`);
    lines.push(`  Description: ${violation.description}`);
    lines.push(`  Help: ${violation.help}`);
    lines.push(`  URL: ${violation.helpUrl}`);
    lines.push('  Affected elements:');

    for (const node of violation.nodes) {
      lines.push(`    - ${node.target.join(' > ')}`);
      lines.push(`      HTML: ${node.html}`);
      if (node.failureSummary) {
        lines.push(`      Fix: ${node.failureSummary}`);
      }
    }
    lines.push('');
  }

  if (result.incomplete.length > 0) {
    lines.push('');
    lines.push(`${result.incomplete.length} item(s) need manual review:`);
    for (const item of result.incomplete) {
      lines.push(`  - ${item.id}: ${item.help}`);
    }
  }

  return lines.join('\n');
}

/**
 * Configure axe to run specific rules only
 */
export function runOnlyRules(rules: string[]): A11yCheckConfig {
  return {
    axeOptions: {
      runOnly: {
        type: 'rule',
        values: rules,
      },
    },
  };
}

/**
 * Configure axe to exclude specific rules
 */
export function excludeRules(rules: string[]): A11yCheckConfig {
  return {
    disabledRules: rules,
  };
}

/**
 * Type guard to check if element is valid for a11y testing
 */
export function isTestableElement(element: unknown): element is Element {
  return element instanceof Element || element instanceof Document;
}

/**
 * Wait for element to be ready and then check accessibility
 * Useful when testing components with async content
 */
export async function checkA11yWhenReady(
  element: Element | Document,
  config: A11yCheckConfig = {},
  timeout = 5000
): Promise<void> {
  // Wait a tick for React to finish rendering
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Simple timeout mechanism
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      await checkA11y(element, config);
      return;
    } catch (error) {
      // If it's not an a11y error, rethrow
      if (
        !(error instanceof Error) ||
        !error.message.includes('accessibility violation')
      ) {
        throw error;
      }
      // Wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Final check - will throw if still failing
  await checkA11y(element, config);
}
