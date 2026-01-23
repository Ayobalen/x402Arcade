/**
 * Animation Test Utilities
 *
 * Utilities for testing Framer Motion and CSS animations.
 * Provides mocks, helpers, and assertions for animation testing.
 *
 * @module __tests__/utils/animation-utils
 */

import { vi } from 'vitest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Animation state for tracking
 */
export interface AnimationState {
  isAnimating: boolean;
  animationName: string | null;
  progress: number;
  direction: 'forward' | 'reverse' | 'none';
  iteration: number;
  completed: boolean;
  cancelled: boolean;
}

/**
 * Configuration for animation mocking
 */
export interface AnimationMockConfig {
  /** Default animation duration in ms (default: 0 for instant) */
  defaultDuration?: number;
  /** Whether to actually run animations or skip them */
  runAnimations?: boolean;
  /** Transition duration multiplier (1 = normal, 0 = instant) */
  transitionMultiplier?: number;
}

/**
 * CSS transition event data
 */
export interface TransitionEventData {
  propertyName: string;
  elapsedTime: number;
  pseudoElement: string;
}

/**
 * CSS animation event data
 */
export interface AnimationEventData {
  animationName: string;
  elapsedTime: number;
  pseudoElement: string;
}

/**
 * Framer Motion variant definition
 */
export interface MotionVariant {
  [key: string]: unknown;
}

/**
 * Tracked animation record
 */
export interface AnimationRecord {
  element: Element;
  type: 'transition' | 'animation' | 'framer';
  name: string;
  startTime: number;
  endTime?: number;
  duration: number;
  completed: boolean;
  cancelled: boolean;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

// Track animations for assertions
const animationRecords: AnimationRecord[] = [];
let animationsEnabled = true;
let transitionMultiplier = 1;
let originalRAF: typeof requestAnimationFrame;
let originalGetComputedStyle: typeof getComputedStyle;

// ============================================================================
// FRAMER MOTION MOCKING
// ============================================================================

/**
 * Creates a mock for Framer Motion's motion component
 * This allows testing components that use motion.* without actual animations
 */
export function mockFramerMotion() {
  const createMockMotionComponent = (Tag: string) => {
    // Return a component factory that passes through props
    return vi.fn(
      ({
        children,
        initial,
        animate,
        exit,
        variants,
        transition,
        whileHover,
        whileTap,
        whileFocus,
        whileDrag,
        whileInView,
        drag,
        dragConstraints,
        dragElastic,
        dragMomentum,
        dragTransition,
        onAnimationStart,
        onAnimationComplete,
        onDragStart,
        onDrag,
        onDragEnd,
        layout,
        layoutId,
        ...rest
      }: Record<string, unknown>) => {
        // Immediately trigger animation callbacks if provided
        if (typeof onAnimationStart === 'function') {
          setTimeout(() => (onAnimationStart as () => void)(), 0);
        }
        if (typeof onAnimationComplete === 'function') {
          setTimeout(() => (onAnimationComplete as () => void)(), 0);
        }

        // Record the animation for testing
        animationRecords.push({
          element: document.createElement(Tag),
          type: 'framer',
          name: typeof animate === 'string' ? animate : 'custom',
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          completed: true,
          cancelled: false,
        });

        // Create element with data attributes for testing
        const element = document.createElement(Tag);
        element.setAttribute('data-framer-initial', JSON.stringify(initial ?? {}));
        element.setAttribute('data-framer-animate', JSON.stringify(animate ?? {}));
        element.setAttribute('data-framer-variants', JSON.stringify(variants ?? {}));

        return {
          type: Tag,
          props: {
            ...rest,
            'data-framer-initial': JSON.stringify(initial ?? {}),
            'data-framer-animate': JSON.stringify(animate ?? {}),
            'data-framer-variants': JSON.stringify(variants ?? {}),
            'data-framer-transition': JSON.stringify(transition ?? {}),
            children,
          },
        };
      }
    );
  };

  // Create mock motion object with all HTML tags
  const mockMotion: Record<string, ReturnType<typeof createMockMotionComponent>> = {};
  const htmlTags = [
    'div', 'span', 'p', 'a', 'button', 'ul', 'li', 'ol',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
    'form', 'input', 'textarea', 'select', 'label',
    'img', 'svg', 'path', 'circle', 'rect', 'g',
    'table', 'tr', 'td', 'th', 'thead', 'tbody',
    'canvas', 'video', 'audio',
  ];

  htmlTags.forEach((tag) => {
    mockMotion[tag] = createMockMotionComponent(tag);
  });

  // Mock AnimatePresence
  const mockAnimatePresence = vi.fn(({ children, mode, initial, onExitComplete }: Record<string, unknown>) => {
    // Immediately call onExitComplete if provided
    if (typeof onExitComplete === 'function') {
      setTimeout(() => (onExitComplete as () => void)(), 0);
    }
    return children;
  });

  // Mock motion hooks
  const mockUseAnimation = vi.fn(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    set: vi.fn(),
  }));

  const mockUseMotionValue = vi.fn((initial: number) => ({
    get: vi.fn(() => initial),
    set: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    onChange: vi.fn(() => () => {}),
    clearListeners: vi.fn(),
  }));

  const mockUseSpring = vi.fn((initial: number) => mockUseMotionValue(initial));

  const mockUseTransform = vi.fn((_value: unknown, _inputRange: number[], outputRange: number[]) => {
    return mockUseMotionValue(outputRange[0]);
  });

  const mockUseInView = vi.fn(() => true);

  const mockUseScroll = vi.fn(() => ({
    scrollX: mockUseMotionValue(0),
    scrollY: mockUseMotionValue(0),
    scrollXProgress: mockUseMotionValue(0),
    scrollYProgress: mockUseMotionValue(0),
  }));

  const mockUseDragControls = vi.fn(() => ({
    start: vi.fn(),
  }));

  const mockUseReducedMotion = vi.fn(() => false);

  return {
    motion: mockMotion,
    AnimatePresence: mockAnimatePresence,
    useAnimation: mockUseAnimation,
    useMotionValue: mockUseMotionValue,
    useSpring: mockUseSpring,
    useTransform: mockUseTransform,
    useInView: mockUseInView,
    useScroll: mockUseScroll,
    useDragControls: mockUseDragControls,
    useReducedMotion: mockUseReducedMotion,
    // Utility to get the underlying mock for assertions
    __getMock: (tag: string) => mockMotion[tag],
  };
}

/**
 * Type for mocked Framer Motion
 */
export type MockedFramerMotion = ReturnType<typeof mockFramerMotion>;

// ============================================================================
// CSS ANIMATION MOCKING
// ============================================================================

/**
 * Dispatches a transitionend event on an element
 */
export function fireTransitionEnd(
  element: Element,
  data: Partial<TransitionEventData> = {}
): void {
  const event = new Event('transitionend', { bubbles: true, cancelable: false }) as Event & TransitionEventData;
  Object.assign(event, {
    propertyName: data.propertyName ?? 'opacity',
    elapsedTime: data.elapsedTime ?? 0.3,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

/**
 * Dispatches a transitionstart event on an element
 */
export function fireTransitionStart(
  element: Element,
  data: Partial<TransitionEventData> = {}
): void {
  const event = new Event('transitionstart', { bubbles: true, cancelable: false }) as Event & TransitionEventData;
  Object.assign(event, {
    propertyName: data.propertyName ?? 'opacity',
    elapsedTime: data.elapsedTime ?? 0,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

/**
 * Dispatches a transitioncancel event on an element
 */
export function fireTransitionCancel(
  element: Element,
  data: Partial<TransitionEventData> = {}
): void {
  const event = new Event('transitioncancel', { bubbles: true, cancelable: false }) as Event & TransitionEventData;
  Object.assign(event, {
    propertyName: data.propertyName ?? 'opacity',
    elapsedTime: data.elapsedTime ?? 0,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

/**
 * Dispatches an animationend event on an element
 */
export function fireAnimationEnd(
  element: Element,
  data: Partial<AnimationEventData> = {}
): void {
  const event = new Event('animationend', { bubbles: true, cancelable: false }) as Event & AnimationEventData;
  Object.assign(event, {
    animationName: data.animationName ?? 'fadeIn',
    elapsedTime: data.elapsedTime ?? 0.3,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

/**
 * Dispatches an animationstart event on an element
 */
export function fireAnimationStart(
  element: Element,
  data: Partial<AnimationEventData> = {}
): void {
  const event = new Event('animationstart', { bubbles: true, cancelable: false }) as Event & AnimationEventData;
  Object.assign(event, {
    animationName: data.animationName ?? 'fadeIn',
    elapsedTime: data.elapsedTime ?? 0,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

/**
 * Dispatches an animationiteration event on an element
 */
export function fireAnimationIteration(
  element: Element,
  data: Partial<AnimationEventData> = {}
): void {
  const event = new Event('animationiteration', { bubbles: true, cancelable: false }) as Event & AnimationEventData;
  Object.assign(event, {
    animationName: data.animationName ?? 'fadeIn',
    elapsedTime: data.elapsedTime ?? 0.3,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

/**
 * Dispatches an animationcancel event on an element
 */
export function fireAnimationCancel(
  element: Element,
  data: Partial<AnimationEventData> = {}
): void {
  const event = new Event('animationcancel', { bubbles: true, cancelable: false }) as Event & AnimationEventData;
  Object.assign(event, {
    animationName: data.animationName ?? 'fadeIn',
    elapsedTime: data.elapsedTime ?? 0,
    pseudoElement: data.pseudoElement ?? '',
  });
  element.dispatchEvent(event);
}

// ============================================================================
// ANIMATION WAITING UTILITIES
// ============================================================================

/**
 * Waits for a CSS animation to complete on an element
 * @param element The element to watch
 * @param animationName Optional specific animation name to wait for
 * @param timeout Maximum time to wait in ms (default: 5000)
 */
export function waitForAnimation(
  element: Element,
  animationName?: string,
  timeout = 5000
): Promise<AnimationEventData> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Animation "${animationName ?? 'any'}" did not complete within ${timeout}ms`));
    }, timeout);

    const handler = (event: Event) => {
      const animEvent = event as Event & AnimationEventData;
      if (!animationName || animEvent.animationName === animationName) {
        cleanup();
        resolve({
          animationName: animEvent.animationName,
          elapsedTime: animEvent.elapsedTime,
          pseudoElement: animEvent.pseudoElement,
        });
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      element.removeEventListener('animationend', handler);
    };

    element.addEventListener('animationend', handler);
  });
}

/**
 * Waits for a CSS transition to complete on an element
 * @param element The element to watch
 * @param propertyName Optional specific property to wait for
 * @param timeout Maximum time to wait in ms (default: 5000)
 */
export function waitForTransition(
  element: Element,
  propertyName?: string,
  timeout = 5000
): Promise<TransitionEventData> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Transition "${propertyName ?? 'any'}" did not complete within ${timeout}ms`));
    }, timeout);

    const handler = (event: Event) => {
      const transEvent = event as Event & TransitionEventData;
      if (!propertyName || transEvent.propertyName === propertyName) {
        cleanup();
        resolve({
          propertyName: transEvent.propertyName,
          elapsedTime: transEvent.elapsedTime,
          pseudoElement: transEvent.pseudoElement,
        });
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      element.removeEventListener('transitionend', handler);
    };

    element.addEventListener('transitionend', handler);
  });
}

/**
 * Waits for all animations and transitions to complete on an element
 * @param element The element to watch
 * @param timeout Maximum time to wait in ms (default: 5000)
 */
export function waitForAllAnimations(
  element: Element,
  timeout = 5000
): Promise<void> {
  return new Promise((resolve) => {
    // In jsdom, getComputedStyle may not have animation properties
    // So we'll use a simple timeout approach for testing
    const checkAnimations = () => {
      // If animations are disabled, resolve immediately
      if (!animationsEnabled) {
        resolve();
        return;
      }

      // Check for pending animations via Web Animations API (if available)
      if ('getAnimations' in element) {
        const animations = (element as Element & { getAnimations: () => Animation[] }).getAnimations();
        if (animations.length === 0) {
          resolve();
          return;
        }
        Promise.all(animations.map((a) => a.finished)).then(() => resolve());
        return;
      }

      // Fallback: resolve after a short delay
      setTimeout(resolve, 0);
    };

    checkAnimations();

    // Also set a max timeout
    setTimeout(resolve, timeout);
  });
}

// ============================================================================
// ANIMATION ASSERTIONS
// ============================================================================

/**
 * Asserts that an element has a specific animation state
 */
export function assertAnimationState(
  element: Element,
  expected: Partial<AnimationState>
): void {
  const computedStyle = window.getComputedStyle(element);

  // Get animation properties from computed style
  const animationName = computedStyle.animationName || 'none';
  const animationPlayState = computedStyle.animationPlayState || 'running';

  // Build actual state
  const actualState: Partial<AnimationState> = {
    animationName: animationName === 'none' ? null : animationName,
    isAnimating: animationPlayState === 'running' && animationName !== 'none',
  };

  // Compare with expected
  if (expected.animationName !== undefined && actualState.animationName !== expected.animationName) {
    throw new Error(
      `Expected animation name "${expected.animationName}", but got "${actualState.animationName}"`
    );
  }

  if (expected.isAnimating !== undefined && actualState.isAnimating !== expected.isAnimating) {
    throw new Error(
      `Expected isAnimating to be ${expected.isAnimating}, but got ${actualState.isAnimating}`
    );
  }
}

/**
 * Asserts that an element has a specific CSS transition
 */
export function assertHasTransition(
  element: Element,
  property?: string,
  duration?: number
): void {
  const computedStyle = window.getComputedStyle(element);
  const transitionProperty = computedStyle.transitionProperty || 'all';
  const transitionDuration = computedStyle.transitionDuration || '0s';

  if (property && !transitionProperty.includes(property) && transitionProperty !== 'all') {
    throw new Error(
      `Expected element to have transition on "${property}", but has "${transitionProperty}"`
    );
  }

  if (duration !== undefined) {
    const actualDuration = parseFloat(transitionDuration) * (transitionDuration.includes('ms') ? 1 : 1000);
    if (Math.abs(actualDuration - duration) > 1) {
      throw new Error(
        `Expected transition duration of ${duration}ms, but got ${actualDuration}ms`
      );
    }
  }
}

/**
 * Asserts that a Framer Motion component received specific animation props
 */
export function assertFramerProps(
  element: Element,
  expected: {
    initial?: unknown;
    animate?: unknown;
    variants?: unknown;
    transition?: unknown;
  }
): void {
  if (expected.initial !== undefined) {
    const initialAttr = element.getAttribute('data-framer-initial');
    if (!initialAttr) {
      throw new Error('Element does not have framer initial data');
    }
    const initial = JSON.parse(initialAttr);
    const expectedStr = JSON.stringify(expected.initial);
    const actualStr = JSON.stringify(initial);
    if (actualStr !== expectedStr) {
      throw new Error(`Expected initial "${expectedStr}", but got "${actualStr}"`);
    }
  }

  if (expected.animate !== undefined) {
    const animateAttr = element.getAttribute('data-framer-animate');
    if (!animateAttr) {
      throw new Error('Element does not have framer animate data');
    }
    const animate = JSON.parse(animateAttr);
    const expectedStr = JSON.stringify(expected.animate);
    const actualStr = JSON.stringify(animate);
    if (actualStr !== expectedStr) {
      throw new Error(`Expected animate "${expectedStr}", but got "${actualStr}"`);
    }
  }

  if (expected.variants !== undefined) {
    const variantsAttr = element.getAttribute('data-framer-variants');
    if (!variantsAttr) {
      throw new Error('Element does not have framer variants data');
    }
    const variants = JSON.parse(variantsAttr);
    const expectedStr = JSON.stringify(expected.variants);
    const actualStr = JSON.stringify(variants);
    if (actualStr !== expectedStr) {
      throw new Error(`Expected variants "${expectedStr}", but got "${actualStr}"`);
    }
  }
}

// ============================================================================
// ANIMATION CONTROL UTILITIES
// ============================================================================

/**
 * Disables all CSS animations and transitions for faster testing
 * Injects a style tag that sets animation/transition durations to 0
 */
export function disableAnimations(): () => void {
  animationsEnabled = false;

  // Create a style tag to disable all animations
  const style = document.createElement('style');
  style.id = 'test-disable-animations';
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0ms !important;
      animation-delay: 0ms !important;
      transition-duration: 0ms !important;
      transition-delay: 0ms !important;
    }
  `;
  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    animationsEnabled = true;
    const styleEl = document.getElementById('test-disable-animations');
    if (styleEl) {
      styleEl.remove();
    }
  };
}

/**
 * Enables all animations (reverses disableAnimations)
 */
export function enableAnimations(): void {
  animationsEnabled = true;
  const style = document.getElementById('test-disable-animations');
  if (style) {
    style.remove();
  }
}

/**
 * Sets a multiplier for transition durations (0 = instant, 1 = normal)
 */
export function setTransitionMultiplier(multiplier: number): void {
  transitionMultiplier = multiplier;
}

/**
 * Gets the current transition multiplier
 */
export function getTransitionMultiplier(): number {
  return transitionMultiplier;
}

/**
 * Checks if animations are currently enabled
 */
export function areAnimationsEnabled(): boolean {
  return animationsEnabled;
}

// ============================================================================
// ANIMATION TRACKING
// ============================================================================

/**
 * Clears all recorded animations
 */
export function clearAnimationRecords(): void {
  animationRecords.length = 0;
}

/**
 * Gets all recorded animations
 */
export function getAnimationRecords(): AnimationRecord[] {
  return [...animationRecords];
}

/**
 * Gets animation records filtered by type
 */
export function getAnimationRecordsByType(type: 'transition' | 'animation' | 'framer'): AnimationRecord[] {
  return animationRecords.filter((r) => r.type === type);
}

/**
 * Tracks an animation for testing
 */
export function trackAnimation(record: Omit<AnimationRecord, 'startTime'>): void {
  animationRecords.push({
    ...record,
    startTime: Date.now(),
  });
}

// ============================================================================
// REQUEST ANIMATION FRAME MOCKING
// ============================================================================

/**
 * Creates a controllable requestAnimationFrame mock
 */
export function createRAFController() {
  const callbacks: Map<number, FrameRequestCallback> = new Map();
  let nextId = 1;
  let currentTime = 0;

  const requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  };

  const cancelAnimationFrame = (id: number): void => {
    callbacks.delete(id);
  };

  const tick = (delta = 16.67): void => {
    currentTime += delta;
    const callbacksToRun = new Map(callbacks);
    callbacks.clear();
    callbacksToRun.forEach((callback) => callback(currentTime));
  };

  const tickTo = (time: number): void => {
    currentTime = time;
    const callbacksToRun = new Map(callbacks);
    callbacks.clear();
    callbacksToRun.forEach((callback) => callback(currentTime));
  };

  const runAllFrames = (maxFrames = 100): void => {
    let frames = 0;
    while (callbacks.size > 0 && frames < maxFrames) {
      tick();
      frames++;
    }
  };

  const install = (): void => {
    originalRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = requestAnimationFrame;
    global.cancelAnimationFrame = cancelAnimationFrame;
  };

  const uninstall = (): void => {
    if (originalRAF) {
      global.requestAnimationFrame = originalRAF;
    }
  };

  const reset = (): void => {
    callbacks.clear();
    currentTime = 0;
    nextId = 1;
  };

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    tick,
    tickTo,
    runAllFrames,
    install,
    uninstall,
    reset,
    getTime: () => currentTime,
    getPendingCount: () => callbacks.size,
  };
}

/**
 * Type for RAF controller
 */
export type RAFController = ReturnType<typeof createRAFController>;

// ============================================================================
// COMPUTED STYLE MOCKING
// ============================================================================

/**
 * Creates a mock for getComputedStyle that returns controlled animation values
 */
export function mockComputedStyleAnimations(
  styles: Partial<CSSStyleDeclaration>
): () => void {
  originalGetComputedStyle = window.getComputedStyle;

  window.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
    const original = originalGetComputedStyle(element, pseudoElt);
    return new Proxy(original, {
      get(target, prop) {
        if (prop in styles) {
          return styles[prop as keyof CSSStyleDeclaration];
        }
        return target[prop as keyof CSSStyleDeclaration];
      },
    });
  };

  return () => {
    window.getComputedStyle = originalGetComputedStyle;
  };
}

// ============================================================================
// SETUP HELPERS
// ============================================================================

/**
 * Sets up animation testing environment
 * Call this in beforeEach
 */
export function setupAnimationTesting(config: AnimationMockConfig = {}): () => void {
  const {
    defaultDuration = 0,
    runAnimations = false,
    transitionMultiplier: multiplier = 0,
  } = config;

  // Clear previous records
  clearAnimationRecords();

  // Set multiplier
  setTransitionMultiplier(multiplier);

  // Disable animations if not running them
  let cleanupDisable: (() => void) | null = null;
  if (!runAnimations) {
    cleanupDisable = disableAnimations();
  }

  // Return cleanup function
  return () => {
    clearAnimationRecords();
    setTransitionMultiplier(1);
    if (cleanupDisable) {
      cleanupDisable();
    }
  };
}

/**
 * Creates a Jest/Vitest mock module for framer-motion
 * Use with vi.mock('framer-motion', () => createFramerMotionMock())
 */
export function createFramerMotionMock() {
  const mocked = mockFramerMotion();
  return {
    ...mocked,
    default: mocked,
  };
}
