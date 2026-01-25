# Three.js Bundle Optimization Guide

This guide covers the optimization strategies implemented for Three.js in x402Arcade to reduce bundle size and improve runtime performance.

## Table of Contents

1. [Bundle Size Optimization](#bundle-size-optimization)
2. [WebGL Context Pooling](#webgl-context-pooling)
3. [Particle System Optimization](#particle-system-optimization)
4. [Performance Best Practices](#performance-best-practices)

---

## Bundle Size Optimization

### The Problem

Three.js is a large library (~150KB gzipped). Using `import * as THREE from 'three'` imports the entire library, even if you only use a few classes.

### The Solution: Selective Imports

We provide an optimized imports module at `@/3d/imports` that exports only what you need, enabling better tree-shaking.

#### Before (Anti-pattern)

```typescript
// This imports the ENTIRE Three.js library
import * as THREE from 'three';

const vector = new THREE.Vector3(0, 0, 0);
const color = new THREE.Color('#ff0000');
const geometry = new THREE.BoxGeometry(1, 1, 1);
```

#### After (Recommended)

```typescript
// Import only what you need - tree-shakeable
import { Vector3, Color, BoxGeometry } from '@/3d/imports';

const vector = new Vector3(0, 0, 0);
const color = new Color('#ff0000');
const geometry = new BoxGeometry(1, 1, 1);
```

### Available Exports

The `@/3d/imports` module exports:

#### Math Classes

- `Vector2`, `Vector3`, `Vector4`
- `Matrix3`, `Matrix4`
- `Quaternion`, `Euler`
- `Box3`, `Sphere`, `Ray`, `Plane`
- `Color`, `MathUtils`

#### Objects

- `Object3D`, `Group`, `Mesh`
- `InstancedMesh`, `Points`, `Line`
- `LOD`, `Sprite`

#### Geometry

- All built-in geometries (Box, Sphere, Plane, Cylinder, etc.)
- `BufferGeometry`, `BufferAttribute`
- `InstancedBufferGeometry`, `InstancedBufferAttribute`

#### Materials

- All standard materials (Basic, Standard, Phong, Lambert, etc.)
- `ShaderMaterial`, `RawShaderMaterial`

#### Textures

- `Texture`, `TextureLoader`
- `DataTexture`, `CanvasTexture`, `VideoTexture`

#### Lights & Cameras

- All light types
- All camera types

#### Constants

- Blending modes, depth modes, texture settings
- All Three.js constants

### Vite Configuration

The Vite config is set up to:

1. **Separate Three.js chunk**: Three.js and @react-three/\* are bundled into a separate chunk
2. **Exclude from pre-bundling**: Heavy dependencies are lazy-loaded
3. **Tree-shaking enabled**: ES modules allow dead code elimination

```typescript
// vite.config.ts (already configured)
manualChunks: (id) => {
  if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
    return 'three-vendor';
  }
};
```

---

## WebGL Context Pooling

### The Problem

Browsers limit the number of active WebGL contexts (typically 8-16). Creating too many canvases with WebGL contexts can:

- Cause context loss events
- Force context eviction
- Lead to crashes on mobile devices

### The Solution: Context Pool

The `WebGLContextPool` singleton manages WebGL contexts across the application:

```typescript
import { WebGLContextPool, useWebGLContextPool } from '@/3d';

// Get the singleton pool
const pool = WebGLContextPool.getInstance();

// Acquire a context
const context = pool.acquire(canvas, {
  antialias: true,
  alpha: true,
});

// Release when done (component unmount)
pool.release(canvas);
```

### React Hook Usage

```tsx
import { useWebGLContextPool } from '@/3d';

function My3DComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { acquire, release } = useWebGLContextPool();

  useEffect(() => {
    if (canvasRef.current) {
      const gl = acquire(canvasRef.current);
      // Use WebGL context...

      return () => {
        release(canvasRef.current!);
      };
    }
  }, []);

  return <canvas ref={canvasRef} />;
}
```

### Features

- **LRU Eviction**: When limit is reached, least recently used contexts are evicted
- **Context Loss Handling**: Automatic detection and callbacks
- **Statistics**: Track active/available contexts
- **Configurable Limit**: Set max contexts based on device capability

### Monitoring

```typescript
const stats = pool.getStats();
console.log({
  active: stats.activeContexts,
  available: stats.availableContexts,
  lost: stats.lostContexts,
  evictions: stats.evictions,
});
```

---

## Particle System Optimization

### The Problem

Particle systems can be performance-intensive due to:

- Garbage collection from creating/destroying objects
- Expensive draw calls for many individual objects
- CPU overhead from updating many particles

### The Solution: Object Pooling + Instanced Rendering

The `ParticlePool` class provides:

1. **Pre-allocated particles**: No runtime allocations
2. **Instanced rendering**: Single draw call for all particles
3. **Automatic recycling**: Particles are reused, not destroyed
4. **LOD support**: Reduce particles based on distance

### Usage

```tsx
import { useParticlePool } from '@/3d';

function ParticleEffect() {
  const { mesh, emit, clear, getStats } = useParticlePool({
    maxParticles: 500,
    quality: 'medium',
    gravity: [0, -9.8, 0],
    drag: 0.02,
  });

  const handleExplosion = useCallback(
    (position: [number, number, number]) => {
      emit({
        position,
        count: 50,
        velocity: { min: 2, max: 5, mode: 'sphere' },
        lifetime: { min: 0.5, max: 1.5 },
        size: { min: 0.05, max: 0.15 },
        startColor: '#ffffff',
        endColor: '#ff6600',
      });
    },
    [emit]
  );

  return <primitive object={mesh} />;
}
```

### Quality Presets

```typescript
// Automatic particle limits based on quality
const QUALITY_PARTICLE_LIMITS = {
  low: 100, // Mobile devices
  medium: 500, // Standard devices
  high: 2000, // Powerful devices
  ultra: 10000, // High-end GPUs
};
```

### LOD (Level of Detail)

Reduce particle count based on camera distance:

```typescript
import { calculateParticleLOD } from '@/3d';

// In your emission logic
const distance = camera.position.distanceTo(emissionPoint);
const multiplier = calculateParticleLOD(distance);
const particleCount = Math.floor(baseCount * multiplier);

emit({
  position: [0, 0, 0],
  count: particleCount,
  // ...
});
```

### Emission Modes

```typescript
// Spherical explosion
emit({ velocity: { min: 1, max: 3, mode: 'sphere' } });

// Directional jet
emit({
  velocity: {
    min: 5,
    max: 8,
    mode: 'direction',
    direction: [0, 1, 0],
  },
});

// Cone spray
emit({
  velocity: {
    min: 2,
    max: 4,
    mode: 'cone',
    direction: [0, 1, 0],
    coneAngle: Math.PI / 4,
  },
});
```

---

## Performance Best Practices

### 1. Use Instanced Meshes

For many identical objects, use `InstancedMesh` instead of multiple `Mesh` objects:

```typescript
// Bad: 1000 draw calls
for (let i = 0; i < 1000; i++) {
  scene.add(new Mesh(geometry, material));
}

// Good: 1 draw call
const instancedMesh = new InstancedMesh(geometry, material, 1000);
for (let i = 0; i < 1000; i++) {
  instancedMesh.setMatrixAt(i, matrix);
}
```

### 2. Share Geometries and Materials

```typescript
// Create once, reuse many times
const sharedGeometry = new BoxGeometry(1, 1, 1);
const sharedMaterial = new MeshBasicMaterial({ color: 0xff0000 });

// Use the same instances
const mesh1 = new Mesh(sharedGeometry, sharedMaterial);
const mesh2 = new Mesh(sharedGeometry, sharedMaterial);
```

### 3. Dispose Unused Resources

```typescript
useEffect(() => {
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial();

  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);
```

### 4. Use Typed Arrays

```typescript
// Prefer Float32Array over regular arrays for buffer attributes
const positions = new Float32Array(vertexCount * 3);
geometry.setAttribute('position', new BufferAttribute(positions, 3));
```

### 5. Frustum Culling

Enable frustum culling to skip rendering off-screen objects:

```typescript
mesh.frustumCulled = true; // Default, but be aware
```

### 6. Object Pooling Pattern

For frequently created/destroyed objects:

```typescript
class ObjectPool<T> {
  private available: T[] = [];
  private active: Set<T> = new Set();

  acquire(): T | undefined {
    const obj = this.available.pop();
    if (obj) this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    this.active.delete(obj);
    this.available.push(obj);
  }
}
```

### 7. Reduce Geometry Complexity

For distant objects, use simpler geometry:

```typescript
// Close: High detail
new SphereGeometry(1, 32, 32);

// Medium: Medium detail
new SphereGeometry(1, 16, 16);

// Far: Low detail
new SphereGeometry(1, 8, 8);
```

### 8. Limit Update Frequency

Not everything needs to update every frame:

```typescript
let frameCount = 0;
useFrame(() => {
  frameCount++;

  // Update every 3rd frame
  if (frameCount % 3 === 0) {
    updateExpensiveEffect();
  }
});
```

---

## Bundle Analysis

Run the bundle analyzer to see Three.js impact:

```bash
ANALYZE=true npm run build
```

This generates a treemap visualization in `dist/stats.html`.

### Target Metrics

| Chunk         | Target Size (gzipped) |
| ------------- | --------------------- |
| three-vendor  | < 100KB               |
| Main bundle   | < 150KB               |
| Total initial | < 250KB               |

---

## Troubleshooting

### "Maximum WebGL contexts exceeded"

- Check that you're releasing contexts on component unmount
- Reduce simultaneous 3D views
- Use the context pool

### "Context lost" events

- Listen for `webglcontextlost` events
- Implement graceful degradation UI
- Attempt context restoration

### Large bundle size

- Check for `import * as THREE` usage
- Use selective imports from `@/3d/imports`
- Run bundle analyzer

### Poor particle performance

- Reduce particle count
- Use LOD system
- Check if pool is being reused

---

## References

- [Three.js Optimization Documentation](https://threejs.org/manual/#en/optimize-lots-of-objects)
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [React Three Fiber Performance](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance)
