/**
 * Tests for useKeyboardNavigation hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
        })
      );

      expect(result.current.activeIndex).toBe(0);
    });

    it('should initialize with custom initial index', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 2,
        })
      );

      expect(result.current.activeIndex).toBe(2);
    });

    it('should clamp initial index to valid range', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 10,
        })
      );

      expect(result.current.activeIndex).toBe(4); // Max index is 4
    });
  });

  describe('vertical navigation', () => {
    it('should navigate down with ArrowDown', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          orientation: 'vertical',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.activeIndex).toBe(1);
    });

    it('should navigate up with ArrowUp', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 2,
          orientation: 'vertical',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.activeIndex).toBe(1);
    });

    it('should not wrap by default when at edges', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          orientation: 'vertical',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.activeIndex).toBe(0); // Stays at 0
    });

    it('should wrap when enabled', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          orientation: 'vertical',
          wrap: true,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.activeIndex).toBe(4); // Wraps to last
    });
  });

  describe('horizontal navigation', () => {
    it('should navigate right with ArrowRight', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          orientation: 'horizontal',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.activeIndex).toBe(1);
    });

    it('should navigate left with ArrowLeft', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 2,
          orientation: 'horizontal',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.activeIndex).toBe(1);
    });
  });

  describe('Home/End navigation', () => {
    it('should navigate to first with Home key', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 3,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Home' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.activeIndex).toBe(0);
    });

    it('should navigate to last with End key', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 1,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'End' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.activeIndex).toBe(4);
    });
  });

  describe('selection', () => {
    it('should call onSelect with Enter key', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 2,
          onSelect,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Enter' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(2);
    });

    it('should call onSelect with Space key', () => {
      const onSelect = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 3,
          onSelect,
        })
      );

      const event = new KeyboardEvent('keydown', { key: ' ' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(3);
    });
  });

  describe('grid navigation', () => {
    it('should navigate down in grid (2 columns)', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 6,
          orientation: 'both',
          columns: 2,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.activeIndex).toBe(2); // Move down by 2 (columns)
    });

    it('should navigate up in grid (2 columns)', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 6,
          initialIndex: 4,
          orientation: 'both',
          columns: 2,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any;
      event.preventDefault = vi.fn();

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.activeIndex).toBe(2); // Move up by 2 (columns)
    });
  });

  describe('callbacks', () => {
    it('should call onActiveIndexChange when index changes', () => {
      const onActiveIndexChange = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onActiveIndexChange,
        })
      );

      act(() => {
        result.current.setActiveIndex(3);
      });

      expect(onActiveIndexChange).toHaveBeenCalledWith(3);
    });
  });

  describe('getItemProps', () => {
    it('should return correct props for active item', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 2,
        })
      );

      const props = result.current.getItemProps(2);

      expect(props.tabIndex).toBe(0);
      expect(props['data-active']).toBe(true);
    });

    it('should return correct props for inactive item', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          initialIndex: 2,
        })
      );

      const props = result.current.getItemProps(1);

      expect(props.tabIndex).toBe(-1);
      expect(props['data-active']).toBe(false);
    });
  });
});
