#!/usr/bin/env python3
"""
Insert comprehensive Audio System features into the x402Arcade features database.
Starting at priority 791 as specified.
"""

import sqlite3
import json

# Audio system features organized by category
AUDIO_FEATURES = [
    # ========== Audio Engine Setup (791-800) ==========
    {
        "priority": 791,
        "category": "Audio System",
        "name": "Install Howler.js for audio management",
        "description": "Add Howler.js library to the project for cross-browser audio playback. Howler.js provides a unified API for Web Audio and HTML5 Audio, handles codec support detection, and manages audio sprites efficiently.",
        "steps": [
            "Run npm install howler in the project directory",
            "Add @types/howler for TypeScript support",
            "Verify installation in package.json",
            "Create basic import test in a utility file"
        ]
    },
    {
        "priority": 792,
        "category": "Audio System",
        "name": "Create AudioManager singleton class",
        "description": "Implement a centralized AudioManager singleton that handles all audio operations. This manager will be the single point of control for audio playback, volume settings, and audio state management across the application.",
        "steps": [
            "Create src/lib/audio/AudioManager.ts",
            "Implement singleton pattern with getInstance()",
            "Add initialization method with lazy loading",
            "Create audio context management",
            "Export singleton instance for global access",
            "Add TypeScript interfaces for audio configuration"
        ]
    },
    {
        "priority": 793,
        "category": "Audio System",
        "name": "Implement audio context initialization",
        "description": "Set up proper Web Audio API context initialization with browser compatibility handling. Handle suspended audio context state and provide methods to resume audio playback.",
        "steps": [
            "Create initializeAudioContext() method in AudioManager",
            "Handle AudioContext creation with browser prefixes",
            "Implement context state checking (suspended/running)",
            "Add error handling for unsupported browsers",
            "Log initialization status for debugging"
        ]
    },
    {
        "priority": 794,
        "category": "Audio System",
        "name": "Handle audio context resume on user interaction",
        "description": "Implement automatic audio context resumption on first user interaction. Modern browsers require user gesture to start audio, so we need to listen for clicks/touches and resume the audio context.",
        "steps": [
            "Create resumeAudioContext() method",
            "Add event listeners for user interaction (click, touchstart, keydown)",
            "Resume audio context on first interaction",
            "Remove listeners after successful resume",
            "Provide visual feedback if audio is blocked",
            "Add useAudioInit hook for React components"
        ]
    },
    {
        "priority": 795,
        "category": "Audio System",
        "name": "Create audio sprite system for efficient loading",
        "description": "Implement an audio sprite system that combines multiple short sounds into a single audio file. This reduces HTTP requests and improves loading performance, especially important for game sound effects.",
        "steps": [
            "Create AudioSprite class in src/lib/audio/AudioSprite.ts",
            "Define sprite map interface with start/end times",
            "Implement sprite loading from JSON definition",
            "Create playSprite() method with segment selection",
            "Add sprite preloading functionality",
            "Document sprite creation workflow"
        ]
    },
    {
        "priority": 796,
        "category": "Audio System",
        "name": "Implement audio pool for concurrent sounds",
        "description": "Create an audio pool system that manages multiple instances of the same sound for concurrent playback. Essential for rapid-fire sound effects like button clicks or game events that may overlap.",
        "steps": [
            "Create AudioPool class in src/lib/audio/AudioPool.ts",
            "Implement pool initialization with configurable size",
            "Create acquire() and release() methods",
            "Add automatic pool expansion if needed",
            "Implement pool cleanup and disposal",
            "Add pool statistics for debugging"
        ]
    },
    {
        "priority": 797,
        "category": "Audio System",
        "name": "Create volume control system",
        "description": "Implement a hierarchical volume control system with master volume, music volume, and sound effects volume. All volumes should be normalized (0-1) and composable.",
        "steps": [
            "Add volume properties to AudioManager (master, music, sfx)",
            "Create setMasterVolume(), setMusicVolume(), setSfxVolume() methods",
            "Implement volume calculation: effective = master * category",
            "Add volume change event emitter",
            "Create getEffectiveVolume() utility",
            "Ensure volume changes apply to currently playing audio"
        ]
    },
    {
        "priority": 798,
        "category": "Audio System",
        "name": "Implement mute/unmute functionality",
        "description": "Add mute/unmute controls for master audio and individual categories. Muting should preserve previous volume settings for restoration on unmute.",
        "steps": [
            "Add muted state properties (masterMuted, musicMuted, sfxMuted)",
            "Create toggleMute(), mute(), unmute() methods",
            "Store pre-mute volume for restoration",
            "Implement category-specific muting",
            "Add isMuted() getter methods",
            "Emit mute state change events"
        ]
    },
    {
        "priority": 799,
        "category": "Audio System",
        "name": "Create audio settings persistence",
        "description": "Persist audio settings (volumes, mute states) to localStorage so user preferences are remembered across sessions. Load settings on initialization and save on changes.",
        "steps": [
            "Create AudioSettings interface",
            "Implement saveSettings() method with localStorage",
            "Create loadSettings() method with defaults",
            "Add settings version for migration support",
            "Call loadSettings() during AudioManager init",
            "Auto-save on setting changes with debouncing"
        ]
    },
    {
        "priority": 800,
        "category": "Audio System",
        "name": "Handle audio on visibility change",
        "description": "Pause or reduce audio when the browser tab becomes hidden and resume when visible again. This saves resources and provides better user experience when switching tabs.",
        "steps": [
            "Add visibilitychange event listener",
            "Pause music when tab is hidden",
            "Optionally mute SFX when hidden",
            "Resume audio when tab becomes visible",
            "Make behavior configurable (pause vs mute)",
            "Handle edge cases (already paused music)"
        ]
    },

    # ========== Sound Effect System (801-808) ==========
    {
        "priority": 801,
        "category": "Audio System",
        "name": "Create SFX loader and cache",
        "description": "Implement a sound effect loading system with caching to prevent duplicate loads. Support preloading critical sounds and lazy loading others.",
        "steps": [
            "Create SFXManager class in src/lib/audio/SFXManager.ts",
            "Implement loadSound() with Promise-based loading",
            "Create sound cache Map for loaded sounds",
            "Add preloadSounds() for batch loading",
            "Implement cache eviction for memory management",
            "Add loading progress tracking"
        ]
    },
    {
        "priority": 802,
        "category": "Audio System",
        "name": "Implement sound effect playback",
        "description": "Create the core sound effect playback functionality with options for volume, rate, and callbacks. Support fire-and-forget and controlled playback modes.",
        "steps": [
            "Create playSFX() method in SFXManager",
            "Add PlaybackOptions interface (volume, rate, loop)",
            "Return playback ID for control",
            "Implement stopSFX() method",
            "Add onEnd callback support",
            "Handle playback errors gracefully"
        ]
    },
    {
        "priority": 803,
        "category": "Audio System",
        "name": "Implement sound effect variants",
        "description": "Add support for sound effect variants - multiple versions of the same sound that are randomly selected. This prevents repetitive audio and adds variety to game sounds.",
        "steps": [
            "Create registerVariants() method",
            "Store variant groups with weights",
            "Implement random selection on play",
            "Add playVariant() method",
            "Support weighted randomization",
            "Prevent immediate repetition of same variant"
        ]
    },
    {
        "priority": 804,
        "category": "Audio System",
        "name": "Implement positional audio with stereo panning",
        "description": "Add stereo panning support for positional audio effects. Allow sounds to be positioned left/right based on game position for spatial awareness.",
        "steps": [
            "Add pan property to PlaybackOptions (-1 to 1)",
            "Create setPan() method for playing sounds",
            "Implement calculatePan() utility from x position",
            "Add smooth pan transitions",
            "Support dynamic pan updates during playback",
            "Test with game element positions"
        ]
    },
    {
        "priority": 805,
        "category": "Audio System",
        "name": "Create sound effect priority system",
        "description": "Implement a priority system for sound effects when too many are playing simultaneously. Higher priority sounds can interrupt or duck lower priority ones.",
        "steps": [
            "Add priority level to PlaybackOptions (1-10)",
            "Track currently playing sounds with priorities",
            "Implement max concurrent sounds limit",
            "Create priority-based eviction",
            "Add critical sounds that always play",
            "Log when sounds are skipped due to priority"
        ]
    },
    {
        "priority": 806,
        "category": "Audio System",
        "name": "Implement sound effect ducking",
        "description": "Add ducking support where certain sounds (like voice or important alerts) temporarily reduce the volume of other sounds. Implement smooth volume transitions.",
        "steps": [
            "Add duck property to PlaybackOptions",
            "Create DuckingManager for coordination",
            "Implement smooth volume reduction",
            "Add ducking recovery on sound end",
            "Support multiple ducking sources",
            "Make ducking amount configurable"
        ]
    },
    {
        "priority": 807,
        "category": "Audio System",
        "name": "Create sound effect cooldowns",
        "description": "Implement cooldown system to prevent sound effect spam. Critical for rapid game events that could cause audio overload.",
        "steps": [
            "Add cooldown property to sound definitions",
            "Track last play time per sound",
            "Skip play if within cooldown window",
            "Support per-instance and global cooldowns",
            "Add optional cooldown callback",
            "Make cooldowns configurable per sound"
        ]
    },
    {
        "priority": 808,
        "category": "Audio System",
        "name": "Write SFX system unit tests",
        "description": "Create comprehensive unit tests for the sound effect system covering loading, playback, variants, positioning, priority, ducking, and cooldowns.",
        "steps": [
            "Create __tests__/audio/SFXManager.test.ts",
            "Test sound loading and caching",
            "Test playback with various options",
            "Test variant selection randomization",
            "Test priority and eviction logic",
            "Test cooldown behavior",
            "Mock Howler.js for unit tests"
        ]
    },

    # ========== Background Music System (809-815) ==========
    {
        "priority": 809,
        "category": "Audio System",
        "name": "Create music track loader",
        "description": "Implement a music track loading system optimized for longer audio files. Support streaming and buffering for smooth playback of background music.",
        "steps": [
            "Create MusicManager class in src/lib/audio/MusicManager.ts",
            "Implement loadTrack() with streaming support",
            "Create track metadata interface",
            "Add preload hints for upcoming tracks",
            "Implement loading progress events",
            "Handle loading errors with fallbacks"
        ]
    },
    {
        "priority": 810,
        "category": "Audio System",
        "name": "Implement seamless music looping",
        "description": "Create seamless looping for background music tracks. Handle loop points properly to avoid clicks or gaps at loop boundaries.",
        "steps": [
            "Configure Howler for seamless looping",
            "Support custom loop start/end points",
            "Handle intro + loop pattern (play intro once, then loop)",
            "Test for audio gaps at loop point",
            "Add loop count tracking",
            "Support infinite and counted loops"
        ]
    },
    {
        "priority": 811,
        "category": "Audio System",
        "name": "Implement crossfade between tracks",
        "description": "Add smooth crossfade transitions when changing background music tracks. Support configurable fade duration and curves.",
        "steps": [
            "Create crossfade() method in MusicManager",
            "Implement linear and exponential fade curves",
            "Make fade duration configurable",
            "Handle rapid track changes gracefully",
            "Support immediate switch (no fade) option",
            "Add fade complete callback"
        ]
    },
    {
        "priority": 812,
        "category": "Audio System",
        "name": "Create dynamic music system with intensity layers",
        "description": "Implement a dynamic music system where different intensity layers can be mixed based on game state. Support smooth transitions between intensity levels.",
        "steps": [
            "Create DynamicMusic class",
            "Support multiple synchronized layers",
            "Implement intensity level (0-1) control",
            "Add layer volume mapping to intensity",
            "Create smooth layer transitions",
            "Support layer-specific effects"
        ]
    },
    {
        "priority": 813,
        "category": "Audio System",
        "name": "Implement music ducking during events",
        "description": "Temporarily reduce music volume during important game events like achievements, level completion, or voice over. Smoothly restore volume after event.",
        "steps": [
            "Create duckMusic() method",
            "Add duck amount and duration parameters",
            "Implement smooth volume reduction",
            "Auto-restore after specified duration",
            "Support manual restore",
            "Stack multiple duck requests properly"
        ]
    },
    {
        "priority": 814,
        "category": "Audio System",
        "name": "Create playlist and shuffle functionality",
        "description": "Implement playlist support for background music with shuffle and repeat modes. Support automatic advancement to next track.",
        "steps": [
            "Create Playlist class",
            "Add tracks array with metadata",
            "Implement next(), previous() methods",
            "Add shuffle mode with Fisher-Yates",
            "Support repeat modes (none, one, all)",
            "Emit track change events"
        ]
    },
    {
        "priority": 815,
        "category": "Audio System",
        "name": "Write music system unit tests",
        "description": "Create unit tests for the music system covering loading, looping, crossfading, dynamic layers, ducking, and playlists.",
        "steps": [
            "Create __tests__/audio/MusicManager.test.ts",
            "Test track loading and buffering",
            "Test seamless looping",
            "Test crossfade transitions",
            "Test dynamic intensity layers",
            "Test playlist navigation and shuffle"
        ]
    },

    # ========== UI Sound Effects (816-825) ==========
    {
        "priority": 816,
        "category": "Audio System",
        "name": "Create button click sound effect",
        "description": "Add a satisfying click sound for button interactions. The sound should be crisp, short, and provide clear feedback without being annoying.",
        "steps": [
            "Source or create button click sound (50-100ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Create useButtonSound hook",
            "Apply to Button component onClick",
            "Test on various buttons throughout app"
        ]
    },
    {
        "priority": 817,
        "category": "Audio System",
        "name": "Create button hover sound effect",
        "description": "Add a subtle hover sound for buttons to enhance interactivity. Should be quieter than click sound and very short to avoid annoyance.",
        "steps": [
            "Source or create soft hover sound (30-50ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Add to useButtonSound hook for hover",
            "Implement cooldown to prevent rapid triggering",
            "Make hover sound optional/configurable"
        ]
    },
    {
        "priority": 818,
        "category": "Audio System",
        "name": "Create modal open sound effect",
        "description": "Add a sound effect when modals open to draw attention and provide feedback. Should feel like something is revealing or expanding.",
        "steps": [
            "Source or create modal open sound (100-200ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Create useModalSound hook",
            "Integrate with Dialog component onOpenChange",
            "Test with various modals"
        ]
    },
    {
        "priority": 819,
        "category": "Audio System",
        "name": "Create modal close sound effect",
        "description": "Add a complementary sound effect when modals close. Should feel like something is receding or closing.",
        "steps": [
            "Source or create modal close sound (100-150ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Add to useModalSound hook",
            "Trigger on dialog close",
            "Ensure distinct from open sound"
        ]
    },
    {
        "priority": 820,
        "category": "Audio System",
        "name": "Create toast notification sound",
        "description": "Add notification sounds for toast messages. Different sounds for different toast types (info, success, warning, error).",
        "steps": [
            "Source or create notification chime (100-150ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Create useToastSound hook",
            "Integrate with toast system",
            "Support different sounds per toast type"
        ]
    },
    {
        "priority": 821,
        "category": "Audio System",
        "name": "Create error sound effect",
        "description": "Add a distinct error sound for validation errors, failed operations, and error states. Should be attention-getting but not harsh.",
        "steps": [
            "Source or create error sound (150-200ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest as error/buzzer",
            "Create playError() convenience method",
            "Use on form validation errors",
            "Use on operation failures"
        ]
    },
    {
        "priority": 822,
        "category": "Audio System",
        "name": "Create success sound effect",
        "description": "Add a positive success sound for completed operations, successful submissions, and achievement moments. Should feel rewarding.",
        "steps": [
            "Source or create success chime (200-300ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Create playSuccess() convenience method",
            "Use on successful operations",
            "Consider different levels of success sounds"
        ]
    },
    {
        "priority": 823,
        "category": "Audio System",
        "name": "Create navigation sound effect",
        "description": "Add subtle sound feedback for navigation changes (page transitions, tab switches). Should be very subtle and non-intrusive.",
        "steps": [
            "Source or create soft navigation sound (50-80ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Create useNavigationSound hook",
            "Integrate with router navigation",
            "Make optional in settings"
        ]
    },
    {
        "priority": 824,
        "category": "Audio System",
        "name": "Create wallet connect sound effect",
        "description": "Add a distinctive sound when wallet connection is established. Should feel secure and confirmatory, fitting the crypto theme.",
        "steps": [
            "Source or create wallet connect sound (200-300ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Trigger on successful wallet connection",
            "Add disconnect sound variant",
            "Consider connection error sound"
        ]
    },
    {
        "priority": 825,
        "category": "Audio System",
        "name": "Create payment confirmation sound effect",
        "description": "Add a satisfying confirmation sound when x402 payments are completed. Should feel like a successful transaction - like a cash register or coin drop.",
        "steps": [
            "Source or create payment sound (300-400ms)",
            "Add sound file to public/audio/ui/",
            "Register in SFX manifest",
            "Trigger on payment confirmation",
            "Consider coin/arcade style sound",
            "Add payment pending/processing sound"
        ]
    },

    # ========== Game Sound Effects - Snake (826-836) ==========
    {
        "priority": 826,
        "category": "Audio System",
        "name": "Create snake movement sound effect",
        "description": "Add a subtle movement sound as the snake moves. Should be very quiet and rhythmic, almost subliminal, to enhance immersion without distraction.",
        "steps": [
            "Source or create soft slither/slide sound (20-30ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on each movement tick",
            "Implement very low default volume",
            "Add rate variation based on speed"
        ]
    },
    {
        "priority": 827,
        "category": "Audio System",
        "name": "Create food eat sound effect",
        "description": "Add a satisfying crunch/chomp sound when the snake eats food. This is a core reward sound and should feel satisfying and addictive.",
        "steps": [
            "Source or create crunchy eat sound (100-150ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Create multiple variants for variety",
            "Trigger on food collection",
            "Consider pitch increase with combo"
        ]
    },
    {
        "priority": 828,
        "category": "Audio System",
        "name": "Create food spawn sound effect",
        "description": "Add a subtle spawn sound when new food appears on the board. Should draw attention without being distracting.",
        "steps": [
            "Source or create soft pop/appear sound (80-120ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on food spawn event",
            "Consider position-based panning",
            "Keep subtle to not distract from gameplay"
        ]
    },
    {
        "priority": 829,
        "category": "Audio System",
        "name": "Create speed increase sound effect",
        "description": "Add an escalation sound when game speed increases. Should convey increasing intensity and urgency.",
        "steps": [
            "Source or create whoosh/acceleration sound (150-200ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on speed threshold changes",
            "Consider pitch increase with level",
            "Make distinct from other sounds"
        ]
    },
    {
        "priority": 830,
        "category": "Audio System",
        "name": "Create wall collision sound effect",
        "description": "Add an impact sound when the snake hits a wall (game over trigger). Should feel like a hard stop/crash.",
        "steps": [
            "Source or create impact/thud sound (150-200ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on wall collision",
            "Make distinct from self-collision",
            "Consider screen shake pairing"
        ]
    },
    {
        "priority": 831,
        "category": "Audio System",
        "name": "Create self collision sound effect",
        "description": "Add a different collision sound when the snake hits itself. Should feel like a squish or crunch, distinct from wall collision.",
        "steps": [
            "Source or create squish/crunch sound (150-200ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on self-collision",
            "Make clearly distinct from wall hit",
            "Pair with game over sequence"
        ]
    },
    {
        "priority": 832,
        "category": "Audio System",
        "name": "Create snake game over sound effect",
        "description": "Add a game over sound effect that plays after collision. Should feel final but not too negative - player should want to try again.",
        "steps": [
            "Source or create game over sound (400-600ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger after collision sound",
            "Consider retro arcade style",
            "Fade or duck other audio"
        ]
    },
    {
        "priority": 833,
        "category": "Audio System",
        "name": "Create high score sound effect",
        "description": "Add a celebratory sound when player achieves a new high score. Should feel special and rewarding, encouraging continued play.",
        "steps": [
            "Source or create fanfare/celebration sound (500-800ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on new high score",
            "Make distinct from regular game over",
            "Consider confetti pairing"
        ]
    },
    {
        "priority": 834,
        "category": "Audio System",
        "name": "Create pause sound effect",
        "description": "Add a sound effect when game is paused. Should feel like a freeze or suspension of action.",
        "steps": [
            "Source or create pause sound (100-150ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on pause action",
            "Consider lowpass filter effect",
            "Pair with visual pause indicator"
        ]
    },
    {
        "priority": 835,
        "category": "Audio System",
        "name": "Create resume sound effect",
        "description": "Add a sound effect when game resumes from pause. Should feel like action is starting again.",
        "steps": [
            "Source or create resume/unpause sound (100-150ms)",
            "Add sound file to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Trigger on resume action",
            "Consider reverse of pause sound",
            "Pair with countdown if applicable"
        ]
    },
    {
        "priority": 836,
        "category": "Audio System",
        "name": "Create countdown beeps for snake game",
        "description": "Add countdown beeps (3, 2, 1, GO!) for game start and resume. Classic arcade feel that builds anticipation.",
        "steps": [
            "Source or create beep sounds (100ms each)",
            "Create distinct 'GO!' sound",
            "Add files to public/audio/games/snake/",
            "Register in snake SFX manifest",
            "Implement countdown sequence",
            "Consider ascending pitch for beeps"
        ]
    },

    # ========== Game Sound Effects - Tetris (837-849) ==========
    {
        "priority": 837,
        "category": "Audio System",
        "name": "Create piece move sound effect",
        "description": "Add a subtle click/tap sound when Tetris piece moves left or right. Should be quick and unobtrusive.",
        "steps": [
            "Source or create soft click sound (30-50ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on left/right input",
            "Keep volume low to not distract",
            "Implement cooldown for DAS"
        ]
    },
    {
        "priority": 838,
        "category": "Audio System",
        "name": "Create piece rotate sound effect",
        "description": "Add a rotation sound when Tetris piece rotates. Should feel like something is turning or clicking into place.",
        "steps": [
            "Source or create rotation click sound (50-80ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on rotation input",
            "Make distinct from move sound",
            "Consider wall kick variant"
        ]
    },
    {
        "priority": 839,
        "category": "Audio System",
        "name": "Create piece drop sound effect",
        "description": "Add drop sounds for both soft drop (faster fall) and hard drop (instant placement). Hard drop should be more impactful.",
        "steps": [
            "Source or create soft drop sound (light thud)",
            "Source or create hard drop sound (heavy impact)",
            "Add files to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on respective drop actions",
            "Consider drop distance affecting volume"
        ]
    },
    {
        "priority": 840,
        "category": "Audio System",
        "name": "Create piece lock sound effect",
        "description": "Add a locking sound when piece settles into place. Should feel solid and final, indicating the piece is now part of the stack.",
        "steps": [
            "Source or create lock/settle sound (80-120ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on piece lock delay complete",
            "Make satisfying but not distracting",
            "Consider subtle bass thud"
        ]
    },
    {
        "priority": 841,
        "category": "Audio System",
        "name": "Create single line clear sound effect",
        "description": "Add sound for clearing a single line. Base level clear sound that feels rewarding but leaves room for bigger clears to sound more impressive.",
        "steps": [
            "Source or create line clear sound (150-200ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on single line clear",
            "Make satisfying but understated",
            "Consider whoosh/sweep sound"
        ]
    },
    {
        "priority": 842,
        "category": "Audio System",
        "name": "Create double line clear sound effect",
        "description": "Add enhanced sound for clearing two lines simultaneously. Should feel more rewarding than single clear.",
        "steps": [
            "Source or create double clear sound (200-250ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on double line clear",
            "Make noticeably more impressive than single",
            "Consider layered sounds"
        ]
    },
    {
        "priority": 843,
        "category": "Audio System",
        "name": "Create triple line clear sound effect",
        "description": "Add powerful sound for clearing three lines. Should feel impressive and rewarding, building toward Tetris clear.",
        "steps": [
            "Source or create triple clear sound (250-300ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on triple line clear",
            "Make exciting and powerful",
            "Consider crescendo effect"
        ]
    },
    {
        "priority": 844,
        "category": "Audio System",
        "name": "Create Tetris (4 lines) clear sound effect",
        "description": "Add the ultimate clear sound for a Tetris (4 lines). Should feel like a major achievement - impactful, celebratory, and satisfying.",
        "steps": [
            "Source or create Tetris clear sound (400-500ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on Tetris clear",
            "Make the most impactful clear sound",
            "Consider screen shake pairing"
        ]
    },
    {
        "priority": 845,
        "category": "Audio System",
        "name": "Create T-spin sound effect",
        "description": "Add special sound for T-spin moves. Should feel skillful and technical, acknowledging the player's advanced move.",
        "steps": [
            "Source or create T-spin sound (200-300ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on T-spin detection",
            "Make distinct and technical feeling",
            "Consider variants for mini/full T-spin"
        ]
    },
    {
        "priority": 846,
        "category": "Audio System",
        "name": "Create combo sound effect with escalating pitch",
        "description": "Add combo sounds that increase in pitch with each consecutive line clear. Creates addictive feedback loop for combos.",
        "steps": [
            "Source or create base combo sound",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Implement pitch scaling with combo count",
            "Cap maximum pitch to avoid harsh sound",
            "Reset pitch on combo break"
        ]
    },
    {
        "priority": 847,
        "category": "Audio System",
        "name": "Create level up sound effect",
        "description": "Add celebration sound when player advances to next level. Should feel like progression and achievement.",
        "steps": [
            "Source or create level up fanfare (300-500ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on level advancement",
            "Consider brief music duck",
            "Pair with visual level indicator"
        ]
    },
    {
        "priority": 848,
        "category": "Audio System",
        "name": "Create Tetris game over sound effect",
        "description": "Add game over sound when blocks reach the top. Should feel final but not discouraging - player should want to retry.",
        "steps": [
            "Source or create game over sound (400-600ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on game over condition",
            "Consider classic Tetris style",
            "Fade background music"
        ]
    },
    {
        "priority": 849,
        "category": "Audio System",
        "name": "Create hold piece sound effect",
        "description": "Add sound when player uses the hold function to store a piece. Should feel like something is being tucked away.",
        "steps": [
            "Source or create hold/stash sound (80-120ms)",
            "Add sound file to public/audio/games/tetris/",
            "Register in tetris SFX manifest",
            "Trigger on hold action",
            "Consider subtle whoosh",
            "Handle hold swap (piece exchange)"
        ]
    },

    # ========== Arcade Ambience (850-855) ==========
    {
        "priority": 850,
        "category": "Audio System",
        "name": "Create arcade background ambience",
        "description": "Add subtle arcade ambience sound - distant game sounds, gentle electronic hum. Sets the mood without being distracting.",
        "steps": [
            "Source or create arcade ambience loop (30-60 seconds)",
            "Add sound file to public/audio/ambience/",
            "Register in ambience manifest",
            "Create ambient audio player",
            "Keep very low volume (background)",
            "Make optional in settings"
        ]
    },
    {
        "priority": 851,
        "category": "Audio System",
        "name": "Create coin insert sound effect",
        "description": "Add classic arcade coin insert sound for x402 payment initiation. Nostalgic and satisfying, reinforces the arcade theme.",
        "steps": [
            "Source or create coin drop sound (200-300ms)",
            "Add sound file to public/audio/arcade/",
            "Register in arcade SFX manifest",
            "Trigger on payment initiation",
            "Consider multiple coin sounds",
            "Classic arcade cabinet sound"
        ]
    },
    {
        "priority": 852,
        "category": "Audio System",
        "name": "Create jackpot/prize sound effect",
        "description": "Add exciting jackpot sound for big wins or prize moments. Should feel like hitting the jackpot on an arcade machine.",
        "steps": [
            "Source or create jackpot sound (500-800ms)",
            "Add sound file to public/audio/arcade/",
            "Register in arcade SFX manifest",
            "Trigger on major achievements",
            "Include coin shower sound effect",
            "Pair with visual celebration"
        ]
    },
    {
        "priority": 853,
        "category": "Audio System",
        "name": "Create leaderboard position sound effect",
        "description": "Add sound when player places on leaderboard. Different sounds for different positions (top 3 vs top 10).",
        "steps": [
            "Source or create leaderboard placement sounds",
            "Create variants for 1st, 2nd, 3rd, top 10",
            "Add files to public/audio/arcade/",
            "Register in arcade SFX manifest",
            "Trigger on leaderboard update",
            "Top 3 should be most impressive"
        ]
    },
    {
        "priority": 854,
        "category": "Audio System",
        "name": "Create achievement unlock sound effect",
        "description": "Add satisfying unlock sound when player earns achievements or badges. Should feel rewarding and collectible.",
        "steps": [
            "Source or create achievement sound (300-400ms)",
            "Add sound file to public/audio/arcade/",
            "Register in arcade SFX manifest",
            "Trigger on achievement unlock",
            "Consider sparkle/shine element",
            "Pair with achievement toast"
        ]
    },
    {
        "priority": 855,
        "category": "Audio System",
        "name": "Create celebration fanfare",
        "description": "Add big celebration fanfare for major moments - tournament wins, new records, special achievements. The ultimate reward sound.",
        "steps": [
            "Source or create fanfare sound (800-1200ms)",
            "Add sound file to public/audio/arcade/",
            "Register in arcade SFX manifest",
            "Trigger on major celebrations",
            "Duck all other audio",
            "Consider confetti/fireworks pairing"
        ]
    },

    # ========== Music Tracks (856-861) ==========
    {
        "priority": 856,
        "category": "Audio System",
        "name": "Create main menu/lobby music",
        "description": "Add background music for the main menu and lobby areas. Should set the arcade mood - upbeat, electronic, but not too intense.",
        "steps": [
            "Source or create menu music (2-3 min loop)",
            "Add music file to public/audio/music/",
            "Register in music manifest",
            "Configure as default lobby track",
            "Set appropriate volume level",
            "Ensure seamless loop"
        ]
    },
    {
        "priority": 857,
        "category": "Audio System",
        "name": "Create Snake game background music",
        "description": "Add background music for Snake gameplay. Should be ambient and rhythmic, building tension as the game progresses without being distracting.",
        "steps": [
            "Source or create snake game music (2-3 min loop)",
            "Add music file to public/audio/music/",
            "Register in music manifest",
            "Configure crossfade from menu music",
            "Consider dynamic intensity layers",
            "Match retro/arcade aesthetic"
        ]
    },
    {
        "priority": 858,
        "category": "Audio System",
        "name": "Create Tetris game background music",
        "description": "Add background music for Tetris gameplay. Should be energetic and rhythmic, complementing the puzzle action without copying copyrighted Tetris music.",
        "steps": [
            "Source or create tetris game music (2-3 min loop)",
            "Add music file to public/audio/music/",
            "Register in music manifest",
            "Create original composition or license-free track",
            "Consider tempo increase with level",
            "Ensure seamless loop"
        ]
    },
    {
        "priority": 859,
        "category": "Audio System",
        "name": "Create leaderboard music",
        "description": "Add music for leaderboard screens. Should feel competitive and exciting, highlighting player achievements.",
        "steps": [
            "Source or create leaderboard music (1-2 min loop)",
            "Add music file to public/audio/music/",
            "Register in music manifest",
            "Play on leaderboard screen",
            "Upbeat and competitive feel",
            "Crossfade from game music"
        ]
    },
    {
        "priority": 860,
        "category": "Audio System",
        "name": "Create victory music",
        "description": "Add triumphant music for victory moments - high scores, tournament wins, achievements. Should feel celebratory and rewarding.",
        "steps": [
            "Source or create victory music (30-60 seconds)",
            "Add music file to public/audio/music/",
            "Register in music manifest",
            "Trigger on major victories",
            "One-shot, not looping",
            "Return to appropriate ambient music after"
        ]
    },
    {
        "priority": 861,
        "category": "Audio System",
        "name": "Create game over music",
        "description": "Add game over music that plays after a loss. Should be somewhat sad/reflective but not depressing - encourage player to try again.",
        "steps": [
            "Source or create game over music (20-30 seconds)",
            "Add music file to public/audio/music/",
            "Register in music manifest",
            "Trigger on game over",
            "Retro arcade style recommended",
            "Transition to menu music after"
        ]
    },

    # ========== Accessibility Audio (862-866) ==========
    {
        "priority": 862,
        "category": "Audio System",
        "name": "Implement screen reader compatibility",
        "description": "Ensure audio system works well with screen readers. Prevent conflicts, provide proper ARIA labels, and don't interfere with accessibility tools.",
        "steps": [
            "Audit audio for screen reader conflicts",
            "Add aria-hidden to audio elements",
            "Ensure audio doesn't auto-play on page load",
            "Test with VoiceOver and NVDA",
            "Document accessibility considerations",
            "Add skip audio option"
        ]
    },
    {
        "priority": 863,
        "category": "Audio System",
        "name": "Create audio descriptions for game events",
        "description": "Add audio descriptions for important game events for visually impaired players. Voice or distinctive sounds that convey game state.",
        "steps": [
            "Identify critical game events needing description",
            "Create distinctive sounds for each event type",
            "Add optional voice announcements",
            "Implement audio description toggle",
            "Test with eyes closed for effectiveness",
            "Document audio description patterns"
        ]
    },
    {
        "priority": 864,
        "category": "Audio System",
        "name": "Design audio-only game mode support",
        "description": "Design framework for potential audio-only gameplay. Ensure games could theoretically be played with audio cues alone for accessibility.",
        "steps": [
            "Analyze game mechanics for audio-only viability",
            "Define audio cues for all game states",
            "Create enhanced audio feedback mode",
            "Document audio-only patterns",
            "Consider haptic feedback pairing",
            "Note: implementation may be future enhancement"
        ]
    },
    {
        "priority": 865,
        "category": "Audio System",
        "name": "Implement earcon system for notifications",
        "description": "Create a consistent earcon (auditory icon) system for UI notifications. Short, distinct sounds that convey meaning consistently.",
        "steps": [
            "Define earcon vocabulary (error, success, warning, info)",
            "Create or source consistent earcon set",
            "Add earcons to public/audio/earcons/",
            "Register in earcon manifest",
            "Integrate with notification system",
            "Document earcon meanings"
        ]
    },
    {
        "priority": 866,
        "category": "Audio System",
        "name": "Implement volume normalization",
        "description": "Add audio normalization to ensure consistent volume levels across all sounds. Prevent jarring volume differences between different audio sources.",
        "steps": [
            "Analyze all audio files for volume levels",
            "Implement dynamic range compression",
            "Add normalization to AudioManager",
            "Create loudness targets for different audio types",
            "Test across all audio sources",
            "Document normalization standards"
        ]
    },

    # ========== Audio Performance (867-872) ==========
    {
        "priority": 867,
        "category": "Audio System",
        "name": "Create audio preloading strategy",
        "description": "Implement smart preloading that loads critical audio first and defers non-essential audio. Balance load time vs. audio readiness.",
        "steps": [
            "Categorize audio by priority (critical, important, nice-to-have)",
            "Create preload manifest with priorities",
            "Implement critical audio preload on app start",
            "Add game-specific preload on game selection",
            "Create preload progress tracking",
            "Test initial load performance"
        ]
    },
    {
        "priority": 868,
        "category": "Audio System",
        "name": "Implement lazy loading for non-critical audio",
        "description": "Add lazy loading for audio that isn't needed immediately. Load on demand or during idle time to improve initial load.",
        "steps": [
            "Identify non-critical audio assets",
            "Implement load-on-demand pattern",
            "Add requestIdleCallback loading",
            "Handle first-play loading gracefully",
            "Show loading state if needed",
            "Test lazy loading behavior"
        ]
    },
    {
        "priority": 869,
        "category": "Audio System",
        "name": "Configure audio compression and format selection",
        "description": "Optimize audio file formats and compression. Use modern formats (WebM/Opus) with MP3/OGG fallbacks for browser compatibility.",
        "steps": [
            "Define target formats (webm, mp3, ogg)",
            "Create audio compression pipeline",
            "Implement format detection and fallback",
            "Optimize file sizes vs quality",
            "Test on various browsers",
            "Document format requirements"
        ]
    },
    {
        "priority": 870,
        "category": "Audio System",
        "name": "Implement mobile audio optimization",
        "description": "Optimize audio for mobile devices. Handle iOS audio restrictions, reduce quality on mobile, and manage battery impact.",
        "steps": [
            "Detect mobile device",
            "Handle iOS audio unlock requirement",
            "Reduce audio quality on mobile if needed",
            "Limit concurrent sounds on mobile",
            "Test on iOS Safari and Android Chrome",
            "Document mobile considerations"
        ]
    },
    {
        "priority": 871,
        "category": "Audio System",
        "name": "Create battery-saving audio mode",
        "description": "Add low-power audio mode that reduces audio processing and quality to save battery on mobile devices.",
        "steps": [
            "Create battery saver audio profile",
            "Reduce audio processing in low power mode",
            "Detect low battery state if possible",
            "Add manual battery saver toggle",
            "Reduce concurrent sound limit",
            "Document battery optimization"
        ]
    },
    {
        "priority": 872,
        "category": "Audio System",
        "name": "Implement audio memory management",
        "description": "Add memory management for audio resources. Unload unused audio, manage cache size, and prevent memory leaks.",
        "steps": [
            "Track audio memory usage",
            "Implement cache size limits",
            "Add LRU eviction for cached audio",
            "Unload audio when leaving games",
            "Monitor for memory leaks",
            "Add memory usage logging"
        ]
    },

    # ========== Audio Settings UI (873-877) ==========
    {
        "priority": 873,
        "category": "Audio System",
        "name": "Create volume slider components",
        "description": "Build volume slider UI components for master volume, music volume, and sound effects volume. Match the app's design system.",
        "steps": [
            "Create VolumeSlider component",
            "Style to match Crypto/Web3 Dark theme",
            "Add volume icon with mute toggle",
            "Show percentage or value label",
            "Implement smooth dragging",
            "Add keyboard accessibility"
        ]
    },
    {
        "priority": 874,
        "category": "Audio System",
        "name": "Create mute toggle components",
        "description": "Build mute toggle buttons for quick mute/unmute of different audio categories. Show clear visual state.",
        "steps": [
            "Create MuteToggle component",
            "Add icons for muted/unmuted states",
            "Style to match design system",
            "Support master, music, and sfx toggles",
            "Add tooltip with current state",
            "Implement keyboard accessibility"
        ]
    },
    {
        "priority": 875,
        "category": "Audio System",
        "name": "Create audio test button",
        "description": "Add test buttons in audio settings to preview sounds. Let users verify audio is working and adjust volumes appropriately.",
        "steps": [
            "Create AudioTestButton component",
            "Add test for each audio category",
            "Play representative sample on click",
            "Show playing state animation",
            "Prevent overlapping test plays",
            "Style to match design system"
        ]
    },
    {
        "priority": 876,
        "category": "Audio System",
        "name": "Integrate audio settings with settings page",
        "description": "Add audio settings section to the main settings page. Organize controls logically and save changes automatically.",
        "steps": [
            "Create AudioSettings panel component",
            "Add to main settings page",
            "Include all volume sliders and toggles",
            "Add audio test buttons",
            "Implement auto-save on change",
            "Add section header with audio icon"
        ]
    },
    {
        "priority": 877,
        "category": "Audio System",
        "name": "Create reset audio settings to defaults",
        "description": "Add button to reset all audio settings to defaults. Confirm before resetting and provide feedback after.",
        "steps": [
            "Create ResetAudioSettings button",
            "Add confirmation dialog",
            "Define default audio settings",
            "Implement reset logic in AudioManager",
            "Show success toast after reset",
            "Style to match design system"
        ]
    },
]

def insert_features(db_path: str = "features.db") -> int:
    """Insert all audio features into the database and return count."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    inserted_count = 0

    for feature in AUDIO_FEATURES:
        try:
            cursor.execute(
                """
                INSERT INTO features (priority, category, name, description, steps, passes, in_progress)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    feature["priority"],
                    feature["category"],
                    feature["name"],
                    feature["description"],
                    json.dumps(feature["steps"]),
                    False,
                    False
                )
            )
            inserted_count += 1
        except sqlite3.IntegrityError as e:
            print(f"Skipped (duplicate): {feature['name']} - {e}")
        except Exception as e:
            print(f"Error inserting {feature['name']}: {e}")

    conn.commit()
    conn.close()

    return inserted_count


if __name__ == "__main__":
    count = insert_features()
    print(f"Successfully inserted {count} audio system features.")
    print(f"Priority range: 791-877")
