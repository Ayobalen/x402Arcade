/**
 * State Machine Implementation
 *
 * Provides a generic state machine for game state management with
 * validated transitions, lifecycle callbacks, and event emission.
 *
 * @module games/engine/state-machine
 */

// ============================================================================
// Types
// ============================================================================

/**
 * State definition with lifecycle hooks
 */
export interface StateDefinition<TContext = unknown> {
  /** State name/identifier */
  name: string
  /** Called when entering this state */
  onEnter?: (context: TContext, previousState: string | null) => void
  /** Called when exiting this state */
  onExit?: (context: TContext, nextState: string) => void
  /** Called every frame while in this state */
  onUpdate?: (context: TContext, deltaTime: number) => void
}

/**
 * State transition definition
 */
export interface TransitionDefinition {
  /** Source state name */
  from: string
  /** Target state name */
  to: string
  /** Optional condition that must be true for transition to occur */
  condition?: () => boolean
  /** Optional callback when transition occurs */
  onTransition?: () => void
}

/**
 * State change event
 */
export interface StateChangeEvent {
  /** Event type */
  type: 'STATE_CHANGED'
  /** Previous state name (null if initial) */
  previousState: string | null
  /** New current state name */
  currentState: string
  /** Timestamp of the change */
  timestamp: number
}

/**
 * State machine event listener
 */
export type StateEventListener = (event: StateChangeEvent) => void

/**
 * State machine configuration
 */
export interface StateMachineConfig<TContext = unknown> {
  /** Initial state name */
  initialState: string
  /** State definitions */
  states: StateDefinition<TContext>[]
  /** Valid transitions (if not provided, all transitions are allowed) */
  transitions?: TransitionDefinition[]
  /** Shared context passed to all callbacks */
  context?: TContext
  /** Whether to allow self-transitions (default: false) */
  allowSelfTransition?: boolean
}

/**
 * State machine interface
 */
export interface StateMachine<TContext = unknown> {
  /** Get current state name */
  getCurrentState: () => string
  /** Get previous state name */
  getPreviousState: () => string | null
  /** Transition to a new state */
  transitionTo: (stateName: string) => boolean
  /** Check if a transition is valid */
  canTransitionTo: (stateName: string) => boolean
  /** Update the current state */
  update: (deltaTime: number) => void
  /** Reset to initial state */
  reset: () => void
  /** Subscribe to state changes */
  subscribe: (listener: StateEventListener) => () => void
  /** Get all available states */
  getStates: () => string[]
  /** Get valid transitions from current state */
  getValidTransitions: () => string[]
  /** Check if in a specific state */
  isInState: (stateName: string) => boolean
  /** Get the context object */
  getContext: () => TContext | undefined
  /** Update the context object */
  setContext: (context: TContext) => void
}

// ============================================================================
// Default Game States
// ============================================================================

/**
 * Standard game state names
 */
export const GAME_STATES = {
  IDLE: 'idle',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  LOADING: 'loading',
} as const

export type GameStateName = (typeof GAME_STATES)[keyof typeof GAME_STATES]

/**
 * Standard game state transitions
 */
export const GAME_STATE_TRANSITIONS: TransitionDefinition[] = [
  // From idle
  { from: GAME_STATES.IDLE, to: GAME_STATES.LOADING },
  { from: GAME_STATES.IDLE, to: GAME_STATES.READY },

  // From loading
  { from: GAME_STATES.LOADING, to: GAME_STATES.READY },
  { from: GAME_STATES.LOADING, to: GAME_STATES.IDLE }, // Load failed

  // From ready
  { from: GAME_STATES.READY, to: GAME_STATES.PLAYING },
  { from: GAME_STATES.READY, to: GAME_STATES.IDLE },

  // From playing
  { from: GAME_STATES.PLAYING, to: GAME_STATES.PAUSED },
  { from: GAME_STATES.PLAYING, to: GAME_STATES.GAME_OVER },
  { from: GAME_STATES.PLAYING, to: GAME_STATES.VICTORY },

  // From paused
  { from: GAME_STATES.PAUSED, to: GAME_STATES.PLAYING },
  { from: GAME_STATES.PAUSED, to: GAME_STATES.IDLE }, // Quit from pause

  // From game over
  { from: GAME_STATES.GAME_OVER, to: GAME_STATES.READY }, // Restart
  { from: GAME_STATES.GAME_OVER, to: GAME_STATES.IDLE },

  // From victory
  { from: GAME_STATES.VICTORY, to: GAME_STATES.READY }, // Next level or restart
  { from: GAME_STATES.VICTORY, to: GAME_STATES.IDLE },
]

// ============================================================================
// State Machine Implementation
// ============================================================================

/**
 * Creates a state machine with validated transitions
 *
 * @param config - State machine configuration
 * @returns StateMachine instance
 *
 * @example
 * ```ts
 * const gameStateMachine = createStateMachine({
 *   initialState: 'idle',
 *   states: [
 *     {
 *       name: 'idle',
 *       onEnter: () => console.log('Entered idle'),
 *       onExit: () => console.log('Exited idle'),
 *     },
 *     {
 *       name: 'playing',
 *       onEnter: () => console.log('Game started'),
 *       onUpdate: (ctx, dt) => updateGame(dt),
 *     },
 *   ],
 *   transitions: [
 *     { from: 'idle', to: 'playing' },
 *     { from: 'playing', to: 'idle' },
 *   ],
 * });
 *
 * gameStateMachine.transitionTo('playing');
 * ```
 */
export function createStateMachine<TContext = unknown>(
  config: StateMachineConfig<TContext>
): StateMachine<TContext> {
  // Validate config
  if (!config.states || config.states.length === 0) {
    throw new Error('StateMachine: At least one state must be defined')
  }

  const stateMap = new Map<string, StateDefinition<TContext>>()
  for (const state of config.states) {
    if (stateMap.has(state.name)) {
      throw new Error(`StateMachine: Duplicate state name "${state.name}"`)
    }
    stateMap.set(state.name, state)
  }

  if (!stateMap.has(config.initialState)) {
    throw new Error(
      `StateMachine: Initial state "${config.initialState}" is not defined`
    )
  }

  // Build transition map for fast lookup
  const transitionMap = new Map<string, Set<string>>()
  if (config.transitions) {
    for (const transition of config.transitions) {
      if (!transitionMap.has(transition.from)) {
        transitionMap.set(transition.from, new Set())
      }
      transitionMap.get(transition.from)!.add(transition.to)
    }
  }

  // State
  let currentState = config.initialState
  let previousState: string | null = null
  let context = config.context
  const allowSelfTransition = config.allowSelfTransition ?? false
  const listeners = new Set<StateEventListener>()

  /**
   * Get the state definition for a state name
   */
  function getStateDefinition(
    stateName: string
  ): StateDefinition<TContext> | undefined {
    return stateMap.get(stateName)
  }

  /**
   * Check if a transition from current state to target state is valid
   */
  function isTransitionValid(targetState: string): boolean {
    // Check self-transition
    if (targetState === currentState && !allowSelfTransition) {
      return false
    }

    // Check if target state exists
    if (!stateMap.has(targetState)) {
      return false
    }

    // If no transitions defined, allow all transitions
    if (!config.transitions || config.transitions.length === 0) {
      return true
    }

    // Check if transition is in the allowed list
    const allowedTransitions = transitionMap.get(currentState)
    if (!allowedTransitions || !allowedTransitions.has(targetState)) {
      return false
    }

    // Check transition condition if defined
    const transition = config.transitions.find(
      (t) => t.from === currentState && t.to === targetState
    )
    if (transition?.condition && !transition.condition()) {
      return false
    }

    return true
  }

  /**
   * Emit a state change event to all listeners
   */
  function emitStateChange(prevState: string | null, newState: string): void {
    const event: StateChangeEvent = {
      type: 'STATE_CHANGED',
      previousState: prevState,
      currentState: newState,
      timestamp: performance.now(),
    }

    for (const listener of listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('StateMachine: Error in state change listener', error)
      }
    }
  }

  return {
    getCurrentState(): string {
      return currentState
    },

    getPreviousState(): string | null {
      return previousState
    },

    /**
     * Transition to a new state
     *
     * @param stateName - Target state name
     * @returns true if transition succeeded, false otherwise
     */
    transitionTo(stateName: string): boolean {
      // Validate transition is allowed
      if (!isTransitionValid(stateName)) {
        console.warn(
          `StateMachine: Invalid transition from "${currentState}" to "${stateName}"`
        )
        return false
      }

      const exitingState = getStateDefinition(currentState)
      const enteringState = getStateDefinition(stateName)

      // Call onExit for current state
      if (exitingState?.onExit && context !== undefined) {
        try {
          exitingState.onExit(context, stateName)
        } catch (error) {
          console.error(
            `StateMachine: Error in onExit for state "${currentState}"`,
            error
          )
        }
      }

      // Get transition callback if defined
      const transition = config.transitions?.find(
        (t) => t.from === currentState && t.to === stateName
      )

      // Call transition callback if defined
      if (transition?.onTransition) {
        try {
          transition.onTransition()
        } catch (error) {
          console.error(
            `StateMachine: Error in onTransition from "${currentState}" to "${stateName}"`,
            error
          )
        }
      }

      // Update current state
      previousState = currentState
      currentState = stateName

      // Call onEnter for new state
      if (enteringState?.onEnter && context !== undefined) {
        try {
          enteringState.onEnter(context, previousState)
        } catch (error) {
          console.error(
            `StateMachine: Error in onEnter for state "${stateName}"`,
            error
          )
        }
      }

      // Emit state change event
      emitStateChange(previousState, currentState)

      return true
    },

    canTransitionTo(stateName: string): boolean {
      return isTransitionValid(stateName)
    },

    update(deltaTime: number): void {
      const state = getStateDefinition(currentState)
      if (state?.onUpdate && context !== undefined) {
        try {
          state.onUpdate(context, deltaTime)
        } catch (error) {
          console.error(
            `StateMachine: Error in onUpdate for state "${currentState}"`,
            error
          )
        }
      }
    },

    reset(): void {
      // Exit current state
      const exitingState = getStateDefinition(currentState)
      if (exitingState?.onExit && context !== undefined) {
        try {
          exitingState.onExit(context, config.initialState)
        } catch (error) {
          console.error(
            `StateMachine: Error in onExit during reset`,
            error
          )
        }
      }

      previousState = currentState
      currentState = config.initialState

      // Enter initial state
      const enteringState = getStateDefinition(currentState)
      if (enteringState?.onEnter && context !== undefined) {
        try {
          enteringState.onEnter(context, previousState)
        } catch (error) {
          console.error(
            `StateMachine: Error in onEnter during reset`,
            error
          )
        }
      }

      emitStateChange(previousState, currentState)
    },

    subscribe(listener: StateEventListener): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    getStates(): string[] {
      return Array.from(stateMap.keys())
    },

    getValidTransitions(): string[] {
      if (!config.transitions || config.transitions.length === 0) {
        // All states are valid if no transitions defined
        return Array.from(stateMap.keys()).filter(
          (s) => s !== currentState || allowSelfTransition
        )
      }

      const transitions = transitionMap.get(currentState)
      if (!transitions) return []

      // Filter by condition
      return Array.from(transitions).filter((targetState) => {
        const transition = config.transitions?.find(
          (t) => t.from === currentState && t.to === targetState
        )
        return !transition?.condition || transition.condition()
      })
    },

    isInState(stateName: string): boolean {
      return currentState === stateName
    },

    getContext(): TContext | undefined {
      return context
    },

    setContext(newContext: TContext): void {
      context = newContext
    },
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a standard game state machine with common states and transitions
 *
 * @param context - Game context to pass to state callbacks
 * @param stateCallbacks - Optional callbacks for each state
 * @returns StateMachine configured for typical game states
 *
 * @example
 * ```ts
 * const gameContext = { player: null, score: 0 };
 *
 * const stateMachine = createGameStateMachine(gameContext, {
 *   playing: {
 *     onEnter: (ctx) => ctx.player = createPlayer(),
 *     onUpdate: (ctx, dt) => ctx.player.update(dt),
 *     onExit: (ctx) => ctx.player.cleanup(),
 *   },
 *   gameOver: {
 *     onEnter: (ctx) => showGameOverScreen(ctx.score),
 *   },
 * });
 * ```
 */
export function createGameStateMachine<TContext = unknown>(
  context?: TContext,
  stateCallbacks?: Partial<
    Record<
      GameStateName,
      {
        onEnter?: (context: TContext, previousState: string | null) => void
        onExit?: (context: TContext, nextState: string) => void
        onUpdate?: (context: TContext, deltaTime: number) => void
      }
    >
  >
): StateMachine<TContext> {
  const states: StateDefinition<TContext>[] = Object.values(GAME_STATES).map(
    (stateName) => ({
      name: stateName,
      ...stateCallbacks?.[stateName],
    })
  )

  return createStateMachine({
    initialState: GAME_STATES.IDLE,
    states,
    transitions: GAME_STATE_TRANSITIONS,
    context,
  })
}

// Note: All types are exported at their definitions via `export interface`
// No need for redundant re-exports here
