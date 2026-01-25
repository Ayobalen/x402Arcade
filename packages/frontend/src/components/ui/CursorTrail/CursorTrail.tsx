/**
 * CursorTrail Component
 *
 * Creates a trailing effect that follows the mouse cursor.
 * Uses framer-motion's useMotionValue and useSpring for smooth movement.
 * Trail elements fade out progressively for a natural trailing effect.
 */

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { CursorTrailProps } from './CursorTrail.types';

export const CursorTrail: React.FC<CursorTrailProps> = ({
  trailLength = 8,
  trailSize = 8,
  color = '#00ffff',
  enabled = true,
  containerSelector,
  delay = 50,
  className = '',
}) => {
  // Track mouse position with motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Create spring animations for smooth trailing
  const springConfig = { damping: 25, stiffness: 300 };
  const cursorXSpring = useSpring(mouseX, springConfig);
  const cursorYSpring = useSpring(mouseY, springConfig);

  // Store trail positions
  const trailPositions = useRef<Array<{ x: number; y: number }>>([]);
  const lastUpdate = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
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

      // Update mouse position
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Update trail positions at specified delay intervals
      const now = Date.now();
      if (now - lastUpdate.current >= delay) {
        trailPositions.current = [
          { x: e.clientX, y: e.clientY },
          ...trailPositions.current.slice(0, trailLength - 1),
        ];
        lastUpdate.current = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, containerSelector, delay, trailLength, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 ${className}`}
      aria-hidden="true"
    >
      {/* Main cursor dot */}
      <motion.div
        className="absolute rounded-full mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          width: trailSize,
          height: trailSize,
          backgroundColor: color,
          translateX: -trailSize / 2,
          translateY: -trailSize / 2,
          boxShadow: `0 0 ${trailSize * 2}px ${color}`,
        }}
      />

      {/* Trail elements */}
      {trailPositions.current.map((pos, index) => {
        const opacity = 1 - index / trailLength;
        const scale = 1 - index / (trailLength * 1.5);

        return (
          <motion.div
            key={index}
            className="absolute rounded-full mix-blend-screen"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity, scale }}
            transition={{ duration: 0.2 }}
            style={{
              left: pos.x - (trailSize * scale) / 2,
              top: pos.y - (trailSize * scale) / 2,
              width: trailSize * scale,
              height: trailSize * scale,
              backgroundColor: color,
              boxShadow: `0 0 ${trailSize}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};
