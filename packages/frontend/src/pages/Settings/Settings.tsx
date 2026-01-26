/**
 * Settings Page
 *
 * User settings and preferences including theme customization.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Volume2, Accessibility } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

export const Settings: React.FC = () => {
  // Set page title
  useEffect(() => {
    document.title = 'Settings - x402Arcade';
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3">
            <SettingsIcon
              size={40}
              className="text-[var(--color-primary)]"
              style={{ filter: 'drop-shadow(0 0 10px var(--color-primary-glow))' }}
            />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
              Settings
            </h1>
          </div>
          <p className="text-lg text-[var(--color-text-tertiary)] max-w-2xl mx-auto">
            Customize your arcade experience
          </p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <motion.section
            className="
              p-6 rounded-xl bg-[var(--color-surface-primary)]
              border border-[var(--color-border)]
              shadow-[var(--shadow-lg)]
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ThemeSwitcher mode="panel" />
          </motion.section>

          {/* Audio Settings Placeholder */}
          <motion.section
            className="
              p-6 rounded-xl bg-[var(--color-surface-primary)]
              border border-[var(--color-border)]
              shadow-[var(--shadow-lg)]
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Volume2
                size={24}
                className="text-[var(--color-secondary)]"
                style={{ filter: 'drop-shadow(0 0 8px var(--color-secondary-glow))' }}
              />
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
                  Audio Settings
                </h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Control sound effects and music
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Sound Effects
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    Game sound effects volume
                  </p>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Controlled in games
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Background Music
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    Lobby and menu music
                  </p>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Controlled in games
                </div>
              </div>
            </div>
          </motion.section>

          {/* Accessibility Settings Placeholder */}
          <motion.section
            className="
              p-6 rounded-xl bg-[var(--color-surface-primary)]
              border border-[var(--color-border)]
              shadow-[var(--shadow-lg)]
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Accessibility
                size={24}
                className="text-[var(--color-success)]"
                style={{ filter: 'drop-shadow(0 0 8px var(--color-success-glow))' }}
              />
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
                  Accessibility
                </h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Accessibility features and preferences
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Audio Accessibility
                </p>
                <ul className="space-y-2 text-xs text-[var(--color-text-tertiary)]">
                  <li>✓ Sound indicators for gameplay events</li>
                  <li>✓ Audio subtitles for important sounds</li>
                  <li>✓ Visual feedback for audio cues</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Keyboard Navigation
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Press{' '}
                  <kbd className="px-2 py-1 bg-[var(--color-surface-tertiary)] rounded border border-[var(--color-border)] font-mono">
                    ?
                  </kbd>{' '}
                  in-game to view keyboard shortcuts
                </p>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Footer Info */}
        <motion.div
          className="text-center pt-8 border-t border-[var(--color-border)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Settings are automatically saved to your browser
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
