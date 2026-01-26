/**
 * Pong Game using Phaser 3
 *
 * Classic arcade Pong implemented with the Phaser game engine.
 * Features AI opponent, difficulty settings, and score tracking.
 *
 * @module games/pong/PongGamePhaser
 */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Difficulty } from '../types/GameTypes';

interface PongGamePhaserProps {
  difficulty?: Difficulty;
  onGameOver: (score: number) => void;
  onPause?: () => void;
}

// Game constants based on difficulty
const DIFFICULTY_CONFIG = {
  easy: {
    paddleSpeed: 300,
    ballSpeed: 200,
    aiReactionDelay: 300,
    paddleHeight: 120,
  },
  normal: {
    paddleSpeed: 400,
    ballSpeed: 300,
    aiReactionDelay: 200,
    paddleHeight: 100,
  },
  hard: {
    paddleSpeed: 500,
    ballSpeed: 400,
    aiReactionDelay: 100,
    paddleHeight: 80,
  },
  expert: {
    paddleSpeed: 600,
    ballSpeed: 500,
    aiReactionDelay: 50,
    paddleHeight: 70,
  },
};

class PongScene extends Phaser.Scene {
  private playerPaddle!: Phaser.GameObjects.Rectangle;
  private aiPaddle!: Phaser.GameObjects.Rectangle;
  private ball!: Phaser.GameObjects.Arc;
  private playerScoreText!: Phaser.GameObjects.Text;
  private aiScoreText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private playerScore = 0;
  private aiScore = 0;
  private ballVelocity = { x: 0, y: 0 };
  private gameActive = true;
  private isPaused = false;
  private lastAiUpdate = 0;
  private lastPaddleHit = 0; // Collision cooldown

  // Sound effects (will be created procedurally)
  private hitSound?: Phaser.Sound.BaseSound;
  private wallSound?: Phaser.Sound.BaseSound;
  private scoreSound?: Phaser.Sound.BaseSound;

  private config: typeof DIFFICULTY_CONFIG.normal;
  private onGameOver: (score: number) => void;
  private onPause?: () => void;

  constructor(
    config: typeof DIFFICULTY_CONFIG.normal,
    onGameOver: (score: number) => void,
    onPause?: () => void
  ) {
    super({ key: 'PongScene' });
    this.config = config;
    this.onGameOver = onGameOver;
    this.onPause = onPause;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Create retro arcade sounds using Web Audio API
    this.createArcadeSounds();

    // Create center line
    const centerLine = this.add.graphics();
    centerLine.lineStyle(2, 0x8b5cf6, 0.5);
    for (let y = 0; y < height; y += 20) {
      centerLine.lineBetween(width / 2, y, width / 2, y + 10);
    }

    // Create paddles
    this.playerPaddle = this.add.rectangle(30, height / 2, 10, this.config.paddleHeight, 0xf8fafc);

    this.aiPaddle = this.add.rectangle(
      width - 30,
      height / 2,
      10,
      this.config.paddleHeight,
      0xf8fafc
    );

    // Create ball
    this.ball = this.add.circle(width / 2, height / 2, 8, 0x8b5cf6);

    // Create score text
    this.playerScoreText = this.add
      .text(width / 4, 50, '0', {
        fontSize: '48px',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
      })
      .setOrigin(0.5);

    this.aiScoreText = this.add
      .text((width / 4) * 3, 50, '0', {
        fontSize: '48px',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
      })
      .setOrigin(0.5);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Handle pause
    this.spaceKey.on('down', () => {
      if (this.gameActive) {
        this.togglePause();
      }
    });

    // Start game
    this.resetBall();
  }

  /**
   * Create retro arcade sound effects using Web Audio API
   */
  private createArcadeSounds() {
    // Generate procedural sounds and add them to Phaser's cache
    this.generateTone('hit', 440, 0.05);
    this.generateTone('wall', 330, 0.05);
    this.generateScoreTone('score');

    // Now create sound objects from the cached audio
    this.hitSound = this.sound.add('hit', { volume: 0.3 });
    this.wallSound = this.sound.add('wall', { volume: 0.2 });
    this.scoreSound = this.sound.add('score', { volume: 0.4 });
  }

  /**
   * Generate a simple tone using Web Audio API and add to Phaser cache
   */
  private generateTone(key: string, frequency: number, duration: number) {
    // Access internal Phaser Web Audio context for procedural audio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = (this.game.sound as any).context as AudioContext | undefined;
    if (!audioContext) return;

    const sampleRate = audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Generate sine wave with envelope (fade out)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = 1 - i / numSamples; // Linear fade out
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    // Add the generated sound to Phaser's audio cache
    this.cache.audio.add(key, audioBuffer);
  }

  /**
   * Generate a score sound with ascending notes and add to Phaser cache
   */
  private generateScoreTone(key: string) {
    // Access internal Phaser Web Audio context for procedural audio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = (this.game.sound as any).context as AudioContext | undefined;
    if (!audioContext) return;

    const sampleRate = audioContext.sampleRate;
    const duration = 0.2; // 200ms
    const numSamples = Math.floor(sampleRate * duration);
    const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Three ascending notes: C5, E5, G5
    const frequencies = [523.25, 659.25, 783.99];
    const noteDuration = duration / 3;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteDuration);
      const frequency = frequencies[Math.min(noteIndex, 2)];
      const envelope = 1 - (i % (numSamples / 3)) / (numSamples / 3);
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    // Add the generated sound to Phaser's audio cache
    this.cache.audio.add(key, audioBuffer);
  }

  update(time: number) {
    if (!this.gameActive || this.isPaused) return;

    const { height } = this.cameras.main;

    // Player paddle movement
    if (this.cursors.up.isDown || this.wKey.isDown) {
      this.playerPaddle.y -= this.config.paddleSpeed * (this.game.loop.delta / 1000);
    } else if (this.cursors.down.isDown || this.sKey.isDown) {
      this.playerPaddle.y += this.config.paddleSpeed * (this.game.loop.delta / 1000);
    }

    // Keep player paddle in bounds
    this.playerPaddle.y = Phaser.Math.Clamp(
      this.playerPaddle.y,
      this.config.paddleHeight / 2,
      height - this.config.paddleHeight / 2
    );

    // AI paddle movement with reaction delay
    if (time - this.lastAiUpdate > this.config.aiReactionDelay) {
      this.lastAiUpdate = time;

      const ballDistanceFromAI = this.ball.y - this.aiPaddle.y;
      const aiMoveSpeed = this.config.paddleSpeed * (this.game.loop.delta / 1000);

      if (Math.abs(ballDistanceFromAI) > 5) {
        if (ballDistanceFromAI > 0) {
          this.aiPaddle.y += aiMoveSpeed;
        } else {
          this.aiPaddle.y -= aiMoveSpeed;
        }
      }
    }

    // Keep AI paddle in bounds
    this.aiPaddle.y = Phaser.Math.Clamp(
      this.aiPaddle.y,
      this.config.paddleHeight / 2,
      height - this.config.paddleHeight / 2
    );

    // Move ball
    this.ball.x += this.ballVelocity.x * (this.game.loop.delta / 1000);
    this.ball.y += this.ballVelocity.y * (this.game.loop.delta / 1000);

    // Ball collision with top/bottom
    if (this.ball.y <= 8 || this.ball.y >= height - 8) {
      this.ballVelocity.y *= -1;
      // Play wall sound
      if (this.wallSound) {
        this.wallSound.play();
      }
    }

    // Ball collision with paddles (with cooldown to prevent multiple hits)
    const timeSinceLastHit = time - this.lastPaddleHit;
    if (timeSinceLastHit > 100) {
      // 100ms cooldown
      if (this.checkPaddleCollision(this.ball, this.playerPaddle)) {
        this.ballVelocity.x = Math.abs(this.ballVelocity.x) * 1.05; // Speed up slightly
        const hitPos = (this.ball.y - this.playerPaddle.y) / (this.config.paddleHeight / 2);
        this.ballVelocity.y = hitPos * this.config.ballSpeed;
        this.lastPaddleHit = time;
        // Move ball away from paddle to prevent sticking
        this.ball.x = this.playerPaddle.x + 15;
        // Play paddle hit sound
        if (this.hitSound) {
          this.hitSound.play();
        }
      } else if (this.checkPaddleCollision(this.ball, this.aiPaddle)) {
        this.ballVelocity.x = -Math.abs(this.ballVelocity.x) * 1.05; // Speed up slightly
        const hitPos = (this.ball.y - this.aiPaddle.y) / (this.config.paddleHeight / 2);
        this.ballVelocity.y = hitPos * this.config.ballSpeed;
        this.lastPaddleHit = time;
        // Move ball away from paddle to prevent sticking
        this.ball.x = this.aiPaddle.x - 15;
        // Play paddle hit sound
        if (this.hitSound) {
          this.hitSound.play();
        }
      }
    }

    // Ball out of bounds (scoring)
    if (this.ball.x < 0) {
      this.aiScore++;
      this.updateScore();
      this.resetBall();
      // Play score sound
      if (this.scoreSound) {
        this.scoreSound.play();
      }
    } else if (this.ball.x > this.cameras.main.width) {
      this.playerScore++;
      this.updateScore();
      this.resetBall();
      // Play score sound
      if (this.scoreSound) {
        this.scoreSound.play();
      }
    }

    // Check win condition (first to 11)
    if (this.playerScore >= 11 || this.aiScore >= 11) {
      this.endGame();
    }
  }

  private checkPaddleCollision(
    ball: Phaser.GameObjects.Arc,
    paddle: Phaser.GameObjects.Rectangle
  ): boolean {
    return (
      ball.x + 8 >= paddle.x - 5 &&
      ball.x - 8 <= paddle.x + 5 &&
      ball.y + 8 >= paddle.y - this.config.paddleHeight / 2 &&
      ball.y - 8 <= paddle.y + this.config.paddleHeight / 2
    );
  }

  private resetBall() {
    const { width, height } = this.cameras.main;
    this.ball.x = width / 2;
    this.ball.y = height / 2;

    // Random direction with guaranteed horizontal movement
    // Angle between -30 and +30 degrees for better gameplay
    const angle = Phaser.Math.Between(-30, 30) * (Math.PI / 180);
    const direction = Math.random() > 0.5 ? 1 : -1;

    // Ensure minimum horizontal velocity
    const vx = Math.cos(angle) * this.config.ballSpeed * direction;
    const vy = Math.sin(angle) * this.config.ballSpeed;

    // Guarantee at least 70% of speed is horizontal
    const minHorizontalSpeed = this.config.ballSpeed * 0.7;
    if (Math.abs(vx) < minHorizontalSpeed) {
      this.ballVelocity.x = minHorizontalSpeed * direction;
      this.ballVelocity.y = vy * 0.5; // Reduce vertical if we're correcting horizontal
    } else {
      this.ballVelocity.x = vx;
      this.ballVelocity.y = vy;
    }
  }

  private updateScore() {
    this.playerScoreText.setText(this.playerScore.toString());
    this.aiScoreText.setText(this.aiScore.toString());
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.onPause) {
      this.onPause();
    }
  }

  private endGame() {
    this.gameActive = false;
    this.ballVelocity.x = 0;
    this.ballVelocity.y = 0;

    // Player score is what they achieved (win or lose)
    this.onGameOver(this.playerScore);
  }
}

// Global flag to prevent multiple Phaser instances (survives React Strict Mode)
let globalPhaserInstance: Phaser.Game | null = null;

export function PongGamePhaser({
  difficulty = 'normal',
  onGameOver,
  onPause,
}: PongGamePhaserProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double initialization in React Strict Mode
    // Check both component-level and global-level instances
    if (isInitializedRef.current || gameRef.current || globalPhaserInstance) return;

    // Also check if there's already a canvas in the container
    if (containerRef.current.querySelector('canvas')) {
      return;
    }

    isInitializedRef.current = true;

    const container = containerRef.current;
    const config = DIFFICULTY_CONFIG[difficulty];

    // Auto-focus container so Phaser receives keyboard events
    container.focus();

    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS, // Force canvas renderer for stability
      parent: container,
      width: 800,
      height: 600,
      backgroundColor: '#0F0F1A',
      scene: new PongScene(config, onGameOver, onPause),
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      disableContextMenu: true,
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true, // Prevent sub-pixel rendering
      },
    };

    gameRef.current = new Phaser.Game(phaserConfig);
    globalPhaserInstance = gameRef.current;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        globalPhaserInstance = null;
      }
      isInitializedRef.current = false;
    };
  }, [difficulty, onGameOver, onPause]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        width: '100%',
        height: '100vh',
        maxHeight: '600px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        outline: 'none',
        // Force GPU acceleration and prevent sub-pixel jitter
        transform: 'translateZ(0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        // Disable any inherited transforms
        transformStyle: 'flat',
      }}
    />
  );
}

export default PongGamePhaser;
