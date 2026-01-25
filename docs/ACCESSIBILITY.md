# Accessibility Guide

This document outlines the accessibility features implemented in x402Arcade and how to use them correctly.

## Table of Contents

- [Overview](#overview)
- [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
- [Focus Management](#focus-management)
- [High Contrast Mode](#high-contrast-mode)
- [Screen Reader Support](#screen-reader-support)
- [Color Contrast](#color-contrast)
- [Touch Targets](#touch-targets)
- [Reduced Motion](#reduced-motion)
- [Keyboard Navigation](#keyboard-navigation)
- [Testing](#testing)

## Overview

x402Arcade implements WCAG 2.1 Level AA accessibility standards to ensure the application is usable by everyone, including users with disabilities.

### Key Features

✅ **Keyboard Navigation** - Full keyboard support for all interactive elements
✅ **Screen Reader Support** - Proper ARIA labels and semantic HTML
✅ **High Contrast Mode** - Enhanced visibility for users with visual impairments
✅ **Focus Indicators** - Visible focus rings with neon glow effects
✅ **Color Contrast** - All text meets WCAG AA contrast ratios (4.5:1 minimum)
✅ **Touch Targets** - Minimum 44×44px tap targets for mobile users
✅ **Reduced Motion** - Respects `prefers-reduced-motion` preference

## WCAG 2.1 AA Compliance

We aim for WCAG 2.1 Level AA compliance across all features:

### Success Criteria Met

- **1.4.1 Use of Color** - Color is not the only visual means of conveying information
- **1.4.3 Contrast (Minimum)** - Text has 4.5:1 contrast ratio (normal text) or 3:1 (large text)
- **1.4.11 Non-text Contrast** - UI components have 3:1 contrast ratio
- **2.1.1 Keyboard** - All functionality available via keyboard
- **2.4.7 Focus Visible** - Keyboard focus indicator is visible
- **2.5.5 Target Size** - Interactive elements meet minimum size requirements
- **4.1.2 Name, Role, Value** - UI components have proper ARIA attributes

## Focus Management

### Focus Rings

All interactive elements have visible focus indicators using the neon cyan theme:

```tsx
import { focusVisibleClasses } from '@/styles/tokens/accessibility';

// Default focus ring
<button className={focusVisibleClasses.default}>
  Play Game
</button>

// Prominent focus ring for critical actions
<button className={focusVisibleClasses.prominent}>
  Submit Payment
</button>

// Error focus ring
<input className={focusVisibleClasses.error} />

// Success focus ring
<button className={focusVisibleClasses.success}>
  Confirm
</button>
```

### Focus Ring Variants

- **Default** - 2px ring with cyan glow (`focus-visible:ring-2`)
- **Subtle** - 1px ring for dense UI (`focus-visible:ring-1`)
- **Prominent** - 3px ring for critical actions (`focus-visible:ring-3`)
- **Error** - Red ring for validation errors
- **Success** - Green ring for success states

### Implementation Example

```tsx
// Button with proper focus styles
<button
  className="
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-primary
    focus-visible:ring-offset-2
    focus-visible:ring-offset-bg-primary
  "
>
  Click Me
</button>
```

## High Contrast Mode

### Using the Hook

```tsx
import { useHighContrastMode } from '@/hooks/useHighContrastMode';

function AccessibilitySettings() {
  const { isHighContrast, toggle, enable, disable, isSystemPreference } = useHighContrastMode();

  return (
    <div>
      <h2>High Contrast Mode</h2>
      <button onClick={toggle}>{isHighContrast ? 'Disable' : 'Enable'} High Contrast</button>

      {isSystemPreference && <p>Using system preference</p>}
    </div>
  );
}
```

### What High Contrast Mode Does

When enabled, high contrast mode:

- Sets pure black background (#000000)
- Sets pure white text (#ffffff)
- Removes gradients (uses solid colors)
- Increases border visibility
- Enhances focus indicators (yellow instead of cyan)
- Removes transparency effects
- Simplifies shadows

### CSS Implementation

High contrast styles are automatically applied when the `.high-contrast-mode` class is present on `<html>`:

```css
.high-contrast-mode {
  --text-primary: #ffffff;
  --bg-primary: #000000;
  --border-default: #ffffff;
  --border-focus: #ffff00; /* Yellow for maximum visibility */
}
```

### System Preference Detection

The hook automatically detects:

- `(prefers-contrast: more)` media query
- Windows High Contrast Mode (`-ms-high-contrast: active`)

User manual overrides are stored in `localStorage` and take precedence over system preferences.

## Screen Reader Support

### VisuallyHidden Component

Hide content visually while keeping it accessible to screen readers:

```tsx
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

// Icon button with accessible label
<button>
  <CloseIcon aria-hidden="true" />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>

// Skip navigation link
<VisuallyHidden as="a" focusable={true}>
  <a href="#main">Skip to main content</a>
</VisuallyHidden>
```

### Using CSS Classes

```tsx
// Screen reader only (always hidden)
<span className="sr-only">
  Accessibility description
</span>

// Visible on focus (skip links)
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to content
</a>
```

### ARIA Labels

Standard ARIA labels are exported for consistency:

```tsx
import { ariaLabels } from '@/styles/tokens/accessibility';

<button aria-label={ariaLabels.close}>×</button>
<input aria-label={ariaLabels.searchInput} />
<button aria-label={ariaLabels.connectWallet}>Connect</button>
```

### Common Patterns

```tsx
// Loading state
<div role="status" aria-live="polite" aria-busy="true">
  <VisuallyHidden>Loading game data...</VisuallyHidden>
  <LoadingSpinner aria-hidden="true" />
</div>

// Form field
<label htmlFor="email">
  Email
  <span className="sr-only">{ariaLabels.required}</span>
</label>
<input id="email" type="email" required />

// Icon button
<button aria-label="Open settings menu">
  <SettingsIcon aria-hidden="true" />
</button>
```

## Color Contrast

### WCAG AA Compliant Colors

All text colors meet WCAG AA contrast requirements:

```tsx
import { accessibleTextColors } from '@/styles/tokens/accessibility';

// On dark primary background (#0a0a0f)
const textOnDark = accessibleTextColors.onDarkPrimary.primary; // White - 19.88:1
const mutedOnDark = accessibleTextColors.onDarkPrimary.muted; // #808080 - 5.38:1

// On surface (#1a1a2e)
const textOnSurface = accessibleTextColors.onSurface.primary; // White - 15.21:1
const mutedOnSurface = accessibleTextColors.onSurface.muted; // #8a8a8a - 4.11:1
```

### Contrast Ratios

```tsx
import { contrastRatios } from '@/styles/tokens/accessibility';

// WCAG AA requirements
contrastRatios.normalText; // 4.5:1 (< 18px)
contrastRatios.largeText; // 3.0:1 (>= 18px or >= 14px bold)
contrastRatios.uiComponents; // 3.0:1 (borders, icons)
contrastRatios.enhanced; // 7.0:1 (WCAG AAA)
```

### Testing Contrast

Use browser DevTools or online tools:

- Chrome DevTools: Inspect element → Contrast ratio shown in color picker
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Tool](https://contrast-ratio.com/)

### Example: Ensuring Proper Contrast

```tsx
// ❌ Bad - insufficient contrast
<div className="bg-gray-800 text-gray-600">
  This text is hard to read (2.1:1 contrast)
</div>

// ✅ Good - meets WCAG AA
<div className="bg-bg-primary text-text-primary">
  This text meets WCAG AA (19.88:1 contrast)
</div>

// ✅ Good - muted text still meets AA
<div className="bg-bg-primary text-text-muted">
  Muted text that still meets AA (5.38:1 contrast)
</div>
```

## Touch Targets

### Minimum Sizes

```tsx
import { touchTargets } from '@/styles/tokens/accessibility';

touchTargets.minimum; // 44px - WCAG AAA requirement
touchTargets.recommended; // 48px - Material Design
touchTargets.comfortable; // 56px - iOS guideline
touchTargets.small; // 36px - minimum with adequate spacing
```

### Implementation

```tsx
// ✅ Good - meets minimum touch target
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="h-4 w-4" />
</button>

// ✅ Good - small target with spacing
<button className="p-2 m-2"> {/* 36px button + 8px margin = 52px total */}
  <Icon className="h-4 w-4" />
</button>

// ❌ Bad - too small
<button className="p-1"> {/* Only 24px total */}
  <Icon className="h-4 w-4" />
</button>
```

## Reduced Motion

### Respecting User Preferences

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  /* Hide particle effects */
  .particles,
  .confetti,
  .cursor-trail {
    display: none !important;
  }
}
```

### Using Reduced Motion Tokens

```tsx
import { reducedMotion } from '@/styles/tokens/accessibility';

// Check preference
const prefersReducedMotion = window.matchMedia(reducedMotion.query).matches;

// Apply class that respects preference
<div className={reducedMotion.respectPreference}>
  Animated content
</div>

// Safe animation (opacity only)
<div className={reducedMotion.safeTransition}>
  Fade transition
</div>
```

### Manual Control

Allow users to disable animations manually:

```tsx
// Set data attribute on html element
<html data-reduce-motion="true">{/* All animations disabled */}</html>
```

## Keyboard Navigation

### Skip Links

Provide skip links for keyboard users:

```tsx
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

function Layout({ children }) {
  return (
    <>
      <VisuallyHidden as="a" focusable={true}>
        <a href="#main" className="skip-to-content">
          Skip to main content
        </a>
      </VisuallyHidden>

      <Header />

      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

### Focus Management

```tsx
// Auto-focus on page load
useEffect(() => {
  const heading = document.querySelector('h1');
  heading?.focus();
}, []);

// Focus trap in modal
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen }) {
  const modalRef = useFocusTrap(isOpen);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

### Tab Order

Ensure logical tab order:

```tsx
// ✅ Good - natural DOM order
<form>
  <input name="email" />
  <input name="password" />
  <button type="submit">Login</button>
</form>

// ❌ Bad - custom tab order
<form>
  <input name="email" tabIndex={2} />
  <button type="submit" tabIndex={1}>Login</button>
  <input name="password" tabIndex={3} />
</form>
```

## Testing

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test all keyboard shortcuts

2. **Screen Reader**
   - Use NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
   - Navigate through the page using screen reader commands
   - Verify all content is announced correctly

3. **High Contrast Mode**
   - Enable in Settings
   - Verify all UI elements are visible
   - Check focus indicators are prominent

4. **Color Contrast**
   - Use browser DevTools contrast checker
   - Verify all text meets WCAG AA (4.5:1 minimum)

5. **Touch Targets**
   - Test on mobile device or emulator
   - Verify all buttons are easy to tap
   - Check minimum 44×44px size

### Automated Testing

```bash
# Run accessibility tests
pnpm test:a11y

# Lint for accessibility issues
pnpm lint:a11y
```

### Tools

- **axe DevTools** - Browser extension for accessibility auditing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Chrome DevTools audit
- **Pa11y** - Automated accessibility testing
- **jest-axe** - Jest matcher for accessibility testing

### Example Test

```tsx
import { axe } from 'jest-axe';
import { render } from '@testing-library/react';

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

## Support

For accessibility-related questions or issues, please:

1. Check this documentation first
2. Review WCAG 2.1 guidelines
3. Test with assistive technologies
4. Create an issue on GitHub with details

---

**Remember:** Accessibility is not optional. It's a fundamental requirement for building inclusive web applications.
