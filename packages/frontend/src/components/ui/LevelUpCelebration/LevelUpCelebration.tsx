/**
 * LevelUpCelebration Component
 *
 * Creates a full-screen celebration effect when player levels up.
 * Includes confetti particles, screen flash, and animated text.
 */

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LevelUpCelebrationProps, ConfettiParticle } from './LevelUpCelebration.types';

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  level,
  duration = 2.5,
  showFlash = true,
  particleCount = 50,
  onSoundTrigger,
  onComplete,
  className = '',
}) => {
  // Arcade color palette
  const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff4444'];

  // Generate confetti particles
  const confetti = useMemo<ConfettiParticle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.random() - 0.5) * Math.PI; // -90° to 90°
      const speed = 300 + Math.random() * 200; // 300-500 px/s
      return {
        id: `confetti-${i}`,
        x: 50 + (Math.random() - 0.5) * 40, // Center with spread
        y: 50,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 200, // Shoot upward
        },
      };
    });
  }, [particleCount]);

  useEffect(() => {
    if (onSoundTrigger) {
      onSoundTrigger();
    }
  }, [onSoundTrigger]);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      <div
        className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${className}`}
        aria-live="assertive"
        aria-atomic="true"
      >
        {/* Screen flash effect */}
        {showFlash && (
          <motion.div
            className="absolute inset-0 bg-white mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.5, times: [0, 0.2, 1] }}
          />
        )}

        {/* Confetti particles */}
        {confetti.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-sm mix-blend-screen"
            initial={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: 1,
              rotate: particle.rotation,
            }}
            animate={{
              x: [0, particle.velocity.x, particle.velocity.x * 1.5],
              y: [
                0,
                particle.velocity.y * 0.5,
                particle.velocity.y * 0.5 + 400,
              ], // Fall with gravity
              opacity: [1, 1, 0],
              rotate: particle.rotation + 720,
            }}
            transition={{
              duration: duration * 0.8,
              ease: 'easeOut',
              opacity: {
                times: [0, 0.7, 1],
              },
            }}
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}

        {/* LEVEL UP! text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            <motion.h1
              className="font-bold tracking-wider"
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px #00ffff, 0 0 40px #00ffff',
                  '0 0 40px #00ffff, 0 0 80px #00ffff',
                  '0 0 20px #00ffff, 0 0 40px #00ffff',
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              style={{
                fontSize: '72px',
                color: '#ffffff',
                fontFamily: 'Orbitron, sans-serif',
                textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
              }}
            >
              LEVEL UP!
            </motion.h1>
            <motion.p
              className="mt-4 text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                color: '#ffff00',
                fontFamily: 'Orbitron, sans-serif',
                textShadow: '0 0 10px #ffff00',
              }}
            >
              Level {level}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
