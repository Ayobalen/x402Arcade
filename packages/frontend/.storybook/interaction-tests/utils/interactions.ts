/**
 * Interaction Test Utilities
 *
 * Helper functions for Storybook interaction tests.
 * These utilities wrap common testing patterns for cleaner test code.
 *
 * @example
 * import { expectElementVisible, clickAndWait } from '../../.storybook/interaction-tests/utils/interactions';
 *
 * play: async ({ canvasElement }) => {
 *   const canvas = within(canvasElement);
 *   await expectElementVisible(canvas, 'Play Now');
 *   await clickAndWait(canvas, 'Play Now', { timeout: 1000 });
 * }
 */

import { expect, waitFor } from '@storybook/test';
import type { BoundFunctions } from '@testing-library/dom';
import type { queries } from '@testing-library/dom';

/**
 * Canvas type from @testing-library
 */
type Canvas = BoundFunctions<typeof queries>;

/**
 * Wait options for async operations
 */
interface WaitOptions {
  /** Maximum time to wait in milliseconds */
  timeout?: number;
  /** Interval between checks in milliseconds */
  interval?: number;
}

/**
 * Default wait options
 */
const DEFAULT_WAIT_OPTIONS: WaitOptions = {
  timeout: 3000,
  interval: 50,
};

// =============================================================================
// Element Visibility Assertions
// =============================================================================

/**
 * Assert that an element with the given text is visible on the canvas.
 *
 * @param canvas - The canvas element from within()
 * @param text - Text content to search for (case-insensitive regex)
 * @throws If element is not found or not visible
 *
 * @example
 * await expectElementVisible(canvas, 'Play Now');
 */
export async function expectElementVisible(
  canvas: Canvas,
  text: string
): Promise<void> {
  const element = canvas.getByText(new RegExp(text, 'i'));
  expect(element).toBeVisible();
}

/**
 * Assert that an element with the given text is NOT visible on the canvas.
 *
 * @param canvas - The canvas element from within()
 * @param text - Text content to search for
 *
 * @example
 * await expectElementNotVisible(canvas, 'Error Message');
 */
export async function expectElementNotVisible(
  canvas: Canvas,
  text: string
): Promise<void> {
  const element = canvas.queryByText(new RegExp(text, 'i'));
  if (element) {
    expect(element).not.toBeVisible();
  }
}

/**
 * Assert that a button with the given text/name is enabled and clickable.
 *
 * @param canvas - The canvas element from within()
 * @param name - Button text or accessible name
 *
 * @example
 * await expectButtonEnabled(canvas, 'Submit');
 */
export async function expectButtonEnabled(
  canvas: Canvas,
  name: string
): Promise<void> {
  const button = canvas.getByRole('button', { name: new RegExp(name, 'i') });
  expect(button).toBeEnabled();
  expect(button).not.toHaveAttribute('aria-disabled', 'true');
}

/**
 * Assert that a button with the given text/name is disabled.
 *
 * @param canvas - The canvas element from within()
 * @param name - Button text or accessible name
 *
 * @example
 * await expectButtonDisabled(canvas, 'Submit');
 */
export async function expectButtonDisabled(
  canvas: Canvas,
  name: string
): Promise<void> {
  const button = canvas.getByRole('button', { name: new RegExp(name, 'i') });
  expect(button).toBeDisabled();
}

// =============================================================================
// Element Interaction Helpers
// =============================================================================

/**
 * Click a button and optionally wait for a condition.
 *
 * @param canvas - The canvas element from within()
 * @param name - Button text or accessible name
 * @param options - Wait options
 * @returns The clicked button element
 *
 * @example
 * const button = await clickAndWait(canvas, 'Submit', { timeout: 2000 });
 */
export async function clickButton(
  canvas: Canvas,
  name: string
): Promise<HTMLElement> {
  const button = canvas.getByRole('button', { name: new RegExp(name, 'i') });
  const { userEvent } = await import('@storybook/test');
  await userEvent.click(button);
  return button;
}

/**
 * Type text into an input field identified by its label.
 *
 * @param canvas - The canvas element from within()
 * @param label - Input label text
 * @param text - Text to type
 *
 * @example
 * await typeInInput(canvas, 'Email', 'test@example.com');
 */
export async function typeInInput(
  canvas: Canvas,
  label: string,
  text: string
): Promise<void> {
  const input = canvas.getByLabelText(new RegExp(label, 'i'));
  const { userEvent } = await import('@storybook/test');
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

/**
 * Type text into an input field identified by placeholder.
 *
 * @param canvas - The canvas element from within()
 * @param placeholder - Input placeholder text
 * @param text - Text to type
 *
 * @example
 * await typeInPlaceholder(canvas, 'Enter your name', 'John');
 */
export async function typeInPlaceholder(
  canvas: Canvas,
  placeholder: string,
  text: string
): Promise<void> {
  const input = canvas.getByPlaceholderText(new RegExp(placeholder, 'i'));
  const { userEvent } = await import('@storybook/test');
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

/**
 * Select an option from a select element by its label.
 *
 * @param canvas - The canvas element from within()
 * @param label - Select element label
 * @param value - Option value to select
 *
 * @example
 * await selectOption(canvas, 'Country', 'US');
 */
export async function selectOption(
  canvas: Canvas,
  label: string,
  value: string
): Promise<void> {
  const select = canvas.getByLabelText(new RegExp(label, 'i'));
  const { userEvent } = await import('@storybook/test');
  await userEvent.selectOptions(select, value);
}

/**
 * Hover over an element with the given text.
 *
 * @param canvas - The canvas element from within()
 * @param text - Text content of element to hover
 *
 * @example
 * await hoverElement(canvas, 'Menu Item');
 */
export async function hoverElement(
  canvas: Canvas,
  text: string
): Promise<void> {
  const element = canvas.getByText(new RegExp(text, 'i'));
  const { userEvent } = await import('@storybook/test');
  await userEvent.hover(element);
}

/**
 * Focus an element with the given text via keyboard navigation.
 *
 * @param canvas - The canvas element from within()
 * @param text - Text content of element to focus
 *
 * @example
 * await focusElement(canvas, 'Input Field');
 */
export async function focusElement(
  canvas: Canvas,
  text: string
): Promise<void> {
  const element = canvas.getByText(new RegExp(text, 'i'));
  element.focus();
}

// =============================================================================
// Async Waiting Utilities
// =============================================================================

/**
 * Wait for an element with the given text to appear.
 *
 * @param canvas - The canvas element from within()
 * @param text - Text content to wait for
 * @param options - Wait options
 *
 * @example
 * await waitForElement(canvas, 'Success!', { timeout: 5000 });
 */
export async function waitForElement(
  canvas: Canvas,
  text: string,
  options: WaitOptions = {}
): Promise<HTMLElement> {
  const { timeout, interval } = { ...DEFAULT_WAIT_OPTIONS, ...options };

  return await waitFor(
    () => {
      const element = canvas.getByText(new RegExp(text, 'i'));
      expect(element).toBeVisible();
      return element;
    },
    { timeout, interval }
  );
}

/**
 * Wait for an element with the given text to disappear.
 *
 * @param canvas - The canvas element from within()
 * @param text - Text content to wait for disappearance
 * @param options - Wait options
 *
 * @example
 * await waitForElementToDisappear(canvas, 'Loading...', { timeout: 5000 });
 */
export async function waitForElementToDisappear(
  canvas: Canvas,
  text: string,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout, interval } = { ...DEFAULT_WAIT_OPTIONS, ...options };

  await waitFor(
    () => {
      const element = canvas.queryByText(new RegExp(text, 'i'));
      expect(element).not.toBeInTheDocument();
    },
    { timeout, interval }
  );
}

/**
 * Wait for a loading state to complete (loading indicator to disappear).
 *
 * @param canvas - The canvas element from within()
 * @param options - Wait options
 *
 * @example
 * await waitForLoadingComplete(canvas);
 */
export async function waitForLoadingComplete(
  canvas: Canvas,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout, interval } = { ...DEFAULT_WAIT_OPTIONS, ...options };

  await waitFor(
    () => {
      // Common loading indicators
      const loadingByText = canvas.queryByText(/loading/i);
      const loadingByRole = canvas.queryByRole('progressbar');
      const loadingByLabel = canvas.queryByLabelText(/loading/i);

      expect(loadingByText).not.toBeInTheDocument();
      expect(loadingByRole).not.toBeInTheDocument();
      expect(loadingByLabel).not.toBeInTheDocument();
    },
    { timeout, interval }
  );
}

// =============================================================================
// Form Validation Helpers
// =============================================================================

/**
 * Assert that a form field shows an error message.
 *
 * @param canvas - The canvas element from within()
 * @param errorText - Expected error message text
 *
 * @example
 * await expectErrorMessage(canvas, 'Email is required');
 */
export async function expectErrorMessage(
  canvas: Canvas,
  errorText: string
): Promise<void> {
  // Check for error message in common locations
  const errorElement = canvas.getByText(new RegExp(errorText, 'i'));
  expect(errorElement).toBeVisible();
}

/**
 * Assert that no error messages are visible.
 *
 * @param canvas - The canvas element from within()
 * @param errorTexts - Array of error texts to check are NOT present
 *
 * @example
 * await expectNoErrors(canvas, ['required', 'invalid']);
 */
export async function expectNoErrors(
  canvas: Canvas,
  errorTexts: string[]
): Promise<void> {
  for (const text of errorTexts) {
    const element = canvas.queryByText(new RegExp(text, 'i'));
    if (element) {
      expect(element).not.toBeVisible();
    }
  }
}

// =============================================================================
// Accessibility Helpers
// =============================================================================

/**
 * Assert that an element has the correct ARIA attributes.
 *
 * @param element - The DOM element to check
 * @param attributes - Object of attribute names and expected values
 *
 * @example
 * expectAriaAttributes(button, { 'aria-pressed': 'true', 'aria-label': 'Toggle' });
 */
export function expectAriaAttributes(
  element: HTMLElement,
  attributes: Record<string, string | null>
): void {
  for (const [attr, value] of Object.entries(attributes)) {
    if (value === null) {
      expect(element).not.toHaveAttribute(attr);
    } else {
      expect(element).toHaveAttribute(attr, value);
    }
  }
}

/**
 * Assert that an element has proper focus management.
 *
 * @param element - The element that should be focusable
 *
 * @example
 * expectFocusable(button);
 */
export function expectFocusable(element: HTMLElement): void {
  expect(element).not.toHaveAttribute('tabindex', '-1');
  expect(element).not.toHaveAttribute('aria-hidden', 'true');
}

// =============================================================================
// Game-Specific Helpers (x402Arcade)
// =============================================================================

/**
 * Assert that a game canvas is visible and ready.
 *
 * @param canvas - The canvas element from within()
 *
 * @example
 * await expectGameCanvasReady(canvas);
 */
export async function expectGameCanvasReady(canvas: Canvas): Promise<void> {
  // Look for canvas element
  const gameCanvas = canvas.getByRole('img', { name: /game/i }) ||
    canvas.getByTestId('game-canvas');
  expect(gameCanvas).toBeVisible();
}

/**
 * Assert wallet connection state.
 *
 * @param canvas - The canvas element from within()
 * @param connected - Whether wallet should be connected
 *
 * @example
 * await expectWalletState(canvas, true);
 */
export async function expectWalletState(
  canvas: Canvas,
  connected: boolean
): Promise<void> {
  if (connected) {
    // Should show wallet address or disconnect button
    const walletIndicator = canvas.queryByText(/0x/i) ||
      canvas.queryByRole('button', { name: /disconnect/i });
    expect(walletIndicator).toBeInTheDocument();
  } else {
    // Should show connect button
    const connectButton = canvas.getByRole('button', { name: /connect.*wallet/i });
    expect(connectButton).toBeVisible();
  }
}

/**
 * Assert that a score is displayed.
 *
 * @param canvas - The canvas element from within()
 * @param score - Expected score value
 *
 * @example
 * await expectScore(canvas, 100);
 */
export async function expectScore(
  canvas: Canvas,
  score: number
): Promise<void> {
  const scoreElement = canvas.getByText(new RegExp(`score.*${score}|${score}.*score`, 'i'));
  expect(scoreElement).toBeVisible();
}
