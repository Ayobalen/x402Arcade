/**
 * Snapshot Testing Utilities
 *
 * Provides utilities for component snapshot testing with Vitest.
 * Includes custom serializers, provider wrappers, and comparison helpers.
 *
 * @example
 * ```tsx
 * import { snapshotWithProviders, createComponentSnapshot } from '../utils/snapshot-utils';
 *
 * it('should match snapshot', () => {
 *   const snapshot = createComponentSnapshot(<MyComponent />);
 *   expect(snapshot).toMatchSnapshot();
 * });
 *
 * it('should match snapshot with providers', () => {
 *   snapshotWithProviders(<MyComponent />, { withRouter: true });
 * });
 * ```
 */

import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { expect } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Provider configuration for snapshot testing
 */
export interface SnapshotProviderOptions {
  /** Wrap with React Router */
  withRouter?: boolean;
  /** Initial route for router */
  initialRoute?: string;
  /** Wrap with React Query provider */
  withQueryClient?: boolean;
  /** Custom wrapper component */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Snapshot configuration options
 */
export interface SnapshotOptions extends SnapshotProviderOptions {
  /** Custom render options */
  renderOptions?: RenderOptions;
  /** Strip dynamic attributes (ids, timestamps, etc.) */
  stripDynamic?: boolean;
  /** Custom attribute filters */
  filterAttributes?: string[];
  /** Inline snapshots format */
  inline?: boolean;
}

/**
 * Serializer configuration
 */
export interface SerializerConfig {
  /** Test function to check if serializer applies */
  test: (val: unknown) => boolean;
  /** Serialization function */
  serialize: (val: unknown, config: SerializerConfig, indentation: string, depth: number, refs: unknown[], printer: (val: unknown) => string) => string;
}

/**
 * Snapshot result with metadata
 */
export interface SnapshotResult {
  /** The rendered HTML snapshot */
  html: string;
  /** Container element */
  container: HTMLElement;
  /** Cleanup function */
  unmount: () => void;
  /** Debug helper */
  debug: () => void;
}

// ============================================================================
// CUSTOM SERIALIZERS
// ============================================================================

/**
 * Attributes to strip from snapshots by default
 * These often contain generated values that change between runs
 */
export const DEFAULT_DYNAMIC_ATTRIBUTES = [
  'data-testid-generated',
  'data-radix-id',
  'aria-labelledby',
  'id',
];

/**
 * CSS class patterns to clean up in snapshots
 */
export const CSS_CLASS_PATTERNS_TO_CLEAN = [
  /css-[a-z0-9]+/g, // Emotion/Styled Components hashes
  /sc-[a-z]+-[a-z0-9]+/g, // Styled Components class names
  /tw-[a-z0-9]+/g, // Tailwind JIT classes
];

/**
 * Custom serializer for styled components
 * Removes generated class names to make snapshots more stable
 */
export const styledComponentsSerializer: SerializerConfig = {
  test: (val: unknown): boolean => {
    return (
      val !== null &&
      typeof val === 'object' &&
      'className' in val &&
      typeof (val as { className: string }).className === 'string'
    );
  },
  serialize: (val, _config, indentation, _depth, _refs, printer) => {
    const element = val as { className?: string; [key: string]: unknown };
    const cleanedClassName = cleanClassName(element.className || '');
    const cleaned = { ...element, className: cleanedClassName };
    return printer(cleaned);
  },
};

/**
 * Custom serializer for Framer Motion elements
 * Strips animation-related attributes
 */
export const framerMotionSerializer: SerializerConfig = {
  test: (val: unknown): boolean => {
    if (val === null || typeof val !== 'object') return false;
    const obj = val as Record<string, unknown>;
    return (
      'style' in obj &&
      typeof obj.style === 'object' &&
      obj.style !== null &&
      ('transform' in (obj.style as object) || 'opacity' in (obj.style as object))
    );
  },
  serialize: (val, _config, _indentation, _depth, _refs, printer) => {
    const element = val as { style?: Record<string, unknown>; [key: string]: unknown };
    const { style, ...rest } = element;

    // Keep only non-animation styles
    const cleanedStyle: Record<string, unknown> = {};
    if (style) {
      for (const [key, value] of Object.entries(style)) {
        if (!['transform', 'opacity', 'scale', 'rotate', 'x', 'y'].includes(key)) {
          cleanedStyle[key] = value;
        }
      }
    }

    return printer({
      ...rest,
      style: Object.keys(cleanedStyle).length > 0 ? cleanedStyle : undefined,
    });
  },
};

/**
 * Custom serializer for HTML elements
 * Cleans up dynamic attributes and normalizes output
 */
export const htmlElementSerializer: SerializerConfig = {
  test: (val: unknown): boolean => {
    return val instanceof HTMLElement;
  },
  serialize: (val, _config, indentation, depth, _refs, _printer) => {
    const element = val as HTMLElement;
    return serializeHTMLElement(element, indentation, depth);
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean CSS class names by removing generated hashes
 */
export function cleanClassName(className: string): string {
  let cleaned = className;
  for (const pattern of CSS_CLASS_PATTERNS_TO_CLEAN) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Clean up extra spaces
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Remove dynamic attributes from an element for snapshot comparison
 */
export function stripDynamicAttributes(
  element: Element,
  attributesToStrip: string[] = DEFAULT_DYNAMIC_ATTRIBUTES
): void {
  for (const attr of attributesToStrip) {
    element.removeAttribute(attr);
  }

  // Recursively strip from children
  for (const child of Array.from(element.children)) {
    stripDynamicAttributes(child, attributesToStrip);
  }
}

/**
 * Serialize an HTML element to a readable string
 */
export function serializeHTMLElement(
  element: HTMLElement,
  indentation: string = '',
  depth: number = 0
): string {
  const indent = indentation.repeat(depth);
  const tagName = element.tagName.toLowerCase();

  // Get attributes
  const attrs = Array.from(element.attributes)
    .filter((attr) => !DEFAULT_DYNAMIC_ATTRIBUTES.includes(attr.name))
    .map((attr) => {
      const value = attr.name === 'class' ? cleanClassName(attr.value) : attr.value;
      return `${attr.name}="${value}"`;
    })
    .join(' ');

  const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

  // Handle self-closing tags
  const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
  if (selfClosingTags.includes(tagName)) {
    return `${indent}${openTag.replace('>', ' />')}`;
  }

  // Get children
  const children = Array.from(element.childNodes);
  if (children.length === 0) {
    return `${indent}${openTag}</${tagName}>`;
  }

  // Serialize children
  const childrenStr = children
    .map((child) => {
      if (child instanceof HTMLElement) {
        return serializeHTMLElement(child, indentation, depth + 1);
      }
      if (child instanceof Text) {
        const text = child.textContent?.trim();
        return text ? `${indentation.repeat(depth + 1)}${text}` : '';
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  if (childrenStr) {
    return `${indent}${openTag}\n${childrenStr}\n${indent}</${tagName}>`;
  }

  return `${indent}${openTag}</${tagName}>`;
}

/**
 * Format HTML string for readable snapshots
 */
export function formatHTML(html: string): string {
  // Simple formatting - add newlines after closing tags
  return html
    .replace(/></g, '>\n<')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// ============================================================================
// PROVIDER WRAPPERS
// ============================================================================

/**
 * Create a combined provider wrapper
 */
export function createProviderWrapper(
  options: SnapshotProviderOptions
): React.ComponentType<{ children: React.ReactNode }> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function ProviderWrapper({ children }: { children: React.ReactNode }) {
    let wrapped = children;

    // Wrap with custom wrapper first
    if (options.wrapper) {
      const CustomWrapper = options.wrapper;
      wrapped = <CustomWrapper>{wrapped}</CustomWrapper>;
    }

    // Wrap with React Query
    if (options.withQueryClient) {
      wrapped = (
        <QueryClientProvider client={queryClient}>
          {wrapped}
        </QueryClientProvider>
      );
    }

    // Wrap with Router
    if (options.withRouter) {
      if (options.initialRoute) {
        wrapped = (
          <MemoryRouter initialEntries={[options.initialRoute]}>
            {wrapped}
          </MemoryRouter>
        );
      } else {
        wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
      }
    }

    return <>{wrapped}</>;
  };
}

// ============================================================================
// SNAPSHOT FUNCTIONS
// ============================================================================

/**
 * Create a snapshot of a rendered component
 *
 * @param element - React element to snapshot
 * @param options - Snapshot options
 * @returns SnapshotResult with HTML and utilities
 *
 * @example
 * ```tsx
 * const result = createComponentSnapshot(<Button>Click me</Button>);
 * expect(result.html).toMatchSnapshot();
 * ```
 */
export function createComponentSnapshot(
  element: ReactElement,
  options: SnapshotOptions = {}
): SnapshotResult {
  const wrapper = createProviderWrapper(options);

  const { container, unmount, debug } = render(element, {
    wrapper,
    ...options.renderOptions,
  });

  // Strip dynamic attributes if requested
  if (options.stripDynamic !== false) {
    const attributesToStrip = [
      ...DEFAULT_DYNAMIC_ATTRIBUTES,
      ...(options.filterAttributes || []),
    ];
    stripDynamicAttributes(container, attributesToStrip);
  }

  // Get formatted HTML
  const html = formatHTML(container.innerHTML);

  return {
    html,
    container,
    unmount,
    debug,
  };
}

/**
 * Create and assert snapshot in one call
 *
 * @param element - React element to snapshot
 * @param options - Snapshot options
 *
 * @example
 * ```tsx
 * it('should match snapshot', () => {
 *   snapshotWithProviders(<MyComponent />, { withRouter: true });
 * });
 * ```
 */
export function snapshotWithProviders(
  element: ReactElement,
  options: SnapshotOptions = {}
): void {
  const { html, unmount } = createComponentSnapshot(element, options);

  try {
    if (options.inline) {
      expect(html).toMatchInlineSnapshot();
    } else {
      expect(html).toMatchSnapshot();
    }
  } finally {
    unmount();
  }
}

/**
 * Create multiple snapshots from a list of component variations
 *
 * @param variations - Map of variation name to element
 * @param options - Shared snapshot options
 *
 * @example
 * ```tsx
 * snapshotVariations({
 *   'default': <Button>Click</Button>,
 *   'disabled': <Button disabled>Click</Button>,
 *   'loading': <Button loading>Click</Button>,
 * });
 * ```
 */
export function snapshotVariations(
  variations: Record<string, ReactElement>,
  options: SnapshotOptions = {}
): Record<string, string> {
  const results: Record<string, string> = {};

  for (const [name, element] of Object.entries(variations)) {
    const { html, unmount } = createComponentSnapshot(element, options);
    results[name] = html;
    unmount();
  }

  return results;
}

/**
 * Assert that all variation snapshots match
 */
export function assertVariationSnapshots(
  variations: Record<string, ReactElement>,
  options: SnapshotOptions = {}
): void {
  const results = snapshotVariations(variations, options);

  for (const [name, html] of Object.entries(results)) {
    expect(html).toMatchSnapshot(name);
  }
}

// ============================================================================
// CI HELPERS
// ============================================================================

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return (
    process.env.CI === 'true' ||
    process.env.CONTINUOUS_INTEGRATION === 'true' ||
    process.env.GITHUB_ACTIONS === 'true'
  );
}

/**
 * Get snapshot update behavior for CI
 * In CI, snapshots should never be updated automatically
 */
export function getSnapshotUpdateBehavior(): 'all' | 'new' | 'none' {
  if (isCI()) {
    return 'none';
  }
  // Allow updating in development
  return process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'new';
}

/**
 * Helper to programmatically update snapshots
 * Only works in development, not CI
 *
 * @param testName - Name of the test to update
 *
 * @example
 * ```bash
 * # Run with update flag
 * UPDATE_SNAPSHOTS=true npm test
 * ```
 */
export function updateSnapshots(testName?: string): void {
  if (isCI()) {
    console.warn('Cannot update snapshots in CI environment');
    return;
  }

  console.log(
    testName
      ? `Run 'npm test -- -u -t "${testName}"' to update snapshots`
      : `Run 'npm test -- -u' to update all snapshots`
  );
}

// ============================================================================
// COMPARISON HELPERS
// ============================================================================

/**
 * Options for snapshot comparison
 */
export interface ComparisonOptions {
  /** Ignore whitespace differences */
  ignoreWhitespace?: boolean;
  /** Ignore attribute order */
  ignoreAttributeOrder?: boolean;
  /** Normalize class names */
  normalizeClasses?: boolean;
}

/**
 * Normalize HTML for comparison
 */
export function normalizeHTML(html: string, options: ComparisonOptions = {}): string {
  let normalized = html;

  if (options.ignoreWhitespace) {
    // Collapse all whitespace to single spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  if (options.normalizeClasses) {
    // Sort class names alphabetically
    normalized = normalized.replace(
      /class="([^"]*)"/g,
      (match, classes: string) => {
        const sorted = classes.split(/\s+/).sort().join(' ');
        return `class="${sorted}"`;
      }
    );
  }

  return normalized;
}

/**
 * Compare two HTML strings with options
 */
export function compareSnapshots(
  actual: string,
  expected: string,
  options: ComparisonOptions = {}
): boolean {
  const normalizedActual = normalizeHTML(actual, options);
  const normalizedExpected = normalizeHTML(expected, options);
  return normalizedActual === normalizedExpected;
}

/**
 * Get diff between two snapshots
 */
export function getSnapshotDiff(
  actual: string,
  expected: string
): { added: string[]; removed: string[] } {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');

  const added = actualLines.filter((line) => !expectedLines.includes(line));
  const removed = expectedLines.filter((line) => !actualLines.includes(line));

  return { added, removed };
}

// ============================================================================
// FILE NAMING CONVENTIONS
// ============================================================================

/**
 * Default snapshot file extension
 */
export const SNAPSHOT_EXTENSION = '.snap';

/**
 * Get snapshot file path for a test file
 *
 * @param testFilePath - Path to the test file
 * @returns Path to the snapshot file
 *
 * @example
 * ```ts
 * getSnapshotPath('/src/Button.test.tsx')
 * // Returns: '/src/__snapshots__/Button.test.tsx.snap'
 * ```
 */
export function getSnapshotPath(testFilePath: string): string {
  const parts = testFilePath.split('/');
  const fileName = parts.pop() || '';
  const dirPath = parts.join('/');

  return `${dirPath}/__snapshots__/${fileName}${SNAPSHOT_EXTENSION}`;
}

/**
 * Generate snapshot name from test description
 */
export function generateSnapshotName(
  componentName: string,
  variation?: string
): string {
  const base = componentName.replace(/\s+/g, '_');
  return variation ? `${base}_${variation}` : base;
}

// ============================================================================
// EXPORTS FOR TEST SETUP
// ============================================================================

/**
 * Configure Vitest snapshot settings
 * Call this in your test setup file
 *
 * @example
 * ```ts
 * // In vitest.setup.ts
 * import { configureSnapshots } from './utils/snapshot-utils';
 * configureSnapshots();
 * ```
 */
export function configureSnapshots(): void {
  // Vitest handles snapshot configuration through vitest.config.ts
  // This function is a placeholder for any runtime configuration

  // Log snapshot mode in development
  if (!isCI() && process.env.DEBUG) {
    console.log('Snapshot update behavior:', getSnapshotUpdateBehavior());
  }
}

/**
 * Get all available serializers
 */
export const serializers = {
  styledComponents: styledComponentsSerializer,
  framerMotion: framerMotionSerializer,
  htmlElement: htmlElementSerializer,
};

/**
 * Default snapshot configuration
 */
export const defaultSnapshotConfig: SnapshotOptions = {
  stripDynamic: true,
  filterAttributes: [],
  withRouter: false,
  withQueryClient: false,
};
