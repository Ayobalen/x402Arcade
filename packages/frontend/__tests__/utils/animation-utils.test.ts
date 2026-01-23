/**
 * Animation Utilities Tests
 *
 * Tests for animation testing utilities including Framer Motion mocks,
 * CSS animation/transition helpers, and animation control utilities.
 *
 * @module __tests__/utils/animation-utils.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Types
  type AnimationState,
  type AnimationMockConfig,
  type TransitionEventData,
  type AnimationEventData,
  type AnimationRecord,
  type MockedFramerMotion,
  type RAFController,
  // Framer Motion mocking
  mockFramerMotion,
  createFramerMotionMock,
  // CSS animation event firing
  fireTransitionEnd,
  fireTransitionStart,
  fireTransitionCancel,
  fireAnimationEnd,
  fireAnimationStart,
  fireAnimationIteration,
  fireAnimationCancel,
  // Animation waiting
  waitForAnimation,
  waitForTransition,
  waitForAllAnimations,
  // Animation assertions
  assertAnimationState,
  assertHasTransition,
  assertFramerProps,
  // Animation control
  disableAnimations,
  enableAnimations,
  setTransitionMultiplier,
  getTransitionMultiplier,
  areAnimationsEnabled,
  // Animation tracking
  clearAnimationRecords,
  getAnimationRecords,
  getAnimationRecordsByType,
  trackAnimation,
  // RAF controller
  createRAFController,
  // Computed style mocking
  mockComputedStyleAnimations,
  // Setup helpers
  setupAnimationTesting,
} from './animation-utils';

describe('Animation Test Utilities', () => {
  // ============================================================================
  // FRAMER MOTION MOCKING TESTS
  // ============================================================================

  describe('mockFramerMotion', () => {
    let mocked: MockedFramerMotion;

    beforeEach(() => {
      mocked = mockFramerMotion();
      clearAnimationRecords();
    });

    it('returns motion object with HTML tags', () => {
      expect(mocked.motion).toBeDefined();
      expect(mocked.motion.div).toBeDefined();
      expect(mocked.motion.span).toBeDefined();
      expect(mocked.motion.button).toBeDefined();
    });

    it('returns AnimatePresence component', () => {
      expect(mocked.AnimatePresence).toBeDefined();
      expect(typeof mocked.AnimatePresence).toBe('function');
    });

    it('returns motion hooks', () => {
      expect(mocked.useAnimation).toBeDefined();
      expect(mocked.useMotionValue).toBeDefined();
      expect(mocked.useSpring).toBeDefined();
      expect(mocked.useTransform).toBeDefined();
      expect(mocked.useInView).toBeDefined();
      expect(mocked.useScroll).toBeDefined();
      expect(mocked.useDragControls).toBeDefined();
      expect(mocked.useReducedMotion).toBeDefined();
    });

    it('motion.div creates component that passes through props', () => {
      const props = {
        children: 'Test',
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        className: 'test-class',
      };

      const result = mocked.motion.div(props);

      expect(result.type).toBe('div');
      expect(result.props.children).toBe('Test');
      expect(result.props.className).toBe('test-class');
    });

    it('motion component records animation', () => {
      mocked.motion.div({
        initial: { opacity: 0 },
        animate: 'visible',
      });

      const records = getAnimationRecords();
      expect(records.length).toBe(1);
      expect(records[0].type).toBe('framer');
      expect(records[0].name).toBe('visible');
    });

    it('useAnimation returns mock controls', () => {
      const controls = mocked.useAnimation();

      expect(controls.start).toBeDefined();
      expect(controls.stop).toBeDefined();
      expect(controls.set).toBeDefined();
      expect(typeof controls.start).toBe('function');
    });

    it('useMotionValue returns mock motion value', () => {
      const value = mocked.useMotionValue(0);

      expect(value.get).toBeDefined();
      expect(value.set).toBeDefined();
      expect(value.subscribe).toBeDefined();
      expect(value.get()).toBe(0);
    });

    it('useSpring returns mock spring value', () => {
      const value = mocked.useSpring(10);

      expect(value.get()).toBe(10);
    });

    it('useTransform returns transformed value', () => {
      const inputValue = mocked.useMotionValue(0);
      const output = mocked.useTransform(inputValue, [0, 100], [0, 1]);

      expect(output.get()).toBe(0);
    });

    it('useInView returns true', () => {
      const inView = mocked.useInView();
      expect(inView).toBe(true);
    });

    it('useScroll returns scroll values', () => {
      const scroll = mocked.useScroll();

      expect(scroll.scrollX).toBeDefined();
      expect(scroll.scrollY).toBeDefined();
      expect(scroll.scrollXProgress).toBeDefined();
      expect(scroll.scrollYProgress).toBeDefined();
    });

    it('useDragControls returns drag controls', () => {
      const controls = mocked.useDragControls();

      expect(controls.start).toBeDefined();
    });

    it('useReducedMotion returns false', () => {
      const reducedMotion = mocked.useReducedMotion();
      expect(reducedMotion).toBe(false);
    });

    it('AnimatePresence calls onExitComplete', async () => {
      const onExitComplete = vi.fn();

      mocked.AnimatePresence({
        children: 'Test',
        onExitComplete,
      });

      // Wait for setTimeout
      await new Promise((r) => setTimeout(r, 10));

      expect(onExitComplete).toHaveBeenCalled();
    });

    it('__getMock returns underlying mock for assertions', () => {
      const divMock = mocked.__getMock('div');
      expect(divMock).toBeDefined();
    });
  });

  describe('createFramerMotionMock', () => {
    it('creates module mock format', () => {
      const moduleMock = createFramerMotionMock();

      expect(moduleMock.motion).toBeDefined();
      expect(moduleMock.AnimatePresence).toBeDefined();
      expect(moduleMock.default).toBeDefined();
    });
  });

  // ============================================================================
  // CSS TRANSITION EVENT TESTS
  // ============================================================================

  describe('CSS Transition Events', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(() => {
      element.remove();
    });

    describe('fireTransitionEnd', () => {
      it('dispatches transitionend event', () => {
        const handler = vi.fn();
        element.addEventListener('transitionend', handler);

        fireTransitionEnd(element);

        expect(handler).toHaveBeenCalled();
      });

      it('includes default event data', () => {
        let eventData: TransitionEventData | null = null;
        element.addEventListener('transitionend', (e) => {
          eventData = e as unknown as TransitionEventData;
        });

        fireTransitionEnd(element);

        expect(eventData?.propertyName).toBe('opacity');
        expect(eventData?.elapsedTime).toBe(0.3);
        expect(eventData?.pseudoElement).toBe('');
      });

      it('accepts custom event data', () => {
        let eventData: TransitionEventData | null = null;
        element.addEventListener('transitionend', (e) => {
          eventData = e as unknown as TransitionEventData;
        });

        fireTransitionEnd(element, {
          propertyName: 'transform',
          elapsedTime: 0.5,
          pseudoElement: '::before',
        });

        expect(eventData?.propertyName).toBe('transform');
        expect(eventData?.elapsedTime).toBe(0.5);
        expect(eventData?.pseudoElement).toBe('::before');
      });
    });

    describe('fireTransitionStart', () => {
      it('dispatches transitionstart event', () => {
        const handler = vi.fn();
        element.addEventListener('transitionstart', handler);

        fireTransitionStart(element);

        expect(handler).toHaveBeenCalled();
      });

      it('includes event data', () => {
        let eventData: TransitionEventData | null = null;
        element.addEventListener('transitionstart', (e) => {
          eventData = e as unknown as TransitionEventData;
        });

        fireTransitionStart(element, { propertyName: 'width' });

        expect(eventData?.propertyName).toBe('width');
      });
    });

    describe('fireTransitionCancel', () => {
      it('dispatches transitioncancel event', () => {
        const handler = vi.fn();
        element.addEventListener('transitioncancel', handler);

        fireTransitionCancel(element);

        expect(handler).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // CSS ANIMATION EVENT TESTS
  // ============================================================================

  describe('CSS Animation Events', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(() => {
      element.remove();
    });

    describe('fireAnimationEnd', () => {
      it('dispatches animationend event', () => {
        const handler = vi.fn();
        element.addEventListener('animationend', handler);

        fireAnimationEnd(element);

        expect(handler).toHaveBeenCalled();
      });

      it('includes default event data', () => {
        let eventData: AnimationEventData | null = null;
        element.addEventListener('animationend', (e) => {
          eventData = e as unknown as AnimationEventData;
        });

        fireAnimationEnd(element);

        expect(eventData?.animationName).toBe('fadeIn');
        expect(eventData?.elapsedTime).toBe(0.3);
      });

      it('accepts custom event data', () => {
        let eventData: AnimationEventData | null = null;
        element.addEventListener('animationend', (e) => {
          eventData = e as unknown as AnimationEventData;
        });

        fireAnimationEnd(element, {
          animationName: 'slideIn',
          elapsedTime: 1.0,
        });

        expect(eventData?.animationName).toBe('slideIn');
        expect(eventData?.elapsedTime).toBe(1.0);
      });
    });

    describe('fireAnimationStart', () => {
      it('dispatches animationstart event', () => {
        const handler = vi.fn();
        element.addEventListener('animationstart', handler);

        fireAnimationStart(element);

        expect(handler).toHaveBeenCalled();
      });
    });

    describe('fireAnimationIteration', () => {
      it('dispatches animationiteration event', () => {
        const handler = vi.fn();
        element.addEventListener('animationiteration', handler);

        fireAnimationIteration(element);

        expect(handler).toHaveBeenCalled();
      });
    });

    describe('fireAnimationCancel', () => {
      it('dispatches animationcancel event', () => {
        const handler = vi.fn();
        element.addEventListener('animationcancel', handler);

        fireAnimationCancel(element);

        expect(handler).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // ANIMATION WAITING TESTS
  // ============================================================================

  describe('Animation Waiting Utilities', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(() => {
      element.remove();
    });

    describe('waitForAnimation', () => {
      it('resolves when animationend fires', async () => {
        const promise = waitForAnimation(element);

        // Fire animation end after short delay
        setTimeout(() => fireAnimationEnd(element), 10);

        const result = await promise;
        expect(result.animationName).toBe('fadeIn');
      });

      it('resolves only for matching animation name', async () => {
        const promise = waitForAnimation(element, 'slideIn');

        // Fire wrong animation first (should not resolve)
        setTimeout(() => fireAnimationEnd(element, { animationName: 'fadeIn' }), 5);
        // Fire correct animation
        setTimeout(() => fireAnimationEnd(element, { animationName: 'slideIn' }), 10);

        const result = await promise;
        expect(result.animationName).toBe('slideIn');
      });

      it('rejects on timeout', async () => {
        const promise = waitForAnimation(element, 'neverFires', 50);

        await expect(promise).rejects.toThrow('did not complete within 50ms');
      });
    });

    describe('waitForTransition', () => {
      it('resolves when transitionend fires', async () => {
        const promise = waitForTransition(element);

        setTimeout(() => fireTransitionEnd(element), 10);

        const result = await promise;
        expect(result.propertyName).toBe('opacity');
      });

      it('resolves only for matching property', async () => {
        const promise = waitForTransition(element, 'transform');

        setTimeout(() => fireTransitionEnd(element, { propertyName: 'opacity' }), 5);
        setTimeout(() => fireTransitionEnd(element, { propertyName: 'transform' }), 10);

        const result = await promise;
        expect(result.propertyName).toBe('transform');
      });

      it('rejects on timeout', async () => {
        const promise = waitForTransition(element, 'neverFires', 50);

        await expect(promise).rejects.toThrow('did not complete within 50ms');
      });
    });

    describe('waitForAllAnimations', () => {
      it('resolves when animations are disabled', async () => {
        const cleanup = disableAnimations();

        const result = await waitForAllAnimations(element, 100);

        expect(result).toBeUndefined();
        cleanup();
      });

      it('resolves within timeout', async () => {
        const promise = waitForAllAnimations(element, 50);

        // Should resolve before timeout
        const result = await promise;
        expect(result).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // ANIMATION ASSERTION TESTS
  // ============================================================================

  describe('Animation Assertions', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(() => {
      element.remove();
    });

    describe('assertAnimationState', () => {
      it('passes for matching animation name', () => {
        // In jsdom, getComputedStyle returns 'none' by default
        expect(() =>
          assertAnimationState(element, { animationName: null })
        ).not.toThrow();
      });

      it('passes for matching isAnimating state', () => {
        expect(() =>
          assertAnimationState(element, { isAnimating: false })
        ).not.toThrow();
      });

      it('throws for mismatched animation name', () => {
        expect(() =>
          assertAnimationState(element, { animationName: 'fadeIn' })
        ).toThrow('Expected animation name "fadeIn"');
      });

      it('throws for mismatched isAnimating state', () => {
        expect(() =>
          assertAnimationState(element, { isAnimating: true })
        ).toThrow('Expected isAnimating to be true');
      });
    });

    describe('assertHasTransition', () => {
      it('passes when element has transition (default all)', () => {
        // jsdom default has no transition, but 'all' is often default
        expect(() =>
          assertHasTransition(element)
        ).not.toThrow();
      });

      it('passes when transitionProperty is all (includes any property)', () => {
        // Default in jsdom is 'all' or empty, which allows any property
        // This test verifies the function doesn't throw for valid cases
        expect(() =>
          assertHasTransition(element, 'opacity')
        ).not.toThrow();
      });
    });

    describe('assertFramerProps', () => {
      it('passes for matching initial props', () => {
        element.setAttribute('data-framer-initial', JSON.stringify({ opacity: 0 }));

        expect(() =>
          assertFramerProps(element, { initial: { opacity: 0 } })
        ).not.toThrow();
      });

      it('passes for matching animate props', () => {
        element.setAttribute('data-framer-animate', JSON.stringify({ opacity: 1 }));

        expect(() =>
          assertFramerProps(element, { animate: { opacity: 1 } })
        ).not.toThrow();
      });

      it('passes for matching variants props', () => {
        element.setAttribute('data-framer-variants', JSON.stringify({ visible: { opacity: 1 } }));

        expect(() =>
          assertFramerProps(element, { variants: { visible: { opacity: 1 } } })
        ).not.toThrow();
      });

      it('throws when initial data missing', () => {
        expect(() =>
          assertFramerProps(element, { initial: { opacity: 0 } })
        ).toThrow('does not have framer initial data');
      });

      it('throws for mismatched initial props', () => {
        element.setAttribute('data-framer-initial', JSON.stringify({ opacity: 1 }));

        expect(() =>
          assertFramerProps(element, { initial: { opacity: 0 } })
        ).toThrow('Expected initial');
      });
    });
  });

  // ============================================================================
  // ANIMATION CONTROL TESTS
  // ============================================================================

  describe('Animation Control Utilities', () => {
    afterEach(() => {
      enableAnimations();
      setTransitionMultiplier(1);
    });

    describe('disableAnimations', () => {
      it('creates style tag to disable animations', () => {
        const cleanup = disableAnimations();

        const style = document.getElementById('test-disable-animations');
        expect(style).not.toBeNull();
        expect(style?.textContent).toContain('animation-duration: 0ms');
        expect(style?.textContent).toContain('transition-duration: 0ms');

        cleanup();
      });

      it('sets animationsEnabled to false', () => {
        const cleanup = disableAnimations();

        expect(areAnimationsEnabled()).toBe(false);

        cleanup();
      });

      it('cleanup restores animation state', () => {
        const cleanup = disableAnimations();
        cleanup();

        expect(areAnimationsEnabled()).toBe(true);
        expect(document.getElementById('test-disable-animations')).toBeNull();
      });
    });

    describe('enableAnimations', () => {
      it('removes style tag', () => {
        disableAnimations();
        enableAnimations();

        expect(document.getElementById('test-disable-animations')).toBeNull();
      });

      it('sets animationsEnabled to true', () => {
        disableAnimations();
        enableAnimations();

        expect(areAnimationsEnabled()).toBe(true);
      });
    });

    describe('setTransitionMultiplier', () => {
      it('sets the transition multiplier', () => {
        setTransitionMultiplier(0.5);

        expect(getTransitionMultiplier()).toBe(0.5);
      });

      it('can be set to 0 for instant transitions', () => {
        setTransitionMultiplier(0);

        expect(getTransitionMultiplier()).toBe(0);
      });
    });
  });

  // ============================================================================
  // ANIMATION TRACKING TESTS
  // ============================================================================

  describe('Animation Tracking', () => {
    beforeEach(() => {
      clearAnimationRecords();
    });

    describe('clearAnimationRecords', () => {
      it('clears all records', () => {
        trackAnimation({
          element: document.createElement('div'),
          type: 'framer',
          name: 'test',
          duration: 300,
          completed: true,
          cancelled: false,
        });

        clearAnimationRecords();

        expect(getAnimationRecords()).toHaveLength(0);
      });
    });

    describe('getAnimationRecords', () => {
      it('returns copy of records', () => {
        trackAnimation({
          element: document.createElement('div'),
          type: 'framer',
          name: 'test',
          duration: 300,
          completed: true,
          cancelled: false,
        });

        const records = getAnimationRecords();
        expect(records).toHaveLength(1);

        // Modifying returned array shouldn't affect internal state
        records.push({} as AnimationRecord);
        expect(getAnimationRecords()).toHaveLength(1);
      });
    });

    describe('getAnimationRecordsByType', () => {
      it('filters records by type', () => {
        trackAnimation({
          element: document.createElement('div'),
          type: 'framer',
          name: 'framer-test',
          duration: 300,
          completed: true,
          cancelled: false,
        });

        trackAnimation({
          element: document.createElement('div'),
          type: 'transition',
          name: 'transition-test',
          duration: 200,
          completed: true,
          cancelled: false,
        });

        trackAnimation({
          element: document.createElement('div'),
          type: 'animation',
          name: 'animation-test',
          duration: 400,
          completed: true,
          cancelled: false,
        });

        expect(getAnimationRecordsByType('framer')).toHaveLength(1);
        expect(getAnimationRecordsByType('transition')).toHaveLength(1);
        expect(getAnimationRecordsByType('animation')).toHaveLength(1);
      });
    });

    describe('trackAnimation', () => {
      it('adds record with startTime', () => {
        const before = Date.now();

        trackAnimation({
          element: document.createElement('div'),
          type: 'framer',
          name: 'test',
          duration: 300,
          completed: true,
          cancelled: false,
        });

        const after = Date.now();
        const records = getAnimationRecords();

        expect(records[0].startTime).toBeGreaterThanOrEqual(before);
        expect(records[0].startTime).toBeLessThanOrEqual(after);
      });
    });
  });

  // ============================================================================
  // RAF CONTROLLER TESTS
  // ============================================================================

  describe('createRAFController', () => {
    let controller: RAFController;

    beforeEach(() => {
      controller = createRAFController();
    });

    describe('requestAnimationFrame', () => {
      it('returns unique IDs', () => {
        const id1 = controller.requestAnimationFrame(() => {});
        const id2 = controller.requestAnimationFrame(() => {});

        expect(id1).not.toBe(id2);
      });

      it('queues callbacks', () => {
        controller.requestAnimationFrame(() => {});
        controller.requestAnimationFrame(() => {});

        expect(controller.getPendingCount()).toBe(2);
      });
    });

    describe('cancelAnimationFrame', () => {
      it('removes callback from queue', () => {
        const id = controller.requestAnimationFrame(() => {});
        controller.cancelAnimationFrame(id);

        expect(controller.getPendingCount()).toBe(0);
      });

      it('prevents callback from running', () => {
        const callback = vi.fn();
        const id = controller.requestAnimationFrame(callback);
        controller.cancelAnimationFrame(id);
        controller.tick();

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('tick', () => {
      it('advances time by default delta', () => {
        const before = controller.getTime();
        controller.tick();
        const after = controller.getTime();

        expect(after - before).toBeCloseTo(16.67, 1);
      });

      it('advances time by specified delta', () => {
        controller.tick(100);

        expect(controller.getTime()).toBe(100);
      });

      it('calls queued callbacks', () => {
        const callback = vi.fn();
        controller.requestAnimationFrame(callback);
        controller.tick();

        expect(callback).toHaveBeenCalled();
      });

      it('passes time to callbacks', () => {
        let receivedTime = 0;
        controller.requestAnimationFrame((time) => {
          receivedTime = time;
        });
        controller.tick(100);

        expect(receivedTime).toBe(100);
      });

      it('clears callbacks after running', () => {
        controller.requestAnimationFrame(() => {});
        controller.tick();

        expect(controller.getPendingCount()).toBe(0);
      });
    });

    describe('tickTo', () => {
      it('sets time to specific value', () => {
        controller.tickTo(500);

        expect(controller.getTime()).toBe(500);
      });

      it('calls queued callbacks with new time', () => {
        let receivedTime = 0;
        controller.requestAnimationFrame((time) => {
          receivedTime = time;
        });
        controller.tickTo(1000);

        expect(receivedTime).toBe(1000);
      });
    });

    describe('runAllFrames', () => {
      it('runs all queued frames', () => {
        const callback1 = vi.fn(() => {
          controller.requestAnimationFrame(callback2);
        });
        const callback2 = vi.fn();

        controller.requestAnimationFrame(callback1);
        controller.runAllFrames();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('respects maxFrames limit', () => {
        let count = 0;
        const infiniteCallback = () => {
          count++;
          controller.requestAnimationFrame(infiniteCallback);
        };

        controller.requestAnimationFrame(infiniteCallback);
        controller.runAllFrames(10);

        expect(count).toBe(10);
      });
    });

    describe('install/uninstall', () => {
      afterEach(() => {
        controller.uninstall();
      });

      it('replaces global requestAnimationFrame', () => {
        const original = global.requestAnimationFrame;
        controller.install();

        expect(global.requestAnimationFrame).not.toBe(original);
      });

      it('uninstall restores original', () => {
        const original = global.requestAnimationFrame;
        controller.install();
        controller.uninstall();

        expect(global.requestAnimationFrame).toBe(original);
      });
    });

    describe('reset', () => {
      it('clears callbacks', () => {
        controller.requestAnimationFrame(() => {});
        controller.reset();

        expect(controller.getPendingCount()).toBe(0);
      });

      it('resets time to 0', () => {
        controller.tick(1000);
        controller.reset();

        expect(controller.getTime()).toBe(0);
      });
    });
  });

  // ============================================================================
  // COMPUTED STYLE MOCKING TESTS
  // ============================================================================

  describe('mockComputedStyleAnimations', () => {
    let element: HTMLDivElement;
    let cleanup: () => void;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(() => {
      element.remove();
      if (cleanup) cleanup();
    });

    it('overrides computed style properties', () => {
      cleanup = mockComputedStyleAnimations({
        animationName: 'testAnimation',
        animationDuration: '1s',
      });

      const style = window.getComputedStyle(element);

      expect(style.animationName).toBe('testAnimation');
      expect(style.animationDuration).toBe('1s');
    });

    it('preserves non-mocked properties', () => {
      cleanup = mockComputedStyleAnimations({
        animationName: 'testAnimation',
      });

      const style = window.getComputedStyle(element);

      // Should still have access to other properties
      expect(style.display).toBeDefined();
    });

    it('cleanup restores original getComputedStyle', () => {
      const originalGetComputedStyle = window.getComputedStyle;

      cleanup = mockComputedStyleAnimations({
        animationName: 'test',
      });

      // Get the mocked version
      const mockedGetComputedStyle = window.getComputedStyle;

      cleanup();

      // Should be different from mocked version (restored)
      expect(window.getComputedStyle).not.toBe(mockedGetComputedStyle);
    });
  });

  // ============================================================================
  // SETUP HELPERS TESTS
  // ============================================================================

  describe('setupAnimationTesting', () => {
    afterEach(() => {
      enableAnimations();
      setTransitionMultiplier(1);
      clearAnimationRecords();
    });

    it('clears previous animation records', () => {
      trackAnimation({
        element: document.createElement('div'),
        type: 'framer',
        name: 'old',
        duration: 100,
        completed: true,
        cancelled: false,
      });

      setupAnimationTesting();

      expect(getAnimationRecords()).toHaveLength(0);
    });

    it('disables animations by default', () => {
      const cleanup = setupAnimationTesting();

      expect(areAnimationsEnabled()).toBe(false);

      cleanup();
    });

    it('sets transition multiplier to 0 by default', () => {
      const cleanup = setupAnimationTesting();

      expect(getTransitionMultiplier()).toBe(0);

      cleanup();
    });

    it('respects runAnimations config', () => {
      const cleanup = setupAnimationTesting({ runAnimations: true });

      expect(areAnimationsEnabled()).toBe(true);

      cleanup();
    });

    it('respects transitionMultiplier config', () => {
      const cleanup = setupAnimationTesting({ transitionMultiplier: 0.5 });

      expect(getTransitionMultiplier()).toBe(0.5);

      cleanup();
    });

    it('cleanup restores all settings', () => {
      const cleanup = setupAnimationTesting({
        transitionMultiplier: 0.5,
        runAnimations: false,
      });

      cleanup();

      expect(areAnimationsEnabled()).toBe(true);
      expect(getTransitionMultiplier()).toBe(1);
      expect(getAnimationRecords()).toHaveLength(0);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Examples', () => {
    let element: HTMLDivElement;
    let cleanupSetup: () => void;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
      cleanupSetup = setupAnimationTesting();
    });

    afterEach(() => {
      element.remove();
      cleanupSetup();
    });

    it('simulates full animation lifecycle', async () => {
      // Track animation start
      trackAnimation({
        element,
        type: 'animation',
        name: 'fadeIn',
        duration: 300,
        completed: false,
        cancelled: false,
      });

      // Fire animation events
      fireAnimationStart(element, { animationName: 'fadeIn' });

      // Simulate animation completion
      fireAnimationEnd(element, { animationName: 'fadeIn', elapsedTime: 0.3 });

      // Verify tracking
      const records = getAnimationRecords();
      expect(records.some((r) => r.name === 'fadeIn')).toBe(true);
    });

    it('tests Framer Motion component', () => {
      const mocked = mockFramerMotion();

      // Simulate rendering a motion component
      mocked.motion.div({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      });

      // Verify animation was recorded
      const records = getAnimationRecordsByType('framer');
      expect(records.length).toBeGreaterThan(0);
    });

    it('controls RAF for game loop testing', () => {
      const controller = createRAFController();
      const positions: number[] = [];

      let position = 0;
      const gameLoop = (time: number) => {
        position += 1;
        positions.push(position);
        if (position < 5) {
          controller.requestAnimationFrame(gameLoop);
        }
      };

      controller.requestAnimationFrame(gameLoop);
      controller.runAllFrames();

      expect(positions).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
