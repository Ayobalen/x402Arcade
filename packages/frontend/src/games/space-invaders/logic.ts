/**
 * Space Invaders Game Logic
 *
 * This module implements the core game logic for Space Invaders including:
 * - Alien formation movement and AI
 * - Player and alien shooting mechanics
 * - Collision detection
 * - Shield destructible cover system
 * - UFO spawning and scoring
 * - Level progression
 *
 * @module games/space-invaders/logic
 */

import type {
  SpaceInvadersGameSpecific,
  PlayerState,
  FormationState,
  AlienState,
  BulletState,
  UFOState,
  ShieldState,
  ShieldSegment,
  Particle,
  Position,
  PlayerDirection,
  AlienType,
  SpaceInvadersDifficultyConfig,
} from './types';
import * as CONST from './constants';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for game entities.
 */
let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

// ============================================================================
// Initialization Functions
// ============================================================================

/**
 * Create initial player state.
 */
export function createPlayer(difficulty: SpaceInvadersDifficultyConfig): PlayerState {
  return {
    position: {
      x: CONST.CANVAS_WIDTH / 2,
      y: CONST.PLAYER_START_Y,
    },
    velocity: { vx: 0, vy: 0 },
    width: CONST.PLAYER_WIDTH,
    height: CONST.PLAYER_HEIGHT,
    lives: difficulty.startingLives,
    isInvulnerable: false,
    invulnerabilityTimer: 0,
    shootCooldown: 0,
    isExploding: false,
    explosionProgress: 0,
  };
}

/**
 * Create alien formation.
 */
export function createFormation(
  level: number,
  difficulty: SpaceInvadersDifficultyConfig
): FormationState {
  const aliens: AlienState[] = [];
  const startX = (CONST.CANVAS_WIDTH - (CONST.ALIEN_COLS - 1) * CONST.ALIEN_SPACING_X) / 2;

  for (let row = 0; row < CONST.ALIEN_ROWS; row++) {
    let type: AlienType;
    if (row === 0) {
      type = 'squid';
    } else if (row <= 2) {
      type = 'crab';
    } else {
      type = 'octopus';
    }

    for (let col = 0; col < CONST.ALIEN_COLS; col++) {
      aliens.push({
        id: generateId('alien'),
        type,
        position: {
          x: startX + col * CONST.ALIEN_SPACING_X,
          y: CONST.ALIEN_START_Y + row * CONST.ALIEN_SPACING_Y,
        },
        isAlive: true,
        animationFrame: 0,
        isExploding: false,
        explosionProgress: 0,
        row,
        col,
      });
    }
  }

  const baseSpeed = difficulty.initialAlienSpeed;
  const levelSpeed = baseSpeed + (level - 1) * difficulty.alienSpeedIncrease;

  return {
    aliens,
    offset: { x: 0, y: 0 },
    direction: 1,
    speed: levelSpeed,
    stepTimer: 0,
    stepInterval: 1.0,
    shouldDrop: false,
    dropDistance: CONST.ALIEN_DROP_DISTANCE,
    animationTimer: 0,
    animationInterval: CONST.ALIEN_ANIMATION_INTERVAL,
    aliveCount: aliens.length,
  };
}

/**
 * Create shield structures.
 */
export function createShields(difficulty: SpaceInvadersDifficultyConfig): ShieldState[] {
  const shields: ShieldState[] = [];
  const spacing = CONST.CANVAS_WIDTH / (CONST.SHIELD_COUNT + 1);

  for (let i = 0; i < CONST.SHIELD_COUNT; i++) {
    const x = spacing * (i + 1);
    const segments: ShieldSegment[] = [];
    const segmentWidth = CONST.SHIELD_WIDTH / CONST.SHIELD_SEGMENTS_X;
    const segmentHeight = CONST.SHIELD_HEIGHT / CONST.SHIELD_SEGMENTS_Y;

    for (let row = 0; row < CONST.SHIELD_SEGMENTS_Y; row++) {
      for (let col = 0; col < CONST.SHIELD_SEGMENTS_X; col++) {
        // Create curved shield shape (skip corners)
        if (row === 0 && (col === 0 || col === CONST.SHIELD_SEGMENTS_X - 1)) continue;
        if (row === CONST.SHIELD_SEGMENTS_Y - 1 && col >= 2 && col <= 5) continue;

        segments.push({
          position: {
            x: x - CONST.SHIELD_WIDTH / 2 + col * segmentWidth,
            y: CONST.SHIELD_Y_POSITION + row * segmentHeight,
          },
          width: segmentWidth,
          height: segmentHeight,
          health: 100 * difficulty.shieldHealthMultiplier,
          isDestroyed: false,
        });
      }
    }

    shields.push({
      id: `shield-${i}`,
      position: { x, y: CONST.SHIELD_Y_POSITION },
      segments,
      healthPercentage: 100,
    });
  }

  return shields;
}

/**
 * Create initial UFO state (inactive).
 */
export function createUFO(): UFOState {
  return {
    position: { x: -CONST.UFO_WIDTH, y: CONST.UFO_Y_POSITION },
    velocity: { vx: 0, vy: 0 },
    width: CONST.UFO_WIDTH,
    height: CONST.UFO_HEIGHT,
    isActive: false,
    bonusPoints: 0,
    isExploding: false,
    explosionProgress: 0,
  };
}

/**
 * Initialize complete Space Invaders game state.
 */
export function initSpaceInvadersState(
  difficulty: SpaceInvadersDifficultyConfig
): SpaceInvadersGameSpecific {
  return {
    player: createPlayer(difficulty),
    formation: createFormation(1, difficulty),
    bullets: [],
    shields: createShields(difficulty),
    ufo: createUFO(),
    particles: [],
    level: 1,
    wave: 1,
    highScore: 0,
    ufoSpawnTimer: getRandomUFOSpawnTime(difficulty),
    alienShootTimer: difficulty.alienShootInterval,
    comboMultiplier: 1,
    comboTimer: 0,
    globalAnimationFrame: 0,
  };
}

// ============================================================================
// Player Movement & Actions
// ============================================================================

/**
 * Update player position based on input.
 */
export function updatePlayerMovement(
  player: PlayerState,
  direction: PlayerDirection,
  deltaTime: number,
  difficulty: SpaceInvadersDifficultyConfig
): PlayerState {
  const speed = difficulty.playerSpeed;
  let vx = 0;

  if (direction === 'left') {
    vx = -speed;
  } else if (direction === 'right') {
    vx = speed;
  }

  let newX = player.position.x + vx * deltaTime;

  // Clamp to game bounds
  const halfWidth = player.width / 2;
  newX = Math.max(CONST.GAME_BOUNDS_MARGIN + halfWidth, newX);
  newX = Math.min(CONST.CANVAS_WIDTH - CONST.GAME_BOUNDS_MARGIN - halfWidth, newX);

  return {
    ...player,
    position: { ...player.position, x: newX },
    velocity: { vx, vy: 0 },
  };
}

/**
 * Attempt to shoot player bullet.
 */
export function playerShoot(
  player: PlayerState,
  bullets: BulletState[],
  difficulty: SpaceInvadersDifficultyConfig
): { player: PlayerState; bullets: BulletState[] } {
  // Check cooldown
  if (player.shootCooldown > 0) {
    return { player, bullets };
  }

  // Check max bullets
  const playerBulletCount = bullets.filter((b) => b.owner === 'player' && b.isActive).length;
  if (playerBulletCount >= CONST.MAX_PLAYER_BULLETS) {
    return { player, bullets };
  }

  // Create bullet
  const newBullet: BulletState = {
    id: generateId('player-bullet'),
    position: {
      x: player.position.x - CONST.PLAYER_BULLET_WIDTH / 2,
      y: player.position.y - player.height / 2,
    },
    velocity: {
      vx: 0,
      vy: -difficulty.playerBulletSpeed,
    },
    width: CONST.PLAYER_BULLET_WIDTH,
    height: CONST.PLAYER_BULLET_HEIGHT,
    owner: 'player',
    isActive: true,
  };

  return {
    player: {
      ...player,
      shootCooldown: difficulty.playerShootCooldown,
    },
    bullets: [...bullets, newBullet],
  };
}

/**
 * Update player cooldowns and timers.
 */
export function updatePlayerTimers(player: PlayerState, deltaTime: number): PlayerState {
  const updated = { ...player };

  if (updated.shootCooldown > 0) {
    updated.shootCooldown = Math.max(0, updated.shootCooldown - deltaTime);
  }

  if (updated.isInvulnerable) {
    updated.invulnerabilityTimer = Math.max(0, updated.invulnerabilityTimer - deltaTime);
    if (updated.invulnerabilityTimer <= 0) {
      updated.isInvulnerable = false;
    }
  }

  if (updated.isExploding) {
    updated.explosionProgress = Math.min(
      1,
      updated.explosionProgress + deltaTime / CONST.EXPLOSION_DURATION
    );
    if (updated.explosionProgress >= 1) {
      updated.isExploding = false;
      updated.explosionProgress = 0;
    }
  }

  return updated;
}

// ============================================================================
// Alien Formation Movement & AI
// ============================================================================

/**
 * Update alien formation movement.
 */
export function updateFormationMovement(
  formation: FormationState,
  deltaTime: number
): FormationState {
  const updated = { ...formation };

  // Update animation
  updated.animationTimer += deltaTime;
  if (updated.animationTimer >= updated.animationInterval) {
    updated.animationTimer = 0;
    updated.aliens = updated.aliens.map((alien) => ({
      ...alien,
      animationFrame: alien.animationFrame === 0 ? 1 : 0,
    }));
  }

  // Update step timer
  updated.stepTimer += deltaTime;
  if (updated.stepTimer < updated.stepInterval) {
    return updated;
  }

  updated.stepTimer = 0;

  // Handle drop
  if (updated.shouldDrop) {
    updated.offset.y += updated.dropDistance;
    updated.direction *= -1;
    updated.shouldDrop = false;

    // Increase speed slightly after drop
    updated.speed *= 1.05;
    updated.stepInterval = Math.max(0.1, updated.stepInterval * 0.95);
  }

  // Move horizontally
  const moveDistance = updated.speed * updated.stepInterval;
  updated.offset.x += moveDistance * updated.direction;

  // Update alien positions
  updated.aliens = updated.aliens.map((alien) => ({
    ...alien,
    position: {
      x: alien.position.x + moveDistance * updated.direction,
      y: alien.position.y,
    },
  }));

  // Check if hit edge
  const aliveAliens = updated.aliens.filter((a) => a.isAlive);
  if (aliveAliens.length > 0) {
    const leftmost = Math.min(...aliveAliens.map((a) => a.position.x - CONST.ALIEN_WIDTH / 2));
    const rightmost = Math.max(...aliveAliens.map((a) => a.position.x + CONST.ALIEN_WIDTH / 2));

    if (
      leftmost <= CONST.GAME_BOUNDS_MARGIN ||
      rightmost >= CONST.CANVAS_WIDTH - CONST.GAME_BOUNDS_MARGIN
    ) {
      updated.shouldDrop = true;
    }
  }

  return updated;
}

/**
 * Alien shooting AI - select random alien to shoot.
 */
export function alienShoot(
  formation: FormationState,
  bullets: BulletState[],
  difficulty: SpaceInvadersDifficultyConfig
): BulletState[] {
  const alienBulletCount = bullets.filter((b) => b.owner === 'alien' && b.isActive).length;
  if (alienBulletCount >= CONST.MAX_ALIEN_BULLETS) {
    return bullets;
  }

  const aliveAliens = formation.aliens.filter((a) => a.isAlive);
  if (aliveAliens.length === 0) {
    return bullets;
  }

  // Select random alien from bottom-most row
  const bottomAliens = getBottomAliens(aliveAliens);
  if (bottomAliens.length === 0) {
    return bullets;
  }

  const shooter = bottomAliens[Math.floor(Math.random() * bottomAliens.length)];

  const newBullet: BulletState = {
    id: generateId('alien-bullet'),
    position: {
      x: shooter.position.x - CONST.ALIEN_BULLET_WIDTH / 2,
      y: shooter.position.y + CONST.ALIEN_HEIGHT / 2,
    },
    velocity: {
      vx: 0,
      vy: difficulty.alienBulletSpeed,
    },
    width: CONST.ALIEN_BULLET_WIDTH,
    height: CONST.ALIEN_BULLET_HEIGHT,
    owner: 'alien',
    isActive: true,
  };

  return [...bullets, newBullet];
}

/**
 * Get bottom-most aliens (for shooting).
 */
function getBottomAliens(aliens: AlienState[]): AlienState[] {
  const columnMap = new Map<number, AlienState>();

  for (const alien of aliens) {
    const existing = columnMap.get(alien.col);
    if (!existing || alien.row > existing.row) {
      columnMap.set(alien.col, alien);
    }
  }

  return Array.from(columnMap.values());
}

/**
 * Update alien explosion animations.
 */
export function updateAlienExplosions(
  formation: FormationState,
  deltaTime: number
): FormationState {
  return {
    ...formation,
    aliens: formation.aliens.map((alien) => {
      if (!alien.isExploding) return alien;

      const newProgress = Math.min(
        1,
        alien.explosionProgress + deltaTime / CONST.EXPLOSION_DURATION
      );

      return {
        ...alien,
        explosionProgress: newProgress,
        isExploding: newProgress < 1,
      };
    }),
  };
}

// ============================================================================
// Bullet Updates
// ============================================================================

/**
 * Update bullet positions and remove out-of-bounds bullets.
 */
export function updateBullets(bullets: BulletState[], deltaTime: number): BulletState[] {
  return bullets
    .map((bullet) => ({
      ...bullet,
      position: {
        x: bullet.position.x + bullet.velocity.vx * deltaTime,
        y: bullet.position.y + bullet.velocity.vy * deltaTime,
      },
    }))
    .filter((bullet) => {
      // Remove bullets out of bounds
      if (bullet.position.y < 0 || bullet.position.y > CONST.CANVAS_HEIGHT) {
        return false;
      }
      return bullet.isActive;
    });
}

// ============================================================================
// UFO System
// ============================================================================

/**
 * Get random UFO spawn time.
 */
function getRandomUFOSpawnTime(difficulty: SpaceInvadersDifficultyConfig): number {
  const min = difficulty.ufoSpawnInterval.min;
  const max = difficulty.ufoSpawnInterval.max;
  return min + Math.random() * (max - min);
}

/**
 * Update UFO spawn timer and spawn UFO if needed.
 */
export function updateUFOSpawning(
  ufo: UFOState,
  ufoSpawnTimer: number,
  deltaTime: number,
  difficulty: SpaceInvadersDifficultyConfig
): { ufo: UFOState; ufoSpawnTimer: number } {
  if (ufo.isActive) {
    return { ufo, ufoSpawnTimer };
  }

  const newTimer = ufoSpawnTimer - deltaTime;

  if (newTimer <= 0) {
    // Spawn UFO
    const direction = Math.random() > 0.5 ? 1 : -1;
    const startX = direction > 0 ? -CONST.UFO_WIDTH : CONST.CANVAS_WIDTH + CONST.UFO_WIDTH;
    const points =
      difficulty.ufoPointsRange.min +
      Math.floor(
        Math.random() * (difficulty.ufoPointsRange.max - difficulty.ufoPointsRange.min + 1)
      );

    return {
      ufo: {
        ...ufo,
        position: { x: startX, y: CONST.UFO_Y_POSITION },
        velocity: { vx: direction * difficulty.ufoSpeed, vy: 0 },
        isActive: true,
        bonusPoints: points,
      },
      ufoSpawnTimer: getRandomUFOSpawnTime(difficulty),
    };
  }

  return { ufo, ufoSpawnTimer: newTimer };
}

/**
 * Update UFO movement.
 */
export function updateUFOMovement(ufo: UFOState, deltaTime: number): UFOState {
  if (!ufo.isActive || ufo.isExploding) {
    return ufo;
  }

  const updated = {
    ...ufo,
    position: {
      x: ufo.position.x + ufo.velocity.vx * deltaTime,
      y: ufo.position.y,
    },
  };

  // Deactivate if off screen
  if (updated.position.x < -CONST.UFO_WIDTH - 50 || updated.position.x > CONST.CANVAS_WIDTH + 50) {
    updated.isActive = false;
  }

  return updated;
}

/**
 * Update UFO explosion animation.
 */
export function updateUFOExplosion(ufo: UFOState, deltaTime: number): UFOState {
  if (!ufo.isExploding) return ufo;

  const newProgress = Math.min(1, ufo.explosionProgress + deltaTime / CONST.EXPLOSION_DURATION);

  // Deactivate after explosion completes
  if (newProgress >= 1) {
    return {
      ...ufo,
      isExploding: false,
      explosionProgress: 0,
      isActive: false,
    };
  }

  return {
    ...ufo,
    explosionProgress: newProgress,
  };
}

// ============================================================================
// Shield System
// ============================================================================

/**
 * Damage shield segment.
 */
export function damageShieldSegment(segment: ShieldSegment, damage: number): ShieldSegment {
  const newHealth = Math.max(0, segment.health - damage);

  return {
    ...segment,
    health: newHealth,
    isDestroyed: newHealth <= 0,
  };
}

/**
 * Update shield health percentages.
 */
export function updateShieldHealth(shields: ShieldState[]): ShieldState[] {
  return shields.map((shield) => {
    const totalSegments = shield.segments.length;
    const aliveSegments = shield.segments.filter((s) => !s.isDestroyed).length;
    const healthPercentage = (aliveSegments / totalSegments) * 100;

    return {
      ...shield,
      healthPercentage,
    };
  });
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Check AABB collision between two rectangles.
 */
function checkAABB(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

/**
 * Check bullet-alien collisions.
 */
export function checkBulletAlienCollisions(
  bullets: BulletState[],
  formation: FormationState
): {
  bullets: BulletState[];
  formation: FormationState;
  hits: Array<{ alienId: string; alienType: AlienType }>;
} {
  const updatedBullets = [...bullets];
  const updatedAliens = [...formation.aliens];
  const hits: Array<{ alienId: string; alienType: AlienType }> = [];

  for (const bullet of updatedBullets) {
    if (!bullet.isActive || bullet.owner !== 'player') continue;

    for (let i = 0; i < updatedAliens.length; i++) {
      const alien = updatedAliens[i];
      if (!alien.isAlive) continue;

      const collision = checkAABB(
        bullet.position.x,
        bullet.position.y,
        bullet.width,
        bullet.height,
        alien.position.x - CONST.ALIEN_WIDTH / 2,
        alien.position.y - CONST.ALIEN_HEIGHT / 2,
        CONST.ALIEN_WIDTH,
        CONST.ALIEN_HEIGHT
      );

      if (collision) {
        bullet.isActive = false;
        updatedAliens[i] = {
          ...alien,
          isAlive: false,
          isExploding: true,
          explosionProgress: 0,
        };
        hits.push({ alienId: alien.id, alienType: alien.type });
        break;
      }
    }
  }

  const aliveCount = updatedAliens.filter((a) => a.isAlive).length;

  return {
    bullets: updatedBullets,
    formation: { ...formation, aliens: updatedAliens, aliveCount },
    hits,
  };
}

/**
 * Check bullet-UFO collisions.
 */
export function checkBulletUFOCollisions(
  bullets: BulletState[],
  ufo: UFOState
): {
  bullets: BulletState[];
  ufo: UFOState;
  hit: boolean;
} {
  if (!ufo.isActive || ufo.isExploding) {
    return { bullets, ufo, hit: false };
  }

  let hit = false;
  const updatedBullets = bullets.map((bullet) => {
    if (!bullet.isActive || bullet.owner !== 'player' || hit) return bullet;

    const collision = checkAABB(
      bullet.position.x,
      bullet.position.y,
      bullet.width,
      bullet.height,
      ufo.position.x - ufo.width / 2,
      ufo.position.y - ufo.height / 2,
      ufo.width,
      ufo.height
    );

    if (collision) {
      hit = true;
      return { ...bullet, isActive: false };
    }

    return bullet;
  });

  if (hit) {
    return {
      bullets: updatedBullets,
      ufo: {
        ...ufo,
        isExploding: true,
        explosionProgress: 0,
      },
      hit: true,
    };
  }

  return { bullets: updatedBullets, ufo, hit: false };
}

/**
 * Check bullet-shield collisions.
 */
export function checkBulletShieldCollisions(
  bullets: BulletState[],
  shields: ShieldState[]
): {
  bullets: BulletState[];
  shields: ShieldState[];
} {
  const updatedBullets = [...bullets];
  const updatedShields = [...shields];

  for (const bullet of updatedBullets) {
    if (!bullet.isActive) continue;

    for (let shieldIdx = 0; shieldIdx < updatedShields.length; shieldIdx++) {
      const shield = updatedShields[shieldIdx];

      for (let segIdx = 0; segIdx < shield.segments.length; segIdx++) {
        const segment = shield.segments[segIdx];
        if (segment.isDestroyed) continue;

        const collision = checkAABB(
          bullet.position.x,
          bullet.position.y,
          bullet.width,
          bullet.height,
          segment.position.x,
          segment.position.y,
          segment.width,
          segment.height
        );

        if (collision) {
          bullet.isActive = false;
          shield.segments[segIdx] = damageShieldSegment(segment, CONST.SHIELD_DAMAGE_PER_HIT);
          break;
        }
      }

      if (!bullet.isActive) break;
    }
  }

  return {
    bullets: updatedBullets,
    shields: updateShieldHealth(updatedShields),
  };
}

/**
 * Check bullet-player collisions.
 */
export function checkBulletPlayerCollisions(
  bullets: BulletState[],
  player: PlayerState
): {
  bullets: BulletState[];
  hit: boolean;
} {
  if (player.isInvulnerable || player.isExploding) {
    return { bullets, hit: false };
  }

  let hit = false;
  const updatedBullets = bullets.map((bullet) => {
    if (!bullet.isActive || bullet.owner !== 'alien' || hit) return bullet;

    const collision = checkAABB(
      bullet.position.x,
      bullet.position.y,
      bullet.width,
      bullet.height,
      player.position.x - player.width / 2,
      player.position.y - player.height / 2,
      player.width,
      player.height
    );

    if (collision) {
      hit = true;
      return { ...bullet, isActive: false };
    }

    return bullet;
  });

  return { bullets: updatedBullets, hit };
}

// ============================================================================
// Scoring & Game State
// ============================================================================

/**
 * Calculate score for alien kill.
 */
export function getAlienScore(type: AlienType): number {
  switch (type) {
    case 'squid':
      return CONST.POINTS_SQUID;
    case 'crab':
      return CONST.POINTS_CRAB;
    case 'octopus':
      return CONST.POINTS_OCTOPUS;
  }
}

/**
 * Update combo system.
 */
export function updateCombo(
  comboMultiplier: number,
  comboTimer: number,
  deltaTime: number,
  wasHit: boolean
): { comboMultiplier: number; comboTimer: number } {
  if (wasHit) {
    const newMultiplier = Math.min(CONST.MAX_COMBO_MULTIPLIER, comboMultiplier + 1);
    return {
      comboMultiplier: newMultiplier,
      comboTimer: CONST.COMBO_TIMEOUT,
    };
  }

  const newTimer = Math.max(0, comboTimer - deltaTime);
  if (newTimer <= 0 && comboMultiplier > 1) {
    return { comboMultiplier: 1, comboTimer: 0 };
  }

  return { comboMultiplier, comboTimer: newTimer };
}

/**
 * Handle player death.
 */
export function handlePlayerDeath(
  player: PlayerState,
  difficulty: SpaceInvadersDifficultyConfig
): PlayerState {
  const newLives = player.lives - 1;

  if (newLives <= 0) {
    return {
      ...player,
      lives: 0,
      isExploding: true,
      explosionProgress: 0,
    };
  }

  // Respawn with invulnerability
  return {
    ...player,
    lives: newLives,
    position: {
      x: CONST.CANVAS_WIDTH / 2,
      y: CONST.PLAYER_START_Y,
    },
    isExploding: true,
    explosionProgress: 0,
    isInvulnerable: true,
    invulnerabilityTimer: difficulty.invulnerabilityDuration,
  };
}

/**
 * Check if wave is complete.
 */
export function isWaveComplete(formation: FormationState): boolean {
  return formation.aliveCount === 0;
}

/**
 * Check if game is over (player dead or aliens reached bottom).
 */
export function isGameOver(player: PlayerState, formation: FormationState): boolean {
  if (player.lives <= 0) {
    return true;
  }

  // Check if any alien reached player zone
  const aliveAliens = formation.aliens.filter((a) => a.isAlive);
  for (const alien of aliveAliens) {
    if (alien.position.y + CONST.ALIEN_HEIGHT / 2 >= CONST.PLAYER_START_Y - CONST.PLAYER_HEIGHT) {
      return true;
    }
  }

  return false;
}

/**
 * Advance to next wave.
 */
export function advanceWave(
  currentLevel: number,
  currentWave: number,
  difficulty: SpaceInvadersDifficultyConfig
): { level: number; wave: number; formation: FormationState } {
  const newWave = currentWave + 1;
  const newLevel = currentLevel + Math.floor(newWave / 3); // New level every 3 waves

  return {
    level: newLevel,
    wave: newWave,
    formation: createFormation(newLevel, difficulty),
  };
}

// ============================================================================
// Particle System
// ============================================================================

/**
 * Create explosion particles.
 */
export function createExplosionParticles(position: Position, color?: string): Particle[] {
  const particles: Particle[] = [];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 100 + Math.random() * 100;

    particles.push({
      position: { ...position },
      velocity: {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      },
      color:
        color ||
        CONST.COLOR_EXPLOSION_PARTICLES[
          Math.floor(Math.random() * CONST.COLOR_EXPLOSION_PARTICLES.length)
        ],
      size: 2 + Math.random() * 3,
      lifetime: CONST.PARTICLE_LIFETIME,
      maxLifetime: CONST.PARTICLE_LIFETIME,
      opacity: 1,
    });
  }

  return particles;
}

/**
 * Update particles.
 */
export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map((particle) => ({
      ...particle,
      position: {
        x: particle.position.x + particle.velocity.vx * deltaTime,
        y: particle.position.y + particle.velocity.vy * deltaTime,
      },
      lifetime: particle.lifetime - deltaTime,
      opacity: particle.lifetime / particle.maxLifetime,
    }))
    .filter((particle) => particle.lifetime > 0);
}
