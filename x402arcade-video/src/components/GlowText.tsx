import React from 'react';
import { colors, fonts, glows } from '../lib/designTokens';

type GlowType = 'cyan' | 'magenta' | 'green' | 'red' | 'none';

interface GlowTextProps {
  children: React.ReactNode;
  fontSize?: number;
  fontFamily?: 'display' | 'body' | 'mono';
  glow?: GlowType;
  color?: string;
  style?: React.CSSProperties;
}

/**
 * Text component with glow effects
 */
export const GlowText: React.FC<GlowTextProps> = ({
  children,
  fontSize = 48,
  fontFamily = 'display',
  glow = 'cyan',
  color,
  style = {},
}) => {
  const getGlow = () => {
    switch (glow) {
      case 'cyan':
        return glows.cyanMd;
      case 'magenta':
        return glows.magentaMd;
      case 'green':
        return glows.greenLg;
      case 'red':
        return glows.red;
      default:
        return 'none';
    }
  };

  const getColor = () => {
    if (color) return color;
    switch (glow) {
      case 'cyan':
        return colors.primary;
      case 'magenta':
        return colors.secondary;
      case 'green':
        return colors.success;
      case 'red':
        return colors.error;
      default:
        return colors.textPrimary;
    }
  };

  const getFontFamily = () => {
    switch (fontFamily) {
      case 'display':
        return fonts.display;
      case 'body':
        return fonts.body;
      case 'mono':
        return fonts.mono;
    }
  };

  return (
    <div
      style={{
        fontSize,
        fontFamily: getFontFamily(),
        color: getColor(),
        textShadow: getGlow(),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
