/**
 * Theme Store
 *
 * Manages theme state, variations, and persistence for the x402Arcade app.
 * Supports multiple arcade-inspired theme variations with smooth transitions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

/**
 * Available theme variations
 * - classic: Original cyan/magenta neon arcade theme (default)
 * - retro: Amber/green CRT monitor aesthetic
 * - cyberpunk: Purple/pink futuristic neon
 * - vapor: Pastel pink/blue vaporwave aesthetic
 */
export type ThemeVariation = 'classic' | 'retro' | 'cyberpunk' | 'vapor';

/**
 * Theme mode (future light theme support)
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Per-game theme override (optional feature)
 */
export type GameTheme = {
  game: 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders';
  theme: ThemeVariation;
};

/**
 * Theme configuration - Complete color palette
 */
export interface ThemeConfig {
  name: string;
  displayName: string;
  description: string;
  colors: {
    // Primary theme colors
    primary: string;
    primaryHover: string;
    primaryGlow: string;
    secondary: string;
    secondaryHover: string;
    secondaryGlow: string;
    accent?: string;
    accentGlow?: string;

    // Background colors
    bgMain: string; // Main background
    bgSurface: string; // Cards, panels
    bgElevated: string; // Modals, dropdowns
    bgHover: string; // Hover state for surfaces

    // Text colors
    textPrimary: string; // Main text
    textSecondary: string; // Secondary text
    textMuted: string; // Muted/disabled text
    textInverse: string; // Text on colored backgrounds

    // Border colors
    border: string; // Default borders
    borderHover: string; // Hover borders
    borderFocus: string; // Focus borders

    // Background gradient (for main background effect)
    bgGradientStart: string;
    bgGradientEnd: string;

    // Special states
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

/**
 * Theme store state
 */
export interface ThemeState {
  // Current theme settings
  variation: ThemeVariation;
  mode: ThemeMode;
  gameThemes: GameTheme[];
  glowIntensity: number; // 0-100, controls glow effects intensity

  // Theme configurations
  themes: Record<ThemeVariation, ThemeConfig>;

  // Actions
  setVariation: (variation: ThemeVariation) => void;
  setMode: (mode: ThemeMode) => void;
  setGameTheme: (game: GameTheme['game'], theme: ThemeVariation) => void;
  removeGameTheme: (game: GameTheme['game']) => void;
  setGlowIntensity: (intensity: number) => void;
  resetToDefaults: () => void;

  // Utilities
  getActiveTheme: () => ThemeConfig;
  getGameTheme: (game: GameTheme['game']) => ThemeVariation;
}

// ============================================
// THEME CONFIGURATIONS
// ============================================

const themeConfigurations: Record<ThemeVariation, ThemeConfig> = {
  classic: {
    name: 'classic',
    displayName: 'Classic Neon',
    description: 'Original cyan and magenta arcade aesthetic',
    colors: {
      primary: '#00ffff', // Cyan
      primaryHover: '#33ffff',
      primaryGlow: 'rgba(0, 255, 255, 0.4)',
      secondary: '#ff00ff', // Magenta
      secondaryHover: '#ff33ff',
      secondaryGlow: 'rgba(255, 0, 255, 0.4)',

      // Backgrounds
      bgMain: '#0a0a0f',
      bgSurface: '#141420',
      bgElevated: '#1a1a2e',
      bgHover: '#1f1f35',

      // Text
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      textInverse: '#0f1419',

      // Borders
      border: '#2d2d4a',
      borderHover: '#3d3d5a',
      borderFocus: '#00ffff',

      // Background gradient
      bgGradientStart: '#0a0a0f',
      bgGradientEnd: '#1a0a2e',

      // States
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff4466',
      info: '#00d9ff',
    },
  },
  retro: {
    name: 'retro',
    displayName: 'Retro CRT',
    description: 'Amber and green CRT monitor vibes',
    colors: {
      primary: '#ffaa00', // Amber
      primaryHover: '#ffcc66',
      primaryGlow: 'rgba(255, 170, 0, 0.4)',
      secondary: '#00ff88', // Green
      secondaryHover: '#66ffbb',
      secondaryGlow: 'rgba(0, 255, 136, 0.4)',
      accent: '#ff6600', // Orange accent
      accentGlow: 'rgba(255, 102, 0, 0.4)',

      // Backgrounds - warm dark browns
      bgMain: '#0f0a05',
      bgSurface: '#1a1408',
      bgElevated: '#251f15',
      bgHover: '#2f2820',

      // Text - amber/green tints
      textPrimary: '#ffeed0',
      textSecondary: '#d4c5a0',
      textMuted: '#8a7a60',
      textInverse: '#1a1408',

      // Borders - warm browns
      border: '#3d3420',
      borderHover: '#4d4430',
      borderFocus: '#ffaa00',

      // Background gradient
      bgGradientStart: '#0f0a05',
      bgGradientEnd: '#1a1000',

      // States
      success: '#00ff88',
      warning: '#ffcc00',
      error: '#ff4400',
      info: '#66ccff',
    },
  },
  cyberpunk: {
    name: 'cyberpunk',
    displayName: 'Cyberpunk',
    description: 'Purple and pink futuristic neon',
    colors: {
      primary: '#a855f7', // Purple
      primaryHover: '#c084fc',
      primaryGlow: 'rgba(168, 85, 247, 0.4)',
      secondary: '#ec4899', // Pink
      secondaryHover: '#f472b6',
      secondaryGlow: 'rgba(236, 72, 153, 0.4)',
      accent: '#3b82f6', // Blue accent
      accentGlow: 'rgba(59, 130, 246, 0.4)',

      // Backgrounds - deep purples
      bgMain: '#0c0a15',
      bgSurface: '#1a1428',
      bgElevated: '#251d35',
      bgHover: '#302842',

      // Text - bright with purple tint
      textPrimary: '#f8f7fc',
      textSecondary: '#d4c9f0',
      textMuted: '#8b7fa8',
      textInverse: '#1a1428',

      // Borders - purple-tinted
      border: '#3d2d5a',
      borderHover: '#4d3d6a',
      borderFocus: '#a855f7',

      // Background gradient
      bgGradientStart: '#0c0a15',
      bgGradientEnd: '#1a0a28',

      // States
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  vapor: {
    name: 'vapor',
    displayName: 'Vaporwave',
    description: 'Pastel pink and blue aesthetic',
    colors: {
      primary: '#ff6ec7', // Hot pink
      primaryHover: '#ff8fd4',
      primaryGlow: 'rgba(255, 110, 199, 0.4)',
      secondary: '#00d9ff', // Sky blue
      secondaryHover: '#66e5ff',
      secondaryGlow: 'rgba(0, 217, 255, 0.4)',
      accent: '#b19cd9', // Lavender
      accentGlow: 'rgba(177, 156, 217, 0.4)',

      // Backgrounds - deep purple/pink
      bgMain: '#120a18',
      bgSurface: '#1f142a',
      bgElevated: '#2c1f3f',
      bgHover: '#3a2850',

      // Text - light pastels
      textPrimary: '#fff5fc',
      textSecondary: '#e5d0f0',
      textMuted: '#a085b5',
      textInverse: '#1f142a',

      // Borders - pastel-tinted
      border: '#4d3560',
      borderHover: '#5d4570',
      borderFocus: '#ff6ec7',

      // Background gradient
      bgGradientStart: '#120a18',
      bgGradientEnd: '#1a0a28',

      // States
      success: '#6ee7b7',
      warning: '#fbbf24',
      error: '#fb7185',
      info: '#67e8f9',
    },
  },
};

// ============================================
// THEME STORE
// ============================================

/**
 * Zustand store for theme management with persistence
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      variation: 'classic',
      mode: 'dark',
      gameThemes: [],
      glowIntensity: 100, // 0-100, default full glow
      themes: themeConfigurations,

      // Set theme variation
      setVariation: (variation: ThemeVariation) => {
        set({ variation });
        applyThemeToDOM(variation, get().mode, get().glowIntensity);
      },

      // Set theme mode (dark/light)
      setMode: (mode: ThemeMode) => {
        set({ mode });
        applyThemeToDOM(get().variation, mode, get().glowIntensity);
      },

      // Set per-game theme override
      setGameTheme: (game: GameTheme['game'], theme: ThemeVariation) => {
        set((state) => ({
          gameThemes: [...state.gameThemes.filter((gt) => gt.game !== game), { game, theme }],
        }));
      },

      // Remove per-game theme override
      removeGameTheme: (game: GameTheme['game']) => {
        set((state) => ({
          gameThemes: state.gameThemes.filter((gt) => gt.game !== game),
        }));
      },

      // Set glow intensity (0-100)
      setGlowIntensity: (intensity: number) => {
        const clampedIntensity = Math.max(0, Math.min(100, intensity));
        set({ glowIntensity: clampedIntensity });
        // Re-apply theme with new glow intensity
        applyThemeToDOM(get().variation, get().mode, clampedIntensity);
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({ variation: 'classic', mode: 'dark', gameThemes: [], glowIntensity: 100 });
        applyThemeToDOM('classic', 'dark', 100);
      },

      // Get active theme configuration
      getActiveTheme: () => {
        const state = get();
        return state.themes[state.variation];
      },

      // Get theme for specific game (with fallback to global)
      getGameTheme: (game: GameTheme['game']) => {
        const state = get();
        const gameTheme = state.gameThemes.find((gt) => gt.game === game);
        return gameTheme?.theme || state.variation;
      },
    }),
    {
      name: 'x402-theme-storage', // localStorage key
      partialize: (state) => ({
        variation: state.variation,
        mode: state.mode,
        gameThemes: state.gameThemes,
        glowIntensity: state.glowIntensity,
      }),
    }
  )
);

// ============================================
// DOM MANIPULATION
// ============================================

/**
 * Apply theme to DOM by setting CSS custom properties
 */
function applyThemeToDOM(variation: ThemeVariation, mode: ThemeMode, glowIntensity: number = 100): void {
  const root = document.documentElement;
  const theme = themeConfigurations[variation];

  // Set data attributes for CSS selectors
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-theme-variation', variation);

  // Apply primary/secondary/accent colors
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
  root.style.setProperty('--color-primary-glow', theme.colors.primaryGlow);

  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-secondary-hover', theme.colors.secondaryHover);
  root.style.setProperty('--color-secondary-glow', theme.colors.secondaryGlow);

  if (theme.colors.accent) {
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-accent-glow', theme.colors.accentGlow || '');
  }

  // Apply background colors
  root.style.setProperty('--color-bg-main', theme.colors.bgMain);
  root.style.setProperty('--color-bg-surface', theme.colors.bgSurface);
  root.style.setProperty('--color-bg-elevated', theme.colors.bgElevated);
  root.style.setProperty('--color-bg-hover', theme.colors.bgHover);

  // Apply text colors
  root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-text-inverse', theme.colors.textInverse);

  // Apply border colors
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-border-hover', theme.colors.borderHover);
  root.style.setProperty('--color-border-focus', theme.colors.borderFocus);

  // Apply background gradient
  root.style.setProperty('--color-bg-gradient-start', theme.colors.bgGradientStart);
  root.style.setProperty('--color-bg-gradient-end', theme.colors.bgGradientEnd);

  // Apply state colors
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-info', theme.colors.info);

  // Update glow shadows to match theme with intensity
  updateGlowShadows(theme, glowIntensity);
}

/**
 * Update glow shadow CSS variables based on theme colors and intensity
 */
function updateGlowShadows(theme: ThemeConfig, glowIntensity: number = 100): void {
  const root = document.documentElement;

  // Extract RGB from hex color
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 255, 255';
  };

  const primaryRgb = hexToRgb(theme.colors.primary);
  const secondaryRgb = hexToRgb(theme.colors.secondary);

  // Calculate intensity multiplier (0-1)
  const intensity = glowIntensity / 100;

  // If intensity is 0, remove all glows (set to 'none')
  if (intensity === 0) {
    root.style.setProperty('--glow-cyan', 'none');
    root.style.setProperty('--glow-cyan-md', 'none');
    root.style.setProperty('--glow-cyan-lg', 'none');
    root.style.setProperty('--glow-cyan-intense', 'none');
    root.style.setProperty('--glow-magenta', 'none');
    root.style.setProperty('--glow-magenta-md', 'none');
    root.style.setProperty('--glow-magenta-lg', 'none');
    root.style.setProperty('--glow-magenta-intense', 'none');
    return;
  }

  // Apply intensity multiplier to alpha values
  // Update primary glows
  root.style.setProperty('--glow-cyan', `0 0 10px rgba(${primaryRgb}, ${0.3 * intensity})`);
  root.style.setProperty('--glow-cyan-md', `0 0 20px rgba(${primaryRgb}, ${0.4 * intensity})`);
  root.style.setProperty(
    '--glow-cyan-lg',
    `0 0 30px rgba(${primaryRgb}, ${0.5 * intensity}), 0 0 60px rgba(${primaryRgb}, ${0.3 * intensity})`
  );
  root.style.setProperty(
    '--glow-cyan-intense',
    `0 0 20px rgba(${primaryRgb}, ${0.6 * intensity}), 0 0 40px rgba(${primaryRgb}, ${0.4 * intensity}), 0 0 60px rgba(${primaryRgb}, ${0.2 * intensity})`
  );

  // Update secondary glows
  root.style.setProperty('--glow-magenta', `0 0 10px rgba(${secondaryRgb}, ${0.3 * intensity})`);
  root.style.setProperty('--glow-magenta-md', `0 0 20px rgba(${secondaryRgb}, ${0.4 * intensity})`);
  root.style.setProperty(
    '--glow-magenta-lg',
    `0 0 30px rgba(${secondaryRgb}, ${0.5 * intensity}), 0 0 60px rgba(${secondaryRgb}, ${0.3 * intensity})`
  );
  root.style.setProperty(
    '--glow-magenta-intense',
    `0 0 20px rgba(${secondaryRgb}, ${0.6 * intensity}), 0 0 40px rgba(${secondaryRgb}, ${0.4 * intensity}), 0 0 60px rgba(${secondaryRgb}, ${0.2 * intensity})`
  );
}

// ============================================
// SELECTORS
// ============================================

/**
 * Select current theme variation
 */
export const selectThemeVariation = (state: ThemeState) => state.variation;

/**
 * Select current theme mode
 */
export const selectThemeMode = (state: ThemeState) => state.mode;

/**
 * Select active theme configuration
 */
export const selectActiveTheme = (state: ThemeState) => state.getActiveTheme();

/**
 * Select all available themes
 */
export const selectAllThemes = (state: ThemeState) => state.themes;

/**
 * Select game-specific themes
 */
export const selectGameThemes = (state: ThemeState) => state.gameThemes;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize theme on app load
 * Call this in main.tsx or App.tsx
 */
export function initializeTheme(): void {
  const state = useThemeStore.getState();
  applyThemeToDOM(state.variation, state.mode, state.glowIntensity);
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to get current theme variation
 */
export function useThemeVariation() {
  return useThemeStore(selectThemeVariation);
}

/**
 * Hook to get current theme mode
 */
export function useThemeMode() {
  return useThemeStore(selectThemeMode);
}

/**
 * Hook to get active theme configuration
 */
export function useActiveTheme() {
  return useThemeStore(selectActiveTheme);
}

/**
 * Hook to get all available themes
 */
export function useAllThemes() {
  return useThemeStore(selectAllThemes);
}

/**
 * Hook to get glow intensity
 */
export function useGlowIntensity() {
  return useThemeStore((state) => state.glowIntensity);
}

/**
 * Hook to get theme actions
 */
export function useThemeActions() {
  return {
    setVariation: useThemeStore((state) => state.setVariation),
    setMode: useThemeStore((state) => state.setMode),
    setGameTheme: useThemeStore((state) => state.setGameTheme),
    removeGameTheme: useThemeStore((state) => state.removeGameTheme),
    setGlowIntensity: useThemeStore((state) => state.setGlowIntensity),
    resetToDefaults: useThemeStore((state) => state.resetToDefaults),
  };
}
