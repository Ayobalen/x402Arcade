/**
 * Space Invaders Game Module
 *
 * This module exports all Space Invaders game components, types, and utilities.
 *
 * @module games/space-invaders
 */

// Types
export type {
  Position,
  Velocity,
  PlayerState,
  PlayerDirection,
  AlienState,
  AlienType,
  FormationState,
  BulletState,
  BulletOwner,
  UFOState,
  ShieldState,
  ShieldSegment,
  Particle,
  SpaceInvadersGameSpecific,
  SpaceInvadersState,
  SpaceInvadersDifficultyConfig,
  SpaceInvadersConfig,
  SpaceInvadersScoringEvent,
} from './types';

// Constants
export {
  // Dimensions
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_BOUNDS_MARGIN,
  // Player constants
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_START_Y,
  PLAYER_BULLET_WIDTH,
  PLAYER_BULLET_HEIGHT,
  // Alien constants
  ALIEN_WIDTH,
  ALIEN_HEIGHT,
  ALIEN_SPACING_X,
  ALIEN_SPACING_Y,
  ALIEN_COLS,
  ALIEN_ROWS,
  ALIEN_START_Y,
  ALIEN_BULLET_WIDTH,
  ALIEN_BULLET_HEIGHT,
  ALIEN_DROP_DISTANCE,
  ALIEN_SPEED_INCREASE_FACTOR,
  // UFO constants
  UFO_WIDTH,
  UFO_HEIGHT,
  UFO_Y_POSITION,
  // Shield constants
  SHIELD_WIDTH,
  SHIELD_HEIGHT,
  SHIELD_COUNT,
  SHIELD_Y_POSITION,
  SHIELD_SEGMENTS_X,
  SHIELD_SEGMENTS_Y,
  SHIELD_DAMAGE_PER_HIT,
  // Scoring constants
  POINTS_SQUID,
  POINTS_CRAB,
  POINTS_OCTOPUS,
  UFO_POINTS_MIN,
  UFO_POINTS_MAX,
  WAVE_BONUS_BASE,
  LEVEL_BONUS_BASE,
  COMBO_TIMEOUT,
  MAX_COMBO_MULTIPLIER,
  // Physics & timing constants
  INVULNERABILITY_FLASH_INTERVAL,
  EXPLOSION_DURATION,
  PARTICLE_LIFETIME,
  ALIEN_ANIMATION_INTERVAL,
  MAX_PLAYER_BULLETS,
  MAX_ALIEN_BULLETS,
  // Difficulty configs
  DIFFICULTY_EASY,
  DIFFICULTY_NORMAL,
  DIFFICULTY_HARD,
  DIFFICULTY_EXPERT,
  getDifficultyConfig,
  // Colors
  COLOR_PLAYER,
  COLOR_ALIEN_SQUID,
  COLOR_ALIEN_CRAB,
  COLOR_ALIEN_OCTOPUS,
  COLOR_UFO,
  COLOR_PLAYER_BULLET,
  COLOR_ALIEN_BULLET,
  COLOR_SHIELD,
  COLOR_EXPLOSION_PARTICLES,
  COLOR_BACKGROUND,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  // Sounds
  SOUNDS,
} from './constants';

export type { SpaceInvadersDifficulty } from './constants';

// Logic functions
export {
  // Initialization
  createPlayer,
  createFormation,
  createShields,
  createUFO,
  initSpaceInvadersState,
  // Player
  updatePlayerMovement,
  playerShoot,
  updatePlayerTimers,
  // Formation
  updateFormationMovement,
  alienShoot,
  updateAlienExplosions,
  // Bullets
  updateBullets,
  // UFO
  updateUFOSpawning,
  updateUFOMovement,
  updateUFOExplosion,
  // Shields
  damageShieldSegment,
  updateShieldHealth,
  // Collisions
  checkBulletAlienCollisions,
  checkBulletUFOCollisions,
  checkBulletShieldCollisions,
  checkBulletPlayerCollisions,
  // Scoring & game state
  getAlienScore,
  updateCombo,
  handlePlayerDeath,
  isWaveComplete,
  isGameOver,
  advanceWave,
  // Particles
  createExplosionParticles,
  updateParticles,
} from './logic';

// Components
export { SpaceInvadersGame } from './SpaceInvadersGame';
export type { SpaceInvadersGameProps } from './SpaceInvadersGame';

// ============================================================================
// Sound System Exports
// ============================================================================

export {
  SpaceInvadersSoundType,
  SPACE_INVADERS_SOUND_ASSETS,
  initializeSpaceInvadersSounds,
  playPlayerShootSound,
  playAlienShootSound,
  playAlienMovementSound,
  playAlienDeathSound,
  playUFOFlybySound,
  stopUFOFlybySound,
  playUFODeathSound,
  playShieldHitSound,
  playShieldDestroySound,
  playPlayerDeathSound,
  playWaveCompleteSound,
  playWaveStartSound,
  playGameOverSound,
  playExtraLifeSound,
  playBonusPointsSound,
} from './SpaceInvadersSounds';
export { SpaceInvadersGameWrapper } from './SpaceInvadersGameWrapper';
export type { SpaceInvadersGameWrapperProps } from './SpaceInvadersGameWrapper';
