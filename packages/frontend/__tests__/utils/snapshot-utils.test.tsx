/**
 * Snapshot Testing Utilities - Comprehensive Tests
 *
 * Tests for component snapshot testing utilities with serializers,
 * provider wrappers, and comparison helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  // Types
  type SnapshotProviderOptions,
  type SnapshotOptions,
  type SerializerConfig,
  type SnapshotResult,
  type ComparisonOptions,
  // Constants
  DEFAULT_DYNAMIC_ATTRIBUTES,
  CSS_CLASS_PATTERNS_TO_CLEAN,
  SNAPSHOT_EXTENSION,
  // Serializers
  styledComponentsSerializer,
  framerMotionSerializer,
  htmlElementSerializer,
  serializers,
  // Helper functions
  cleanClassName,
  stripDynamicAttributes,
  serializeHTMLElement,
  formatHTML,
  // Provider wrappers
  createProviderWrapper,
  // Snapshot functions
  createComponentSnapshot,
  snapshotWithProviders,
  snapshotVariations,
  assertVariationSnapshots,
  // CI helpers
  isCI,
  getSnapshotUpdateBehavior,
  updateSnapshots,
  // Comparison helpers
  normalizeHTML,
  compareSnapshotStrings,
  getSnapshotDiff,
  // File naming
  getSnapshotPath,
  generateSnapshotName,
  // Configuration
  configureSnapshots,
  defaultSnapshotConfig,
} from './index';

// ============================================================================
// TEST COMPONENTS
// ============================================================================

/** Simple test component */
function SimpleButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button disabled={disabled} className="btn btn-primary">
      {children}
    </button>
  );
}

/** Component with dynamic class names (simulating styled-components) */
function StyledComponent({ className }: { className?: string }) {
  return (
    <div className={`base-class css-abc123 sc-a-xyz789 ${className || ''}`}>
      Styled Content
    </div>
  );
}

/** Component that uses React Router */
function RouterComponent() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  );
}

/** Component that uses React Query */
function QueryComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve({ message: 'Hello' }),
    enabled: false, // Don't actually fetch in tests
  });

  if (isLoading) return <div>Loading...</div>;
  return <div data-testid="result">{data?.message || 'No data'}</div>;
}

/** Component with Framer Motion-like styles */
function AnimatedComponent() {
  return (
    <div
      style={{
        transform: 'translateX(100px)',
        opacity: 0.5,
        backgroundColor: 'red',
        padding: '10px',
      }}
    >
      Animated
    </div>
  );
}

/** Component with various HTML elements */
function ComplexComponent() {
  return (
    <article id="dynamic-id-123" data-radix-id="radix-456">
      <header>
        <h1>Title</h1>
      </header>
      <main>
        <p aria-labelledby="label-789">Content</p>
        <img src="/image.jpg" alt="Test" />
        <input type="text" placeholder="Enter text" />
      </main>
      <footer>Footer</footer>
    </article>
  );
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Snapshot Constants', () => {
  describe('DEFAULT_DYNAMIC_ATTRIBUTES', () => {
    it('should include common dynamic attributes', () => {
      expect(DEFAULT_DYNAMIC_ATTRIBUTES).toContain('id');
      expect(DEFAULT_DYNAMIC_ATTRIBUTES).toContain('data-radix-id');
      expect(DEFAULT_DYNAMIC_ATTRIBUTES).toContain('aria-labelledby');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(DEFAULT_DYNAMIC_ATTRIBUTES)).toBe(true);
      DEFAULT_DYNAMIC_ATTRIBUTES.forEach((attr) => {
        expect(typeof attr).toBe('string');
      });
    });
  });

  describe('CSS_CLASS_PATTERNS_TO_CLEAN', () => {
    it('should include patterns for common CSS-in-JS libraries', () => {
      expect(CSS_CLASS_PATTERNS_TO_CLEAN.length).toBeGreaterThan(0);
      CSS_CLASS_PATTERNS_TO_CLEAN.forEach((pattern) => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });

    it('should match Emotion class patterns', () => {
      const emotionPattern = CSS_CLASS_PATTERNS_TO_CLEAN.find((p) =>
        p.test('css-abc123')
      );
      expect(emotionPattern).toBeDefined();
    });

    it('should match Styled Components class patterns', () => {
      const scPattern = CSS_CLASS_PATTERNS_TO_CLEAN.find((p) =>
        p.test('sc-a-xyz789')
      );
      expect(scPattern).toBeDefined();
    });
  });

  describe('SNAPSHOT_EXTENSION', () => {
    it('should be .snap', () => {
      expect(SNAPSHOT_EXTENSION).toBe('.snap');
    });
  });
});

// ============================================================================
// SERIALIZER TESTS
// ============================================================================

describe('Snapshot Serializers', () => {
  describe('styledComponentsSerializer', () => {
    it('should test objects with className property', () => {
      expect(styledComponentsSerializer.test({ className: 'test' })).toBe(true);
      expect(styledComponentsSerializer.test({ className: '' })).toBe(true);
      expect(styledComponentsSerializer.test({})).toBe(false);
      expect(styledComponentsSerializer.test(null)).toBe(false);
      expect(styledComponentsSerializer.test('string')).toBe(false);
    });

    it('should serialize and clean className', () => {
      const mockPrinter = vi.fn((val) => JSON.stringify(val));
      const obj = { className: 'base-class css-abc123 other-class' };

      styledComponentsSerializer.serialize(
        obj,
        styledComponentsSerializer,
        '  ',
        0,
        [],
        mockPrinter
      );

      expect(mockPrinter).toHaveBeenCalled();
      const [printedValue] = mockPrinter.mock.calls[0];
      expect((printedValue as { className: string }).className).not.toContain('css-');
    });
  });

  describe('framerMotionSerializer', () => {
    it('should test objects with animation styles', () => {
      expect(
        framerMotionSerializer.test({ style: { transform: 'translateX(100px)' } })
      ).toBe(true);
      expect(framerMotionSerializer.test({ style: { opacity: 0.5 } })).toBe(true);
      expect(framerMotionSerializer.test({ style: { color: 'red' } })).toBe(false);
      expect(framerMotionSerializer.test({})).toBe(false);
      expect(framerMotionSerializer.test(null)).toBe(false);
    });

    it('should strip animation-related styles', () => {
      const mockPrinter = vi.fn((val) => JSON.stringify(val));
      const obj = {
        style: {
          transform: 'translateX(100px)',
          opacity: 0.5,
          backgroundColor: 'red',
          padding: '10px',
        },
        className: 'test',
      };

      framerMotionSerializer.serialize(
        obj,
        framerMotionSerializer,
        '  ',
        0,
        [],
        mockPrinter
      );

      expect(mockPrinter).toHaveBeenCalled();
      const [printedValue] = mockPrinter.mock.calls[0];
      const printed = printedValue as { style?: Record<string, unknown> };
      expect(printed.style).toBeDefined();
      expect(printed.style?.transform).toBeUndefined();
      expect(printed.style?.opacity).toBeUndefined();
      expect(printed.style?.backgroundColor).toBe('red');
      expect(printed.style?.padding).toBe('10px');
    });
  });

  describe('htmlElementSerializer', () => {
    it('should test HTML elements', () => {
      const div = document.createElement('div');
      expect(htmlElementSerializer.test(div)).toBe(true);
      expect(htmlElementSerializer.test({})).toBe(false);
      expect(htmlElementSerializer.test('string')).toBe(false);
    });

    it('should serialize HTML elements', () => {
      const div = document.createElement('div');
      div.className = 'test-class';
      div.textContent = 'Hello';

      const result = htmlElementSerializer.serialize(
        div,
        htmlElementSerializer,
        '  ',
        0,
        [],
        vi.fn()
      );

      expect(result).toContain('div');
      expect(result).toContain('test-class');
      expect(result).toContain('Hello');
    });
  });

  describe('serializers object', () => {
    it('should export all serializers', () => {
      expect(serializers.styledComponents).toBe(styledComponentsSerializer);
      expect(serializers.framerMotion).toBe(framerMotionSerializer);
      expect(serializers.htmlElement).toBe(htmlElementSerializer);
    });
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('Helper Functions', () => {
  describe('cleanClassName', () => {
    it('should remove Emotion class names', () => {
      const result = cleanClassName('btn css-abc123 primary');
      expect(result).not.toContain('css-');
      expect(result).toContain('btn');
      expect(result).toContain('primary');
    });

    it('should remove Styled Components class names', () => {
      const result = cleanClassName('btn sc-a-xyz789 primary');
      expect(result).not.toContain('sc-');
      expect(result).toContain('btn');
      expect(result).toContain('primary');
    });

    it('should collapse extra whitespace', () => {
      const result = cleanClassName('btn   css-abc   primary');
      expect(result).not.toContain('  ');
    });

    it('should handle empty strings', () => {
      expect(cleanClassName('')).toBe('');
    });

    it('should trim the result', () => {
      const result = cleanClassName('  btn primary  ');
      expect(result).toBe('btn primary');
    });
  });

  describe('stripDynamicAttributes', () => {
    it('should remove default dynamic attributes', () => {
      const div = document.createElement('div');
      div.id = 'dynamic-123';
      div.setAttribute('data-radix-id', 'radix-456');
      div.setAttribute('aria-labelledby', 'label-789');
      div.className = 'test-class';

      stripDynamicAttributes(div);

      expect(div.hasAttribute('id')).toBe(false);
      expect(div.hasAttribute('data-radix-id')).toBe(false);
      expect(div.hasAttribute('aria-labelledby')).toBe(false);
      expect(div.className).toBe('test-class');
    });

    it('should strip custom attributes', () => {
      const div = document.createElement('div');
      div.setAttribute('data-custom', 'value');
      div.setAttribute('data-keep', 'value');

      stripDynamicAttributes(div, ['data-custom']);

      expect(div.hasAttribute('data-custom')).toBe(false);
      expect(div.hasAttribute('data-keep')).toBe(true);
    });

    it('should recursively strip from children', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      child.id = 'child-id';
      parent.appendChild(child);

      stripDynamicAttributes(parent);

      expect(child.hasAttribute('id')).toBe(false);
    });
  });

  describe('serializeHTMLElement', () => {
    it('should serialize a simple element', () => {
      const div = document.createElement('div');
      div.className = 'test';
      div.textContent = 'Hello';

      const result = serializeHTMLElement(div);

      expect(result).toContain('<div');
      expect(result).toContain('class="test"');
      expect(result).toContain('Hello');
      expect(result).toContain('</div>');
    });

    it('should handle self-closing tags', () => {
      const img = document.createElement('img');
      img.src = '/test.jpg';
      img.alt = 'Test';

      const result = serializeHTMLElement(img);

      expect(result).toContain('<img');
      expect(result).toContain('/>');
      expect(result).not.toContain('</img>');
    });

    it('should handle nested elements', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'Child';
      div.appendChild(span);

      const result = serializeHTMLElement(div, '  ');

      expect(result).toContain('<div>');
      expect(result).toContain('<span>');
      expect(result).toContain('Child');
      expect(result).toContain('</span>');
      expect(result).toContain('</div>');
    });

    it('should strip dynamic attributes', () => {
      const div = document.createElement('div');
      div.id = 'dynamic-id';
      div.className = 'keep-this';

      const result = serializeHTMLElement(div);

      expect(result).not.toContain('id=');
      expect(result).toContain('class="keep-this"');
    });

    it('should clean class names', () => {
      const div = document.createElement('div');
      div.className = 'base css-abc123 other';

      const result = serializeHTMLElement(div);

      expect(result).not.toContain('css-abc123');
      expect(result).toContain('base');
      expect(result).toContain('other');
    });
  });

  describe('formatHTML', () => {
    it('should add newlines between tags', () => {
      const html = '<div><span>Hello</span></div>';
      const result = formatHTML(html);

      expect(result).toContain('\n');
    });

    it('should remove extra blank lines', () => {
      const html = '<div>\n\n\n<span>Hello</span></div>';
      const result = formatHTML(html);

      expect(result).not.toMatch(/\n\s*\n/);
    });

    it('should trim whitespace', () => {
      const html = '  <div>Test</div>  ';
      const result = formatHTML(html);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });
});

// ============================================================================
// PROVIDER WRAPPER TESTS
// ============================================================================

describe('Provider Wrappers', () => {
  describe('createProviderWrapper', () => {
    it('should return a component', () => {
      const Wrapper = createProviderWrapper({});
      expect(typeof Wrapper).toBe('function');
    });

    it('should render children without providers', () => {
      const Wrapper = createProviderWrapper({});
      const { html } = createComponentSnapshot(
        <Wrapper>
          <div>Test</div>
        </Wrapper>,
        { stripDynamic: false }
      );

      expect(html).toContain('Test');
    });

    it('should wrap with router when withRouter is true', () => {
      const Wrapper = createProviderWrapper({ withRouter: true });
      const { unmount } = createComponentSnapshot(
        <Wrapper>
          <RouterComponent />
        </Wrapper>
      );

      // If it renders without error, router is working
      unmount();
    });

    it('should use initial route when provided', () => {
      const Wrapper = createProviderWrapper({
        withRouter: true,
        initialRoute: '/test',
      });
      const { unmount } = createComponentSnapshot(
        <Wrapper>
          <RouterComponent />
        </Wrapper>
      );

      unmount();
    });

    it('should wrap with query client when withQueryClient is true', () => {
      const Wrapper = createProviderWrapper({ withQueryClient: true });
      const { unmount } = createComponentSnapshot(
        <Wrapper>
          <QueryComponent />
        </Wrapper>
      );

      unmount();
    });

    it('should wrap with custom wrapper', () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="custom-wrapper">{children}</div>
      );

      const Wrapper = createProviderWrapper({ wrapper: CustomWrapper });
      const { html, unmount } = createComponentSnapshot(
        <Wrapper>
          <div>Test</div>
        </Wrapper>,
        { stripDynamic: false }
      );

      expect(html).toContain('custom-wrapper');
      unmount();
    });
  });
});

// ============================================================================
// SNAPSHOT FUNCTION TESTS
// ============================================================================

describe('Snapshot Functions', () => {
  describe('createComponentSnapshot', () => {
    it('should return snapshot result object', () => {
      const result = createComponentSnapshot(<SimpleButton>Click</SimpleButton>);

      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('container');
      expect(result).toHaveProperty('unmount');
      expect(result).toHaveProperty('debug');
      expect(typeof result.html).toBe('string');
      expect(result.container).toBeInstanceOf(HTMLElement);
      expect(typeof result.unmount).toBe('function');
      expect(typeof result.debug).toBe('function');

      result.unmount();
    });

    it('should strip dynamic attributes by default', () => {
      const result = createComponentSnapshot(<ComplexComponent />);

      expect(result.html).not.toContain('dynamic-id-123');
      expect(result.html).not.toContain('radix-456');
      expect(result.html).not.toContain('label-789');

      result.unmount();
    });

    it('should preserve dynamic attributes when stripDynamic is false', () => {
      const result = createComponentSnapshot(<ComplexComponent />, {
        stripDynamic: false,
      });

      expect(result.container.innerHTML).toContain('dynamic-id-123');

      result.unmount();
    });

    it('should filter custom attributes', () => {
      const TestComponent = () => (
        <div data-custom="remove-this" data-keep="keep-this">
          Test
        </div>
      );

      const result = createComponentSnapshot(<TestComponent />, {
        filterAttributes: ['data-custom'],
      });

      expect(result.html).not.toContain('remove-this');
      expect(result.html).toContain('keep-this');

      result.unmount();
    });

    it('should work with router provider', () => {
      const result = createComponentSnapshot(<RouterComponent />, {
        withRouter: true,
      });

      expect(result.html).toContain('Home');
      expect(result.html).toContain('About');

      result.unmount();
    });

    it('should work with query client provider', () => {
      const result = createComponentSnapshot(<QueryComponent />, {
        withQueryClient: true,
      });

      expect(result.html).toBeDefined();

      result.unmount();
    });
  });

  describe('snapshotWithProviders', () => {
    it('should match snapshot', () => {
      snapshotWithProviders(<SimpleButton>Click me</SimpleButton>);
    });

    it('should match snapshot with router', () => {
      snapshotWithProviders(<RouterComponent />, { withRouter: true });
    });

    it('should match snapshot with query client', () => {
      snapshotWithProviders(<QueryComponent />, { withQueryClient: true });
    });

    it('should match snapshot with all providers', () => {
      snapshotWithProviders(<RouterComponent />, {
        withRouter: true,
        withQueryClient: true,
      });
    });
  });

  describe('snapshotVariations', () => {
    it('should return snapshots for all variations', () => {
      const variations = {
        default: <SimpleButton>Default</SimpleButton>,
        disabled: <SimpleButton disabled>Disabled</SimpleButton>,
      };

      const results = snapshotVariations(variations);

      expect(Object.keys(results)).toEqual(['default', 'disabled']);
      expect(results['default']).toContain('Default');
      expect(results['disabled']).toContain('Disabled');
      expect(results['disabled']).toContain('disabled');
    });

    it('should apply options to all variations', () => {
      const variations = {
        first: <RouterComponent />,
        second: <RouterComponent />,
      };

      const results = snapshotVariations(variations, { withRouter: true });

      expect(results['first']).toContain('Home');
      expect(results['second']).toContain('Home');
    });
  });

  describe('assertVariationSnapshots', () => {
    it('should assert all variation snapshots', () => {
      const variations = {
        default: <SimpleButton>Click</SimpleButton>,
        disabled: <SimpleButton disabled>Click</SimpleButton>,
      };

      // This should not throw
      assertVariationSnapshots(variations);
    });
  });
});

// ============================================================================
// CI HELPER TESTS
// ============================================================================

describe('CI Helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isCI', () => {
    it('should return true when CI=true', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('should return true when CONTINUOUS_INTEGRATION=true', () => {
      process.env.CONTINUOUS_INTEGRATION = 'true';
      expect(isCI()).toBe(true);
    });

    it('should return true when GITHUB_ACTIONS=true', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCI()).toBe(true);
    });

    it('should return false when not in CI', () => {
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.GITHUB_ACTIONS;
      expect(isCI()).toBe(false);
    });
  });

  describe('getSnapshotUpdateBehavior', () => {
    it('should return "none" in CI', () => {
      process.env.CI = 'true';
      expect(getSnapshotUpdateBehavior()).toBe('none');
    });

    it('should return "all" when UPDATE_SNAPSHOTS=true', () => {
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.GITHUB_ACTIONS;
      process.env.UPDATE_SNAPSHOTS = 'true';
      expect(getSnapshotUpdateBehavior()).toBe('all');
    });

    it('should return "new" by default', () => {
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.UPDATE_SNAPSHOTS;
      expect(getSnapshotUpdateBehavior()).toBe('new');
    });
  });

  describe('updateSnapshots', () => {
    it('should warn in CI environment', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.CI = 'true';

      updateSnapshots();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot update snapshots in CI environment'
      );
      consoleSpy.mockRestore();
    });

    it('should log update command in development', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.GITHUB_ACTIONS;

      updateSnapshots();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log specific test name when provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.GITHUB_ACTIONS;

      updateSnapshots('my-test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('my-test')
      );
      consoleSpy.mockRestore();
    });
  });
});

// ============================================================================
// COMPARISON HELPER TESTS
// ============================================================================

describe('Comparison Helpers', () => {
  describe('normalizeHTML', () => {
    it('should collapse whitespace when ignoreWhitespace is true', () => {
      const html = '<div>  Hello   World  </div>';
      const result = normalizeHTML(html, { ignoreWhitespace: true });

      expect(result).toBe('<div> Hello World </div>');
    });

    it('should sort class names when normalizeClasses is true', () => {
      const html = '<div class="zebra apple mango">Test</div>';
      const result = normalizeHTML(html, { normalizeClasses: true });

      expect(result).toContain('class="apple mango zebra"');
    });

    it('should preserve original HTML without options', () => {
      const html = '<div class="b a">Test</div>';
      const result = normalizeHTML(html);

      expect(result).toBe(html);
    });
  });

  describe('compareSnapshotStrings', () => {
    it('should return true for identical strings', () => {
      const html = '<div>Test</div>';
      expect(compareSnapshotStrings(html, html)).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(
        compareSnapshotStrings('<div>A</div>', '<div>B</div>')
      ).toBe(false);
    });

    it('should compare with whitespace normalization', () => {
      const a = '<div>  Hello  </div>';
      const b = '<div> Hello </div>';

      expect(
        compareSnapshotStrings(a, b, { ignoreWhitespace: true })
      ).toBe(true);
    });

    it('should compare with class normalization', () => {
      const a = '<div class="b a">Test</div>';
      const b = '<div class="a b">Test</div>';

      expect(
        compareSnapshotStrings(a, b, { normalizeClasses: true })
      ).toBe(true);
    });
  });

  describe('getSnapshotDiff', () => {
    it('should return empty arrays for identical snapshots', () => {
      const html = '<div>Test</div>';
      const { added, removed } = getSnapshotDiff(html, html);

      expect(added).toEqual([]);
      expect(removed).toEqual([]);
    });

    it('should return added lines', () => {
      const a = '<div>\n<span>New</span>\n</div>';
      const b = '<div>\n</div>';

      const { added, removed } = getSnapshotDiff(a, b);

      expect(added).toContain('<span>New</span>');
      expect(removed.length).toBe(0);
    });

    it('should return removed lines', () => {
      const a = '<div>\n</div>';
      const b = '<div>\n<span>Old</span>\n</div>';

      const { added, removed } = getSnapshotDiff(a, b);

      expect(removed).toContain('<span>Old</span>');
      expect(added.length).toBe(0);
    });

    it('should handle both additions and removals', () => {
      const a = '<div>\n<span>New</span>\n</div>';
      const b = '<div>\n<span>Old</span>\n</div>';

      const { added, removed } = getSnapshotDiff(a, b);

      expect(added).toContain('<span>New</span>');
      expect(removed).toContain('<span>Old</span>');
    });
  });
});

// ============================================================================
// FILE NAMING TESTS
// ============================================================================

describe('File Naming', () => {
  describe('getSnapshotPath', () => {
    it('should generate correct snapshot path', () => {
      const result = getSnapshotPath('/src/Button.test.tsx');

      expect(result).toBe('/src/__snapshots__/Button.test.tsx.snap');
    });

    it('should handle nested paths', () => {
      const result = getSnapshotPath('/src/components/ui/Button.test.tsx');

      expect(result).toBe('/src/components/ui/__snapshots__/Button.test.tsx.snap');
    });

    it('should handle paths without leading slash', () => {
      const result = getSnapshotPath('src/Button.test.tsx');

      expect(result).toBe('src/__snapshots__/Button.test.tsx.snap');
    });
  });

  describe('generateSnapshotName', () => {
    it('should generate name from component name', () => {
      expect(generateSnapshotName('Button')).toBe('Button');
    });

    it('should include variation', () => {
      expect(generateSnapshotName('Button', 'disabled')).toBe('Button_disabled');
    });

    it('should replace spaces with underscores', () => {
      expect(generateSnapshotName('My Button', 'is disabled')).toBe(
        'My_Button_is_disabled'
      );
    });

    it('should handle component names with spaces', () => {
      expect(generateSnapshotName('Complex Component')).toBe('Complex_Component');
    });
  });
});

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

describe('Configuration', () => {
  describe('configureSnapshots', () => {
    it('should be a function', () => {
      expect(typeof configureSnapshots).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => configureSnapshots()).not.toThrow();
    });

    it('should log in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';

      configureSnapshots();

      // Restore
      process.env.DEBUG = originalDebug;
      consoleSpy.mockRestore();
    });
  });

  describe('defaultSnapshotConfig', () => {
    it('should have expected default values', () => {
      expect(defaultSnapshotConfig.stripDynamic).toBe(true);
      expect(defaultSnapshotConfig.filterAttributes).toEqual([]);
      expect(defaultSnapshotConfig.withRouter).toBe(false);
      expect(defaultSnapshotConfig.withQueryClient).toBe(false);
    });

    it('should be a valid SnapshotOptions object', () => {
      const config: SnapshotOptions = defaultSnapshotConfig;
      expect(config).toBeDefined();
    });
  });
});

// ============================================================================
// TYPE TESTS (compile-time verification)
// ============================================================================

describe('Type Definitions', () => {
  it('should export SnapshotProviderOptions type', () => {
    const options: SnapshotProviderOptions = {
      withRouter: true,
      initialRoute: '/test',
      withQueryClient: true,
    };
    expect(options).toBeDefined();
  });

  it('should export SnapshotOptions type', () => {
    const options: SnapshotOptions = {
      withRouter: true,
      stripDynamic: true,
      filterAttributes: ['id'],
      inline: false,
    };
    expect(options).toBeDefined();
  });

  it('should export SerializerConfig type', () => {
    const config: SerializerConfig = {
      test: () => true,
      serialize: () => 'serialized',
    };
    expect(config).toBeDefined();
  });

  it('should export SnapshotResult type', () => {
    const result: SnapshotResult = {
      html: '<div></div>',
      container: document.createElement('div'),
      unmount: () => {},
      debug: () => {},
    };
    expect(result).toBeDefined();
  });

  it('should export ComparisonOptions type', () => {
    const options: ComparisonOptions = {
      ignoreWhitespace: true,
      ignoreAttributeOrder: true,
      normalizeClasses: true,
    };
    expect(options).toBeDefined();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('should handle a complete snapshot workflow', () => {
    // 1. Create variations
    const variations = {
      default: <SimpleButton>Click</SimpleButton>,
      disabled: <SimpleButton disabled>Click</SimpleButton>,
    };

    // 2. Generate snapshots
    const snapshots = snapshotVariations(variations);

    // 3. Verify snapshots are different
    expect(snapshots['default']).not.toBe(snapshots['disabled']);

    // 4. Verify content
    expect(snapshots['default']).toContain('btn btn-primary');
    expect(snapshots['disabled']).toContain('disabled');
  });

  it('should handle components with styled-components patterns', () => {
    const { html, unmount } = createComponentSnapshot(<StyledComponent />);

    // CSS-in-JS class names should be cleaned
    expect(html).not.toContain('css-');
    expect(html).not.toContain('sc-');
    expect(html).toContain('base-class');

    unmount();
  });

  it('should handle complex nested components', () => {
    const { html, unmount } = createComponentSnapshot(<ComplexComponent />);

    // Structure should be preserved
    expect(html).toContain('article');
    expect(html).toContain('header');
    expect(html).toContain('main');
    expect(html).toContain('footer');
    expect(html).toContain('Title');
    expect(html).toContain('Content');

    // Dynamic attributes should be stripped
    expect(html).not.toContain('dynamic-id');
    expect(html).not.toContain('radix-');

    unmount();
  });

  it('should handle full-page component with all providers', () => {
    const PageComponent = () => (
      <div>
        <RouterComponent />
        <QueryComponent />
        <SimpleButton>Submit</SimpleButton>
      </div>
    );

    const { html, unmount } = createComponentSnapshot(<PageComponent />, {
      withRouter: true,
      withQueryClient: true,
    });

    expect(html).toContain('Home');
    expect(html).toContain('About');
    expect(html).toContain('Submit');

    unmount();
  });
});

// ============================================================================
// SNAPSHOT EXAMPLES (documentation)
// ============================================================================

describe('Snapshot Examples (Documentation)', () => {
  /**
   * Example 1: Basic component snapshot
   */
  it('Example 1: Basic component snapshot', () => {
    const { html, unmount } = createComponentSnapshot(
      <SimpleButton>Click me</SimpleButton>
    );

    expect(html).toMatchSnapshot();
    unmount();
  });

  /**
   * Example 2: Component with router context
   */
  it('Example 2: Component with router context', () => {
    snapshotWithProviders(<RouterComponent />, { withRouter: true });
  });

  /**
   * Example 3: Multiple variations
   */
  it('Example 3: Multiple variations', () => {
    assertVariationSnapshots({
      default: <SimpleButton>Default</SimpleButton>,
      disabled: <SimpleButton disabled>Disabled</SimpleButton>,
    });
  });

  /**
   * Example 4: Custom attribute filtering
   */
  it('Example 4: Custom attribute filtering', () => {
    const ComponentWithDataAttrs = () => (
      <div data-timestamp="123456" data-user="keep">
        Content
      </div>
    );

    const { html, unmount } = createComponentSnapshot(
      <ComponentWithDataAttrs />,
      { filterAttributes: ['data-timestamp'] }
    );

    expect(html).not.toContain('123456');
    expect(html).toContain('keep');
    unmount();
  });

  /**
   * Example 5: Snapshot comparison
   */
  it('Example 5: Snapshot comparison', () => {
    const result1 = createComponentSnapshot(<SimpleButton>A</SimpleButton>);
    const result2 = createComponentSnapshot(<SimpleButton>A</SimpleButton>);

    expect(compareSnapshotStrings(result1.html, result2.html)).toBe(true);

    result1.unmount();
    result2.unmount();
  });
});
