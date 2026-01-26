import React from 'react';
import { colors, fonts } from '../lib/designTokens';

interface GradientTextProps {
  children: React.ReactNode;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: 'display' | 'body' | 'mono';
  from?: string;
  to?: string;
  glowIntensity?: number;
  style?: React.CSSProperties;
}

/**
 * Text with gradient fill and glow (for hero/emphasis text)
 */
export const GradientText: React.FC<GradientTextProps> = ({
  children,
  fontSize = 96,
  fontWeight = 900,
  fontFamily = 'display',
  from = colors.primary,
  to = colors.secondary,
  glowIntensity = 1,
  style = {},
}) => {
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
        fontWeight,
        fontFamily: getFontFamily(),
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${from})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
