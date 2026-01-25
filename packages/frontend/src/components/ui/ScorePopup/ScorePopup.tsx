/**
 * ScorePopup Component
 *
 * Displays a floating score that animates upward and fades out.
 * Used when points are earned in games. Supports combo mode with extra flair.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScorePopupProps } from './ScorePopup.types';

export const ScorePopup: React.FC<ScorePopupProps> = ({
  score,
  x,
  y,
  color = '#00ff00',
  duration = 1.5,
  distance = 80,
  isCombo = false,
  onComplete,
  className = '',
}) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  // Format score with + prefix
  const formattedScore = score > 0 ? `+${score}` : `${score}`;

  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ left: x, top: y }}
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.div
        className="relative font-bold"
        initial={{
          y: 0,
          opacity: 0,
          scale: 0.5,
        }}
        animate={{
          y: -distance,
          opacity: [0, 1, 1, 0],
          scale: isCombo ? [0.5, 1.3, 1.1, 1] : [0.5, 1.2, 1],
        }}
        transition={{
          duration,
          ease: 'easeOut',
          opacity: {
            times: [0, 0.1, 0.7, 1],
          },
          scale: {
            times: isCombo ? [0, 0.3, 0.5, 1] : [0, 0.4, 1],
            type: 'spring',
            stiffness: 300,
            damping: 15,
          },
        }}
        style={{
          color,
          fontSize: isCombo ? '32px' : '24px',
          textShadow: `
            0 0 10px ${color},
            0 0 20px ${color},
            0 0 30px ${color}
          `,
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        {formattedScore}
        {isCombo && (
          <motion.span
            className="ml-2 text-sm"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 400,
              damping: 20,
            }}
          >
            COMBO!
          </motion.span>
        )}
      </motion.div>
    </div>
  );
};
