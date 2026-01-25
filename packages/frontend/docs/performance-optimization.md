# Performance Optimization Guide

This document describes the performance optimization strategies implemented in the x402 Arcade frontend.

## Table of Contents

1. [Tree Shaking](#tree-shaking)
2. [Image Optimization](#image-optimization)
3. [WebP Conversion](#webp-conversion)
4. [Bundle Analysis](#bundle-analysis)
5. [Best Practices](#best-practices)

---

## Tree Shaking

Tree shaking eliminates unused code from the final bundle. Vite uses Rollup for production builds, which performs tree shaking automatically for ES modules.

### Configuration

#### Package.json sideEffects

We've configured the `sideEffects` field to help bundlers identify side-effect-free modules:

```json
// packages/frontend/package.json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "src/index.css",
    "src/styles/**/*.css"
  ]
}

// packages/shared/package.json
{
  "sideEffects": false
}
```

**What this means:**

- `false` = All exports are pure (no side effects), safe to tree shake
- `["*.css"]` = CSS files have side effects (they modify global styles)
- Everything else can be safely removed if not imported

#### Vite Configuration

The Vite config is already optimized for tree shaking:

```typescript
// vite.config.ts
{
  build: {
    target: 'esnext',  // Modern browsers = smaller bundles
    rollupOptions: {
      output: {
        manualChunks: { ... }  // Strategic chunk splitting
      }
    }
  }
}
```

### Import Patterns for Maximum Tree Shaking

**Good (tree-shakeable):**

```typescript
// Named imports - only the used exports are bundled
import { Button, Card } from '@/components/ui';
import { Play, Wallet } from 'lucide-react';
```

**Bad (not tree-shakeable):**

```typescript
// Namespace imports include everything
import * as UI from '@/components/ui'; // Avoid unless necessary
import * as Icons from 'lucide-react'; // Includes ALL icons
```

**Exception:** `import * as THREE from 'three'` is acceptable because:

1. Three.js is already in its own chunk
2. 3D components typically need most of Three.js
3. The bundle is lazy-loaded only when 3D features are used

### Verifying Tree Shaking

Run a build with analysis:

```bash
pnpm --dir packages/frontend build:analyze
```

This opens an interactive treemap showing:

- Which modules are included in the bundle
- Gzip and Brotli sizes
- Where to optimize

### Libraries Using Named Imports

| Library       | Import Pattern   | Tree-Shakeable       |
| ------------- | ---------------- | -------------------- |
| lucide-react  | Named imports    | Yes                  |
| framer-motion | Named imports    | Yes                  |
| zustand       | Named imports    | Yes                  |
| viem          | Named imports    | Yes                  |
| three         | Namespace import | N/A (separate chunk) |

---

## Image Optimization

Images should be optimized before committing to reduce bundle size and improve load times.

### Build-Time Optimization

The Vite config handles images automatically:

```typescript
// vite.config.ts
{
  build: {
    assetsInlineLimit: 4096,  // Inline images < 4KB as base64
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp|ico)$/)) {
            return 'images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
}
```

### Optimization Script

Use the provided optimization script to compress images:

```bash
# From packages/frontend directory
pnpm run optimize:images
```

This script:

1. Finds all images in `src/assets/images/`
2. Compresses PNG/JPEG/WebP with sharp
3. Optimizes SVGs with SVGO
4. Generates WebP versions of raster images
5. Reports file size savings

### Manual Optimization Tools

For one-off optimization:

| Tool             | Use Case               | Link                                    |
| ---------------- | ---------------------- | --------------------------------------- |
| Squoosh          | Best visual comparison | https://squoosh.app                     |
| TinyPNG          | Quick compression      | https://tinypng.com                     |
| SVGOMG           | SVG optimization       | https://jakearchibald.github.io/svgomg/ |
| ImageOptim (Mac) | Batch processing       | https://imageoptim.com                  |

### Image Guidelines

| Format | Use Case                      | Max Size |
| ------ | ----------------------------- | -------- |
| SVG    | Icons, logos, simple graphics | 10KB     |
| WebP   | Photos, complex images        | 100KB    |
| PNG    | Images needing transparency   | 50KB     |
| JPEG   | Legacy fallback only          | 100KB    |

---

## WebP Conversion

WebP provides 25-35% smaller file sizes compared to JPEG/PNG with similar quality.

### OptimizedImage Component

Use the `OptimizedImage` component for automatic WebP with fallbacks:

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage'

// Basic usage
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
/>

// With responsive sizes
<OptimizedImage
  src="/images/card.png"
  alt="Game card"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
  loading="lazy"
/>
```

The component automatically:

1. Renders a `<picture>` element
2. Includes WebP source for modern browsers
3. Falls back to original format
4. Supports lazy loading
5. Maintains aspect ratio to prevent layout shift

### WebP Generation

Generate WebP versions during development:

```bash
# Convert all images to WebP
pnpm run images:webp

# Convert specific directory
pnpm run images:webp -- --dir=src/assets/sprites
```

### Browser Support

WebP is supported by all modern browsers:

- Chrome 23+ (2012)
- Firefox 65+ (2019)
- Safari 14+ (2020)
- Edge 18+ (2018)

For legacy browsers, the `<picture>` element falls back to PNG/JPEG.

### Directory Structure

```
src/assets/images/
├── hero.jpg           # Original
├── hero.webp          # WebP version (auto-generated)
├── logo.svg           # SVG (no WebP needed)
├── card.png           # Original with transparency
└── card.webp          # WebP version (preserves transparency)
```

---

## Bundle Analysis

### Running Analysis

```bash
# Frontend bundle analysis
pnpm --dir packages/frontend build:analyze
```

This generates `dist/stats.html` with an interactive treemap.

### Key Metrics to Monitor

| Metric         | Target       | Current     |
| -------------- | ------------ | ----------- |
| Initial JS     | < 150KB gzip | Monitor     |
| Largest Chunk  | < 100KB gzip | Monitor     |
| Three.js Chunk | < 200KB gzip | Lazy loaded |
| Total Assets   | < 500KB      | Monitor     |

### Chunk Strategy

| Chunk        | Contents            | Load Timing      |
| ------------ | ------------------- | ---------------- |
| react-vendor | React, ReactDOM     | Initial          |
| router       | React Router        | Initial          |
| animation    | Framer Motion       | Initial          |
| utils        | zustand, viem, clsx | Initial          |
| three-vendor | Three.js, R3F, Drei | Lazy (3D pages)  |
| games/snake  | Snake game          | Lazy (play page) |
| games/tetris | Tetris game         | Lazy (play page) |
| pages/\*     | Individual pages    | Lazy (routing)   |

---

## Best Practices

### Do's

1. **Use named imports** for tree shaking
2. **Lazy load** heavy components (3D, games)
3. **Compress images** before committing
4. **Use WebP** with fallbacks for photos
5. **Inline small assets** (< 4KB)
6. **Code split** by route and feature
7. **Analyze bundles** regularly

### Don'ts

1. **Don't import entire libraries** (`import * from 'library'`)
2. **Don't commit uncompressed images** (> 100KB)
3. **Don't use JPEG/PNG** when WebP works
4. **Don't load 3D on non-3D pages**
5. **Don't inline large assets** (> 10KB)

### Performance Budget

```json
{
  "timings": {
    "first-contentful-paint": "1.5s",
    "largest-contentful-paint": "2.5s",
    "time-to-interactive": "3.5s"
  },
  "resourceSizes": {
    "total": "500KB",
    "javascript": "300KB",
    "images": "150KB",
    "fonts": "50KB"
  }
}
```

---

## Scripts Reference

```bash
# Build with analysis
pnpm --dir packages/frontend build:analyze

# Optimize images
pnpm --dir packages/frontend optimize:images

# Generate WebP versions
pnpm --dir packages/frontend images:webp

# Type check
pnpm --dir packages/frontend build:check
```
