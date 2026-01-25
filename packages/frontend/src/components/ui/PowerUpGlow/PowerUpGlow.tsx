/**
 * PowerUpGlow Component
 *
 * Wraps children with a pulsing glow effect when power-up is active.
 * Pulses rhythmically during active period and fades out when ending.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerUpGlowProps } from './PowerUpGlow.types';

export const PowerUpGlow: React.FC<PowerUpGlowProps> = ({
  isActive,
  color = '#00ffff',
  duration = 10,
  pulseSpeed = 1.0,
  intensity = 0.8,
  onExpire,
  className = '',
  children,
}) => {
  useEffect(() => {
    if (isActive && onExpire) {
      const timer = setTimeout(onExpire, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, onExpire]);

  // Calculate glow sizes based on intensity
  const minGlow = 10 * intensity;
  const maxGlow = 40 * intensity;
  const spreadMin = 5 * intensity;
  const spreadMax = 20 * intensity;

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div
          key="glow-active"
          className={`relative ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.3 },
          }}
        >
          {/* Pulsing glow wrapper */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 ${minGlow}px ${spreadMin}px ${color}`,
                `0 0 ${maxGlow}px ${spreadMax}px ${color}`,
                `0 0 ${minGlow}px ${spreadMin}px ${color}`,
              ],
            }}
            transition={{
              duration: pulseSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          />

          {/* Inner glow */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            animate={{
              backgroundColor: [
                `${color}00`,
                `${color}${Math.floor(intensity * 51).toString(16).padStart(2, '0')}`,
                `${color}00`,
              ],
            }}
            transition={{
              duration: pulseSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative z-10">{children}</div>
        </motion.div>
      ) : (
        <div key="glow-inactive" className={className}>
          {children}
        </div>
      )}
    </AnimatePresence>
  );
};
