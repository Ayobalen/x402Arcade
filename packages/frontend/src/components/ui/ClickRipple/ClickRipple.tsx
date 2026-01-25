/**
 * ClickRipple Component
 *
 * Creates an expanding ripple effect from click points.
 * Automatically cleans up ripple elements after animation completes.
 * Uses framer-motion for smooth scale and opacity animations.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClickRippleProps, Ripple } from './ClickRipple.types';

export const ClickRipple: React.FC<ClickRippleProps> = ({
  color = '#8B5CF6',
  duration = 0.6,
  size = 100,
  enabled = true,
  containerSelector,
  className = '',
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      // Check if we're within the container (if specified)
      if (containerSelector) {
        const container = document.querySelector(containerSelector);
        if (container) {
          const rect = container.getBoundingClientRect();
          const isInside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;

          if (!isInside) {
            return;
          }
        }
      }

      // Create new ripple
      const newRipple: Ripple = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration * 1000);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [enabled, containerSelector, duration]);

  if (!enabled) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 ${className}`}
      aria-hidden="true"
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full mix-blend-screen"
            initial={{
              scale: 0,
              opacity: 0.8,
            }}
            animate={{
              scale: 1,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration,
              ease: 'easeOut',
            }}
            style={{
              left: ripple.x - size / 2,
              top: ripple.y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size / 2}px ${color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
