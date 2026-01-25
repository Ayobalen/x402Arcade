/**
 * Tests for SFXEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SFXEngine, SoundPriority, type SoundAsset } from '../SFXEngine';
import { AudioCategory } from '../AudioManager';

// Mock Howler
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation((config: any) => ({
    play: vi.fn(() => 1),
    stop: vi.fn(),
    pause: vi.fn(),
    volume: vi.fn(),
    rate: vi.fn(),
    loop: vi.fn(),
    duration: vi.fn(() => 5), // 5 seconds
    unload: vi.fn(),
    once: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    // Trigger onload immediately
    ...(config.onload && setTimeout(() => config.onload(), 0)),
  })),
  Howler: {
    ctx: null,
    volume: vi.fn(),
    mute: vi.fn(),
  },
}));

// Mock AudioManager
vi.mock('../AudioManager', () => ({
  AudioManager: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      unlock: vi.fn(),
      isInitialized: vi.fn(() => true),
      isUnlocked: vi.fn(() => true),
    })),
  },
  AudioCategory: {
    SFX: 'sfx',
    MUSIC: 'music',
    VOICE: 'voice',
    UI: 'ui',
  },
}));

describe('SFXEngine', () => {
  let engine: SFXEngine;

  beforeEach(() => {
    // Reset singleton
    SFXEngine.resetInstance();
    engine = SFXEngine.getInstance({ debug: false });
  });

  afterEach(() => {
    engine.unloadAll();
    SFXEngine.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const engine1 = SFXEngine.getInstance();
      const engine2 = SFXEngine.getInstance();
      expect(engine1).toBe(engine2);
    });

    it('should create new instance after reset', () => {
      const engine1 = SFXEngine.getInstance();
      SFXEngine.resetInstance();
      const engine2 = SFXEngine.getInstance();
      expect(engine1).not.toBe(engine2);
    });
  });

  describe('Asset Management', () => {
    it('should add a sound asset', async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
        category: AudioCategory.SFX,
      };

      await engine.addSound(asset);
      expect(engine.isLoaded('test-sound')).toBe(false); // Not loaded yet (preload: false)
    });

    it('should preload sound when preload is true', async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      };

      await engine.addSound(asset);
      // Wait for load
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(engine.isLoaded('test-sound')).toBe(true);
    });

    it('should add multiple sounds', async () => {
      const assets: SoundAsset[] = [
        { id: 'sound1', src: '/sounds/1.mp3' },
        { id: 'sound2', src: '/sounds/2.mp3' },
        { id: 'sound3', src: '/sounds/3.mp3' },
      ];

      await engine.addSounds(assets);
      // Sounds should be added but not loaded
      expect(engine.isLoaded('sound1')).toBe(false);
      expect(engine.isLoaded('sound2')).toBe(false);
      expect(engine.isLoaded('sound3')).toBe(false);
    });

    it('should not add duplicate sounds', async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      };

      await engine.addSound(asset);
      await engine.addSound(asset); // Should skip
      // No error should be thrown
    });

    it('should unload a sound', async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      };

      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));

      engine.unload('test-sound');
      expect(engine.isLoaded('test-sound')).toBe(false);
    });

    it('should unload all sounds', async () => {
      const assets: SoundAsset[] = [
        { id: 'sound1', src: '/sounds/1.mp3', preload: true },
        { id: 'sound2', src: '/sounds/2.mp3', preload: true },
      ];

      await engine.addSounds(assets);
      await new Promise((resolve) => setTimeout(resolve, 10));

      engine.unloadAll();
      expect(engine.isLoaded('sound1')).toBe(false);
      expect(engine.isLoaded('sound2')).toBe(false);
    });
  });

  describe('Loading & Caching', () => {
    it('should load a sound on demand', async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
      };

      await engine.addSound(asset);
      expect(engine.isLoaded('test-sound')).toBe(false);

      await engine.load('test-sound');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(engine.isLoaded('test-sound')).toBe(true);
    });

    it('should handle multiple load calls', async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
      };

      await engine.addSound(asset);

      // Multiple concurrent loads should not cause issues
      await Promise.all([
        engine.load('test-sound'),
        engine.load('test-sound'),
        engine.load('test-sound'),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(engine.isLoaded('test-sound')).toBe(true);
    });

    it('should preload sounds for a game', async () => {
      const assets: SoundAsset[] = [
        { id: 'game-sound1', src: '/sounds/game/1.mp3' },
        { id: 'game-sound2', src: '/sounds/game/2.mp3' },
      ];

      await engine.addSounds(assets);
      await engine.preloadForGame('test-game', ['game-sound1', 'game-sound2']);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(engine.isLoaded('game-sound1')).toBe(true);
      expect(engine.isLoaded('game-sound2')).toBe(true);
    });

    it('should get cache statistics', async () => {
      const stats = engine.getCacheStats();

      expect(stats).toHaveProperty('loaded');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
    });
  });

  describe('Playback', () => {
    beforeEach(async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      };
      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it('should play a sound', async () => {
      const soundId = await engine.play({ id: 'test-sound' });
      expect(soundId).toBe(1);
    });

    it('should play with options', async () => {
      const soundId = await engine.play({
        id: 'test-sound',
        volume: 0.5,
        rate: 1.5,
        loop: true,
        priority: SoundPriority.HIGH,
      });
      expect(soundId).toBe(1);
    });

    it('should return null for non-existent sound', async () => {
      const soundId = await engine.play({ id: 'non-existent' });
      expect(soundId).toBeNull();
    });

    it('should stop a playing sound', async () => {
      const soundId = await engine.play({ id: 'test-sound' });
      engine.stop('test-sound', soundId ?? undefined);
      // No error should be thrown
    });

    it('should stop all playing sounds', async () => {
      await engine.play({ id: 'test-sound' });
      engine.stopAll();
      // No error should be thrown
    });

    it('should track if sound is playing', async () => {
      // Initially not playing
      expect(engine.isPlaying('test-sound')).toBe(false);

      // After play, should be playing
      await engine.play({ id: 'test-sound' });
      expect(engine.isPlaying('test-sound')).toBe(true);
    });
  });

  describe('Sound Variants', () => {
    it('should support sound variants', async () => {
      const asset: SoundAsset = {
        id: 'variant-sound',
        variants: [
          { id: 'var1', src: '/sounds/var1.mp3', weight: 1 },
          { id: 'var2', src: '/sounds/var2.mp3', weight: 1 },
          { id: 'var3', src: '/sounds/var3.mp3', weight: 2 },
        ],
        preload: true,
      };

      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const soundId = await engine.play({ id: 'variant-sound' });
      expect(soundId).toBe(1);
    });

    it('should play specific variant', async () => {
      const asset: SoundAsset = {
        id: 'variant-sound',
        variants: [
          { id: 'var1', src: '/sounds/var1.mp3' },
          { id: 'var2', src: '/sounds/var2.mp3' },
        ],
        preload: true,
      };

      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const soundId = await engine.play({
        id: 'variant-sound',
        variantId: 'var1',
      });
      expect(soundId).toBe(1);
    });
  });

  describe('Sound Sprites', () => {
    it('should support sound sprites', async () => {
      const asset: SoundAsset = {
        id: 'sprite-sound',
        src: '/sounds/sprites.mp3',
        sprites: {
          jump: { start: 0, duration: 500 },
          land: { start: 500, duration: 300 },
          hit: { start: 800, duration: 400 },
        },
        preload: true,
      };

      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const soundId = await engine.play({
        id: 'sprite-sound',
        sprite: 'jump',
      });
      expect(soundId).toBe(1);
    });
  });

  describe('Priority Queue', () => {
    it('should respect sound priorities', async () => {
      // Add multiple sounds
      const assets: SoundAsset[] = Array.from({ length: 15 }, (_, i) => ({
        id: `sound${i}`,
        src: `/sounds/${i}.mp3`,
        preload: true,
      }));

      await engine.addSounds(assets);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Play many sounds (exceeds maxConcurrentSounds)
      const lowPriority = await engine.play({
        id: 'sound0',
        priority: SoundPriority.LOW,
      });
      const highPriority = await engine.play({
        id: 'sound1',
        priority: SoundPriority.HIGH,
      });
      const criticalPriority = await engine.play({
        id: 'sound2',
        priority: SoundPriority.CRITICAL,
      });

      // All should play or be queued
      expect(lowPriority).not.toBeNull();
      expect(highPriority).not.toBeNull();
      expect(criticalPriority).not.toBeNull();
    });
  });

  describe('Max Instances', () => {
    it('should respect maxInstances limit', async () => {
      const asset: SoundAsset = {
        id: 'limited-sound',
        src: '/sounds/limited.mp3',
        maxInstances: 2,
        preload: true,
      };

      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Play up to max instances
      const id1 = await engine.play({ id: 'limited-sound' });
      const id2 = await engine.play({ id: 'limited-sound' });
      const id3 = await engine.play({ id: 'limited-sound' }); // Should be null

      expect(id1).not.toBeNull();
      expect(id2).not.toBeNull();
      expect(id3).toBeNull(); // Exceeds maxInstances
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      const asset: SoundAsset = {
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      };
      await engine.addSound(asset);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it('should track cache hits and misses', async () => {
      const initialStats = engine.getCacheStats();

      await engine.play({ id: 'test-sound' }); // Hit
      await engine.play({ id: 'non-existent' }); // Miss

      const finalStats = engine.getCacheStats();

      expect(finalStats.hits).toBeGreaterThan(initialStats.hits);
      expect(finalStats.misses).toBeGreaterThan(initialStats.misses);
    });

    it('should get playback statistics', async () => {
      await engine.play({ id: 'test-sound' });

      const stats = engine.getPlaybackStats();

      expect(stats).toHaveProperty('totalPlays');
      expect(stats).toHaveProperty('activeSounds');
      expect(stats).toHaveProperty('queuedByPriority');
      expect(stats).toHaveProperty('topSounds');

      expect(stats.totalPlays).toBeGreaterThan(0);
    });

    it('should track top sounds', async () => {
      // Play same sound multiple times
      await engine.play({ id: 'test-sound' });
      await engine.play({ id: 'test-sound' });
      await engine.play({ id: 'test-sound' });

      const stats = engine.getPlaybackStats();
      const topSound = stats.topSounds[0];

      expect(topSound?.id).toBe('test-sound');
      expect(topSound?.plays).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      SFXEngine.resetInstance();
      const customEngine = SFXEngine.getInstance({
        maxCacheSize: 100,
        maxConcurrentSounds: 20,
        maxMemoryUsage: 100 * 1024 * 1024,
        debug: true,
      });

      const stats = customEngine.getCacheStats();
      expect(stats.maxSize).toBe(100);
    });

    it('should use default configuration', () => {
      const stats = engine.getCacheStats();
      expect(stats.maxSize).toBe(50); // Default
    });
  });

  describe('Error Handling', () => {
    it('should throw error for asset without id', async () => {
      const asset = {
        src: '/sounds/test.mp3',
      } as SoundAsset;

      await expect(engine.addSound(asset)).rejects.toThrow('must have an id');
    });

    it('should throw error for asset without src or variants', async () => {
      const asset = {
        id: 'test',
      } as SoundAsset;

      await expect(engine.addSound(asset)).rejects.toThrow('must have src or variants');
    });

    it('should throw error when loading non-existent sound', async () => {
      await expect(engine.load('non-existent')).rejects.toThrow('not found');
    });
  });
});
