/**
 * ParticleBurst Component
 *
 * Creates a burst of particles radiating outward from a point.
 * Particles animate with random angles, fade out, and scale down.
 * Useful for hover effects, click confirmations, or celebratory animations.
 */

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ParticleBurstProps, Particle } from './ParticleBurst.types';

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  particleCount = 12,
  color = '#00ffff',
  duration = 0.8,
  distance = 50,
  particleSize = 4,
  x,
  y,
  onComplete,
  className = '',
}) => {
  // Generate particles with random angles
  const particles = useMemo<Particle[]>(() => {
    const angleStep = (Math.PI * 2) / particleCount;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: `particle-${i}`,
      angle: angleStep * i + (Math.random() - 0.5) * 0.3, // Add some randomness
      distance: distance + (Math.random() - 0.5) * 20, // Vary distance slightly
      size: particleSize + (Math.random() - 0.5) * 2, // Vary size slightly
    }));
  }, [particleCount, distance, particleSize]);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      {particles.map((particle) => {
        const endX = Math.cos(particle.angle) * particle.distance;
        const endY = Math.sin(particle.angle) * particle.distance;

        return (
          <motion.div
            key={particle.id}
            className="absolute rounded-full mix-blend-screen"
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: endX,
              y: endY,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration,
              ease: 'easeOut',
            }}
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: color,
              boxShadow: `0 0 ${particle.size * 2}px ${color}`,
              translateX: -particle.size / 2,
              translateY: -particle.size / 2,
            }}
          />
        );
      })}
    </div>
  );
};
