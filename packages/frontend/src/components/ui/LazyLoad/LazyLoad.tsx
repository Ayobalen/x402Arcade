/**
 * LazyLoad Component
 *
 * A wrapper component that delays loading its children until they're
 * about to enter the viewport using Intersection Observer.
 *
 * Features:
 * - Viewport-based lazy loading with configurable rootMargin
 * - Optional loading placeholder
 * - Fade-in animation when content loads
 * - Reduced motion support
 * - SSR-safe with hydration support
 * - Ref forwarding for DOM access
 */

import { forwardRef, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Default loading placeholder for lazy-loaded content
 */
function DefaultPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'bg-[#1a1a2e] rounded-lg',
        'min-h-[100px]',
        className
      )}
      role="progressbar"
      aria-label="Loading..."
      aria-busy="true"
    >
      <div className="flex gap-2">
        <div
          className="w-2 h-2 rounded-full bg-[#00ffff] animate-bounce motion-reduce:animate-none"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 rounded-full bg-[#ff00ff] animate-bounce motion-reduce:animate-none"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-2 h-2 rounded-full bg-[#00ffff] animate-bounce motion-reduce:animate-none"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

export interface LazyLoadProps {
  /** Content to lazy load */
  children: ReactNode;
  /**
   * Placeholder to show while content is loading.
   * Can be a React node or a component that receives className.
   */
  placeholder?: ReactNode;
  /**
   * Root margin for intersection observer.
   * Positive values load content before it enters viewport.
   * @default "200px"
   */
  rootMargin?: string;
  /**
   * Threshold for intersection observer.
   * 0 = any pixel visible, 1 = fully visible.
   * @default 0
   */
  threshold?: number;
  /**
   * Whether to trigger loading only once.
   * If false, content unloads when leaving viewport.
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Minimum height for the container before content loads.
   * Helps prevent layout shift.
   */
  minHeight?: string | number;
  /**
   * Whether to show fade-in animation when content loads.
   * @default true
   */
  fadeIn?: boolean;
  /**
   * Fade-in animation duration in ms.
   * @default 200
   */
  fadeDuration?: number;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Callback when content starts loading (enters viewport)
   */
  onLoad?: () => void;
  /**
   * Callback when content becomes visible
   */
  onVisible?: () => void;
  /**
   * Force loading regardless of viewport position.
   * Useful for preloading.
   * @default false
   */
  forceLoad?: boolean;
  /**
   * Disable lazy loading (load immediately).
   * @default false
   */
  disabled?: boolean;
}

/**
 * LazyLoad Component
 *
 * Delays loading children until they're near the viewport.
 * Ideal for heavy components like 3D scenes, images, or complex UI.
 *
 * @example
 * // Basic usage
 * <LazyLoad>
 *   <Heavy3DComponent />
 * </LazyLoad>
 *
 * @example
 * // With custom placeholder
 * <LazyLoad placeholder={<GameSkeleton />}>
 *   <GameCanvas />
 * </LazyLoad>
 *
 * @example
 * // With early loading (200px before entering viewport)
 * <LazyLoad rootMargin="200px">
 *   <ParticleBackground />
 * </LazyLoad>
 */
export const LazyLoad = forwardRef<HTMLDivElement, LazyLoadProps>(function LazyLoad(
  {
    children,
    placeholder,
    rootMargin = '200px',
    threshold = 0,
    triggerOnce = true,
    minHeight,
    fadeIn = true,
    fadeDuration = 200,
    className,
    onLoad,
    onVisible,
    forceLoad = false,
    disabled = false,
  },
  ref
) {
  const [isLoaded, setIsLoaded] = useState(disabled || forceLoad);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(disabled || forceLoad);

  // Combine forwarded ref with internal ref
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      // Update internal ref
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

      // Update forwarded ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  useEffect(() => {
    // Skip if already loaded and triggerOnce is true
    if (hasLoadedRef.current && triggerOnce) {
      return;
    }

    // Skip if disabled or force loaded
    if (disabled || forceLoad) {
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    // Check for IntersectionObserver support
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: load immediately if IntersectionObserver not supported
      setIsLoaded(true);
      hasLoadedRef.current = true;
      onLoad?.();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!hasLoadedRef.current) {
              setIsLoaded(true);
              hasLoadedRef.current = true;
              onLoad?.();
            }

            if (!isVisible) {
              setIsVisible(true);
              onVisible?.();
            }

            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
            if (!triggerOnce) {
              setIsLoaded(false);
              hasLoadedRef.current = false;
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, disabled, forceLoad, onLoad, onVisible, isVisible]);

  // Compute container style
  const containerStyle: React.CSSProperties = {
    minHeight: minHeight !== undefined ? minHeight : undefined,
    transition: fadeIn ? `opacity ${fadeDuration}ms ease-in-out` : undefined,
    opacity: fadeIn && isLoaded && !isVisible ? 0 : 1,
  };

  // If visible and loaded, show full opacity
  if (isLoaded && isVisible) {
    containerStyle.opacity = 1;
  }

  return (
    <div
      ref={setRefs}
      className={cn(
        'relative',
        // Reduced motion: skip fade animations
        fadeIn && 'motion-reduce:transition-none motion-reduce:opacity-100',
        className
      )}
      style={containerStyle}
    >
      {isLoaded
        ? children
        : (placeholder ?? (
            <DefaultPlaceholder className={minHeight ? `min-h-[${minHeight}]` : undefined} />
          ))}
    </div>
  );
});

LazyLoad.displayName = 'LazyLoad';

export default LazyLoad;
