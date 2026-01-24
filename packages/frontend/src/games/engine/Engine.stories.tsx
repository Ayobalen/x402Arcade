import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createGameLoop,
  createInputManager,
  createStateMachine,
  createAudioManager,
  GAME_STATES,
  aabbIntersects,
  circleIntersects,
  circlePenetrationDepth,
  type InputManager,
  type StateMachine as StateMachineType,
  type AudioManager,
} from './index'
import type { CircleBounds } from './types'

// ============================================================================
// Helper Components
// ============================================================================

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h2
      className="text-2xl font-bold text-cyan-400 mb-2"
      style={{ fontFamily: 'Orbitron, sans-serif' }}
    >
      {title}
    </h2>
    {description && <p className="text-gray-400">{description}</p>}
  </div>
)

const StatDisplay = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center p-2 bg-[#1a1a2e] rounded">
    <span className="text-gray-400 text-sm">{label}</span>
    <span className="text-cyan-400 font-mono">{value}</span>
  </div>
)

// ============================================================================
// Game Loop Demo
// ============================================================================

const GameLoopDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fps, setFps] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationX = 0
    let animationY = canvas.height / 2

    const gameLoop = createGameLoop({
      targetFps: 60,
      useFixedTimestep: false,
      autoPauseOnHidden: true,
    })

    gameLoop.setUpdateCallback((frameInfo) => {
      // Update animation
      animationX = (animationX + frameInfo.deltaTime * 0.1) % canvas.width
      animationY = canvas.height / 2 + Math.sin(animationX * 0.02) * 50

      setFps(Math.round(frameInfo.fps))
      setFrameCount(frameInfo.frameNumber)
    })

    gameLoop.setRenderCallback(() => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw trail
      for (let i = 0; i < 10; i++) {
        const trailX = animationX - i * 15
        const trailY = canvas.height / 2 + Math.sin((trailX) * 0.02) * 50
        const alpha = 1 - i * 0.1
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(trailX, trailY, 8 - i * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw main ball with glow
      ctx.shadowColor = '#00ffff'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#00ffff'
      ctx.beginPath()
      ctx.arc(animationX, animationY, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    if (running) {
      gameLoop.start()
    }

    return () => {
      gameLoop.destroy()
    }
  }, [running])

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen">
      <SectionHeader
        title="Game Loop"
        description="Demonstrates the game loop with update/render separation, FPS tracking, and smooth animation."
      />

      <div className="flex gap-8">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="rounded-lg border border-[#2a2a4a]"
          />
        </div>

        <div className="w-64 space-y-4">
          <div className="p-4 bg-[#1a1a2e] rounded-lg space-y-3">
            <h3 className="text-white font-bold">Stats</h3>
            <StatDisplay label="FPS" value={fps} />
            <StatDisplay label="Frame" value={frameCount} />
            <StatDisplay label="Status" value={running ? 'Running' : 'Paused'} />
          </div>

          <button
            onClick={() => setRunning(!running)}
            className={`w-full py-2 rounded-lg font-bold transition-all ${
              running
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-cyan-600 hover:bg-cyan-700 text-black'
            }`}
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Input Manager Demo
// ============================================================================

const InputDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<InputManager | null>(null)
  const [directions, setDirections] = useState<Set<string>>(new Set())
  const [action, setAction] = useState(false)
  const [playerPos, setPlayerPos] = useState({ x: 200, y: 150 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const inputManager = createInputManager({
      preventDefault: true,
      enableKeyboard: true,
      enableTouch: true,
      enableMouse: true,
    })

    inputRef.current = inputManager
    inputManager.attach(canvas)

    // Animation loop
    let animationId: number
    const pos = { x: 200, y: 150 }
    const speed = 5

    const animate = () => {
      const input = inputManager.getInput()

      // Update direction display
      setDirections(new Set(input.directions))
      setAction(input.action)

      // Move player
      if (input.directions.has('up')) pos.y -= speed
      if (input.directions.has('down')) pos.y += speed
      if (input.directions.has('left')) pos.x -= speed
      if (input.directions.has('right')) pos.x += speed

      // Keep in bounds
      pos.x = Math.max(20, Math.min(canvas.width - 20, pos.x))
      pos.y = Math.max(20, Math.min(canvas.height - 20, pos.y))
      setPlayerPos({ ...pos })

      // Clear
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = '#1a1a2e'
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw player with glow
      const color = input.action ? '#ff00ff' : '#00ffff'
      ctx.shadowColor = color
      ctx.shadowBlur = input.action ? 30 : 15
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, input.action ? 25 : 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Draw direction indicator
      if (input.directions.size > 0) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath()
        let dx = 0, dy = 0
        if (input.directions.has('up')) dy -= 1
        if (input.directions.has('down')) dy += 1
        if (input.directions.has('left')) dx -= 1
        if (input.directions.has('right')) dx += 1
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(pos.x + (dx / len) * 30, pos.y + (dy / len) * 30)
        ctx.stroke()
        ctx.lineWidth = 1
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      inputManager.dispose()
    }
  }, [])

  const DirectionKey = ({ dir, active }: { dir: string; active: boolean }) => (
    <div
      className={`w-12 h-12 rounded flex items-center justify-center font-bold transition-all ${
        active
          ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.5)]'
          : 'bg-[#1a1a2e] text-gray-500'
      }`}
    >
      {dir === 'up' && '↑'}
      {dir === 'down' && '↓'}
      {dir === 'left' && '←'}
      {dir === 'right' && '→'}
    </div>
  )

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen">
      <SectionHeader
        title="Input Manager"
        description="Use arrow keys or WASD to move. Press Space for action. Click/touch the canvas for pointer input."
      />

      <div className="flex gap-8">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="rounded-lg border border-[#2a2a4a] cursor-crosshair"
            tabIndex={0}
          />
        </div>

        <div className="w-64 space-y-4">
          <div className="p-4 bg-[#1a1a2e] rounded-lg">
            <h3 className="text-white font-bold mb-3">Direction Keys</h3>
            <div className="flex flex-col items-center gap-1">
              <DirectionKey dir="up" active={directions.has('up')} />
              <div className="flex gap-1">
                <DirectionKey dir="left" active={directions.has('left')} />
                <DirectionKey dir="down" active={directions.has('down')} />
                <DirectionKey dir="right" active={directions.has('right')} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#1a1a2e] rounded-lg">
            <h3 className="text-white font-bold mb-3">Action</h3>
            <div
              className={`py-3 rounded text-center font-bold transition-all ${
                action
                  ? 'bg-magenta-500 text-white shadow-[0_0_20px_rgba(255,0,255,0.5)]'
                  : 'bg-[#2a2a4a] text-gray-500'
              }`}
              style={{ backgroundColor: action ? '#ff00ff' : undefined }}
            >
              {action ? 'ACTIVE!' : 'Press Space'}
            </div>
          </div>

          <div className="p-4 bg-[#1a1a2e] rounded-lg space-y-2">
            <StatDisplay label="X" value={Math.round(playerPos.x)} />
            <StatDisplay label="Y" value={Math.round(playerPos.y)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Collision Detection Demo
// ============================================================================

const CollisionDemo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [collision, setCollision] = useState(false)
  const [depth, setDepth] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Static objects
    const boxes = [
      { x: 100, y: 100, width: 80, height: 60 },
      { x: 250, y: 180, width: 100, height: 40 },
      { x: 400, y: 80, width: 60, height: 100 },
    ]

    const circles: CircleBounds[] = [
      { x: 180, y: 250, radius: 30 },
      { x: 350, y: 250, radius: 25 },
    ]

    // Mouse-controlled circle
    const mouseCircle: CircleBounds = { x: 0, y: 0, radius: 25 }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseCircle.x = e.clientX - rect.left
      mouseCircle.y = e.clientY - rect.top
    }

    canvas.addEventListener('mousemove', handleMouseMove)

    let animationId: number

    const animate = () => {
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let hasCollision = false
      let maxDepth = 0

      // Draw boxes
      for (const box of boxes) {
        // Check collision with mouse circle
        const circleBox = {
          x: mouseCircle.x - mouseCircle.radius,
          y: mouseCircle.y - mouseCircle.radius,
          width: mouseCircle.radius * 2,
          height: mouseCircle.radius * 2,
        }

        const isColliding = aabbIntersects(circleBox, box)
        if (isColliding) hasCollision = true

        ctx.fillStyle = isColliding ? 'rgba(255, 0, 255, 0.3)' : 'rgba(0, 255, 255, 0.2)'
        ctx.strokeStyle = isColliding ? '#ff00ff' : '#00ffff'
        ctx.lineWidth = 2

        if (isColliding) {
          ctx.shadowColor = '#ff00ff'
          ctx.shadowBlur = 20
        }

        ctx.fillRect(box.x, box.y, box.width, box.height)
        ctx.strokeRect(box.x, box.y, box.width, box.height)
        ctx.shadowBlur = 0
      }

      // Draw static circles
      for (const circle of circles) {
        const isColliding = circleIntersects(mouseCircle, circle)
        if (isColliding) {
          hasCollision = true
          const penetration = circlePenetrationDepth(mouseCircle, circle)
          maxDepth = Math.max(maxDepth, penetration)
        }

        ctx.fillStyle = isColliding ? 'rgba(255, 0, 255, 0.3)' : 'rgba(0, 255, 255, 0.2)'
        ctx.strokeStyle = isColliding ? '#ff00ff' : '#00ffff'
        ctx.lineWidth = 2

        if (isColliding) {
          ctx.shadowColor = '#ff00ff'
          ctx.shadowBlur = 20
        }

        ctx.beginPath()
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Draw mouse circle
      ctx.fillStyle = hasCollision ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 255, 100, 0.5)'
      ctx.strokeStyle = hasCollision ? '#ff6666' : '#66ff66'
      ctx.lineWidth = 3

      if (hasCollision) {
        ctx.shadowColor = '#ff0000'
        ctx.shadowBlur = 30
      }

      ctx.beginPath()
      ctx.arc(mouseCircle.x, mouseCircle.y, mouseCircle.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      setCollision(hasCollision)
      setDepth(Math.round(maxDepth * 100) / 100)

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen">
      <SectionHeader
        title="Collision Detection"
        description="Move your mouse over the canvas. Shapes change color on collision."
      />

      <div className="flex gap-8">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={500}
            height={350}
            className="rounded-lg border border-[#2a2a4a]"
          />
        </div>

        <div className="w-64 space-y-4">
          <div className="p-4 bg-[#1a1a2e] rounded-lg space-y-3">
            <h3 className="text-white font-bold">Collision Info</h3>
            <div
              className={`py-4 rounded text-center font-bold text-xl transition-all ${
                collision
                  ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                  : 'bg-green-600 text-white shadow-[0_0_20px_rgba(0,255,0,0.3)]'
              }`}
            >
              {collision ? 'COLLISION!' : 'No Collision'}
            </div>
          </div>

          <div className="p-4 bg-[#1a1a2e] rounded-lg space-y-3">
            <h3 className="text-white font-bold">Stats</h3>
            <StatDisplay label="Penetration" value={depth > 0 ? `${depth}px` : '-'} />
          </div>

          <div className="p-4 bg-[#1a1a2e] rounded-lg">
            <h3 className="text-white font-bold mb-2">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-500" />
                <span className="text-gray-400">Static AABB</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-500" />
                <span className="text-gray-400">Static Circle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500/50 border-2 border-green-500" />
                <span className="text-gray-400">Mouse Circle</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// State Machine Demo
// ============================================================================

const StateMachineDemo = () => {
  const [stateMachine, setStateMachine] = useState<StateMachineType | null>(null)
  const [currentState, setCurrentState] = useState<string>(GAME_STATES.IDLE)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const sm = createStateMachine({
      initialState: GAME_STATES.IDLE,
      states: Object.values(GAME_STATES).map((name) => ({
        name,
        onEnter: () => {
          setHistory((h) => [...h.slice(-9), `Entered: ${name}`])
        },
        onExit: () => {
          setHistory((h) => [...h.slice(-9), `Exited: ${name}`])
        },
      })),
      transitions: [
        { from: GAME_STATES.IDLE, to: GAME_STATES.READY },
        { from: GAME_STATES.READY, to: GAME_STATES.PLAYING },
        { from: GAME_STATES.PLAYING, to: GAME_STATES.PAUSED },
        { from: GAME_STATES.PAUSED, to: GAME_STATES.PLAYING },
        { from: GAME_STATES.PLAYING, to: GAME_STATES.GAME_OVER },
        { from: GAME_STATES.GAME_OVER, to: GAME_STATES.READY },
        { from: GAME_STATES.GAME_OVER, to: GAME_STATES.IDLE },
      ],
    })

    sm.subscribe((event) => {
      setCurrentState(event.currentState)
    })

    setStateMachine(sm)
  }, [])

  const tryTransition = useCallback(
    (state: string) => {
      if (stateMachine) {
        const success = stateMachine.transitionTo(state)
        if (!success) {
          setHistory((h) => [...h.slice(-9), `Failed: ${currentState} → ${state}`])
        }
      }
    },
    [stateMachine, currentState]
  )

  const StateButton = ({ state, label }: { state: string; label: string }) => {
    const isCurrent = currentState === state
    const canTransition = stateMachine?.canTransitionTo(state)

    return (
      <button
        onClick={() => tryTransition(state)}
        disabled={isCurrent || !canTransition}
        className={`px-4 py-2 rounded font-bold transition-all ${
          isCurrent
            ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.5)]'
            : canTransition
              ? 'bg-[#2a2a4a] text-white hover:bg-[#3a3a5a]'
              : 'bg-[#1a1a2e] text-gray-600 cursor-not-allowed'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen">
      <SectionHeader
        title="State Machine"
        description="Click buttons to transition between game states. Invalid transitions are disabled."
      />

      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="p-6 bg-[#1a1a2e] rounded-lg">
            <h3 className="text-white font-bold mb-4">Current State</h3>
            <div
              className="text-4xl font-bold text-cyan-400 py-4 text-center"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {currentState.toUpperCase()}
            </div>
          </div>

          <div className="p-6 bg-[#1a1a2e] rounded-lg">
            <h3 className="text-white font-bold mb-4">Transitions</h3>
            <div className="flex flex-wrap gap-3">
              <StateButton state={GAME_STATES.IDLE} label="Idle" />
              <StateButton state={GAME_STATES.READY} label="Ready" />
              <StateButton state={GAME_STATES.PLAYING} label="Playing" />
              <StateButton state={GAME_STATES.PAUSED} label="Paused" />
              <StateButton state={GAME_STATES.GAME_OVER} label="Game Over" />
            </div>
          </div>
        </div>

        <div className="w-80">
          <div className="p-4 bg-[#1a1a2e] rounded-lg h-full">
            <h3 className="text-white font-bold mb-3">Transition History</h3>
            <div className="space-y-1 font-mono text-sm max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-gray-500 italic">No transitions yet...</p>
              ) : (
                history.map((entry, i) => (
                  <div
                    key={i}
                    className={`py-1 px-2 rounded ${
                      entry.includes('Failed')
                        ? 'text-red-400 bg-red-900/20'
                        : entry.includes('Entered')
                          ? 'text-green-400 bg-green-900/20'
                          : 'text-yellow-400 bg-yellow-900/20'
                    }`}
                  >
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Audio Demo
// ============================================================================

const AudioDemo = () => {
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [masterVolume, setMasterVolume] = useState(1.0)
  const [sfxVolume, setSfxVolume] = useState(1.0)
  const [playingCount, setPlayingCount] = useState(0)
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set())

  // Initialize audio manager
  const initAudio = useCallback(async () => {
    if (audioManager) return

    const manager = createAudioManager({
      masterVolume: 1.0,
      categoryVolumes: {
        sfx: 1.0,
        music: 0.7,
        ui: 0.8,
        voice: 1.0,
      },
    })

    await manager.init()
    setAudioManager(manager)
    setIsInitialized(true)
  }, [audioManager])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      audioManager?.dispose()
    }
  }, [audioManager])

  // Generate a simple beep sound using oscillator (no external files needed)
  const playBeep = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      if (!isInitialized) return

      // Create a temporary audio context for demo sounds
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

      // Apply volume from master and sfx sliders
      const volume = masterVolume * sfxVolume * (isMuted ? 0 : 1)
      gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start()
      oscillator.stop(ctx.currentTime + duration)

      const soundId = `beep_${Date.now()}`
      setActiveSounds((prev) => new Set(prev).add(soundId))
      setPlayingCount((prev) => prev + 1)

      setTimeout(() => {
        setActiveSounds((prev) => {
          const next = new Set(prev)
          next.delete(soundId)
          return next
        })
        setPlayingCount((prev) => Math.max(0, prev - 1))
        ctx.close()
      }, duration * 1000)
    },
    [isInitialized, masterVolume, sfxVolume, isMuted]
  )

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value)
    audioManager?.setMasterVolume(value)
  }

  const handleSfxVolumeChange = (value: number) => {
    setSfxVolume(value)
    audioManager?.setCategoryVolume('sfx', value)
  }

  const toggleMute = () => {
    if (isMuted) {
      audioManager?.unmute()
    } else {
      audioManager?.mute()
    }
    setIsMuted(!isMuted)
  }

  const SoundButton = ({
    label,
    frequency,
    type = 'sine',
    duration = 0.3,
    color = 'cyan',
  }: {
    label: string
    frequency: number
    type?: OscillatorType
    duration?: number
    color?: string
  }) => {
    const colorClasses: Record<string, string> = {
      cyan: 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.3)]',
      magenta: 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_20px_rgba(255,0,255,0.3)]',
      green: 'bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(0,255,0,0.3)]',
      yellow: 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_0_20px_rgba(255,255,0,0.3)]',
      red: 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]',
    }

    return (
      <button
        onClick={() => playBeep(frequency, duration, type)}
        disabled={!isInitialized}
        className={`
          px-4 py-3 rounded-lg font-bold text-white transition-all
          ${isInitialized ? colorClasses[color] : 'bg-gray-700 cursor-not-allowed opacity-50'}
        `}
      >
        {label}
      </button>
    )
  }

  const VolumeSlider = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (value: number) => void
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-cyan-400 font-mono">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-[#2a2a4a] rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  )

  return (
    <div className="p-8 bg-[#0a0a0f] min-h-screen">
      <SectionHeader
        title="Audio Playback"
        description="Click to initialize audio, then trigger different sound effects. Adjust volume with sliders."
      />

      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          {/* Initialize Button */}
          {!isInitialized ? (
            <div className="p-8 bg-[#1a1a2e] rounded-lg text-center">
              <p className="text-gray-400 mb-4">
                Browser autoplay policy requires user interaction to enable audio.
              </p>
              <button
                onClick={initAudio}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all shadow-[0_0_30px_rgba(0,255,255,0.4)] text-xl"
              >
                🔊 Initialize Audio
              </button>
            </div>
          ) : (
            <>
              {/* Sound Buttons Grid */}
              <div className="p-6 bg-[#1a1a2e] rounded-lg">
                <h3 className="text-white font-bold mb-4">Sound Effects (Synthesized)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <SoundButton label="Beep" frequency={440} color="cyan" />
                  <SoundButton label="Boop" frequency={220} color="cyan" />
                  <SoundButton label="Blip" frequency={880} duration={0.1} color="cyan" />
                  <SoundButton label="Jump" frequency={600} type="square" duration={0.15} color="green" />
                  <SoundButton label="Hit" frequency={150} type="sawtooth" duration={0.2} color="red" />
                  <SoundButton label="Coin" frequency={987} type="triangle" duration={0.2} color="yellow" />
                  <SoundButton label="Power Up" frequency={523} type="sine" duration={0.5} color="magenta" />
                  <SoundButton label="Laser" frequency={1200} type="sawtooth" duration={0.15} color="magenta" />
                  <SoundButton label="Explosion" frequency={80} type="sawtooth" duration={0.4} color="red" />
                </div>
              </div>

              {/* Visual Feedback */}
              <div className="p-6 bg-[#1a1a2e] rounded-lg">
                <h3 className="text-white font-bold mb-4">Audio Visualizer</h3>
                <div className="flex items-end justify-center gap-1 h-32 bg-[#0a0a0f] rounded-lg p-4">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const isActive = activeSounds.size > 0
                    // Use deterministic height based on index instead of Math.random() for purity
                    const height = isActive
                      ? 20 + ((i * 17 + 7) % 80)
                      : 10 + Math.sin(i * 0.5) * 5
                    return (
                      <div
                        key={i}
                        className={`w-4 rounded-t transition-all duration-75 ${
                          isActive ? 'bg-cyan-500' : 'bg-[#2a2a4a]'
                        }`}
                        style={{
                          height: `${height}%`,
                          boxShadow: isActive ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-72 space-y-4">
          {/* Status */}
          <div className="p-4 bg-[#1a1a2e] rounded-lg space-y-3">
            <h3 className="text-white font-bold">Status</h3>
            <StatDisplay
              label="Initialized"
              value={isInitialized ? '✓ Ready' : '○ Pending'}
            />
            <StatDisplay label="Playing" value={playingCount} />
            <StatDisplay label="Muted" value={isMuted ? 'Yes' : 'No'} />
          </div>

          {/* Volume Controls */}
          <div className="p-4 bg-[#1a1a2e] rounded-lg space-y-4">
            <h3 className="text-white font-bold">Volume Controls</h3>
            <VolumeSlider
              label="Master Volume"
              value={masterVolume}
              onChange={handleMasterVolumeChange}
            />
            <VolumeSlider
              label="SFX Volume"
              value={sfxVolume}
              onChange={handleSfxVolumeChange}
            />
            <button
              onClick={toggleMute}
              disabled={!isInitialized}
              className={`w-full py-2 rounded-lg font-bold transition-all ${
                !isInitialized
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
          </div>

          {/* Legend */}
          <div className="p-4 bg-[#1a1a2e] rounded-lg">
            <h3 className="text-white font-bold mb-2">Wave Types</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-500" />
                <span className="text-gray-400">Sine (smooth)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-gray-400">Square (retro)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-gray-400">Triangle (soft)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-gray-400">Sawtooth (harsh)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Documentation Overview
// ============================================================================

const EngineOverview = () => (
  <div className="p-8 bg-[#0a0a0f] min-h-screen text-white">
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: 'Orbitron, sans-serif', color: '#00ffff' }}
        >
          Game Engine
        </h1>
        <p className="text-gray-400 text-lg">
          x402Arcade Game Engine - Core systems for retro arcade games
        </p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">Game Loop</h2>
          <p className="text-gray-400 mb-4">
            Fixed timestep game loop with separate update and render phases.
            Supports FPS limiting and automatic pause on tab visibility change.
          </p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• 60 FPS target with frame interpolation</li>
            <li>• Update/render callback separation</li>
            <li>• FPS counter and frame timing</li>
          </ul>
        </div>

        <div className="p-6 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">Input Manager</h2>
          <p className="text-gray-400 mb-4">
            Unified input handling for keyboard, touch, and mouse.
            Supports custom key mapping and input event handlers.
          </p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• Keyboard (WASD, Arrows, etc.)</li>
            <li>• Touch gestures and swipes</li>
            <li>• Mouse position and clicks</li>
          </ul>
        </div>

        <div className="p-6 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">Collision Detection</h2>
          <p className="text-gray-400 mb-4">
            2D collision detection utilities for AABB and circle shapes.
            Includes penetration depth and collision normal calculation.
          </p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• AABB vs AABB intersection</li>
            <li>• Circle vs Circle collision</li>
            <li>• Circle vs AABB collision</li>
          </ul>
        </div>

        <div className="p-6 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">State Machine</h2>
          <p className="text-gray-400 mb-4">
            Game state management with validated transitions and lifecycle hooks.
            Perfect for managing menu, playing, paused, and game over states.
          </p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• Enter/exit callbacks per state</li>
            <li>• Transition validation</li>
            <li>• State change events</li>
          </ul>
        </div>

        <div className="p-6 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">Audio Manager</h2>
          <p className="text-gray-400 mb-4">
            Web Audio API wrapper for game sounds and music.
            Handles autoplay policy and audio context management.
          </p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• Sound effect loading and playback</li>
            <li>• Volume control per category</li>
            <li>• Auto-suspend on tab hide</li>
          </ul>
        </div>

        <div className="p-6 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">Music Manager</h2>
          <p className="text-gray-400 mb-4">
            Background music playback with crossfade support.
            Designed for seamless track transitions.
          </p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>• Looping with custom loop points</li>
            <li>• Crossfade between tracks</li>
            <li>• Pause/resume with position</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)

// ============================================================================
// Storybook Configuration
// ============================================================================

const meta = {
  title: 'Game Engine/Core',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'arcade-dark',
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <EngineOverview />,
}

export const GameLoop: Story = {
  render: () => <GameLoopDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo of the game loop with FPS tracking and animation.',
      },
    },
  },
}

export const Input: Story = {
  render: () => <InputDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Test keyboard input handling. Use arrow keys or WASD to move.',
      },
    },
  },
}

export const Collision: Story = {
  render: () => <CollisionDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Visual demonstration of AABB and circle collision detection.',
      },
    },
  },
}

export const GameStateMachine: Story = {
  render: () => <StateMachineDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive state machine demo showing valid transitions.',
      },
    },
  },
}

export const Audio: Story = {
  render: () => <AudioDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Audio playback demo with volume controls and sound effect triggers.',
      },
    },
  },
}
