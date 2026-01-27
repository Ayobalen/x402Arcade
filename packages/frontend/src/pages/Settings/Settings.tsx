/**
 * Settings Page
 *
 * User settings and preferences including theme customization.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Volume2, Accessibility, Sparkles } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { useGlowIntensity, useThemeActions } from '@/stores/themeStore';

export const Settings: React.FC = () => {
  const glowIntensity = useGlowIntensity();
  const { setGlowIntensity } = useThemeActions();

  // Set page title
  useEffect(() => {
    document.title = 'Settings - x402Arcade';
  }, []);

  return (
    <div className="w-full">
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
              className="text-theme-primary drop-shadow-theme-glow"
            />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-theme-text-primary">
              Settings
            </h1>
          </div>
          <p className="text-lg text-theme-text-secondary max-w-2xl mx-auto">
            Customize your arcade experience - change themes to see everything sync!
          </p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <motion.section
            className="
              p-6 rounded-xl bg-theme-bg-elevated
              border-2 border-theme-primary/30
              shadow-theme-glow-md
              hover:border-theme-primary/50
              transition-all duration-300
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ThemeSwitcher mode="panel" />
          </motion.section>

          {/* Visual Effects Settings */}
          <motion.section
            className="
              p-6 rounded-xl bg-theme-bg-elevated
              border border-theme-border
              shadow-md
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles
                size={24}
                className="text-theme-primary drop-shadow-theme-glow"
              />
              <div>
                <h2 className="font-display text-xl font-bold text-theme-text-primary">
                  Visual Effects
                </h2>
                <p className="text-sm text-theme-text-secondary mt-1">
                  Customize neon glow intensity and visual effects
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-theme-bg-main border border-theme-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-theme-text-primary">
                      Glow Intensity
                    </p>
                    <p className="text-xs text-theme-text-secondary mt-1">
                      Adjust the intensity of neon glow effects
                    </p>
                  </div>
                  <span className="text-lg font-bold text-theme-primary tabular-nums">
                    {glowIntensity}%
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={glowIntensity}
                    onChange={(e) => setGlowIntensity(Number(e.target.value))}
                    className="
                      w-full h-2 rounded-full appearance-none cursor-pointer
                      bg-theme-bg-elevated
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-theme-primary
                      [&::-webkit-slider-thumb]:shadow-theme-glow
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-theme-primary
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:shadow-theme-glow
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:transition-all
                      [&::-moz-range-thumb]:hover:scale-110
                    "
                  />
                  <div className="flex justify-between text-xs text-theme-text-muted">
                    <span>0% - No Glow</span>
                    <span>50% - Balanced</span>
                    <span>100% - Full Neon</span>
                  </div>
                </div>

                {/* Preview hint */}
                <p className="text-xs text-theme-text-secondary mt-3 text-center">
                  Changes apply instantly - see the glow adjust in real-time!
                </p>
              </div>
            </div>
          </motion.section>

          {/* Audio Settings Placeholder */}
          <motion.section
            className="
              p-6 rounded-xl bg-theme-bg-elevated
              border border-theme-border
              shadow-md
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Volume2
                size={24}
                className="text-theme-secondary drop-shadow-theme-glow-secondary"
              />
              <div>
                <h2 className="font-display text-xl font-bold text-theme-text-primary">
                  Audio Settings
                </h2>
                <p className="text-sm text-theme-text-secondary mt-1">
                  Control sound effects and music
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-theme-bg-main border border-theme-border">
                <div>
                  <p className="text-sm font-medium text-theme-text-primary">
                    Sound Effects
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-1">
                    Game sound effects volume
                  </p>
                </div>
                <div className="text-sm text-theme-text-muted">
                  Controlled in games
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-theme-bg-main border border-theme-border">
                <div>
                  <p className="text-sm font-medium text-theme-text-primary">
                    Background Music
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-1">
                    Lobby and menu music
                  </p>
                </div>
                <div className="text-sm text-theme-text-muted">
                  Controlled in games
                </div>
              </div>
            </div>
          </motion.section>

          {/* Accessibility Settings Placeholder */}
          <motion.section
            className="
              p-6 rounded-xl bg-theme-bg-elevated
              border border-theme-border
              shadow-md
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Accessibility
                size={24}
                className="text-theme-success drop-shadow-[0_0_8px_var(--color-success)]"
              />
              <div>
                <h2 className="font-display text-xl font-bold text-theme-text-primary">
                  Accessibility
                </h2>
                <p className="text-sm text-theme-text-secondary mt-1">
                  Accessibility features and preferences
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-theme-bg-main border border-theme-border">
                <p className="text-sm font-medium text-theme-text-primary mb-2">
                  Audio Accessibility
                </p>
                <ul className="space-y-2 text-xs text-theme-text-secondary">
                  <li>✓ Sound indicators for gameplay events</li>
                  <li>✓ Audio subtitles for important sounds</li>
                  <li>✓ Visual feedback for audio cues</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-theme-bg-main border border-theme-border">
                <p className="text-sm font-medium text-theme-text-primary mb-2">
                  Keyboard Navigation
                </p>
                <p className="text-xs text-theme-text-secondary">
                  Press{' '}
                  <kbd className="px-2 py-1 bg-theme-bg-elevated rounded border border-theme-border font-mono text-theme-primary">
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
          className="text-center pt-8 border-t border-theme-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-theme-text-muted">
            Settings are automatically saved to your browser
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
