# Image Alt Text Guidelines

## Overview

This document provides guidelines for adding alt text to images in the x402 Arcade application. Proper alt text ensures that screen reader users can understand the content and purpose of images.

## Current Status

**Audit Date:** January 25, 2026
**Images Found:** 0 `<img>` tags in application code
**Status:** ✅ No accessibility violations

### Image Inventory

Currently, the application uses:

- **SVG Icons** via `lucide-react` library (automatically accessible with proper ARIA labels)
- **Canvas Elements** for game rendering (accessibility handled via ARIA roles and live regions)
- **CSS Background Images** for decorative elements (no alt text needed)

No traditional `<img>` elements are currently in use.

## Alt Text Guidelines

When adding images to the application, follow these guidelines:

### 1. Descriptive Alt Text for Meaningful Images

**Purpose:** Images that convey information or content

**Examples:**

```tsx
// Game thumbnails
<img
  src="/games/snake-thumbnail.png"
  alt="Snake game - Guide a growing snake to eat food and avoid walls"
/>

// Achievement badges
<img
  src="/badges/high-scorer.png"
  alt="High Scorer achievement badge - Gold trophy with 1000+ score"
/>

// NFT/Collectible images
<img
  src="/nft/cyber-snake-001.png"
  alt="Cyber Snake NFT #001 - Neon green snake with digital circuit patterns"
/>

// Avatar images
<img
  src={player.avatar}
  alt={`${player.username}'s avatar`}
/>

// Wallet provider logos
<img
  src="/wallets/metamask-logo.png"
  alt="MetaMask wallet"
/>
```

### 2. Empty Alt Text for Decorative Images

**Purpose:** Images that are purely decorative and don't convey meaningful content

**Examples:**

```tsx
// Decorative background patterns
<img src="/patterns/grid-bg.png" alt="" />

// Decorative icons next to text that already describes them
<div>
  <img src="/icons/star.png" alt="" />
  <span>Featured Game</span> {/* Text already describes the content */}
</div>

// Purely aesthetic elements
<img src="/decorations/neon-glow.png" alt="" />
```

**Rule:** Use `alt=""` (empty string, not omitted) for decorative images so screen readers skip them.

### 3. Context-Dependent Alt Text

**Purpose:** Alt text that varies based on context and user state

**Examples:**

```tsx
// Game state images
<img
  src="/ui/play-button.png"
  alt={isGamePaused ? "Resume game" : "Start new game"}
/>

// Dynamic achievement images
<img
  src={achievement.image}
  alt={`${achievement.name} - ${achievement.description}`}
/>

// User-generated content
<img
  src={userImage}
  alt={userDescription || "User uploaded image"}
/>
```

### 4. Icon Alt Text

**Note:** We use `lucide-react` for icons, which are SVG-based. Use ARIA labels instead of alt text.

**Examples:**

```tsx
import { Wallet, Trophy, Settings } from 'lucide-react';

// Standalone icon buttons (use aria-label)
<button aria-label="Open wallet">
  <Wallet />
</button>

<button aria-label="View achievements">
  <Trophy />
</button>

// Icons with visible text (use aria-hidden to hide from screen readers)
<button>
  <Settings aria-hidden="true" />
  <span>Settings</span>
</button>
```

### 5. Complex Images Requiring Long Descriptions

**Purpose:** Images that need more explanation than alt text can provide

**Examples:**

```tsx
// Leaderboard chart
<img
  src="/charts/leaderboard-weekly.png"
  alt="Weekly leaderboard chart showing top 10 players"
  aria-describedby="leaderboard-description"
/>
<div id="leaderboard-description" className="sr-only">
  Detailed breakdown: 1st place: Player123 with 5,000 points.
  2nd place: GamerX with 4,500 points. 3rd place: SnakeKing with 4,200 points...
</div>

// Game state visualization
<img
  src="/stats/game-progress.png"
  alt="Game progress statistics"
  aria-describedby="stats-detail"
/>
<div id="stats-detail" className="sr-only">
  You have completed 25 games with an average score of 1,200 points.
  Your best game was 3,500 points on January 20th.
</div>
```

## Best Practices

### ✅ DO:

- **Be specific:** "Snake game thumbnail showing a green snake on a grid" vs. "Game image"
- **Include relevant details:** Describe what makes the image meaningful in context
- **Keep it concise:** Aim for 125 characters or less for alt text
- **Use `aria-describedby` for longer descriptions:** When more detail is needed
- **Test with screen readers:** Verify that alt text makes sense when read aloud
- **Update alt text when content changes:** If image meaning changes, update the alt text

### ❌ DON'T:

- **Don't start with "Image of" or "Picture of":** Screen readers already announce it's an image
- **Don't repeat information:** If adjacent text describes the image, use `alt=""`
- **Don't use overly technical descriptions:** Unless technical accuracy is required
- **Don't describe decorative styling:** "Image with a blue border and drop shadow" - focus on content
- **Don't leave alt attribute empty for meaningful images:** Use descriptive text
- **Don't omit alt attribute entirely:** Always include `alt`, even if it's `alt=""`

## Testing Alt Text

### Manual Testing

1. **Screen Reader Testing:**
   - macOS: VoiceOver (Cmd + F5)
   - Windows: NVDA or JAWS
   - Navigate through images and verify announcements

2. **Developer Tools:**
   - Chrome DevTools > Accessibility panel
   - Check computed ARIA properties
   - Verify alt text is present and meaningful

3. **Browser Extensions:**
   - [axe DevTools](https://www.deque.com/axe/devtools/)
   - [WAVE](https://wave.webaim.org/extension/)

### Automated Testing

```tsx
// Test that images have alt text
it('should have alt text for game thumbnail', () => {
  render(<GameThumbnail game="snake" />);
  const img = screen.getByRole('img');
  expect(img).toHaveAttribute('alt');
  expect(img.getAttribute('alt')).not.toBe('');
});

// Test that decorative images have empty alt
it('should have empty alt for decorative background', () => {
  render(<DecorativeBackground />);
  const img = screen.getByRole('img', { hidden: true });
  expect(img).toHaveAttribute('alt', '');
});
```

## WCAG Success Criteria

### ✅ 1.1.1 Non-text Content (Level A)

All non-text content (images) must have text alternatives that serve the equivalent purpose.

**Compliance Status:**

- Canvas elements: ✅ Accessible via `role="img"` and `aria-label`
- SVG icons: ✅ Accessible via ARIA labels
- Future images: ⚠️ Must follow guidelines above

### ✅ 1.4.5 Images of Text (Level AA)

Avoid using images of text. Use actual text with CSS styling instead.

**Compliance Status:** ✅ All text is HTML/CSS, no images of text

## Implementation Checklist

When adding new images to the application:

- [ ] Determine if image is meaningful or decorative
- [ ] Add appropriate alt text (descriptive or empty)
- [ ] Test with screen reader
- [ ] Verify in accessibility tools
- [ ] Add automated test for alt text
- [ ] Document in this file if it's a new category of image

## Resources

- [WebAIM: Alternative Text](https://webaim.org/techniques/alttext/)
- [W3C Alt Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)
- [WCAG 1.1.1 Understanding](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
- [Image Alt Text Best Practices](https://axesslab.com/alt-texts/)

## Maintenance

**Review Frequency:** Quarterly
**Next Review:** April 25, 2026
**Responsible Team:** Accessibility Team

When new image types are added to the application, update this document with:

1. Category of the new image type
2. Example alt text for that category
3. Any special considerations
4. Test examples

---

**Last Updated:** January 25, 2026
**Status:** All current visual elements have appropriate accessibility implementations
