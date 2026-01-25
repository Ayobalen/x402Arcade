/**
 * ComboFlash Component
 *
 * Displays a flash effect when combo multiplier increases.
 * Higher combos get more intense glow and shake effects.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComboFlashProps } from './ComboFlash.types';

export const ComboFlash: React.FC<ComboFlashProps> = ({
  multiplier,
  show = true,
  duration = 0.6,
  position,
  onComplete,
  className = '',
}) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  // Calculate color based on multiplier
  const getColor = (mult: number): string => {
    if (mult >= 10) return '#ffff00'; // Gold for 10x+
    if (mult >= 5) return '#ff00ff'; // Magenta for 5x+
    if (mult >= 3) return '#00ffff'; // Cyan for 3x+
    return '#ffffff'; // White for 2x
  };

  // Calculate glow intensity based on multiplier
  const getGlowSize = (mult: number): number => {
    if (mult >= 10) return 60;
    if (mult >= 5) return 45;
    if (mult >= 3) return 30;
    return 20;
  };

  // High combos (5x+) get shake effect
  const shouldShake = multiplier >= 5;

  const color = getColor(multiplier);
  const glowSize = getGlowSize(multiplier);

  const positionStyle = position
    ? { left: position.x, top: position.y }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`pointer-events-none absolute ${className}`}
          style={positionStyle}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: shouldShake ? [0, 1.2, 1, 1.1, 1] : [0, 1.2, 1],
            x: shouldShake ? [0, -3, 3, -3, 3, 0] : 0,
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration,
            times: shouldShake ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.3, 1],
            opacity: {
              times: [0, 0.1, 0.7, 1],
            },
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Glow layers */}
          <div className="relative">
            {/* Outer glow */}
            <motion.div
              className="absolute rounded-full"
              animate={{
                boxShadow: [
                  `0 0 ${glowSize}px ${glowSize / 2}px ${color}`,
                  `0 0 ${glowSize * 1.5}px ${glowSize}px ${color}`,
                  `0 0 ${glowSize}px ${glowSize / 2}px ${color}`,
                ],
              }}
              transition={{
                duration: duration * 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              style={{
                width: 100,
                height: 100,
                left: -50,
                top: -50,
              }}
            />

            {/* Multiplier text */}
            <motion.div
              className="relative text-center font-bold"
              initial={{ color: '#ffffff' }}
              animate={{ color }}
              transition={{ duration: duration * 0.3 }}
              style={{
                fontSize: '48px',
                fontFamily: 'Orbitron, sans-serif',
                textShadow: `
                  0 0 10px ${color},
                  0 0 20px ${color},
                  0 0 30px ${color}
                `,
              }}
            >
              {multiplier}x
            </motion.div>

            {/* "COMBO" label for high multipliers */}
            {multiplier >= 3 && (
              <motion.div
                className="mt-2 text-sm font-bold text-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: duration * 0.2 }}
                style={{
                  color,
                  fontFamily: 'Orbitron, sans-serif',
                  textShadow: `0 0 10px ${color}`,
                }}
              >
                COMBO!
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
