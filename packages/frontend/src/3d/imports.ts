/**
 * Optimized Three.js Imports
 *
 * This module provides selective imports from Three.js to enable better tree shaking.
 * Instead of `import * as THREE from 'three'`, import only what you need from here.
 *
 * Benefits:
 * - Smaller bundle size through tree shaking
 * - Explicit dependency tracking
 * - Easier to identify unused Three.js features
 * - Better code splitting opportunities
 *
 * @example
 * // Instead of:
 * import * as THREE from 'three'
 * const vec = new THREE.Vector3()
 *
 * // Use:
 * import { Vector3 } from '@/3d/imports'
 * const vec = new Vector3()
 *
 * @module 3d/imports
 */

// ============================================================================
// Core Classes
// ============================================================================

export {
  // Math
  Vector2,
  Vector3,
  Vector4,
  Matrix3,
  Matrix4,
  Quaternion,
  Euler,
  Box3,
  Sphere,
  Ray,
  Plane,
  Color,
  MathUtils,

  // Objects
  Object3D,
  Group,
  Mesh,
  InstancedMesh,
  Points,
  Line,
  LineSegments,
  Sprite,
  LOD,
  Bone,
  Skeleton,
  SkinnedMesh,

  // Geometry
  BufferGeometry,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  TorusGeometry,
  RingGeometry,
  CircleGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  DodecahedronGeometry,
  TetrahedronGeometry,
  ShapeGeometry,
  ExtrudeGeometry,
  TubeGeometry,
  LatheGeometry,
  EdgesGeometry,
  WireframeGeometry,

  // Buffer Attributes
  BufferAttribute,
  Float32BufferAttribute,
  Int32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Float16BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,

  // Materials
  Material,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshToonMaterial,
  MeshNormalMaterial,
  MeshMatcapMaterial,
  MeshDepthMaterial,
  MeshDistanceMaterial,
  PointsMaterial,
  LineBasicMaterial,
  LineDashedMaterial,
  SpriteMaterial,
  ShaderMaterial,
  RawShaderMaterial,
  ShadowMaterial,

  // Lights
  Light,
  AmbientLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  HemisphereLight,
  RectAreaLight,

  // Light Helpers
  DirectionalLightHelper,
  PointLightHelper,
  SpotLightHelper,
  HemisphereLightHelper,
  GridHelper,
  AxesHelper,
  BoxHelper,
  Box3Helper,
  PlaneHelper,
  ArrowHelper,
  CameraHelper,

  // Cameras
  Camera,
  PerspectiveCamera,
  OrthographicCamera,
  ArrayCamera,
  CubeCamera,
  StereoCamera,

  // Textures
  Texture,
  DataTexture,
  DataArrayTexture,
  Data3DTexture,
  CompressedTexture,
  CompressedArrayTexture,
  CubeTexture,
  CanvasTexture,
  VideoTexture,
  DepthTexture,
  FramebufferTexture,

  // Loaders
  Loader,
  FileLoader,
  ImageLoader,
  TextureLoader,
  CubeTextureLoader,
  BufferGeometryLoader,
  ObjectLoader,
  MaterialLoader,
  LoaderUtils,
  LoadingManager,
  ImageBitmapLoader,

  // Renderers
  WebGLRenderer,
  WebGLRenderTarget,
  WebGLCubeRenderTarget,
  WebGLArrayRenderTarget,
  WebGL3DRenderTarget,

  // Scenes
  Scene,
  Fog,
  FogExp2,

  // Animation
  AnimationClip,
  AnimationMixer,
  AnimationAction,
  AnimationObjectGroup,
  KeyframeTrack,
  NumberKeyframeTrack,
  VectorKeyframeTrack,
  QuaternionKeyframeTrack,
  BooleanKeyframeTrack,
  StringKeyframeTrack,
  ColorKeyframeTrack,

  // Audio (optional - only import if using audio)
  // Audio,
  // AudioListener,
  // AudioAnalyser,
  // AudioLoader,
  // PositionalAudio,

  // Curves
  Curve,
  CurvePath,
  Path,
  Shape,
  ShapePath,
  LineCurve,
  LineCurve3,
  QuadraticBezierCurve,
  QuadraticBezierCurve3,
  CubicBezierCurve,
  CubicBezierCurve3,
  SplineCurve,
  CatmullRomCurve3,
  EllipseCurve,
  ArcCurve,

  // Controls (import from drei instead for React Three Fiber)
  // OrbitControls,
  // TrackballControls,
  // etc.

  // Raycasting
  Raycaster,

  // Clock
  Clock,

  // Uniforms
  Uniform,
  UniformsGroup,

  // Frustum
  Frustum,

  // Layers
  Layers,

  // Skeleton
  DataTextureLoader,

  // Utils
  Triangle,
  Interpolant,
  DiscreteInterpolant,
  LinearInterpolant,
  CubicInterpolant,
} from 'three';

// ============================================================================
// Constants
// ============================================================================

export {
  // Side
  FrontSide,
  BackSide,
  DoubleSide,

  // Blending
  NoBlending,
  NormalBlending,
  AdditiveBlending,
  SubtractiveBlending,
  MultiplyBlending,
  CustomBlending,

  // Blending Equations
  AddEquation,
  SubtractEquation,
  ReverseSubtractEquation,
  MinEquation,
  MaxEquation,

  // Blending Factors
  ZeroFactor,
  OneFactor,
  SrcColorFactor,
  OneMinusSrcColorFactor,
  SrcAlphaFactor,
  OneMinusSrcAlphaFactor,
  DstAlphaFactor,
  OneMinusDstAlphaFactor,
  DstColorFactor,
  OneMinusDstColorFactor,
  SrcAlphaSaturateFactor,
  ConstantColorFactor,
  OneMinusConstantColorFactor,
  ConstantAlphaFactor,
  OneMinusConstantAlphaFactor,

  // Depth Modes
  NeverDepth,
  AlwaysDepth,
  LessDepth,
  LessEqualDepth,
  EqualDepth,
  GreaterEqualDepth,
  GreaterDepth,
  NotEqualDepth,

  // Texture Mapping
  UVMapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  CubeUVReflectionMapping,

  // Texture Wrapping
  RepeatWrapping,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,

  // Texture Filters
  NearestFilter,
  NearestMipmapNearestFilter,
  NearestMipmapLinearFilter,
  LinearFilter,
  LinearMipmapNearestFilter,
  LinearMipmapLinearFilter,

  // Pixel Formats
  RGBAFormat,
  RGBFormat,
  RedFormat,
  RGFormat,
  RedIntegerFormat,
  RGIntegerFormat,
  RGBAIntegerFormat,
  AlphaFormat,
  DepthFormat,
  DepthStencilFormat,

  // Data Types
  UnsignedByteType,
  ByteType,
  ShortType,
  UnsignedShortType,
  IntType,
  UnsignedIntType,
  FloatType,
  HalfFloatType,
  UnsignedShort4444Type,
  UnsignedShort5551Type,
  UnsignedInt248Type,

  // Encoding
  LinearSRGBColorSpace,
  SRGBColorSpace,
  NoColorSpace,

  // Tone Mapping
  NoToneMapping,
  LinearToneMapping,
  ReinhardToneMapping,
  CineonToneMapping,
  ACESFilmicToneMapping,
  CustomToneMapping,
  AgXToneMapping,
  NeutralToneMapping,

  // Shadow Types
  BasicShadowMap,
  PCFShadowMap,
  PCFSoftShadowMap,
  VSMShadowMap,

  // Triangle Draw Modes
  TrianglesDrawMode,
  TriangleStripDrawMode,
  TriangleFanDrawMode,

  // Clipping
  NormalAnimationBlendMode,
  AdditiveAnimationBlendMode,

  // Interpolation
  InterpolateDiscrete,
  InterpolateLinear,
  InterpolateSmooth,

  // Wrapping modes for animations
  ZeroCurvatureEnding,
  ZeroSlopeEnding,
  WrapAroundEnding,

  // Loop modes
  LoopOnce,
  LoopRepeat,
  LoopPingPong,

  // GL
  GLSL1,
  GLSL3,

  // Stencil Operations
  ZeroStencilOp,
  KeepStencilOp,
  ReplaceStencilOp,
  IncrementStencilOp,
  DecrementStencilOp,
  IncrementWrapStencilOp,
  DecrementWrapStencilOp,
  InvertStencilOp,

  // Stencil Functions
  NeverStencilFunc,
  LessStencilFunc,
  EqualStencilFunc,
  LessEqualStencilFunc,
  GreaterStencilFunc,
  NotEqualStencilFunc,
  GreaterEqualStencilFunc,
  AlwaysStencilFunc,

  // Usage
  StaticDrawUsage,
  DynamicDrawUsage,
  StreamDrawUsage,
  StaticReadUsage,
  DynamicReadUsage,
  StreamReadUsage,
  StaticCopyUsage,
  DynamicCopyUsage,
  StreamCopyUsage,

  // WebXR
  // WebXRManager,  // Import only if using VR/AR
} from 'three';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Common types
  BufferGeometryJSON,
  ColorRepresentation,
  EulerOrder,
  IUniform,
  Matrix4Tuple,
  NormalBufferAttributes,
  Object3DEventMap,
  PixelFormat,
  ShaderMaterialParameters,
  Side,
  TextureDataType,
  TextureFilter,
  Wrapping,
} from 'three';

// ============================================================================
// Version Info
// ============================================================================

export { REVISION as THREE_VERSION } from 'three';
