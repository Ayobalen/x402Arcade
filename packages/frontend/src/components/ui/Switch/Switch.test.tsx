/**
 * Tests for Switch Component
 *
 * Verifies toggle switch functionality, accessibility, and styling.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  const defaultProps = {
    checked: false,
    onCheckedChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render unchecked switch', () => {
      render(<Switch {...defaultProps} data-testid="test-switch" />);
      const switchEl = screen.getByTestId('test-switch');
      expect(switchEl).toBeInTheDocument();
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should render checked switch', () => {
      render(<Switch {...defaultProps} checked={true} data-testid="test-switch" />);
      const switchEl = screen.getByTestId('test-switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });

    it('should render with label', () => {
      render(<Switch {...defaultProps} label="Enable Feature" />);
      expect(screen.getByText('Enable Feature')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(
        <Switch {...defaultProps} label="Enable Feature" description="This enables the feature" />
      );
      expect(screen.getByText('This enables the feature')).toBeInTheDocument();
    });

    it('should render in different sizes', () => {
      const { rerender } = render(<Switch {...defaultProps} size="sm" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();

      rerender(<Switch {...defaultProps} size="md" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();

      rerender(<Switch {...defaultProps} size="lg" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();
    });

    it('should apply variant colors', () => {
      const { rerender } = render(
        <Switch {...defaultProps} variant="cyan" data-testid="test-switch" />
      );
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();

      rerender(<Switch {...defaultProps} variant="magenta" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();

      rerender(<Switch {...defaultProps} variant="green" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();

      rerender(<Switch {...defaultProps} variant="yellow" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onCheckedChange when clicked', () => {
      const onCheckedChange = jest.fn();
      render(
        <Switch {...defaultProps} onCheckedChange={onCheckedChange} data-testid="test-switch" />
      );

      fireEvent.click(screen.getByTestId('test-switch'));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should toggle from checked to unchecked', () => {
      const onCheckedChange = jest.fn();
      render(
        <Switch
          {...defaultProps}
          checked={true}
          onCheckedChange={onCheckedChange}
          data-testid="test-switch"
        />
      );

      fireEvent.click(screen.getByTestId('test-switch'));
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('should toggle when label is clicked', () => {
      const onCheckedChange = jest.fn();
      render(<Switch {...defaultProps} onCheckedChange={onCheckedChange} label="Click me" />);

      fireEvent.click(screen.getByText('Click me'));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should toggle with keyboard (Space)', () => {
      const onCheckedChange = jest.fn();
      render(
        <Switch {...defaultProps} onCheckedChange={onCheckedChange} data-testid="test-switch" />
      );

      fireEvent.keyDown(screen.getByTestId('test-switch'), { key: ' ' });
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should toggle with keyboard (Enter)', () => {
      const onCheckedChange = jest.fn();
      render(
        <Switch {...defaultProps} onCheckedChange={onCheckedChange} data-testid="test-switch" />
      );

      fireEvent.keyDown(screen.getByTestId('test-switch'), { key: 'Enter' });
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should not toggle when disabled', () => {
      const onCheckedChange = jest.fn();
      render(
        <Switch
          {...defaultProps}
          onCheckedChange={onCheckedChange}
          disabled={true}
          data-testid="test-switch"
        />
      );

      fireEvent.click(screen.getByTestId('test-switch'));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="switch"', () => {
      render(<Switch {...defaultProps} data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toHaveAttribute('role', 'switch');
    });

    it('should have correct aria-checked attribute', () => {
      const { rerender } = render(<Switch {...defaultProps} data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toHaveAttribute('aria-checked', 'false');

      rerender(<Switch {...defaultProps} checked={true} data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('should have aria-disabled when disabled', () => {
      render(<Switch {...defaultProps} disabled={true} data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should link label with aria-labelledby', () => {
      render(<Switch {...defaultProps} label="Test Label" data-testid="test-switch" />);
      const switchEl = screen.getByTestId('test-switch');
      const labelledBy = switchEl.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeInTheDocument();
    });

    it('should link description with aria-describedby', () => {
      render(
        <Switch
          {...defaultProps}
          label="Test"
          description="Test description"
          data-testid="test-switch"
        />
      );
      const switchEl = screen.getByTestId('test-switch');
      const describedBy = switchEl.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Switch {...defaultProps} data-testid="test-switch" />);
      const switchEl = screen.getByTestId('test-switch');
      switchEl.focus();
      expect(switchEl).toHaveFocus();
    });
  });

  describe('Form Integration', () => {
    it('should render hidden input when name provided', () => {
      render(<Switch {...defaultProps} name="feature-toggle" label="Feature" />);
      const hiddenInput = document.querySelector('input[type="checkbox"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute('name', 'feature-toggle');
    });

    it('should sync hidden input with checked state', () => {
      const { rerender } = render(<Switch {...defaultProps} name="test" checked={false} />);
      let hiddenInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(hiddenInput.checked).toBe(false);

      rerender(<Switch {...defaultProps} name="test" checked={true} />);
      hiddenInput = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(hiddenInput.checked).toBe(true);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Switch {...defaultProps} className="custom-class" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch').closest('.custom-class')).toBeInTheDocument();
    });

    it('should use provided id', () => {
      render(<Switch {...defaultProps} id="custom-id" data-testid="test-switch" />);
      expect(screen.getByTestId('test-switch')).toBeInTheDocument();
    });
  });
});
