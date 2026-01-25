# ARIA Implementation Guide

Complete guide to ARIA (Accessible Rich Internet Applications) labels, live regions, and semantic markup in x402Arcade.

## Table of Contents

1. [Overview](#overview)
2. [ARIA Labels](#aria-labels)
3. [ARIA Live Regions](#aria-live-regions)
4. [Form Inputs](#form-inputs)
5. [Usage Examples](#usage-examples)
6. [Testing Guide](#testing-guide)

---

## Overview

This project implements comprehensive ARIA support following WCAG 2.1 Level AA guidelines:

- **ARIA labels** for all interactive elements
- **ARIA live regions** for dynamic content announcements
- **Proper form labeling** with aria-labelledby, aria-describedby, aria-invalid
- **Utility functions** for consistent label generation

### Standards Compliance

✅ **WCAG 2.1 SC 1.3.1** - Info and Relationships (Level A)
✅ **WCAG 2.1 SC 2.4.6** - Headings and Labels (Level AA)
✅ **WCAG 2.1 SC 4.1.2** - Name, Role, Value (Level A)
✅ **WCAG 2.1 SC 4.1.3** - Status Messages (Level AA)

---

## ARIA Labels

### Button Components

All buttons include descriptive `aria-label` attributes:

```tsx
// Icon-only buttons
<Button aria-label="Close modal">
  <CloseIcon />
</Button>

// Action buttons with context
<Button aria-label="Play Snake game">Play</Button>

// Toggle buttons
<Button aria-label={soundEnabled ? "Disable sound effects" : "Enable sound effects"}>
  {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
</Button>
```

### Navigation

Navigation elements include clear labels:

```tsx
<Button aria-label="Navigate to Leaderboard">
  Leaderboard
</Button>

<Link aria-label="Go to home page">
  <HomeIcon />
</Link>
```

### Utility Functions

Use the `ariaLabels` utility for consistent labeling:

```tsx
import {
  getCloseButtonLabel,
  getNavigationLabel,
  getActionButtonLabel,
  getGameControlLabel,
  getScoreLabel,
} from '@/utils/accessibility/ariaLabels';

// Close button
<Button aria-label={getCloseButtonLabel('settings modal')}>
  <CloseIcon />
</Button>

// Navigation
<Button aria-label={getNavigationLabel('Leaderboard')}>
  Leaderboard
</Button>

// Game controls
<Button aria-label={getGameControlLabel('pause')}>
  Pause
</Button>

// Score display
<div aria-label={getScoreLabel(1250, 'Current')}>
  Score: 1,250
</div>
```

---

## ARIA Live Regions

### LiveRegion Component

The `LiveRegion` component announces dynamic content changes to screen readers:

```tsx
import { LiveRegion } from '@/components/ui/LiveRegion';

// Score updates (polite announcements)
<LiveRegion
  message={`Score: ${score}`}
  politeness="polite"
/>

// Critical alerts (assertive announcements)
<LiveRegion
  message="Game Over!"
  politeness="assertive"
  role="alert"
/>

// High score achievement
<LiveRegion
  message="New high score!"
  politeness="assertive"
/>
```

### useLiveAnnouncer Hook

For programmatic announcements:

```tsx
import { useLiveAnnouncer } from '@/hooks/useLiveAnnouncer';

function GameScore() {
  const { announce, LiveRegionComponent } = useLiveAnnouncer();

  const handleScoreChange = (newScore: number) => {
    // Announce score changes
    announce(`Score increased to ${newScore}`, 'polite');
  };

  const handleHighScore = () => {
    // Announce achievements assertively
    announce('New high score!', {
      politeness: 'assertive',
      clearAfter: 3000, // Auto-clear after 3 seconds
    });
  };

  return (
    <div>
      <div>Score: {score}</div>
      {/* Must render the component */}
      <LiveRegionComponent />
    </div>
  );
}
```

### Politeness Levels

| Level       | When to Use                                            | Example                         |
| ----------- | ------------------------------------------------------ | ------------------------------- |
| `polite`    | Non-urgent updates that don't need immediate attention | Score changes, progress updates |
| `assertive` | Important updates that should be announced immediately | Game over, errors, achievements |
| `off`       | Disable announcements                                  | Silent mode, background updates |

### Use Cases

#### Score Updates During Gameplay

```tsx
// Snake Game example
const { announce, LiveRegionComponent } = useLiveAnnouncer();

useEffect(() => {
  // Announce score increases
  if (score > previousScore) {
    announce(`Score: ${score}`, 'polite');
  }
}, [score]);

// In render
<LiveRegionComponent />;
```

#### High Score Achievements

```tsx
// Announce when player beats high score
useEffect(() => {
  if (score > highScore) {
    announce('New high score!', {
      politeness: 'assertive',
      clearAfter: 3000,
    });
  }
}, [score, highScore]);
```

#### Leaderboard Position Changes

```tsx
// Announce rank changes
useEffect(() => {
  if (newRank < previousRank) {
    announce(`You moved up to rank ${newRank}!`, 'assertive');
  }
}, [newRank, previousRank]);
```

---

## Form Inputs

### Input Component

The `Input` component includes comprehensive ARIA support:

```tsx
// Basic input with label
<Input
  label="Email Address"
  id="email-input"
  type="email"
  required
  aria-required="true"
/>

// Input with error state
<Input
  label="Password"
  error={true}
  errorMessage="Password must be at least 8 characters"
  aria-invalid="true"
  aria-describedby="password-error"
/>

// Input with helper text
<Input
  label="Wallet Address"
  helperText="Enter your Ethereum wallet address"
  aria-describedby="wallet-helper"
/>
```

### ARIA Attributes for Forms

| Attribute          | Purpose                                      | Example                          |
| ------------------ | -------------------------------------------- | -------------------------------- |
| `aria-label`       | Labels for inputs without visible labels     | `aria-label="Search games"`      |
| `aria-labelledby`  | Associates input with visible label element  | `aria-labelledby="email-label"`  |
| `aria-describedby` | Links input to helper text or error messages | `aria-describedby="email-error"` |
| `aria-invalid`     | Indicates validation error                   | `aria-invalid="true"`            |
| `aria-required`    | Indicates required field                     | `aria-required="true"`           |

### Example: Complete Form

```tsx
<form>
  <Input
    id="username"
    label="Username"
    aria-label="Enter your username"
    aria-required="true"
    required
    helperText="Must be 3-20 characters"
  />

  <Input
    id="email"
    label="Email"
    type="email"
    aria-label="Enter your email address"
    aria-required="true"
    aria-invalid={emailError}
    error={emailError}
    errorMessage="Please enter a valid email address"
    required
  />

  <Button type="submit" aria-label="Submit registration form">
    Register
  </Button>
</form>
```

---

## Usage Examples

### Game Over Screen

```tsx
function GameOver({ score, highScore }) {
  const { announce, LiveRegionComponent } = useLiveAnnouncer();

  useEffect(() => {
    // Announce game over
    announce('Game Over!', 'assertive');

    // Announce score
    setTimeout(() => {
      announce(`Final score: ${score}`, 'polite');
    }, 1000);

    // Announce high score achievement
    if (score > highScore) {
      setTimeout(() => {
        announce('Congratulations! New high score!', 'assertive');
      }, 2000);
    }
  }, []);

  return (
    <div>
      <h2>Game Over</h2>
      <p aria-label={getScoreLabel(score, 'Final')}>Score: {score}</p>
      <Button aria-label={getGameControlLabel('play again')}>Play Again</Button>
      <LiveRegionComponent />
    </div>
  );
}
```

### Wallet Connection

```tsx
function ConnectButton() {
  const { announce } = useLiveAnnouncer();

  const handleConnect = async () => {
    announce('Connecting wallet...', 'polite');

    try {
      await connectWallet();
      announce('Wallet connected successfully', 'assertive');
    } catch (error) {
      announce(`Connection failed: ${error.message}`, 'assertive');
    }
  };

  return (
    <Button
      onClick={handleConnect}
      aria-label={isConnected ? getWalletLabel(address, true) : 'Connect wallet'}
    >
      {isConnected ? address : 'Connect'}
    </Button>
  );
}
```

### Leaderboard

```tsx
function LeaderboardEntry({ player, rank, total }) {
  return (
    <div
      role="listitem"
      aria-label={`${getRankLabel(rank, total)}: ${player.name} with ${player.score} points`}
    >
      <span>{rank}</span>
      <span>{player.name}</span>
      <span aria-label={getScoreLabel(player.score)}>{player.score}</span>
    </div>
  );
}
```

---

## Testing Guide

### Manual Testing

1. **Enable Screen Reader**
   - macOS: VoiceOver (Cmd + F5)
   - Windows: NVDA (free) or JAWS
   - Linux: Orca

2. **Test Button Labels**
   - Navigate to each button
   - Verify screen reader announces descriptive label
   - Icon-only buttons should have clear context

3. **Test Live Regions**
   - Trigger score changes
   - Verify announcements without navigating
   - Check politeness levels don't interrupt

4. **Test Form Labels**
   - Navigate through form inputs
   - Verify labels are announced
   - Check error messages are read
   - Confirm required field indicators

### Automated Testing

```tsx
// Test ARIA labels
it('should have descriptive aria-label', () => {
  render(
    <Button aria-label="Close settings modal">
      <CloseIcon />
    </Button>
  );

  const button = screen.getByLabelText('Close settings modal');
  expect(button).toBeInTheDocument();
});

// Test live regions
it('should announce score updates', () => {
  const { rerender } = render(<LiveRegion message="Score: 100" />);

  const region = screen.getByRole('status');
  expect(region).toHaveTextContent('Score: 100');

  rerender(<LiveRegion message="Score: 200" />);
  expect(region).toHaveTextContent('Score: 200');
});

// Test form labels
it('should associate label with input', () => {
  render(<Input label="Email" id="email-input" />);

  const input = screen.getByLabelText('Email');
  expect(input).toBeInTheDocument();
  expect(input).toHaveAttribute('id', 'email-input');
});
```

### Browser DevTools

1. **Chrome DevTools Accessibility Tree**
   - Open DevTools → Elements tab
   - Click "Accessibility" pane
   - Verify ARIA attributes are present

2. **Lighthouse Accessibility Audit**
   - Run Lighthouse audit
   - Check for ARIA best practices violations
   - Ensure all interactive elements have labels

---

## Best Practices

1. **Always provide ARIA labels for icon-only buttons**
2. **Use live regions for dynamic content that affects user context**
3. **Don't overuse assertive announcements** - reserve for critical alerts
4. **Test with actual screen readers** - automated tools catch only 30-40% of issues
5. **Keep labels concise** - screen reader users scan quickly
6. **Use utility functions** for consistent label formatting
7. **Clear live region announcements** when content becomes stale

---

## Resources

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
