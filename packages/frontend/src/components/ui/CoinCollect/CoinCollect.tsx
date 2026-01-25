/**
 * CoinCollect Component
 *
 * Animates a coin traveling from start to end position along a bezier curve.
 * The coin spins during flight and triggers a pulse effect at the destination.
 */

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoinCollectProps } from './CoinCollect.types';

export const CoinCollect: React.FC<CoinCollectProps> = ({
  start,
  end,
  duration = 0.8,
  coinSize = 24,
  color = '#ffff00',
  onArrive,
  onComplete,
  className = '',
}) => {
  // Calculate control points for bezier curve (arc upward)
  const controlPoints = useMemo(() => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    // Arc height is proportional to distance
    const arcHeight = Math.min(distance * 0.4, 100);

    return {
      cp1x: midX,
      cp1y: midY - arcHeight,
      cp2x: midX,
      cp2y: midY - arcHeight,
    };
  }, [start, end]);

  useEffect(() => {
    if (onArrive) {
      const timer = setTimeout(onArrive, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration, onArrive]);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, (duration + 0.3) * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  // Create bezier path for motion
  const path = `M ${start.x} ${start.y} C ${controlPoints.cp1x} ${controlPoints.cp1y}, ${controlPoints.cp2x} ${controlPoints.cp2y}, ${end.x} ${end.y}`;

  return (
    <div className={`pointer-events-none fixed inset-0 ${className}`} aria-hidden="true">
      {/* Coin */}
      <motion.div
        className="absolute rounded-full mix-blend-screen"
        initial={{ offsetDistance: '0%', opacity: 1, scale: 1, rotate: 0 }}
        animate={{ offsetDistance: '100%', opacity: 1, scale: 1, rotate: 720 }}
        transition={{
          duration,
          ease: 'easeInOut',
        }}
        style={{
          width: coinSize,
          height: coinSize,
          backgroundColor: color,
          boxShadow: `
            0 0 ${coinSize}px ${color},
            0 0 ${coinSize * 2}px ${color}
          `,
          offsetPath: `path("${path}")`,
          offsetRotate: '0deg',
        }}
      >
        {/* Inner circle for 3D effect */}
        <motion.div
          className="absolute inset-1 rounded-full border-2"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.5)',
          }}
          animate={{ scaleX: [1, 0.3, 1, 0.3, 1] }}
          transition={{
            duration,
            ease: 'linear',
            repeat: 0,
          }}
        />
      </motion.div>

      {/* Target pulse effect */}
      <motion.div
        className="absolute rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.5, 2], opacity: [0, 0, 0.6, 0] }}
        transition={{
          duration: 0.6,
          delay: duration,
          times: [0, 0.5, 0.8, 1],
        }}
        style={{
          left: end.x - coinSize / 2,
          top: end.y - coinSize / 2,
          width: coinSize,
          height: coinSize,
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}`,
        }}
      />
    </div>
  );
};
