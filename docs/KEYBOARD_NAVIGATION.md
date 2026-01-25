# Keyboard Navigation Guide

Comprehensive guide for implementing keyboard navigation in x402Arcade.
Ensures full accessibility compliance with WAI-ARIA keyboard interaction patterns.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Implementation Patterns](#implementation-patterns)
- [Available Hooks](#available-hooks)
- [Component Examples](#component-examples)
- [Testing](#testing)

## Overview

x402Arcade is fully navigable using only a keyboard. This guide documents:

1. **Global keyboard shortcuts** for the entire application
2. **Component-specific patterns** for interactive widgets
3. **Hooks and utilities** for implementing keyboard navigation
4. **Testing strategies** to ensure keyboard accessibility

## Design Principles

### 1. Focus Visibility

All interactive elements must have clear focus indicators:

```tsx
// Use design system focus rings
import { focusVisibleClasses } from '@/styles/tokens/accessibility';

<button className={focusVisibleClasses.default}>Click Me</button>;
```

### 2. Logical Tab Order

Tab order follows the visual reading order (top to bottom, left to right):

- Use semantic HTML elements in proper order
- Avoid `tabindex > 0` (disrupts natural tab order)
- Use `tabindex="-1"` for programmatic focus only
- Use `tabindex="0"` to add elements to tab order

### 3. Skip Navigation

Skip links allow users to bypass repetitive content:

```tsx
import { SkipLink } from '@/components/ui/SkipLink';

<SkipLink href="#main-content" />
<Header />
<main id="main-content">...</main>
```

### 4. Keyboard Shortcuts

- Use standard conventions (Arrow keys, Enter, Space, Escape)
- Don't override browser shortcuts (Ctrl+T, F5, etc.)
- Provide visual hints for non-obvious shortcuts
- Allow customization when possible

## Keyboard Shortcuts

### Global Shortcuts

| Key       | Action                             | Location                |
| --------- | ---------------------------------- | ----------------------- |
| Tab       | Move to next focusable element     | Everywhere              |
| Shift+Tab | Move to previous focusable element | Everywhere              |
| Enter     | Activate button or link            | Everywhere              |
| Space     | Activate button or toggle checkbox | Everywhere              |
| Escape    | Close modal/dialog/menu            | Overlays                |
| /         | Focus search input                 | Header (when available) |

### Navigation

| Key         | Action                                       |
| ----------- | -------------------------------------------- |
| Home        | Jump to first item in list                   |
| End         | Jump to last item in list                    |
| Arrow Up    | Navigate to previous item (vertical lists)   |
| Arrow Down  | Navigate to next item (vertical lists)       |
| Arrow Left  | Navigate to previous item (horizontal lists) |
| Arrow Right | Navigate to next item (horizontal lists)     |

### Game Controls

| Key        | Action               | Game                                       |
| ---------- | -------------------- | ------------------------------------------ |
| Arrow Keys | Move player          | Snake, Pong, Breakout, Space Invaders      |
| W/A/S/D    | Alternative movement | All games                                  |
| Space      | Shoot/Jump/Action    | Tetris (hard drop), Space Invaders (shoot) |
| P          | Pause game           | All games                                  |
| Escape     | Pause or quit game   | All games                                  |
| R          | Restart game         | All games (when game over)                 |

### Modals and Dialogs

| Key    | Action                             |
| ------ | ---------------------------------- |
| Tab    | Cycle through focusable elements   |
| Escape | Close modal                        |
| Enter  | Confirm action (on focused button) |

## Implementation Patterns

### Pattern 1: Focus Trap (Modals)

When a modal opens, trap focus inside it until it closes:

```tsx
import { useFocusTrap } from '@/hooks';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, isOpen, {
    autoFocus: true,
    returnFocus: true,
    initialFocus: '.primary-button', // Optional: focus specific element
  });

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <h2>Dialog Title</h2>
      <button onClick={onClose}>Cancel</button>
      <button className="primary-button">Confirm</button>
    </div>
  );
}
```

### Pattern 2: Roving Tab Index (Toolbars, Menubars)

Only one item in a widget is in the tab order. Arrow keys navigate between items:

```tsx
import { useRovingTabIndex } from '@/hooks';

function Toolbar({ items }) {
  const { getRovingProps, handleContainerKeyDown } = useRovingTabIndex({
    count: items.length,
    orientation: 'horizontal',
  });

  return (
    <div role="toolbar" onKeyDown={handleContainerKeyDown}>
      {items.map((item, index) => (
        <button key={item.id} {...getRovingProps(index)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

### Pattern 3: Keyboard Navigation (Lists, Grids)

Navigate through items using arrow keys, Home/End, and selection with Enter/Space:

```tsx
import { useKeyboardNavigation } from '@/hooks';

function GameList({ games }) {
  const { activeIndex, handleKeyDown, getItemProps } = useKeyboardNavigation({
    itemCount: games.length,
    orientation: 'vertical',
    wrap: true,
    onSelect: (index) => {
      navigateToGame(games[index]);
    },
  });

  return (
    <ul role="list" onKeyDown={handleKeyDown}>
      {games.map((game, index) => (
        <li key={game.id} {...getItemProps(index)}>
          <Link to={`/play/${game.id}`}>{game.name}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### Pattern 4: Grid Navigation

Navigate a 2D grid with arrow keys:

```tsx
const { activeIndex, handleKeyDown, getItemProps } = useKeyboardNavigation({
  itemCount: 12,
  orientation: 'both',
  columns: 3, // 3-column grid
  wrap: false,
});
```

## Available Hooks

### `useFocusTrap`

Traps focus within a container (for modals, dialogs).

**Options:**

- `autoFocus` - Auto-focus first element (default: true)
- `returnFocus` - Return focus on deactivate (default: true)
- `initialFocus` - Element to focus initially (selector or element)

**Example:**

```tsx
useFocusTrap(containerRef, isActive, {
  autoFocus: true,
  returnFocus: true,
  initialFocus: '.primary-button',
});
```

### `useRovingTabIndex`

Implements roving tabindex pattern (for toolbars, menubars).

**Options:**

- `count` - Number of items (required)
- `orientation` - 'horizontal' or 'vertical' (default: 'horizontal')
- `wrap` - Wrap at edges (default: true)
- `onFocusChange` - Callback when focus changes

**Returns:**

- `currentIndex` - Currently focused item
- `getRovingProps(index)` - Props for each item
- `handleContainerKeyDown` - Handler for container

**Example:**

```tsx
const { currentIndex, getRovingProps, handleContainerKeyDown } = useRovingTabIndex({
  count: items.length,
  orientation: 'horizontal',
  wrap: true,
});
```

### `useKeyboardNavigation`

Full keyboard navigation for lists and grids.

**Options:**

- `itemCount` - Number of items (required)
- `orientation` - 'vertical' | 'horizontal' | 'both' (default: 'vertical')
- `wrap` - Wrap at edges (default: false)
- `columns` - Number of columns for grid navigation
- `onSelect` - Callback when Enter/Space is pressed
- `onActiveIndexChange` - Callback when active index changes

**Returns:**

- `activeIndex` - Currently active item
- `setActiveIndex` - Set active index programmatically
- `handleKeyDown` - Keyboard event handler
- `getItemProps(index)` - Props for each item
- `focusActiveItem` - Focus the active item

**Example:**

```tsx
const { activeIndex, handleKeyDown, getItemProps } = useKeyboardNavigation({
  itemCount: items.length,
  orientation: 'vertical',
  wrap: true,
  onSelect: (index) => console.log('Selected:', index),
});
```

## Component Examples

### Game Lobby (Grid Navigation)

```tsx
function GameLobby() {
  const games = [
    { id: 'snake', name: 'Snake' },
    { id: 'tetris', name: 'Tetris' },
    // ... more games
  ];

  const { activeIndex, handleKeyDown, getItemProps } = useKeyboardNavigation({
    itemCount: games.length,
    orientation: 'both',
    columns: 3,
    wrap: false,
    onSelect: (index) => {
      navigate(`/play/${games[index].id}`);
    },
  });

  return (
    <div
      role="grid"
      aria-label="Available games"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-3 gap-4"
    >
      {games.map((game, index) => (
        <GameCard
          key={game.id}
          game={game}
          {...getItemProps(index)}
          aria-label={`Play ${game.name}`}
        />
      ))}
    </div>
  );
}
```

### Leaderboard (List Navigation)

```tsx
function Leaderboard() {
  const entries = useLeaderboardData();

  const { activeIndex, handleKeyDown, getItemProps } = useKeyboardNavigation({
    itemCount: entries.length,
    orientation: 'vertical',
    wrap: false,
  });

  return (
    <table role="table" aria-label="Leaderboard">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody onKeyDown={handleKeyDown}>
        {entries.map((entry, index) => (
          <tr key={entry.id} {...getItemProps(index)}>
            <td>{entry.rank}</td>
            <td>{entry.player}</td>
            <td>{entry.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Wallet Connection Dialog (Focus Trap)

```tsx
function WalletDialog({ isOpen, onClose }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen, {
    autoFocus: true,
    returnFocus: true,
  });

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title">
      <h2 id="wallet-dialog-title">Connect Wallet</h2>
      <p>Choose a wallet provider:</p>

      <div role="group" aria-label="Wallet providers">
        <button onClick={() => connect('metamask')}>MetaMask</button>
        <button onClick={() => connect('walletconnect')}>WalletConnect</button>
        <button onClick={() => connect('coinbase')}>Coinbase Wallet</button>
      </div>

      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
```

## Testing

### Manual Testing Checklist

Test all functionality using only keyboard:

- [ ] Tab through entire page in logical order
- [ ] All interactive elements are reachable
- [ ] Focus indicators are clearly visible
- [ ] Skip link works (jump to main content)
- [ ] Modals trap focus correctly
- [ ] Lists/grids navigable with arrow keys
- [ ] Games playable with keyboard
- [ ] No keyboard traps (can always move away)
- [ ] Escape key closes overlays

### Automated Testing

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Keyboard Navigation', () => {
  it('should focus first item on Tab', async () => {
    render(<GameList games={mockGames} />);

    await userEvent.tab();

    expect(screen.getByText(mockGames[0].name)).toHaveFocus();
  });

  it('should navigate with arrow keys', async () => {
    render(<GameList games={mockGames} />);

    await userEvent.tab(); // Focus first item
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByText(mockGames[1].name)).toHaveFocus();
  });

  it('should select with Enter key', async () => {
    const onSelect = vi.fn();
    render(<GameList games={mockGames} onSelect={onSelect} />);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(0);
  });
});
```

### Screen Reader Testing

Test with actual screen readers:

- **NVDA** (Windows, free)
- **JAWS** (Windows, commercial)
- **VoiceOver** (macOS/iOS, built-in)
- **TalkBack** (Android, built-in)

## Best Practices

1. **Use semantic HTML** - Prefer `<button>` over `<div role="button">`
2. **Provide ARIA labels** - For icon buttons and complex widgets
3. **Manage focus** - When content changes dynamically
4. **Test with real users** - People who rely on keyboard navigation
5. **Document shortcuts** - Provide a keyboard shortcuts help screen
6. **Be consistent** - Use standard patterns across the app
7. **Don't trap focus** - Except in modals/dialogs
8. **Visible focus** - Never `outline: none` without custom focus styles

## Resources

- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Keyboard Accessibility](https://webaim.org/articles/keyboard/)
- [Focus Management](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
