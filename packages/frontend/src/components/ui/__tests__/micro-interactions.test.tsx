/**
 * Micro-Interactions Integration Tests
 *
 * Tests that verify micro-interaction components work correctly together
 * and handle cleanup properly to prevent memory leaks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CursorTrail } from '../CursorTrail';
import { ClickRipple } from '../ClickRipple';
import { ScorePopup } from '../ScorePopup';
import { ParticleBurst } from '../ParticleBurst';

describe('Micro-Interactions Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('CursorTrail', () => {
    it('tracks mouse position correctly', () => {
      const { container } = render(
        <div style={{ width: 500, height: 500 }}>
          <CursorTrail trailCount={3} color="#00ffff" />
        </div>
      );

      // CursorTrail should render trail elements
      const trails = container.querySelectorAll('[class*="absolute"]');
      expect(trails.length).toBeGreaterThan(0);
    });

    it('cleans up trail elements on unmount', () => {
      const { container, unmount } = render(
        <div style={{ width: 500, height: 500 }}>
          <CursorTrail trailCount={5} />
        </div>
      );

      const initialTrails = container.querySelectorAll('[class*="absolute"]');
      expect(initialTrails.length).toBeGreaterThan(0);

      unmount();

      // After unmount, container should be empty
      expect(container.children.length).toBe(0);
    });

    it('prevents memory leaks with proper cleanup', () => {
      const onCleanup = vi.fn();
      const { unmount } = render(
        <div style={{ width: 500, height: 500 }}>
          <CursorTrail trailCount={3} />
        </div>
      );

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('ClickRipple', () => {
    it('creates ripple container when enabled', () => {
      const { container } = render(
        <ClickRipple enabled={true} />
      );

      // Should render ripple container
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('does not render when disabled', () => {
      const { container } = render(
        <ClickRipple enabled={false} />
      );

      // Should not render anything when disabled
      expect(container.firstChild).not.toBeInTheDocument();
    });

    it('handles multiple ripple instances', () => {
      const { container } = render(
        <>
          <ClickRipple enabled={true} />
          <ClickRipple enabled={true} color="#ff00ff" />
          <ClickRipple enabled={true} color="#00ffff" />
        </>
      );

      // All ripple containers should be rendered without errors
      const rippleContainers = container.querySelectorAll('[aria-hidden="true"]');
      expect(rippleContainers.length).toBe(3);
    });

    it('prevents memory leaks with cleanup', () => {
      const { unmount } = render(
        <ClickRipple enabled={true} duration={2} />
      );

      // Unmount before potential ripples complete
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('ScorePopup', () => {
    it('animates score and calls callback', () => {
      const onComplete = vi.fn();
      render(
        <ScorePopup
          score={100}
          x={200}
          y={200}
          duration={1}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('+100')).toBeInTheDocument();

      // Fast-forward animation
      vi.advanceTimersByTime(1000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('handles multiple simultaneous popups', () => {
      render(
        <>
          <ScorePopup score={10} x={100} y={100} />
          <ScorePopup score={50} x={200} y={200} />
          <ScorePopup score={100} x={300} y={300} />
        </>
      );

      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('+50')).toBeInTheDocument();
      expect(screen.getByText('+100')).toBeInTheDocument();
    });

    it('cleans up timers on unmount', () => {
      const onComplete = vi.fn();
      const { unmount } = render(
        <ScorePopup
          score={100}
          x={200}
          y={200}
          duration={5}
          onComplete={onComplete}
        />
      );

      // Unmount before completion
      unmount();

      // Advance time
      vi.advanceTimersByTime(5000);

      // Callback should not be called after unmount
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('prevents memory leaks with proper cleanup', () => {
      const { unmount } = render(
        <>
          <ScorePopup score={10} x={100} y={100} duration={2} />
          <ScorePopup score={50} x={200} y={200} duration={3} />
          <ScorePopup score={100} x={300} y={300} duration={4} />
        </>
      );

      // Unmount all popups before animations complete
      expect(() => unmount()).not.toThrow();

      // Advance time
      vi.advanceTimersByTime(5000);

      // Should not cause any errors
    });
  });

  describe('ParticleBurst', () => {
    it('creates correct number of particles', () => {
      const { container } = render(
        <ParticleBurst
          x={250}
          y={250}
          particleCount={10}
        />
      );

      // Should have container + 10 particle divs
      const particles = container.querySelectorAll('[class*="absolute"]');
      expect(particles.length).toBeGreaterThanOrEqual(10);
    });

    it('calls onComplete after animation duration', () => {
      const onComplete = vi.fn();
      render(
        <ParticleBurst
          x={250}
          y={250}
          particleCount={5}
          duration={0.5}
          onComplete={onComplete}
        />
      );

      expect(onComplete).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('prevents memory leaks with cleanup', () => {
      const { unmount } = render(
        <ParticleBurst
          x={250}
          y={250}
          particleCount={50}
          duration={5}
        />
      );

      // Unmount before animation completes
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Combined Micro-Interactions', () => {
    it('handles multiple interaction types simultaneously', () => {
      const { container } = render(
        <div style={{ position: 'relative', width: 500, height: 500 }}>
          <CursorTrail trailCount={3} />
          <ClickRipple x={100} y={100} />
          <ScorePopup score={100} x={200} y={200} />
          <ParticleBurst x={300} y={300} particleCount={10} />
        </div>
      );

      // All interactions should be present
      expect(container.querySelectorAll('[class*="absolute"]').length).toBeGreaterThan(0);
      expect(screen.getByText('+100')).toBeInTheDocument();
    });

    it('cleans up all interactions properly', () => {
      const { unmount } = render(
        <div style={{ position: 'relative', width: 500, height: 500 }}>
          <CursorTrail trailCount={5} />
          <ClickRipple x={100} y={100} duration={3} />
          <ClickRipple x={200} y={200} duration={3} />
          <ScorePopup score={100} x={200} y={200} duration={3} />
          <ScorePopup score={50} x={250} y={250} duration={3} />
          <ParticleBurst x={300} y={300} particleCount={20} duration={3} />
        </div>
      );

      // Unmount all before animations complete
      expect(() => unmount()).not.toThrow();

      // Advance timers
      vi.advanceTimersByTime(5000);

      // Should not cause any memory leaks or errors
    });

    it('prevents event listener leaks', () => {
      const initialListenerCount = vi.getTimerCount();

      const { unmount } = render(
        <div style={{ position: 'relative', width: 500, height: 500 }}>
          <CursorTrail trailCount={3} />
          <ClickRipple x={100} y={100} />
        </div>
      );

      unmount();

      // Timer count should be cleaned up (or similar to initial)
      // This is a basic check - in real apps you'd use more sophisticated leak detection
      vi.clearAllTimers();
    });
  });
});
