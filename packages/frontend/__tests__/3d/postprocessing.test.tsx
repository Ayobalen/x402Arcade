/**
 * Tests to verify @react-three/postprocessing installation and effect imports
 */
import { describe, it, expect } from 'vitest';
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ChromaticAberration,
  DepthOfField,
  SMAA,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

describe('@react-three/postprocessing Setup', () => {
  describe('Effect Composer', () => {
    it('should import EffectComposer', () => {
      expect(EffectComposer).toBeDefined();
    });
  });

  describe('Glow and Bloom Effects', () => {
    it('should import Bloom effect (critical for neon arcade aesthetic)', () => {
      expect(Bloom).toBeDefined();
    });

    it('should have BlendFunction for effect blending', () => {
      expect(BlendFunction).toBeDefined();
      expect(BlendFunction.ADD).toBeDefined();
      expect(BlendFunction.SCREEN).toBeDefined();
    });
  });

  describe('Visual Effects', () => {
    it('should import Noise effect', () => {
      expect(Noise).toBeDefined();
    });

    it('should import Vignette effect', () => {
      expect(Vignette).toBeDefined();
    });

    it('should import ChromaticAberration effect', () => {
      expect(ChromaticAberration).toBeDefined();
    });

    it('should import DepthOfField effect', () => {
      expect(DepthOfField).toBeDefined();
    });
  });

  describe('Anti-aliasing', () => {
    it('should import SMAA for anti-aliasing', () => {
      expect(SMAA).toBeDefined();
    });
  });

  describe('Tone Mapping', () => {
    it('should import ToneMapping', () => {
      expect(ToneMapping).toBeDefined();
    });
  });

  describe('Project-Specific Effects', () => {
    // Effects identified as needed for x402Arcade arcade aesthetic:
    it('should have access to neon glow effect (Bloom)', () => {
      // Bloom is critical for the neon arcade aesthetic
      expect(Bloom).toBeDefined();
    });

    it('should have access to retro CRT effects', () => {
      // ChromaticAberration for CRT color fringing
      expect(ChromaticAberration).toBeDefined();
      // Noise for CRT static
      expect(Noise).toBeDefined();
      // Vignette for CRT edge darkening
      expect(Vignette).toBeDefined();
    });
  });
});
