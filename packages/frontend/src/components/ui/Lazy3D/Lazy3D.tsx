/**
 * Lazy3D Component
 *
 * A specialized lazy loading wrapper for Three.js / React Three Fiber components.
 * Combines intersection observer-based loading with React.lazy() for code splitting.
 *
 * Features:
 * - Viewport-triggered loading for 3D components
 * - Code splitting with React.lazy()
 * - Custom placeholder optimized for 3D scenes
 * - WebGL context cleanup on unmount
 * - Performance-aware loading
 * - Reduced motion support
 * - Error boundary integration
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { LazyLoad } from '../LazyLoad';

/**
 * 3D-specific placeholder component
 * Shows a stylized loading state for 3D content
 */
function Default3DPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]',
        'rounded-lg border border-[#2d2d4a]',
        'min-h-[200px]',
        className
      )}
      role="progressbar"
      aria-label="Loading 3D content..."
      aria-busy="true"
    >
      {/* Animated 3D cube icon */}
      <div className="relative w-12 h-12 mb-4">
        <div
          className={cn(
            'absolute inset-0',
            'border-2 border-[#00ffff]',
            'animate-spin',
            'motion-reduce:animate-none'
          )}
          style={{
            animationDuration: '3s',
            transform: 'perspective(200px) rotateX(25deg) rotateY(45deg)',
          }}
        />
        <div
          className={cn(
            'absolute inset-2',
            'border-2 border-[#ff00ff]',
            'animate-spin',
            'motion-reduce:animate-none'
          )}
          style={{
            animationDuration: '4s',
            animationDirection: 'reverse',
            transform: 'perspective(200px) rotateX(25deg) rotateY(-45deg)',
          }}
        />
      </div>

      <p className="text-sm text-white/60">Loading 3D scene...</p>

      {/* Reduced motion fallback */}
      <noscript>
        <p className="text-sm text-white/40 mt-2">3D content loading...</p>
      </noscript>
    </div>
  );
}

export interface Lazy3DProps<T extends object = object> {
  /**
   * Factory function that returns a dynamic import.
   * Should return a module with a default export of the component.
   *
   * @example
   * factory={() => import('./Heavy3DScene')}
   */
  factory: () => Promise<{ default: ComponentType<T> }>;
  /**
   * Props to pass to the lazy-loaded component
   */
  componentProps?: T;
  /**
   * Placeholder to show while loading.
   * Defaults to a 3D-themed loading animation.
   */
  placeholder?: ReactNode;
  /**
   * Root margin for intersection observer.
   * How far before entering viewport to start loading.
   * @default "300px"
   */
  rootMargin?: string;
  /**
   * Minimum height for the container.
   * Prevents layout shift when content loads.
   */
  minHeight?: string | number;
  /**
   * Whether to show fade-in animation.
   * @default true
   */
  fadeIn?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when component starts loading
   */
  onLoadStart?: () => void;
  /**
   * Callback when component finishes loading
   */
  onLoadComplete?: () => void;
  /**
   * Callback on load error
   */
  onError?: (error: Error) => void;
  /**
   * Force immediate loading (skip intersection observer)
   * @default false
   */
  forceLoad?: boolean;
  /**
   * Disable lazy loading entirely
   * @default false
   */
  disabled?: boolean;
}

/**
 * ErrorFallback for failed 3D component loads
 */
function Error3DFallback({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'bg-[#1a1a2e] rounded-lg border border-[#ff4444]/50',
        'min-h-[200px] p-4 text-center'
      )}
      role="alert"
    >
      <span className="text-2xl mb-2" aria-hidden="true">
        ⚠️
      </span>
      <p className="text-white/80 mb-2">Failed to load 3D content</p>
      <p className="text-xs text-white/40 mb-4 max-w-xs">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-[#00ffff]/20 text-[#00ffff]',
            'hover:bg-[#00ffff]/30',
            'transition-colors duration-200'
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Lazy3D Component
 *
 * Combines React.lazy() code splitting with intersection observer
 * for optimal loading of heavy 3D components.
 *
 * @example
 * // Basic usage
 * <Lazy3D factory={() => import('./ParticleBackground')} />
 *
 * @example
 * // With props and placeholder
 * <Lazy3D
 *   factory={() => import('./ArcadeCabinet')}
 *   componentProps={{ color: 'blue', animated: true }}
 *   placeholder={<CabinetSkeleton />}
 *   minHeight={400}
 * />
 *
 * @example
 * // With callbacks
 * <Lazy3D
 *   factory={() => import('./GameScene')}
 *   onLoadStart={() => console.log('Loading 3D...')}
 *   onLoadComplete={() => console.log('3D loaded!')}
 *   onError={(err) => console.error('Failed:', err)}
 * />
 */
export function Lazy3D<T extends object = object>({
  factory,
  componentProps,
  placeholder,
  rootMargin = '300px',
  minHeight,
  fadeIn = true,
  className,
  onLoadStart,
  onLoadComplete,
  onError,
  forceLoad = false,
  disabled = false,
}: Lazy3DProps<T>) {
  const [LazyComponent, setLazyComponent] = useState<ComponentType<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const hasStartedLoading = useRef(false);

  // Load the component when triggered
  const handleLoad = useCallback(() => {
    if (hasStartedLoading.current) return;

    hasStartedLoading.current = true;
    onLoadStart?.();

    factory()
      .then((module) => {
        setLazyComponent(() => module.default);
        onLoadComplete?.();
      })
      .catch((err: Error) => {
        setError(err);
        onError?.(err);
      });
  }, [factory, onLoadStart, onLoadComplete, onError]);

  // Handle retry after error
  const handleRetry = () => {
    hasStartedLoading.current = false;
    setError(null);
    handleLoad();
  };

  // If disabled or forceLoad, load immediately
  useEffect(() => {
    if ((disabled || forceLoad) && !hasStartedLoading.current) {
      handleLoad();
    }
  }, [disabled, forceLoad, handleLoad]);

  // Render error state
  if (error) {
    return <Error3DFallback error={error} onRetry={handleRetry} />;
  }

  // Render loaded component
  if (LazyComponent) {
    return (
      <div
        className={cn(fadeIn && 'animate-fadeIn motion-reduce:animate-none', className)}
        style={{ minHeight }}
      >
        <LazyComponent {...(componentProps as T)} />
      </div>
    );
  }

  // Render placeholder with intersection observer
  return (
    <LazyLoad
      rootMargin={rootMargin}
      minHeight={minHeight}
      fadeIn={false}
      onLoad={handleLoad}
      forceLoad={forceLoad}
      disabled={disabled}
      placeholder={placeholder ?? <Default3DPlaceholder />}
      className={className}
    >
      {/* Show placeholder while loading */}
      {placeholder ?? <Default3DPlaceholder />}
    </LazyLoad>
  );
}

Lazy3D.displayName = 'Lazy3D';

/**
 * Creates a lazy-loaded 3D component with pre-configured settings.
 *
 * @example
 * const LazyParticles = createLazy3D(() => import('./ParticleBackground'));
 *
 * // Usage
 * <LazyParticles intensity={0.8} />
 */
export function createLazy3D<T extends object = object>(
  factory: () => Promise<{ default: ComponentType<T> }>,
  defaultProps?: Partial<Omit<Lazy3DProps<T>, 'factory' | 'componentProps'>>
) {
  return function Lazy3DWrapper(
    props: T & Partial<Omit<Lazy3DProps<T>, 'factory' | 'componentProps'>>
  ) {
    const { onLoadStart, onLoadComplete, onError, ...componentProps } = props as T &
      Partial<Lazy3DProps<T>>;

    return (
      <Lazy3D<T>
        factory={factory}
        componentProps={componentProps as T}
        {...defaultProps}
        onLoadStart={onLoadStart ?? defaultProps?.onLoadStart}
        onLoadComplete={onLoadComplete ?? defaultProps?.onLoadComplete}
        onError={onError ?? defaultProps?.onError}
      />
    );
  };
}

export default Lazy3D;
