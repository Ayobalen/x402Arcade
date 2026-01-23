import type { Config } from 'tailwindcss';
import { backgrounds, surfaces, primary, secondary, semantic, text, borders, accents } from './src/styles/tokens/colors';
import { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing } from './src/styles/tokens/typography';
import { spacing, negativeSpacing } from './src/styles/tokens/spacing';
import { borderRadius, borderWidth } from './src/styles/tokens/borders';
import { elevationShadows, glowShadows, combinedShadows } from './src/styles/tokens/shadows';
import { durations, easings, keyframes as animKeyframes } from './src/styles/tokens/animations';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          primary: backgrounds.primary,
          secondary: backgrounds.secondary,
          tertiary: backgrounds.tertiary,
          surface: backgrounds.surface,
          main: backgrounds.main,
        },
        // Surface colors
        surface: {
          primary: surfaces.primary,
          secondary: surfaces.secondary,
          tertiary: surfaces.tertiary,
          border: surfaces.border,
        },
        // Primary accent (cyan)
        primary: {
          DEFAULT: primary.DEFAULT,
          50: primary['50'],
          100: primary['100'],
          200: primary['200'],
          300: primary['300'],
          400: primary['400'],
          500: primary['500'],
          600: primary['600'],
          700: primary['700'],
          800: primary['800'],
          900: primary['900'],
        },
        // Secondary accent (magenta)
        secondary: {
          DEFAULT: secondary.DEFAULT,
          50: secondary['50'],
          100: secondary['100'],
          200: secondary['200'],
          300: secondary['300'],
          400: secondary['400'],
          500: secondary['500'],
          600: secondary['600'],
          700: secondary['700'],
          800: secondary['800'],
          900: secondary['900'],
        },
        // Legacy arcade colors
        arcade: {
          bg: backgrounds.primary,
          secondary: backgrounds.secondary,
          surface: backgrounds.surface,
          border: borders.default,
        },
        // Direct neon colors
        cyan: accents.primary,
        magenta: accents.secondary,
        // Neon semantic colors
        neon: {
          green: semantic.success,
          orange: semantic.warning,
          red: semantic.error,
          blue: semantic.info,
        },
        // Semantic colors
        success: {
          DEFAULT: semantic.success,
          light: semantic.successLight,
          dark: semantic.successDark,
        },
        warning: {
          DEFAULT: semantic.warning,
          light: semantic.warningLight,
          dark: semantic.warningDark,
        },
        error: {
          DEFAULT: semantic.error,
          light: semantic.errorLight,
          dark: semantic.errorDark,
        },
        info: {
          DEFAULT: semantic.info,
          light: semantic.infoLight,
          dark: semantic.infoDark,
        },
        // Text colors
        text: {
          primary: text.primary,
          secondary: text.secondary,
          tertiary: text.tertiary,
          muted: text.muted,
          disabled: text.disabled,
          inverse: text.inverse,
        },
        muted: text.secondary,
        // Border colors
        border: {
          DEFAULT: borders.default,
          subtle: borders.subtle,
          focus: borders.focus,
        },
      },
      fontFamily: {
        display: fontFamilies.display.split(',').map(f => f.trim().replace(/['"]/g, '')),
        body: fontFamilies.body.split(',').map(f => f.trim().replace(/['"]/g, '')),
        code: fontFamilies.code.split(',').map(f => f.trim().replace(/['"]/g, '')),
        mono: fontFamilies.mono.split(',').map(f => f.trim().replace(/['"]/g, '')),
        sans: fontFamilies.sans.split(',').map(f => f.trim().replace(/['"]/g, '')),
      },
      fontSize: {
        xs: fontSizes.xs,
        sm: fontSizes.sm,
        base: fontSizes.base,
        md: fontSizes.md,
        lg: fontSizes.lg,
        xl: fontSizes.xl,
        '2xl': fontSizes['2xl'],
        '3xl': fontSizes['3xl'],
        '4xl': fontSizes['4xl'],
        '5xl': fontSizes['5xl'],
        '6xl': fontSizes['6xl'],
        '7xl': fontSizes['7xl'],
        '8xl': fontSizes['8xl'],
        '9xl': fontSizes['9xl'],
      },
      fontWeight: {
        thin: fontWeights.thin,
        extralight: fontWeights.extralight,
        light: fontWeights.light,
        normal: fontWeights.normal,
        medium: fontWeights.medium,
        semibold: fontWeights.semibold,
        bold: fontWeights.bold,
        extrabold: fontWeights.extrabold,
        black: fontWeights.black,
      },
      lineHeight: {
        none: lineHeights.none,
        tight: lineHeights.tight,
        snug: lineHeights.snug,
        normal: lineHeights.normal,
        relaxed: lineHeights.relaxed,
        loose: lineHeights.loose,
      },
      letterSpacing: {
        tighter: letterSpacing.tighter,
        tight: letterSpacing.tight,
        normal: letterSpacing.normal,
        wide: letterSpacing.wide,
        wider: letterSpacing.wider,
        widest: letterSpacing.widest,
      },
      spacing: {
        ...spacing,
        ...negativeSpacing,
      },
      borderRadius: {
        none: borderRadius.none,
        xs: borderRadius.xs,
        sm: borderRadius.sm,
        DEFAULT: borderRadius.DEFAULT,
        md: borderRadius.md,
        lg: borderRadius.lg,
        xl: borderRadius.xl,
        '2xl': borderRadius['2xl'],
        '3xl': borderRadius['3xl'],
        full: borderRadius.full,
      },
      borderWidth: {
        DEFAULT: borderWidth.DEFAULT,
        '0': borderWidth['0'],
        '2': borderWidth['2'],
        '4': borderWidth['4'],
        '8': borderWidth['8'],
      },
      boxShadow: {
        // Elevation shadows
        xs: elevationShadows.xs,
        sm: elevationShadows.sm,
        DEFAULT: elevationShadows.DEFAULT,
        md: elevationShadows.md,
        lg: elevationShadows.lg,
        xl: elevationShadows.xl,
        '2xl': elevationShadows['2xl'],
        inner: elevationShadows.inner,
        none: elevationShadows.none,
        // Glow shadows
        'glow-cyan': glowShadows.cyan,
        'glow-cyan-md': glowShadows.cyanMd,
        'glow-cyan-lg': glowShadows.cyanLg,
        'glow-cyan-intense': glowShadows.cyanIntense,
        'glow-magenta': glowShadows.magenta,
        'glow-magenta-md': glowShadows.magentaMd,
        'glow-magenta-lg': glowShadows.magentaLg,
        'glow-magenta-intense': glowShadows.magentaIntense,
        'glow-green': glowShadows.green,
        'glow-green-lg': glowShadows.greenLg,
        'glow-orange': glowShadows.orange,
        'glow-orange-lg': glowShadows.orangeLg,
        'glow-red': glowShadows.red,
        'glow-red-lg': glowShadows.redLg,
        'glow-white': glowShadows.white,
        'glow-rainbow': glowShadows.rainbow,
        // Combined shadows
        'card-hover': combinedShadows.cardHover,
        'button-hover': combinedShadows.buttonHover,
        'button-active': combinedShadows.buttonActive,
        modal: combinedShadows.modal,
        dropdown: combinedShadows.dropdown,
        'focus-ring': combinedShadows.focusRing,
        'crt-glow': combinedShadows.crtGlow,
        'neon-border': combinedShadows.neonBorder,
      },
      transitionDuration: {
        instant: durations.instant,
        ultraFast: durations.ultraFast,
        fastest: durations.fastest,
        fast: durations.fast,
        quick: durations.quick,
        DEFAULT: durations.DEFAULT,
        normal: durations.normal,
        moderate: durations.moderate,
        slow: durations.slow,
        slower: durations.slower,
        slowest: durations.slowest,
        languid: durations.languid,
        glacial: durations.glacial,
        eternal: durations.eternal,
      },
      transitionTimingFunction: {
        linear: easings.linear,
        ease: easings.ease,
        'ease-in': easings.easeIn,
        'ease-out': easings.easeOut,
        'ease-in-out': easings.easeInOut,
        'cubic-in': easings.cubicIn,
        'cubic-out': easings.cubicOut,
        'cubic-in-out': easings.cubicInOut,
        'quart-out': easings.quartOut,
        'expo-out': easings.expoOut,
        'back-out': easings.backOut,
        'back-in-out': easings.backInOut,
        'bounce-out': easings.bounceOut,
        spring: easings.spring,
        elastic: easings.elastic,
      },
      animation: {
        'glow-pulse': `${animKeyframes.glowPulse} 2s ease-in-out infinite`,
        pulse: `${animKeyframes.pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
        spin: `${animKeyframes.spin} 1s linear infinite`,
        bounce: `${animKeyframes.bounce} 1s infinite`,
        ping: `${animKeyframes.ping} 1s cubic-bezier(0, 0, 0.2, 1) infinite`,
        'neon-flicker': `${animKeyframes.neonFlicker} 2s linear infinite`,
        'fade-in': `${animKeyframes.fadeIn} 200ms ease-out`,
        'fade-out': `${animKeyframes.fadeOut} 200ms ease-in`,
        'slide-in-up': `${animKeyframes.slideInUp} 300ms ease-out`,
        'slide-in-down': `${animKeyframes.slideInDown} 300ms ease-out`,
        'scale-in': `${animKeyframes.scaleIn} 200ms ease-out`,
        'score-pop': `${animKeyframes.scorePop} 300ms ease-out`,
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' },
        },
        [animKeyframes.fadeIn]: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        [animKeyframes.fadeOut]: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        [animKeyframes.slideInUp]: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        [animKeyframes.slideInDown]: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        [animKeyframes.scaleIn]: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        [animKeyframes.pulse]: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        [animKeyframes.bounce]: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        [animKeyframes.ping]: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        [animKeyframes.spin]: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        [animKeyframes.glowPulse]: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.6)' },
        },
        [animKeyframes.neonFlicker]: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '0.99' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.4' },
        },
        [animKeyframes.scorePop]: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
