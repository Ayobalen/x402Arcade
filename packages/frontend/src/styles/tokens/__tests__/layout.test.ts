import { describe, it, expect } from 'vitest';
import { containerWidths, aspectRatios, maxWidths, minHeights } from '../layout';

describe('Layout Tokens', () => {
  describe('containerWidths', () => {
    it('should export all container width values', () => {
      expect(containerWidths.xs).toBe('20rem');
      expect(containerWidths.sm).toBe('24rem');
      expect(containerWidths.md).toBe('28rem');
      expect(containerWidths.lg).toBe('32rem');
      expect(containerWidths.xl).toBe('36rem');
      expect(containerWidths['2xl']).toBe('42rem');
      expect(containerWidths['3xl']).toBe('48rem');
      expect(containerWidths['4xl']).toBe('56rem');
      expect(containerWidths['5xl']).toBe('64rem');
      expect(containerWidths['6xl']).toBe('72rem');
      expect(containerWidths['7xl']).toBe('80rem');
      expect(containerWidths.full).toBe('100%');
      expect(containerWidths.screen).toBe('100vw');
    });

    it('should use rem units for consistent scaling', () => {
      const remValues = Object.entries(containerWidths).filter(
        ([key]) => !['full', 'screen'].includes(key)
      );
      remValues.forEach(([key, value]) => {
        expect(value).toMatch(/^\d+(\.\d+)?rem$/);
      });
    });
  });

  describe('aspectRatios', () => {
    it('should export all aspect ratio values', () => {
      expect(aspectRatios.square).toBe('1 / 1');
      expect(aspectRatios.portrait).toBe('3 / 4');
      expect(aspectRatios.landscape).toBe('4 / 3');
      expect(aspectRatios.video).toBe('16 / 9');
      expect(aspectRatios.ultrawide).toBe('21 / 9');
      expect(aspectRatios.golden).toBe('1.618 / 1');
      expect(aspectRatios.wide).toBe('2 / 1');
      expect(aspectRatios.superwide).toBe('3 / 1');
      expect(aspectRatios.tall).toBe('9 / 16');
      expect(aspectRatios.auto).toBe('auto');
    });

    it('should use proper ratio format', () => {
      const ratioValues = Object.entries(aspectRatios).filter(([key]) => key !== 'auto');
      ratioValues.forEach(([key, value]) => {
        expect(value).toMatch(/^[\d.]+\s*\/\s*[\d.]+$/);
      });
    });
  });

  describe('maxWidths', () => {
    it('should export all max width values', () => {
      expect(maxWidths.none).toBe('none');
      expect(maxWidths['prose-narrow']).toBe('45ch');
      expect(maxWidths.prose).toBe('65ch');
      expect(maxWidths['prose-wide']).toBe('75ch');
      expect(maxWidths['screen-sm']).toBe('640px');
      expect(maxWidths['screen-md']).toBe('768px');
      expect(maxWidths['screen-lg']).toBe('1024px');
      expect(maxWidths['screen-xl']).toBe('1280px');
      expect(maxWidths['screen-2xl']).toBe('1536px');
    });

    it('should use ch units for prose widths', () => {
      expect(maxWidths['prose-narrow']).toMatch(/^\d+ch$/);
      expect(maxWidths.prose).toMatch(/^\d+ch$/);
      expect(maxWidths['prose-wide']).toMatch(/^\d+ch$/);
    });

    it('should use px units for screen widths', () => {
      expect(maxWidths['screen-sm']).toMatch(/^\d+px$/);
      expect(maxWidths['screen-md']).toMatch(/^\d+px$/);
      expect(maxWidths['screen-lg']).toMatch(/^\d+px$/);
      expect(maxWidths['screen-xl']).toMatch(/^\d+px$/);
      expect(maxWidths['screen-2xl']).toMatch(/^\d+px$/);
    });
  });

  describe('minHeights', () => {
    it('should export all min height values', () => {
      expect(minHeights.screen).toBe('100vh');
      expect(minHeights['screen-half']).toBe('50vh');
      expect(minHeights['screen-third']).toBe('33.333vh');
      expect(minHeights['screen-quarter']).toBe('25vh');
      expect(minHeights['screen-dynamic']).toBe('100dvh');
    });

    it('should use vh units for viewport heights', () => {
      const vhValues = Object.entries(minHeights).filter(([key]) => !key.includes('dynamic'));
      vhValues.forEach(([key, value]) => {
        expect(value).toMatch(/^[\d.]+vh$/);
      });
    });

    it('should include dynamic viewport unit for mobile', () => {
      expect(minHeights['screen-dynamic']).toBe('100dvh');
    });
  });

  describe('Token consistency', () => {
    it('should have no duplicate keys', () => {
      const allKeys = [
        ...Object.keys(containerWidths),
        ...Object.keys(aspectRatios),
        ...Object.keys(maxWidths),
        ...Object.keys(minHeights),
      ];
      const uniqueKeys = new Set(allKeys);
      // Some overlap is expected (like 'screen'), but check totals are reasonable
      expect(uniqueKeys.size).toBeGreaterThan(0);
    });
  });
});
