# Assets Directory

This directory contains static assets for the x402 Arcade frontend application.

## Directory Structure

```
assets/
├── images/      # Static images (logos, backgrounds, icons)
├── fonts/       # Custom web fonts
├── sounds/      # Game audio (SFX, music)
├── sprites/     # Game sprite sheets and graphics
└── README.md    # This file
```

## Asset Guidelines

### Images (`/images`)
- Use WebP format for photographs and complex images (smaller file size)
- Use PNG for images requiring transparency
- Use SVG for icons and simple graphics (scalable, small file size)
- Recommended dimensions: @1x, @2x for retina displays
- Naming: `descriptive-name.ext` (e.g., `logo-dark.svg`, `background-arcade.webp`)

### Fonts (`/fonts`)
- Use WOFF2 format for best compression and browser support
- Include fallback WOFF format for older browsers
- Load fonts via CSS `@font-face` or import in components
- Project uses: Inter (UI), JetBrains Mono (code/addresses)

### Sounds (`/sounds`)
- Use MP3 format for broad compatibility
- Use OGG for better quality at smaller sizes (with MP3 fallback)
- Organize by category: `sfx/`, `music/`
- Keep individual SFX files under 50KB for fast loading
- Naming: `category-action.mp3` (e.g., `sfx-button-click.mp3`, `music-gameplay.mp3`)

### Sprites (`/sprites`)
- Use PNG with transparency for sprite sheets
- Create sprite atlases for related graphics
- Include JSON metadata for sprite coordinates
- Naming: `game-element.png` (e.g., `snake-body.png`, `tetris-blocks.png`)

## Importing Assets

### In React Components

```tsx
// Images
import logo from '@/assets/images/logo.svg'
<img src={logo} alt="Logo" />

// Fonts (via CSS)
import '@/assets/fonts/fonts.css'

// Sounds (via audio manager)
import { audioManager } from '@/games/engine'
audioManager.loadSound('button-click', '/assets/sounds/sfx-button-click.mp3')
```

### In CSS/SCSS

```css
/* Background images */
.hero {
  background-image: url('@/assets/images/background.webp');
}

/* Fonts */
@font-face {
  font-family: 'Inter';
  src: url('@/assets/fonts/Inter.woff2') format('woff2');
}
```

## Vite Asset Handling

Vite automatically processes assets in this directory:
- Files are hashed for cache busting
- Small files (<4KB) are inlined as base64
- Larger files are copied to the build output

### Configuration

Asset handling can be customized in `vite.config.ts`:

```ts
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // Inline files < 4KB
  },
  assetsInclude: ['**/*.gltf', '**/*.glb'], // Additional asset types
})
```

## Best Practices

1. **Optimize assets** before committing:
   - Compress images (use tools like imageoptim, squoosh)
   - Minify audio files
   - Generate sprite sheets to reduce HTTP requests

2. **Lazy load** large assets:
   - Music files should be loaded on-demand
   - Use dynamic imports for large sprite sheets

3. **Provide fallbacks**:
   - Always have a fallback for custom fonts
   - Provide OGG + MP3 for audio compatibility

4. **Version control**:
   - Avoid committing very large binary files
   - Consider using Git LFS for assets > 100MB
