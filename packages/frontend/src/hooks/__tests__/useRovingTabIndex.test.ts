/**
 * Tests for useRovingTabIndex hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRovingTabIndex } from '../useRovingTabIndex';

describe('useRovingTabIndex', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
        })
      );

      expect(result.current.currentIndex).toBe(0);
    });

    it('should initialize with custom initial index', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 2,
        })
      );

      expect(result.current.currentIndex).toBe(2);
    });

    it('should clamp initial index to valid range', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 10,
        })
      );

      expect(result.current.currentIndex).toBe(4);
    });
  });

  describe('horizontal navigation', () => {
    it('should navigate right with ArrowRight', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          orientation: 'horizontal',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(0).onKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(1);
    });

    it('should navigate left with ArrowLeft', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 2,
          orientation: 'horizontal',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(2).onKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(1);
    });

    it('should wrap at edges when enabled', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          orientation: 'horizontal',
          wrap: true,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(0).onKeyDown(event);
      });

      expect(result.current.currentIndex).toBe(4); // Wrap to last
    });

    it('should not wrap when disabled', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          orientation: 'horizontal',
          wrap: false,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(0).onKeyDown(event);
      });

      expect(result.current.currentIndex).toBe(0); // Stay at first
    });
  });

  describe('vertical navigation', () => {
    it('should navigate down with ArrowDown', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          orientation: 'vertical',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(0).onKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(1);
    });

    it('should navigate up with ArrowUp', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 2,
          orientation: 'vertical',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(2).onKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(1);
    });
  });

  describe('Home/End navigation', () => {
    it('should navigate to first with Home key', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 3,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Home' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(3).onKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(0);
    });

    it('should navigate to last with End key', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 1,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'End' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(1).onKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.currentIndex).toBe(4);
    });
  });

  describe('getRovingProps', () => {
    it('should return tabIndex 0 for current item', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 2,
        })
      );

      const props = result.current.getRovingProps(2);
      expect(props.tabIndex).toBe(0);
    });

    it('should return tabIndex -1 for non-current items', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 2,
        })
      );

      const props = result.current.getRovingProps(1);
      expect(props.tabIndex).toBe(-1);
    });

    it('should update current index on focus', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          initialIndex: 0,
        })
      );

      act(() => {
        result.current.getRovingProps(3).onFocus();
      });

      expect(result.current.currentIndex).toBe(3);
    });
  });

  describe('callbacks', () => {
    it('should call onFocusChange when index changes', () => {
      const onFocusChange = vi.fn();
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          onFocusChange,
        })
      );

      act(() => {
        result.current.setCurrentIndex(3);
      });

      expect(onFocusChange).toHaveBeenCalledWith(3);
    });
  });

  describe('loop parameter', () => {
    it('should use loop parameter as alias for wrap', () => {
      const { result } = renderHook(() =>
        useRovingTabIndex({
          count: 5,
          orientation: 'horizontal',
          loop: true,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.getRovingProps(0).onKeyDown(event);
      });

      expect(result.current.currentIndex).toBe(4); // Loop to last
    });
  });
});
