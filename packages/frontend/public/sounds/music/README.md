# Background Music

This directory contains background music files for the x402 Arcade games.

## Required Music Files

The following music files are required for the background music system:

### Game Music Tracks

| File                  | Description               | Usage                  |
| --------------------- | ------------------------- | ---------------------- |
| `arcade-theme.mp3`    | Main arcade theme         | Menu/Lobby             |
| `snake-gameplay.mp3`  | Snake game music          | During Snake gameplay  |
| `tetris-gameplay.mp3` | Tetris game music         | During Tetris gameplay |
| `game-over.mp3`       | Game over jingle          | After game ends        |
| `victory.mp3`         | Victory/high score jingle | New high score         |
| `countdown.mp3`       | Pre-game countdown        | Before game starts     |

## Music Requirements

- **Format**: MP3 (for broadest compatibility)
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192kbps
- **Duration**:
  - Loops: 30-120 seconds (seamlessly loopable)
  - Jingles: 3-10 seconds
- **File Size**: < 1MB per track (ideally < 500KB)
- **Style**: Chiptune/8-bit retro arcade aesthetic
- **Volume**: Normalized to -6dB peak (music should be subtle background)

## Recommended Sources

### Free Chiptune Music

1. **OpenGameArt.org** - https://opengameart.org
   - Search: "chiptune", "8-bit", "arcade"
   - License: Various CC licenses

2. **Free Music Archive** - https://freemusicarchive.org
   - Search: "chiptune", "video game"
   - License: Various CC licenses

3. **Incompetech** - https://incompetech.com
   - Royalty-free music by Kevin MacLeod
   - License: CC BY 3.0

4. **Pixabay Music** - https://pixabay.com/music
   - Search: "8-bit", "arcade", "retro game"
   - License: Pixabay License (free for commercial use)

### Chiptune Creation Tools

1. **FamiTracker** - https://famitracker.com
   - NES-style music creation

2. **LMMS** - https://lmms.io
   - Free DAW with chiptune plugins

3. **Bosca Ceoil** - https://boscaceoil.net
   - Simple chiptune music maker

## Loop Points

For seamless looping, ensure tracks:

1. Start and end at the same point in the musical phrase
2. Have no silence at beginning/end
3. Maintain consistent BPM throughout

## Integration

Music is loaded and managed via the `MusicManager` utility:

```typescript
import { getGlobalMusicManager } from '@/games/engine/music-manager';

const music = getGlobalMusicManager();

// Load tracks
await music.loadTrack({
  key: 'snake-gameplay',
  url: '/sounds/music/snake-gameplay.mp3',
  volume: 0.5,
});

// Play with crossfade
music.play('snake-gameplay');
music.crossfadeTo('game-over', { duration: 1000 });
```

## Fallback Behavior

If music files are missing:

- Console warnings will appear
- Games will function normally (silent)
- No errors thrown, graceful degradation

## Volume Guidelines

- Menu music: 0.4-0.5 volume
- Gameplay music: 0.3-0.4 volume (subtle, not distracting)
- Jingles: 0.5-0.6 volume
- All music should be mutable via UI controls
