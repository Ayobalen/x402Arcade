/**
 * ThemeSwitcher Component
 *
 * Allows users to switch between theme variations with a visual preview.
 * Features smooth transitions and arcade-styled UI.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, X } from 'lucide-react';
import {
  useThemeVariation,
  useThemeActions,
  useAllThemes,
  type ThemeVariation,
} from '../../../stores/themeStore';

// ============================================
// THEME PREVIEWS
// ============================================

/**
 * Visual preview of each theme showing colors
 */
const ThemePreview: React.FC<{
  variation: ThemeVariation;
  isActive: boolean;
  onClick: () => void;
}> = ({ variation, isActive, onClick }) => {
  const themes = useAllThemes();
  const theme = themes[variation];

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col gap-3 p-4 rounded-lg border-2 transition-all
        ${
          isActive
            ? 'border-current shadow-lg'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
        }
        bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-secondary)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]
        focus:ring-[var(--color-primary)]
      `}
      style={{
        color: isActive ? theme.colors.primary : 'var(--color-text-primary)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute top-2 right-2 p-1 rounded-full"
          style={{
            backgroundColor: theme.colors.primary,
            color: 'var(--color-bg-primary)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Check size={14} strokeWidth={3} />
        </motion.div>
      )}

      {/* Theme name */}
      <div className="flex flex-col items-start gap-1">
        <h3 className="font-display text-sm font-semibold">{theme.displayName}</h3>
        <p className="text-xs text-[var(--color-text-tertiary)]">{theme.description}</p>
      </div>

      {/* Color swatches */}
      <div className="flex gap-2">
        <div
          className="w-8 h-8 rounded border border-[var(--color-border)]"
          style={{
            backgroundColor: theme.colors.primary,
            boxShadow: `0 0 10px ${theme.colors.primaryGlow}`,
          }}
          title="Primary color"
        />
        <div
          className="w-8 h-8 rounded border border-[var(--color-border)]"
          style={{
            backgroundColor: theme.colors.secondary,
            boxShadow: `0 0 10px ${theme.colors.secondaryGlow}`,
          }}
          title="Secondary color"
        />
        {theme.colors.accent && (
          <div
            className="w-8 h-8 rounded border border-[var(--color-border)]"
            style={{
              backgroundColor: theme.colors.accent,
              boxShadow: `0 0 10px ${theme.colors.accentGlow}`,
            }}
            title="Accent color"
          />
        )}
      </div>
    </motion.button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export interface ThemeSwitcherProps {
  /**
   * Display mode: 'panel' (full panel) or 'compact' (icon button with dropdown)
   * @default 'panel'
   */
  mode?: 'panel' | 'compact';

  /**
   * Callback when theme changes
   */
  onThemeChange?: (theme: ThemeVariation) => void;
}

/**
 * ThemeSwitcher Component
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ mode = 'panel', onThemeChange }) => {
  const currentVariation = useThemeVariation();
  const { setVariation, resetToDefaults } = useThemeActions();
  const themes = useAllThemes();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: ThemeVariation[] = ['classic', 'retro', 'cyberpunk', 'vapor'];

  const handleThemeChange = (variation: ThemeVariation) => {
    setVariation(variation);
    onThemeChange?.(variation);

    // Auto-close in compact mode
    if (mode === 'compact') {
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    onThemeChange?.('classic');
  };

  // Compact mode: icon button with dropdown
  if (mode === 'compact') {
    return (
      <div className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            p-2 rounded-lg border border-[var(--color-border)]
            bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-secondary)]
            text-[var(--color-text-primary)] hover:text-[var(--color-primary)]
            transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
          "
          aria-label="Change theme"
          aria-expanded={isOpen}
        >
          <Palette size={20} />
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[var(--z-modal-backdrop)]"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown */}
              <motion.div
                className="
                  absolute right-0 top-full mt-2 p-4 rounded-lg
                  bg-[var(--color-surface-primary)] border border-[var(--color-border)]
                  shadow-[var(--shadow-lg)] z-[var(--z-dropdown)]
                  min-w-[280px]
                "
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
                    Choose Theme
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-[var(--color-surface-secondary)] transition-colors"
                    aria-label="Close theme switcher"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid gap-3">
                  {themeOptions.map((variation) => (
                    <ThemePreview
                      key={variation}
                      variation={variation}
                      isActive={currentVariation === variation}
                      onClick={() => handleThemeChange(variation)}
                    />
                  ))}
                </div>

                {currentVariation !== 'classic' && (
                  <button
                    onClick={handleReset}
                    className="
                      mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium
                      bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)]
                      text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                      transition-colors border border-[var(--color-border)]
                    "
                  >
                    Reset to Classic
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Panel mode: full theme selection panel
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette
            size={24}
            className="text-[var(--color-primary)]"
            style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }}
          />
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              Theme Customization
            </h2>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
              Choose your arcade aesthetic
            </p>
          </div>
        </div>

        {currentVariation !== 'classic' && (
          <button
            onClick={handleReset}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)]
              text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
              transition-colors border border-[var(--color-border)]
            "
          >
            Reset to Classic
          </button>
        )}
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themeOptions.map((variation) => (
          <ThemePreview
            key={variation}
            variation={variation}
            isActive={currentVariation === variation}
            onClick={() => handleThemeChange(variation)}
          />
        ))}
      </div>

      {/* Current theme info */}
      <div className="p-4 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
          Active Theme
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-[var(--color-primary)]">
            {themes[currentVariation].displayName}
          </span>
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded border border-[var(--color-border)]"
              style={{
                backgroundColor: themes[currentVariation].colors.primary,
                boxShadow: `0 0 8px ${themes[currentVariation].colors.primaryGlow}`,
              }}
            />
            <div
              className="w-6 h-6 rounded border border-[var(--color-border)]"
              style={{
                backgroundColor: themes[currentVariation].colors.secondary,
                boxShadow: `0 0 8px ${themes[currentVariation].colors.secondaryGlow}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
