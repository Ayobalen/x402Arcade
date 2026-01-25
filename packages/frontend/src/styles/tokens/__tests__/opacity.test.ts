import { describe, it, expect } from 'vitest';
import { opacity, semanticOpacity, overlayOpacity, glowOpacity } from '../opacity';

describe('Opacity Tokens', () => {
  describe('opacity scale', () => {
    it('should export all opacity values from 0 to 100', () => {
      expect(opacity[0]).toBe('0');
      expect(opacity[5]).toBe('0.05');
      expect(opacity[10]).toBe('0.1');
      expect(opacity[15]).toBe('0.15');
      expect(opacity[20]).toBe('0.2');
      expect(opacity[25]).toBe('0.25');
      expect(opacity[30]).toBe('0.3');
      expect(opacity[35]).toBe('0.35');
      expect(opacity[40]).toBe('0.4');
      expect(opacity[45]).toBe('0.45');
      expect(opacity[50]).toBe('0.5');
      expect(opacity[55]).toBe('0.55');
      expect(opacity[60]).toBe('0.6');
      expect(opacity[65]).toBe('0.65');
      expect(opacity[70]).toBe('0.7');
      expect(opacity[75]).toBe('0.75');
      expect(opacity[80]).toBe('0.8');
      expect(opacity[85]).toBe('0.85');
      expect(opacity[90]).toBe('0.9');
      expect(opacity[95]).toBe('0.95');
      expect(opacity[100]).toBe('1');
    });

    it('should use numeric string values between 0 and 1', () => {
      Object.values(opacity).forEach((value) => {
        const numValue = parseFloat(value);
        expect(numValue).toBeGreaterThanOrEqual(0);
        expect(numValue).toBeLessThanOrEqual(1);
      });
    });

    it('should have 21 opacity levels (0-100 in 5% increments)', () => {
      expect(Object.keys(opacity)).toHaveLength(21);
    });
  });

  describe('semanticOpacity', () => {
    it('should export all semantic opacity values', () => {
      expect(semanticOpacity.invisible).toBe(opacity[0]);
      expect(semanticOpacity.ghost).toBe(opacity[5]);
      expect(semanticOpacity.whisper).toBe(opacity[10]);
      expect(semanticOpacity.faint).toBe(opacity[20]);
      expect(semanticOpacity.disabled).toBe(opacity[40]);
      expect(semanticOpacity.muted).toBe(opacity[50]);
      expect(semanticOpacity.dimmed).toBe(opacity[60]);
      expect(semanticOpacity.visible).toBe(opacity[80]);
      expect(semanticOpacity.active).toBe(opacity[90]);
      expect(semanticOpacity.solid).toBe(opacity[100]);
    });

    it('should reference base opacity values', () => {
      Object.values(semanticOpacity).forEach((value) => {
        expect(Object.values(opacity)).toContain(value);
      });
    });

    it('should provide meaningful semantic names', () => {
      const names = Object.keys(semanticOpacity);
      expect(names).toContain('disabled');
      expect(names).toContain('muted');
      expect(names).toContain('active');
      expect(names).toContain('solid');
    });
  });

  describe('overlayOpacity', () => {
    it('should export all overlay opacity values', () => {
      expect(overlayOpacity.subtle).toBe(opacity[30]);
      expect(overlayOpacity.light).toBe(opacity[50]);
      expect(overlayOpacity.medium).toBe(opacity[60]);
      expect(overlayOpacity.dark).toBe(opacity[75]);
      expect(overlayOpacity.heavy).toBe(opacity[90]);
      expect(overlayOpacity.solid).toBe(opacity[100]);
    });

    it('should reference base opacity values', () => {
      Object.values(overlayOpacity).forEach((value) => {
        expect(Object.values(opacity)).toContain(value);
      });
    });

    it('should provide appropriate opacity levels for overlays', () => {
      // Overlays typically range from 30% to 100%
      Object.values(overlayOpacity).forEach((value) => {
        const numValue = parseFloat(value);
        expect(numValue).toBeGreaterThanOrEqual(0.3);
        expect(numValue).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('glowOpacity', () => {
    it('should export all glow opacity values', () => {
      expect(glowOpacity.subtle).toBe(opacity[10]);
      expect(glowOpacity.soft).toBe(opacity[20]);
      expect(glowOpacity.medium).toBe(opacity[30]);
      expect(glowOpacity.bright).toBe(opacity[50]);
      expect(glowOpacity.intense).toBe(opacity[70]);
      expect(glowOpacity.maximum).toBe(opacity[100]);
    });

    it('should reference base opacity values', () => {
      Object.values(glowOpacity).forEach((value) => {
        expect(Object.values(opacity)).toContain(value);
      });
    });

    it('should provide graduated glow intensities', () => {
      const values = Object.values(glowOpacity).map(parseFloat);
      // Values should be in ascending order
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  });

  describe('Token consistency', () => {
    it('should have no duplicate values within semantic sets', () => {
      const semanticValues = Object.values(semanticOpacity);
      const uniqueValues = new Set(semanticValues);
      expect(uniqueValues.size).toBe(semanticValues.length);
    });

    it('should align with Tailwind opacity scale', () => {
      // Tailwind uses 0-100 scale, which we match
      expect(opacity[0]).toBe('0');
      expect(opacity[50]).toBe('0.5');
      expect(opacity[100]).toBe('1');
    });
  });
});
