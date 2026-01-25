/**
 * Animation Utilities
 *
 * Collection of animation utilities for the application.
 * Includes stagger animations for lists, sequence animations for multi-step effects,
 * loop animations for repeating effects, and gesture animations for interactions.
 */

// Stagger animations
export {
  staggerContainer,
  staggerChild,
  STAGGER_PRESETS,
  getStaggerPreset,
  type StaggerContainerOptions,
  type StaggerChildOptions,
  type StaggerPreset,
} from './stagger';

// Sequence animations
export {
  sequence,
  createSequence,
  sequencePreset,
  SEQUENCE_PRESETS,
  getSequencePreset,
  type AnimationStep,
  type SequenceOptions,
  type SequencePreset,
} from './sequence';

// Loop animations
export {
  createLoop,
  LOOP_PRESETS,
  getLoopPreset,
  customLoop,
  type LoopOptions,
  type LoopRepeatType,
  type LoopPreset,
} from './loop';

// Gesture animations
export {
  HOVER_PRESETS,
  TAP_PRESETS,
  FOCUS_PRESETS,
  DRAG_CONSTRAINTS,
  DRAG_ELASTIC,
  BUTTON_GESTURES,
  getHoverPreset,
  getTapPreset,
  getFocusPreset,
  getDragConstraintPreset,
  getDragElasticPreset,
  getButtonGesturePreset,
  type HoverPreset,
  type TapPreset,
  type FocusPreset,
  type DragConstraintPreset,
  type DragElasticPreset,
  type ButtonGesturePreset,
} from './gestures';

// Page transitions
export {
  fadeTransition,
  fadeFastTransition,
  slideTransition,
  scaleTransition,
  slideScaleTransition,
  blurTransition,
  rotateTransition,
  zoomTransition,
  neonGlowTransition,
  PAGE_TRANSITION_PRESETS,
  getPageTransitionPreset,
  type SlideDirection,
  type ScaleDirection,
  type PageTransitionVariants,
  type PageTransitionPreset,
} from './pageTransitions';
