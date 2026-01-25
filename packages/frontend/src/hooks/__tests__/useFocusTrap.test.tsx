/**
 * Tests for useFocusTrap Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap, FOCUSABLE_SELECTORS } from '../useFocusTrap';

// Test component that uses the useFocusTrap hook
function TestFocusTrap({
  isActive,
  autoFocus = true,
  returnFocus = true,
  initialFocus,
  onActivate,
  onDeactivate,
}: {
  isActive: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
  initialFocus?: string | HTMLElement;
  onActivate?: () => void;
  onDeactivate?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, isActive, {
    autoFocus,
    returnFocus,
    initialFocus,
    onActivate,
    onDeactivate,
  });

  return (
    <div ref={containerRef} data-testid="trap-container">
      <button data-testid="button-1">Button 1</button>
      <button data-testid="button-2">Button 2</button>
      <input data-testid="input-1" type="text" placeholder="Input 1" />
      <a href="#" data-testid="link-1">
        Link 1
      </a>
    </div>
  );
}

describe('useFocusTrap', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    // Clean up any remaining focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  describe('Focus Trap Activation', () => {
    it('should auto-focus first element when activated', async () => {
      render(<TestFocusTrap isActive={true} />);

      await waitFor(() => {
        const button1 = screen.getByTestId('button-1');
        expect(button1).toHaveFocus();
      });
    });

    it('should not auto-focus when autoFocus is false', () => {
      render(<TestFocusTrap isActive={true} autoFocus={false} />);

      const button1 = screen.getByTestId('button-1');
      expect(button1).not.toHaveFocus();
    });

    it('should focus specific element when initialFocus is provided (selector)', async () => {
      render(<TestFocusTrap isActive={true} initialFocus="[data-testid='button-2']" />);

      await waitFor(() => {
        const button2 = screen.getByTestId('button-2');
        expect(button2).toHaveFocus();
      });
    });

    it('should call onActivate callback when trap activates', () => {
      const onActivate = vi.fn();
      render(<TestFocusTrap isActive={true} onActivate={onActivate} />);

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('should not activate when isActive is false', () => {
      const onActivate = vi.fn();
      render(<TestFocusTrap isActive={false} onActivate={onActivate} />);

      expect(onActivate).not.toHaveBeenCalled();
    });
  });

  describe('Tab Cycling', () => {
    it('should cycle focus forward through elements with Tab', async () => {
      render(<TestFocusTrap isActive={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Tab to next element
      await user.tab();
      expect(screen.getByTestId('button-2')).toHaveFocus();

      // Tab to next element
      await user.tab();
      expect(screen.getByTestId('input-1')).toHaveFocus();

      // Tab to next element
      await user.tab();
      expect(screen.getByTestId('link-1')).toHaveFocus();
    });

    it('should wrap to first element when tabbing from last element', async () => {
      render(<TestFocusTrap isActive={true} />);

      // Focus last element
      const link1 = screen.getByTestId('link-1');
      link1.focus();
      expect(link1).toHaveFocus();

      // Tab should wrap to first
      await user.tab();

      await waitFor(() => {
        const button1 = screen.getByTestId('button-1');
        expect(button1).toHaveFocus();
      });
    });

    it('should cycle focus backward with Shift+Tab', async () => {
      render(<TestFocusTrap isActive={true} />);

      // Focus button-2
      const button2 = screen.getByTestId('button-2');
      button2.focus();

      // Shift+Tab to previous element
      await user.tab({ shift: true });
      expect(screen.getByTestId('button-1')).toHaveFocus();
    });

    it('should wrap to last element when shift-tabbing from first element', async () => {
      render(<TestFocusTrap isActive={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Shift+Tab should wrap to last
      await user.tab({ shift: true });

      await waitFor(() => {
        const link1 = screen.getByTestId('link-1');
        expect(link1).toHaveFocus();
      });
    });
  });

  describe('Focus Return', () => {
    it('should return focus to previously focused element on deactivate', async () => {
      // Create a button outside the trap
      const { rerender } = render(
        <>
          <button data-testid="outside-button">Outside</button>
          <TestFocusTrap isActive={false} />
        </>
      );

      // Focus outside button
      const outsideButton = screen.getByTestId('outside-button');
      outsideButton.focus();
      expect(outsideButton).toHaveFocus();

      // Activate trap
      rerender(
        <>
          <button data-testid="outside-button">Outside</button>
          <TestFocusTrap isActive={true} />
        </>
      );

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Deactivate trap
      rerender(
        <>
          <button data-testid="outside-button">Outside</button>
          <TestFocusTrap isActive={false} />
        </>
      );

      await waitFor(() => {
        expect(outsideButton).toHaveFocus();
      });
    });

    it('should not return focus when returnFocus is false', async () => {
      const { rerender } = render(
        <>
          <button data-testid="outside-button">Outside</button>
          <TestFocusTrap isActive={false} returnFocus={false} />
        </>
      );

      const outsideButton = screen.getByTestId('outside-button');
      outsideButton.focus();

      // Activate trap
      rerender(
        <>
          <button data-testid="outside-button">Outside</button>
          <TestFocusTrap isActive={true} returnFocus={false} />
        </>
      );

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Deactivate trap
      rerender(
        <>
          <button data-testid="outside-button">Outside</button>
          <TestFocusTrap isActive={false} returnFocus={false} />
        </>
      );

      // Focus should NOT return to outside button
      expect(outsideButton).not.toHaveFocus();
    });

    it('should call onDeactivate callback when trap deactivates', () => {
      const onDeactivate = vi.fn();
      const { rerender } = render(<TestFocusTrap isActive={true} onDeactivate={onDeactivate} />);

      expect(onDeactivate).not.toHaveBeenCalled();

      // Deactivate
      rerender(<TestFocusTrap isActive={false} onDeactivate={onDeactivate} />);

      expect(onDeactivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle container with no focusable elements', () => {
      function EmptyTrap({ isActive }: { isActive: boolean }) {
        const containerRef = useRef<HTMLDivElement>(null);
        useFocusTrap(containerRef, isActive);

        return (
          <div ref={containerRef} data-testid="empty-trap">
            <div>No focusable elements</div>
          </div>
        );
      }

      render(<EmptyTrap isActive={true} />);

      // Container itself should be focused with tabindex=-1
      const container = screen.getByTestId('empty-trap');
      expect(container).toHaveFocus();
    });

    it('should handle disabled buttons correctly', async () => {
      function TrapWithDisabled({ isActive }: { isActive: boolean }) {
        const containerRef = useRef<HTMLDivElement>(null);
        useFocusTrap(containerRef, isActive);

        return (
          <div ref={containerRef}>
            <button data-testid="button-1">Button 1</button>
            <button disabled data-testid="button-disabled">
              Disabled
            </button>
            <button data-testid="button-2">Button 2</button>
          </div>
        );
      }

      render(<TrapWithDisabled isActive={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Tab should skip disabled button
      await user.tab();
      expect(screen.getByTestId('button-2')).toHaveFocus();
    });

    it('should handle hidden elements correctly', async () => {
      function TrapWithHidden({ isActive }: { isActive: boolean }) {
        const containerRef = useRef<HTMLDivElement>(null);
        useFocusTrap(containerRef, isActive);

        return (
          <div ref={containerRef}>
            <button data-testid="button-1">Button 1</button>
            <button style={{ display: 'none' }} data-testid="button-hidden">
              Hidden
            </button>
            <button data-testid="button-2">Button 2</button>
          </div>
        );
      }

      render(<TrapWithHidden isActive={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Tab should skip hidden button
      await user.tab();
      expect(screen.getByTestId('button-2')).toHaveFocus();
    });
  });

  describe('FOCUSABLE_SELECTORS', () => {
    it('should export FOCUSABLE_SELECTORS constant', () => {
      expect(FOCUSABLE_SELECTORS).toBeDefined();
      expect(typeof FOCUSABLE_SELECTORS).toBe('string');
    });

    it('should include standard focusable elements', () => {
      expect(FOCUSABLE_SELECTORS).toContain('a[href]');
      expect(FOCUSABLE_SELECTORS).toContain('button:not([disabled])');
      expect(FOCUSABLE_SELECTORS).toContain('input:not([disabled])');
      expect(FOCUSABLE_SELECTORS).toContain('select:not([disabled])');
      expect(FOCUSABLE_SELECTORS).toContain('textarea:not([disabled])');
      expect(FOCUSABLE_SELECTORS).toContain('[tabindex]:not([tabindex="-1"])');
    });
  });

  describe('Dynamic Content', () => {
    it('should handle dynamically changing focusable elements', async () => {
      function DynamicTrap() {
        const [showExtra, setShowExtra] = useState(false);
        const containerRef = useRef<HTMLDivElement>(null);
        useFocusTrap(containerRef, true);

        return (
          <div ref={containerRef}>
            <button data-testid="button-1">Button 1</button>
            {showExtra && <button data-testid="button-extra">Extra Button</button>}
            <button data-testid="button-2" onClick={() => setShowExtra(true)}>
              Show Extra
            </button>
          </div>
        );
      }

      render(<DynamicTrap />);

      await waitFor(() => {
        expect(screen.getByTestId('button-1')).toHaveFocus();
      });

      // Tab to button-2
      await user.tab();
      await user.tab();

      const button2 = screen.getByTestId('button-2');
      expect(button2).toHaveFocus();

      // Click to show extra button
      await user.click(button2);

      // Tab should now include the extra button
      await user.tab();
      expect(screen.getByTestId('button-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-extra')).toHaveFocus();
    });
  });
});
