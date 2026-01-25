# Design Tokens Documentation

This directory contains all design tokens for the x402Arcade project. Design tokens are the single source of truth for visual design decisions, ensuring consistency across the application.

## Table of Contents

- [Colors](#colors)
- [Typography](#typography)
- [Spacing](#spacing)
- [Borders](#borders)
- [Shadows](#shadows)
- [Animations](#animations)
- [Layout](#layout)
- [Opacity](#opacity)
- [Z-Index](#z-index)
- [Focus States](#focus-states)

---

## Colors

**File:** `colors.ts`

Defines the complete color palette for the retro arcade aesthetic.

### Categories

- **Backgrounds**: Primary backgrounds for the app (`#0a0a0a`, `#1a1a2e`, etc.)
- **Surfaces**: Card and panel backgrounds with depth
- **Primary (Cyan)**: Main accent color with 50-900 scale
- **Secondary (Magenta)**: Secondary accent color with 50-900 scale
- **Semantic**: Success (green), warning (orange), error (red), info (blue)
- **Text**: Primary, secondary, tertiary, muted, disabled states
- **Borders**: Default, subtle, focus states
- **Accents**: Direct neon colors (cyan, magenta)

### Usage

```tsx
// Background
<div className="bg-bg-primary">...</div>

// Accent colors
<button className="bg-primary text-white hover:bg-primary-600">Click Me</button>

// Semantic colors
<div className="text-success">Success!</div>
<div className="text-error">Error!</div>

// Text hierarchy
<h1 className="text-text-primary">Heading</h1>
<p className="text-text-secondary">Body text</p>
```

---

## Typography

**File:** `typography.ts`

Defines font families, sizes, weights, line heights, and letter spacing.

### Font Families

- **Display**: `'Orbitron'` - Retro arcade headings
- **Body**: `'Inter'` - Clean, readable body text
- **Code/Mono**: `'JetBrains Mono'` - Code, addresses, IDs

### Font Sizes

Rem-based scale from `xs` (0.75rem) to `9xl` (8rem).

### Usage

```tsx
// Headings
<h1 className="font-display text-5xl font-bold">x402Arcade</h1>

// Body text
<p className="font-body text-base">Insert a penny, play for glory</p>

// Wallet addresses
<code className="font-mono text-sm">0x1234...5678</code>
```

---

## Spacing

**File:** `spacing.ts`

Consistent spacing scale using 4px base unit (0.25rem).

### Scale

- **0.5**: 0.125rem (2px)
- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **12**: 3rem (48px)
- **16**: 4rem (64px)
- ...up to **96**: 24rem (384px)

### Usage

```tsx
// Padding
<div className="p-4">16px padding</div>
<div className="px-6 py-3">24px horizontal, 12px vertical</div>

// Margin
<div className="mt-8 mb-4">32px top, 16px bottom</div>

// Gap (flexbox/grid)
<div className="flex gap-2">8px gap between children</div>
```

---

## Borders

**File:** `borders.ts`

Border radius and width tokens for consistent component styling.

### Border Radius

- **none**: 0
- **xs**: 0.125rem (2px)
- **sm**: 0.25rem (4px)
- **DEFAULT**: 0.375rem (6px)
- **md**: 0.5rem (8px)
- **lg**: 0.75rem (12px)
- **xl**: 1rem (16px)
- **2xl**: 1.5rem (24px)
- **3xl**: 2rem (32px)
- **full**: 9999px (circle/pill)

### Border Width

- **0**: 0
- **DEFAULT**: 1px
- **2**: 2px
- **4**: 4px
- **8**: 8px

### Usage

```tsx
// Rounded corners
<div className="rounded-lg border">Card</div>
<button className="rounded-xl">Button</button>

// Pill/circle
<div className="rounded-full">Avatar</div>

// Thick borders
<div className="border-4 border-primary">Emphasized</div>
```

---

## Shadows

**File:** `shadows.ts`

Elevation shadows, neon glow effects, and combined shadows.

### Categories

- **Elevation**: Standard depth shadows (xs, sm, md, lg, xl, 2xl)
- **Glow**: Neon glow effects (cyan, magenta, green, orange, red, white, rainbow)
- **Combined**: Purpose-specific shadows (card-hover, button-hover, modal, focus-ring, crt-glow, neon-border)

### Usage

```tsx
// Elevation
<div className="shadow-lg">Card with depth</div>

// Glow effects
<button className="shadow-glow-cyan hover:shadow-glow-cyan-intense">
  Neon Button
</button>

// Combined effects
<div className="shadow-card-hover">Hover card</div>
<button className="shadow-button-hover active:shadow-button-active">
  Interactive button
</button>
```

---

## Animations

**File:** `animations.ts`

Duration, easing, and keyframe definitions for smooth animations.

### Durations

- **instant**: 0ms
- **ultraFast**: 50ms
- **fastest**: 75ms
- **fast**: 100ms
- **quick**: 150ms
- **normal**: 200ms (default)
- **moderate**: 300ms
- **slow**: 500ms
- **slower**: 700ms
- **slowest**: 1000ms
- **languid**: 1500ms
- **glacial**: 2000ms
- **eternal**: 3000ms

### Easings

- **linear**, **ease**, **ease-in**, **ease-out**, **ease-in-out**
- **cubic-in**, **cubic-out**, **cubic-in-out**
- **quart-out**, **expo-out**
- **back-out**, **back-in-out**
- **bounce-out**
- **spring**, **elastic**

### Animations

- **glow-pulse**: Pulsing glow effect (2s infinite)
- **neon-flicker**: Retro flicker effect (2s infinite)
- **fade-in**, **fade-out**: Opacity transitions
- **slide-in-up**, **slide-in-down**: Slide animations
- **scale-in**: Scale up entrance
- **score-pop**: Score increment animation

### Usage

```tsx
// Transitions
<button className="transition-all duration-moderate ease-out hover:scale-105">
  Smooth button
</button>

// Animations
<div className="animate-glow-pulse">Pulsing glow</div>
<div className="animate-fade-in">Fade in on mount</div>
<div className="animate-score-pop">Score!</div>
```

---

## Layout

**File:** `layout.ts` ✨ **NEW**

Container widths, aspect ratios, and layout constraints.

### Container Widths

```tsx
// Max width constraints
<div className="max-w-xs">320px max</div>
<div className="max-w-lg">512px max</div>
<div className="max-w-5xl">1024px max</div>

// Prose (readable text)
<article className="max-w-prose">Optimal reading width (65ch)</article>
```

### Aspect Ratios

```tsx
// Fixed aspect ratios
<div className="aspect-square">1:1 (profile images)</div>
<div className="aspect-video">16:9 (videos)</div>
<div className="aspect-landscape">4:3 (arcade screens)</div>
<div className="aspect-golden">1.618:1 (aesthetic)</div>
```

### Min Heights

```tsx
// Viewport heights
<section className="min-h-screen">Full viewport</section>
<div className="min-h-screen-half">50vh</div>
<div className="min-h-screen-dynamic">100dvh (mobile-safe)</div>
```

---

## Opacity

**File:** `opacity.ts` ✨ **NEW**

Opacity scale and semantic opacity values.

### Opacity Scale

Full 0-100 scale in 5% increments:

```tsx
// Numeric opacity
<div className="opacity-0">Invisible</div>
<div className="opacity-50">Half transparent</div>
<div className="opacity-100">Fully opaque</div>
```

### Semantic Opacity

Named opacity values for better meaning:

- **invisible**: 0%
- **ghost**: 5%
- **whisper**: 10%
- **faint**: 20%
- **disabled**: 40%
- **muted**: 50%
- **dimmed**: 60%
- **visible**: 80%
- **active**: 90%
- **solid**: 100%

### Overlays

- **subtle**: 30%
- **light**: 50%
- **medium**: 60%
- **dark**: 75%
- **heavy**: 90%
- **solid**: 100%

### Glow Effects

- **subtle**: 10%
- **soft**: 20%
- **medium**: 30%
- **bright**: 50%
- **intense**: 70%
- **maximum**: 100%

### Usage

```tsx
// States
<button disabled className="opacity-disabled">Disabled</button>
<div className="opacity-muted">Muted content</div>

// Overlays
<div className="bg-black opacity-overlay-medium">Modal backdrop</div>

// Effects
<div className="shadow-glow-cyan opacity-glow-bright">Bright glow</div>
```

---

## Z-Index

**File:** `zIndex.ts`

Layering system for stacking contexts.

### Layers

- **auto**: auto
- **base**: 0
- **raised**: 10
- **dropdown**: 1000
- **sticky**: 1100
- **fixed**: 1200
- **modal-backdrop**: 1300
- **modal**: 1400
- **popover**: 1500
- **tooltip**: 1600
- **toast**: 1700
- **debug**: 9999

### Usage

```tsx
// Sticky header
<header className="sticky top-0 z-sticky">Header</header>

// Modal
<div className="z-modal-backdrop">Backdrop</div>
<div className="z-modal">Modal content</div>

// Tooltips
<div className="z-tooltip">Tooltip</div>
```

---

## Focus States

**File:** `focus.ts`

Accessible focus ring utilities for keyboard navigation.

### Usage

```tsx
// Primary focus ring (cyan)
<button className="focus-ring">Button</button>

// Secondary focus ring (magenta)
<input className="focus-ring-secondary" />

// Offset focus ring (for buttons with backgrounds)
<button className="focus-ring-offset">Button with offset ring</button>
```

---

## Best Practices

### 1. Use Tokens, Not Raw Values

❌ **Don't:**

```tsx
<div className="p-[16px] bg-[#00ffff] text-[14px]">Bad</div>
```

✅ **Do:**

```tsx
<div className="p-4 bg-primary text-sm">Good</div>
```

### 2. Semantic Over Numeric

❌ **Don't:**

```tsx
<div className="opacity-40 text-text-secondary">Disabled</div>
```

✅ **Do:**

```tsx
<div className="opacity-disabled text-text-disabled">Disabled</div>
```

### 3. Consistent Spacing

Use the 4px base unit spacing scale consistently:

```tsx
// Good spacing rhythm
<div className="p-4 space-y-4">
  <div className="mb-2">...</div>
  <div className="mb-2">...</div>
</div>
```

### 4. Design System Alignment

Always use the retro arcade aesthetic:

- Dark backgrounds (#0a0a0a, #1a1a2e)
- Neon accents (cyan, magenta)
- Glow effects for interactivity
- Orbitron for headings
- Smooth animations (200-300ms)

---

## Token Testing

All token files include unit tests in `__tests__/` directory:

- `colors.test.ts` - Color palette validation
- `typography.test.ts` - Font and text scale
- `spacing.test.ts` - Spacing scale integrity
- `animations.test.ts` - Duration and easing
- (Add tests for new tokens as needed)

Run tests:

```bash
npm test -- tokens
```

---

## Contributing

When adding new tokens:

1. **Create the token file** in `src/styles/tokens/`
2. **Export const objects** with TypeScript typing
3. **Update tailwind.config.ts** to include new tokens
4. **Add documentation** to this README
5. **Write unit tests** in `__tests__/`
6. **Use semantic naming** that describes purpose, not value

---

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design Tokens W3C Spec](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
