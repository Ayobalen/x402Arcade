# Keyboard Navigation Guide

## Overview

x402Arcade provides comprehensive keyboard navigation support across all games and UI components, ensuring the application is fully accessible to keyboard-only users.

## Game Controls

### Snake Game

**Movement:**

- `Arrow Keys (↑ ↓ ← →)` - Move snake up, down, left, right
- `WASD Keys` - Alternative movement controls
  - `W` - Move up
  - `S` - Move down
  - `A` - Move left
  - `D` - Move right

**Game Control:**

- `Space` - Pause/Resume game
- `Escape` - Pause/Resume game
- `Enter` (on Play Again button) - Restart game after game over

**Implementation Status:** ✅ Fully Implemented

- Controls hint displayed below game canvas
- Keyboard input handled via `useSnakeGame` hook
- Both arrow keys and WASD supported
- Pause toggle via Space/Escape

### Tetris Game

**Movement:**

- `Arrow Left (←)` - Move piece left
- `Arrow Right (→)` - Move piece right
- `Arrow Down (↓)` - Soft drop (move piece down faster)
- `Space` - Hard drop (instant drop to bottom)

**Rotation:**

- `Arrow Up (↑)` - Rotate clockwise
- `Z` - Rotate counter-clockwise
- `X` - Rotate clockwise (alternative)
- `Shift` - Rotate counter-clockwise (alternative)

**Game Control:**

- `P` - Pause/Resume game
- `Escape` - Pause/Resume game
- `Enter` (on Play Again button) - Restart game after game over

**Implementation Status:** 🔨 In Development

- Core logic implemented in `packages/frontend/src/games/tetris/logic.ts`
- Hook implementation pending in `useTetrisGame`
- Component integration pending

### Future Games

Additional games (Memory Match, Whack-a-Mole, etc.) will follow similar keyboard navigation patterns:

- Arrow keys for directional movement
- Space/Enter for primary actions
- Escape for pause/cancel
- Tab/Shift+Tab for UI element navigation

## UI Navigation

### Global Navigation

**Skip to Content:**

- `Tab` (when page loads) - Focuses skip link
- `Enter` (on skip link) - Jumps directly to main content, bypassing navigation

**Header Navigation:**

- `Tab` - Navigate through header links
- `Enter` - Activate focused link
- `Space` - Activate focused button (e.g., wallet connect)

**Modal Dialogs:**

- `Tab` - Navigate through modal elements (focus trapped within modal)
- `Shift+Tab` - Navigate backwards through modal elements
- `Escape` - Close modal and return focus to trigger element
- `Enter` - Activate focused button

### Focus Management

**Focus Trap:**
All modal dialogs implement focus trapping using the `useFocusTrap` hook:

- Focus is trapped within the modal while open
- Tab cycles through focusable elements
- Shift+Tab cycles backwards
- Focus returns to trigger element on close

**Focus Indicators:**
All interactive elements have visible focus indicators:

- Cyan glow ring for primary elements (`#00ffff`)
- 2px ring width with 2px offset
- Enhanced glow on buttons and primary actions
- Respects `prefers-reduced-motion` for animations

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut    | Action                                 | Scope             |
| ----------- | -------------------------------------- | ----------------- |
| `Tab`       | Navigate to next focusable element     | Global            |
| `Shift+Tab` | Navigate to previous focusable element | Global            |
| `Enter`     | Activate focused element               | Global            |
| `Space`     | Activate focused button/control        | Global            |
| `Escape`    | Close modal/dialog, pause game         | Context-dependent |

### Game-Specific Shortcuts

| Game   | Shortcut            | Action        |
| ------ | ------------------- | ------------- |
| Snake  | `↑ ↓ ← →` or `WASD` | Move          |
| Snake  | `Space` or `Esc`    | Pause         |
| Tetris | `↑ ↓ ← →`           | Rotate/Move   |
| Tetris | `Space`             | Hard Drop     |
| Tetris | `Z` / `X`           | Rotate CCW/CW |
| Tetris | `P` or `Esc`        | Pause         |

## Accessibility Features

### WCAG 2.1 Compliance

**Level A:**

- ✅ SC 2.1.1 Keyboard - All functionality available via keyboard
- ✅ SC 2.1.2 No Keyboard Trap - Focus can always exit trapped areas (via Escape)
- ✅ SC 2.4.1 Bypass Blocks - Skip link provided
- ✅ SC 2.4.7 Focus Visible - All focused elements have visible indicators

**Level AA:**

- ✅ SC 2.4.7 Focus Visible - Enhanced focus indicators with neon glow

### Screen Reader Support

**Semantic HTML:**

- Proper landmark regions (`<main>`, `<nav>`, `<header>`, `<footer>`)
- ARIA labels on interactive elements
- Role attributes for custom components

**Skip Links:**

- Hidden until focused (`.sr-only-focusable`)
- First focusable element in document order
- Links to `#main-content` landmark

**Modal Dialogs:**

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` for title
- Proper focus management

## Testing Keyboard Navigation

### Manual Testing Checklist

**Basic Navigation:**

- [ ] Tab through all UI elements
- [ ] All focusable elements have visible focus
- [ ] Tab order is logical
- [ ] Skip link appears on first Tab
- [ ] Skip link jumps to main content

**Game Controls:**

- [ ] All documented keyboard controls work
- [ ] Controls hint is visible during gameplay
- [ ] Pause works via Escape/Space
- [ ] Game over screen is keyboard accessible

**Modal Dialogs:**

- [ ] Focus trapped within modal
- [ ] Tab cycles through elements
- [ ] Escape closes modal
- [ ] Focus returns to trigger element

**Focus Management:**

- [ ] Focus visible on all elements
- [ ] No focus traps (can always exit)
- [ ] Focus order is logical
- [ ] Focus indicators meet contrast requirements

### Automated Testing

Run E2E keyboard navigation tests:

```bash
pnpm test:e2e -- keyboard-navigation.spec.ts
```

Run accessibility audits:

```bash
pnpm --dir packages/frontend accessibility:audit
```

## Implementation Details

### Focus Trap Hook

Location: `packages/frontend/src/hooks/useFocusTrap.ts`

```tsx
const dialogRef = useRef<HTMLDivElement>(null);

useFocusTrap(dialogRef, isOpen, {
  autoFocus: true, // Auto-focus first element
  returnFocus: true, // Return focus on close
  initialFocus: '.primary-button', // Optional initial focus
});
```

### Skip Link Component

Location: `packages/frontend/src/components/ui/SkipLink`

```tsx
<SkipLink href="#main-content" />
```

### Game Keyboard Handling

Example from Snake game:

```tsx
// In useSnakeGame hook
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        changeDirection('UP');
        break;
      // ... other directions
      case ' ':
      case 'Escape':
        togglePause();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [changeDirection, togglePause]);
```

## Browser Support

Keyboard navigation is supported in all modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

**Planned Features:**

- [ ] Customizable keyboard shortcuts
- [ ] Keyboard shortcut help overlay (press `?` to show)
- [ ] Gamepad support for games
- [ ] Voice control integration
- [ ] Keyboard navigation training mode

## Resources

- [WAI-ARIA Authoring Practices - Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WCAG 2.1 - Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)
- [WebAIM - Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

---

**Last Updated:** January 25, 2026
**Maintained By:** x402Arcade Development Team
