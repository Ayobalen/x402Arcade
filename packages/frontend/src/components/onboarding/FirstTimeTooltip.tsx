/**
 * FirstTimeTooltip Component
 *
 * Shows contextual tooltips to first-time users.
 * Automatically dismisses after interaction or manual close.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores';
import { X } from 'lucide-react';

interface FirstTimeTooltipProps {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function FirstTimeTooltip({
  id,
  target,
  title,
  content,
  placement = 'bottom',
  delay = 500,
}: FirstTimeTooltipProps) {
  const { showTooltips, dismissedTooltips, registerTooltip, dismissTooltip } = useOnboardingStore();

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const isDismissed = dismissedTooltips.includes(id);
  const shouldShow = showTooltips && !isDismissed;

  useEffect(() => {
    if (!shouldShow) return;

    // Register tooltip
    registerTooltip({
      id,
      target,
      title,
      content,
      placement,
    });

    // Show after delay
    const timer = setTimeout(() => {
      const targetElement = document.querySelector(target);
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setPosition({ top, left });
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldShow, id, target, title, content, placement, delay, registerTooltip]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => dismissTooltip(id), 300);
  };

  if (!shouldShow || !isVisible) return null;

  const placementStyles = {
    top: 'transform -translate-x-1/2 -translate-y-full',
    bottom: 'transform -translate-x-1/2',
    left: 'transform -translate-x-full -translate-y-1/2',
    right: 'transform -translate-y-1/2',
  };

  const arrowStyles = {
    top: 'bottom-[-8px] left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#1a1a2e]',
    bottom:
      'top-[-8px] left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[#1a1a2e]',
    left: 'right-[-8px] top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[#1a1a2e]',
    right:
      'left-[-8px] top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#1a1a2e]',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`fixed z-[9999] ${placementStyles[placement]}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {/* Arrow */}
          <div className={`absolute w-0 h-0 ${arrowStyles[placement]}`} />

          {/* Tooltip Content */}
          <div className="bg-[#1a1a2e] border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 p-4 max-w-xs relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss tooltip"
            >
              <X size={16} />
            </button>

            {/* Title */}
            <h4 className="text-sm font-semibold text-cyan-400 mb-2 pr-6">{title}</h4>

            {/* Content */}
            <p className="text-xs text-slate-300 leading-relaxed">{content}</p>

            {/* Dismiss link */}
            <button
              onClick={handleDismiss}
              className="text-xs text-cyan-400 hover:text-cyan-300 mt-3 transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
