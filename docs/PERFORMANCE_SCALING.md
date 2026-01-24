# Performance Scaling System

Automatic performance optimization that adjusts visual effect quality based on frame rate to maintain smooth gameplay and user experience.

## Overview

The performance scaling system continuously monitors frame rate and automatically reduces or disables expensive visual effects when FPS drops below configurable thresholds. This ensures the application remains responsive even on lower-end devices.

## Features

- **Continuous FPS Monitoring**: Tracks frame rate using `requestAnimationFrame` with rolling averages
- **Progressive Degradation**: Disables expensive effects first, preserving core functionality
- **Hysteresis**: Prevents rapid quality switching with configurable FPS margins
- **4 Quality Levels**: High, Medium, Low, and Minimal quality presets
- **Manual Override**: Option to force specific quality level
- **Statistics**: Real-time performance metrics for debugging
- **Zero Dependencies**: Built with standard browser APIs

## Quick Start

### Basic Usage

```tsx
import { usePerformanceScaling } from '@/hooks/usePerformanceScaling';

function MyComponent() {
  const { quality, settings } = usePerformanceScaling();

  return (
    <div>
      {/* Apply settings to your effects */}
      <BackgroundEffects
        showGlows={settings.backgroundGlows}
        glowIntensity={settings.glowIntensity}
        animateGlows={settings.animateGlows}
      />

      <NoiseOverlay
        enabled={settings.noiseOverlay}
        fps={settings.noiseFps}
      />

      {/* Conditionally render expensive effects */}
      {settings.bloom && <BloomEffect preset={settings.bloomPreset} />}
      {settings.chromaticAberration && <ChromaticAberration />}
    </div>
  );
}
```

### Using PerformanceScaledLayout

The easiest way to add performance scaling is to use the `PerformanceScaledLayout` component:

```tsx
import { PerformanceScaledLayout } from '@/components/layout/Layout';

function App() {
  return (
    <PerformanceScaledLayout>
      <YourContent />
    </PerformanceScaledLayout>
  );
}
```

## Quality Levels

### High Quality (≥50 FPS)

All effects enabled at maximum settings:
- ✓ Background glows (high intensity, animated)
- ✓ Noise overlay (24 FPS)
- ✓ Bloom effect (intense preset)
- ✓ Chromatic aberration
- ✓ Vignette effect
- ✓ Scanlines
- ✓ 100% particles with animations
- ✓ High-quality 3D effects

**Target Devices**: High-end desktop GPUs, gaming laptops

### Medium Quality (≥35 FPS)

Balanced performance and visuals:
- ✓ Background glows (medium intensity, **no animation**)
- ✓ Noise overlay (**12 FPS**)
- ✓ Bloom effect (**moderate preset**)
- ✓ Chromatic aberration
- ✓ Vignette effect
- ✓ Scanlines
- ✓ **60% particles** with animations
- ✓ Medium-quality 3D effects

**Target Devices**: Mid-range laptops, integrated graphics

### Low Quality (≥20 FPS)

Performance-focused with minimal effects:
- ✓ Background glows (low intensity, no animation)
- ✓ Noise overlay (**6 FPS**)
- ✓ Bloom effect (**subtle preset**)
- ✗ **Chromatic aberration disabled**
- ✓ Vignette effect
- ✗ **Scanlines disabled**
- ✓ **30% particles**, **no animations**
- ✓ Low-quality 3D effects

**Target Devices**: Older laptops, budget devices

### Minimal Quality (<20 FPS)

Absolute minimum for very low-end devices:
- ✗ **All background glows disabled**
- ✗ **Noise overlay disabled**
- ✗ **All post-processing disabled**
- ✗ **No particles**
- ✗ **No animations**
- ✓ Low-quality 3D effects (essential only)

**Target Devices**: Very old hardware, emergency fallback

## Configuration

### Custom Thresholds

```tsx
const { quality, settings } = usePerformanceScaling({
  highQualityFps: 55,    // Require 55+ FPS for high quality
  mediumQualityFps: 40,  // Require 40+ FPS for medium quality
  lowQualityFps: 25,     // Require 25+ FPS for low quality
  hysteresis: 5,         // 5 FPS margin to prevent switching
  checkInterval: 2000,   // Check every 2 seconds
  sampleSize: 120,       // Average over 120 frames
});
```

### Manual Quality Override

```tsx
const { quality, setManualQuality, enableAutoScaling } = usePerformanceScaling();

// Force low quality
setManualQuality('low');

// Re-enable automatic scaling
enableAutoScaling();

// Or set to null
setManualQuality(null);
```

### Disable Scaling

```tsx
const { quality } = usePerformanceScaling({
  enabled: false, // Stays at high quality
});
```

## How It Works

### 1. FPS Measurement

```typescript
// Measures frame time using requestAnimationFrame
const measureFps = (timestamp: number) => {
  const frameTime = timestamp - lastFrameTime;
  frameTimes.push(frameTime);

  // Keep rolling window of samples
  if (frameTimes.length > sampleSize) {
    frameTimes.shift();
  }

  requestAnimationFrame(measureFps);
};
```

### 2. Quality Determination

```typescript
// Determine quality based on average FPS
const determineQuality = (fps: number): QualityLevel => {
  if (fps >= highQualityFps) return 'high';
  if (fps >= mediumQualityFps) return 'medium';
  if (fps >= lowQualityFps) return 'low';
  return 'minimal';
};
```

### 3. Hysteresis Prevention

```typescript
// Apply hysteresis based on current quality
const adjustedThreshold =
  currentQuality === 'high'
    ? highQualityFps - hysteresis  // Lower threshold when already high
    : highQualityFps;              // Normal threshold when upgrading

// Prevents rapid switching:
// - High→Medium requires dropping below 47 FPS (50 - 3)
// - Medium→High requires reaching 50 FPS (no hysteresis when upgrading)
```

## Performance Monitoring

### Access Statistics

```tsx
const { stats } = usePerformanceScaling();

console.log({
  currentFps: stats.currentFps,      // Latest frame's FPS
  averageFps: stats.averageFps,      // Rolling average
  minFps: stats.minFps,              // Minimum in window
  maxFps: stats.maxFps,              // Maximum in window
  quality: stats.quality,            // Current quality level
  autoAdjusted: stats.autoAdjusted,  // Was it auto-adjusted?
  adjustmentCount: stats.adjustmentCount, // Total adjustments
});
```

### Debug Overlay

```tsx
<PerformanceScaledLayout showStats={true}>
  {/* Shows FPS overlay in top-right corner */}
</PerformanceScaledLayout>
```

## Integration Examples

### With Existing Effects

```tsx
function Scene() {
  const { settings } = usePerformanceScaling();

  return (
    <Canvas>
      <EffectComposer>
        {/* Bloom adjusts based on quality */}
        {settings.bloom && (
          <Bloom
            intensity={settings.bloomPreset === 'intense' ? 2.0 :
                      settings.bloomPreset === 'moderate' ? 1.0 : 0.5}
          />
        )}

        {/* Chromatic aberration disabled on low/minimal */}
        {settings.chromaticAberration && (
          <ChromaticAberration
            offset={[settings.chromaticAberrationIntensity, 0]}
          />
        )}
      </EffectComposer>

      {/* Particle count scales with quality */}
      <Particles count={1000 * settings.particleMultiplier} />
    </Canvas>
  );
}
```

### With Particle Systems

```tsx
function Particles() {
  const { settings } = usePerformanceScaling();

  const particleCount = Math.floor(BASE_PARTICLE_COUNT * settings.particleMultiplier);

  return (
    <instancedMesh args={[null, null, particleCount]}>
      {/* Only animate if enabled */}
      {settings.particleAnimations && <ParticleAnimation />}
    </instancedMesh>
  );
}
```

### With Background Effects

```tsx
function Background() {
  const { settings } = usePerformanceScaling();

  return (
    <>
      <BackgroundEffects
        showGlows={settings.backgroundGlows}
        glowIntensity={settings.glowIntensity}
        animateGlows={settings.animateGlows}
      />

      <NoiseOverlay
        enabled={settings.noiseOverlay}
        fps={settings.noiseFps}
      />

      <Scanlines
        enabled={settings.scanlines}
        opacity={settings.scanlinesOpacity}
      />
    </>
  );
}
```

## Best Practices

### 1. Progressive Degradation

Disable expensive effects first:

```tsx
// Priority order (first to disable):
1. Animations (animateGlows, particleAnimations)
2. Post-processing (chromatic aberration)
3. High-frequency updates (noise FPS, particle count)
4. Secondary effects (scanlines, vignette)
5. Primary effects (bloom, background glows)
```

### 2. Smooth Transitions

Use CSS transitions when changing quality:

```tsx
<div style={{
  opacity: settings.vignette ? settings.vignetteIntensity : 0,
  transition: 'opacity 0.5s ease', // Smooth fade
}}>
  <VignetteEffect />
</div>
```

### 3. Hysteresis Tuning

- **Low hysteresis (1-2)**: More responsive, may flicker
- **Medium hysteresis (3-5)**: Balanced (recommended)
- **High hysteresis (6-10)**: Very stable, slower to adapt

### 4. Threshold Tuning

For **60Hz displays**:
```tsx
highQualityFps: 55,   // Leave 5 FPS margin
mediumQualityFps: 40, // 2/3 of target
lowQualityFps: 25,    // ~1/2 of target
```

For **120Hz+ displays**:
```tsx
highQualityFps: 110,  // Leave 10 FPS margin
mediumQualityFps: 80,
lowQualityFps: 50,
```

## Troubleshooting

### Quality Never Changes

**Problem**: FPS stays constant, no quality adjustments

**Solutions**:
- Check `enabled: true` in config
- Verify `checkInterval` isn't too long
- Ensure effects actually impact FPS (test with heavy scenes)

### Rapid Quality Switching

**Problem**: Quality flickers between levels

**Solutions**:
- Increase `hysteresis` (try 5-8)
- Increase `sampleSize` for more averaging (try 120)
- Increase `checkInterval` to reduce check frequency

### FPS Improves But Quality Doesn't Upgrade

**Problem**: Quality stays low despite good FPS

**Solutions**:
- Check if manual override is active (`setManualQuality`)
- Verify thresholds aren't too strict
- Increase hysteresis margin for faster upgrades

### Performance Still Poor on Minimal Quality

**Problem**: Even minimal quality is too slow

**Solutions**:
```tsx
// Create custom ultra-minimal preset
const ULTRA_MINIMAL = {
  ...QUALITY_PRESETS.minimal,
  effect3dQuality: 'low',
  // Disable everything possible
};
```

## API Reference

### usePerformanceScaling(config?)

**Parameters**:
- `config.highQualityFps?: number` - FPS threshold for high quality (default: 50)
- `config.mediumQualityFps?: number` - FPS threshold for medium quality (default: 35)
- `config.lowQualityFps?: number` - FPS threshold for low quality (default: 20)
- `config.hysteresis?: number` - FPS margin to prevent switching (default: 3)
- `config.sampleSize?: number` - Number of frames to average (default: 60)
- `config.enabled?: boolean` - Enable auto-scaling (default: true)
- `config.checkInterval?: number` - Check interval in ms (default: 2000)

**Returns**:
- `quality: QualityLevel` - Current quality level
- `settings: QualitySettings` - Settings for current quality
- `stats: PerformanceStats` - Performance statistics
- `setManualQuality: (quality) => void` - Override quality
- `enableAutoScaling: () => void` - Re-enable auto-scaling

## Testing

Run comprehensive test suite:

```bash
npm test usePerformanceScaling
```

View in Storybook:

```bash
npm run storybook
# Navigate to "System/Performance Scaling"
```

## Future Enhancements

- [ ] WebGL capability detection
- [ ] Device tier detection (mobile, tablet, desktop)
- [ ] Memory usage monitoring
- [ ] Custom quality presets
- [ ] Quality persistence (localStorage)
- [ ] Performance history tracking
- [ ] Automatic quality suggestions based on device

## Related Documentation

- [Background Effects](./BACKGROUND_EFFECTS.md)
- [3D Effects](./3D_EFFECTS.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING.md)
- [Design System](./DESIGN_SYSTEM.md)
