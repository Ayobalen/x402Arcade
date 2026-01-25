# Responsive Images Guide

This document covers the responsive image implementation for x402Arcade, including the `ResponsiveImage` component, lazy loading, and font optimization.

## Overview

The x402Arcade uses optimized image loading strategies to ensure fast page loads and minimal layout shift:

1. **Responsive Images with srcset** - Serve appropriately sized images for each device
2. **Lazy Loading** - Defer off-screen images until needed
3. **Format Negotiation** - Serve WebP/AVIF when supported
4. **Font Optimization** - Preload critical fonts with font-display: swap

## ResponsiveImage Component

The `ResponsiveImage` component automatically generates srcset and sizes attributes for optimal performance.

### Basic Usage

```tsx
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

// Basic responsive image
<ResponsiveImage src="/images/game-card" alt="Snake Game" width={400} height={300} />;
```

### Using Presets

The component includes presets for common use cases:

```tsx
// Game thumbnail preset
<ResponsiveImage
  src="/images/snake-thumbnail"
  alt="Snake Game"
  width={400}
  height={300}
  preset="game-thumbnail"
/>

// Hero image preset
<ResponsiveImage
  src="/images/hero-banner"
  alt="Welcome to x402Arcade"
  width={1536}
  height={600}
  preset="hero"
  priority // Eager load for above-the-fold
/>

// Avatar preset
<ResponsiveImage
  src="/images/player-avatar"
  alt="Player Avatar"
  width={96}
  height={96}
  preset="avatar"
/>
```

### Available Presets

| Preset           | Breakpoints                       | Use Case             |
| ---------------- | --------------------------------- | -------------------- |
| `thumbnail`      | 150px → 200px → 250px             | Small thumbnails     |
| `card`           | 320px → 400px → 500px             | Game cards           |
| `hero`           | 640px → 1024px → 1536px           | Hero banners         |
| `full-width`     | Viewport width at each breakpoint | Full-width images    |
| `game-thumbnail` | 200px → 280px → 320px → 400px     | Game selection cards |
| `avatar`         | 48px → 64px → 96px                | User avatars         |

### Priority Loading

For above-the-fold images, use the `priority` prop:

```tsx
<ResponsiveImage
  src="/images/hero"
  alt="Hero"
  width={1536}
  height={600}
  priority // Sets loading="eager" and fetchPriority="high"
/>
```

### Custom Breakpoints

```tsx
<ResponsiveImage
  src="/images/custom"
  alt="Custom sizing"
  width={800}
  height={600}
  breakpoints={[
    { width: 480, imageWidth: 300 },
    { width: 768, imageWidth: 500 },
    { width: Infinity, imageWidth: 800 },
  ]}
/>
```

### Custom srcset Generator

For CDN URLs or custom image paths:

```tsx
<ResponsiveImage
  src="/images/game"
  alt="Game"
  width={800}
  height={600}
  srcsetGenerator={(src, width) => `https://cdn.example.com${src}?w=${width}&format=webp`}
/>
```

## OptimizedImage Component

The base `OptimizedImage` component handles format negotiation:

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src="/images/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  webp={true} // Include WebP source (default)
  avif={false} // Include AVIF source
/>;
```

## Lazy Loading

All images use lazy loading by default:

```tsx
// Lazy loading is default
<OptimizedImage src="/images/photo.jpg" alt="Photo" />

// Explicit lazy loading
<OptimizedImage src="/images/photo.jpg" alt="Photo" loading="lazy" />

// Eager loading for above-the-fold
<OptimizedImage src="/images/hero.jpg" alt="Hero" loading="eager" fetchPriority="high" />
```

### When to Use Eager Loading

- Hero images
- First visible image on the page
- Images in the viewport on initial load
- Critical path images

### When to Use Lazy Loading (Default)

- Below-the-fold images
- Images in carousels/sliders
- Gallery images
- Game thumbnails not initially visible

## Font Optimization

Fonts are optimized with:

1. **Preconnect** - Connect to Google Fonts early
2. **Preload** - Load critical fonts immediately
3. **font-display: swap** - Show text immediately with fallback

### Configuration in index.html

```html
<!-- Preconnect to Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload critical fonts -->
<link
  rel="preload"
  href="https://fonts.gstatic.com/s/inter/..."
  as="font"
  type="font/woff2"
  crossorigin
/>
```

### CSS Configuration

```css
@font-face {
  font-family: 'Inter';
  font-display: swap; /* Show fallback font immediately */
  src: local('Inter');
}
```

### Font Loading Strategy

| Font           | Weights Loaded     | Usage                  |
| -------------- | ------------------ | ---------------------- |
| Inter          | 400, 500, 600, 700 | Body text              |
| Orbitron       | 400, 600, 700, 800 | Display headings       |
| JetBrains Mono | 400, 500           | Code, wallet addresses |

Only the weights actually used are loaded to minimize download size.

## Performance Best Practices

### Do's

1. **Always provide width and height** - Prevents layout shift
2. **Use presets** - Consistent, optimized breakpoints
3. **Use priority for above-fold** - Faster LCP
4. **Use meaningful alt text** - Accessibility

### Don'ts

1. **Don't lazy load above-fold images** - Hurts LCP
2. **Don't skip width/height** - Causes CLS
3. **Don't load unnecessary font weights** - Increases download

## Measuring Performance

### Lighthouse Metrics

- **LCP (Largest Contentful Paint)** - Hero images should use `priority`
- **CLS (Cumulative Layout Shift)** - Always provide width/height
- **Total Blocking Time** - Use async font loading

### Browser DevTools

1. Open Network tab
2. Filter by "Img" or "Font"
3. Check response sizes and timings
4. Verify lazy loading with scroll

## API Reference

### ResponsiveImageProps

| Prop                  | Type                     | Default                           | Description                   |
| --------------------- | ------------------------ | --------------------------------- | ----------------------------- |
| `src`                 | string                   | required                          | Base image URL                |
| `alt`                 | string                   | required                          | Alt text for accessibility    |
| `width`               | number                   | required                          | Intrinsic width               |
| `height`              | number                   | required                          | Intrinsic height              |
| `widths`              | number[]                 | [320, 640, 768, 1024, 1280, 1536] | Widths for srcset             |
| `sizes`               | string                   | auto                              | Sizes attribute               |
| `preset`              | BreakpointPreset         | -                                 | Preset configuration          |
| `priority`            | boolean                  | false                             | Eager load with high priority |
| `breakpoints`         | ImageBreakpoint[]        | -                                 | Custom breakpoints            |
| `format`              | 'jpg' \| 'png' \| 'webp' | 'jpg'                             | Image format                  |
| `srcsetGenerator`     | function                 | -                                 | Custom URL generator          |
| `aspectRatio`         | string                   | -                                 | CSS aspect-ratio              |
| `preserveAspectRatio` | boolean                  | true                              | Apply aspect ratio            |

### OptimizedImageProps

| Prop            | Type                        | Default  | Description         |
| --------------- | --------------------------- | -------- | ------------------- |
| `src`           | string                      | required | Image URL           |
| `alt`           | string                      | required | Alt text            |
| `loading`       | 'lazy' \| 'eager'           | 'lazy'   | Loading strategy    |
| `webp`          | boolean                     | true     | Include WebP source |
| `avif`          | boolean                     | false    | Include AVIF source |
| `fetchPriority` | 'high' \| 'low' \| 'auto'   | 'auto'   | Fetch priority      |
| `decoding`      | 'sync' \| 'async' \| 'auto' | 'async'  | Decoding hint       |
