#!/bin/bash

# Audio Setup Script for x402Arcade Video
# Generates placeholder audio files for testing, then helps download real ones

set -e

AUDIO_DIR="../public/audio"
SFX_DIR="$AUDIO_DIR/sfx"
MUSIC_DIR="$AUDIO_DIR/music"

echo "🎵 x402Arcade Audio Setup"
echo "========================="
echo ""

# Create directories
mkdir -p "$SFX_DIR" "$MUSIC_DIR"

# Check if ffmpeg is available
if command -v ffmpeg &> /dev/null; then
    echo "✓ ffmpeg found - generating placeholder audio..."
    echo ""

    # Generate silent placeholder files (0.5 seconds each)
    # These let you preview timing before downloading real sounds

    SFX_FILES=(
        "impact-deep.mp3"
        "impact-heavy.mp3"
        "impact-punch.mp3"
        "glitch-digital.mp3"
        "whoosh-cyber.mp3"
        "transition-swoosh.mp3"
        "coin-insert.mp3"
        "ui-blip.mp3"
        "ui-confirm.mp3"
        "ui-success.mp3"
        "warning-alarm.mp3"
        "rumble-bass.mp3"
        "step-ping.mp3"
        "logo-reveal.mp3"
        "badge-chime.mp3"
    )

    for file in "${SFX_FILES[@]}"; do
        if [ ! -f "$SFX_DIR/$file" ]; then
            # Generate a short tone instead of silence (more useful for timing)
            case "$file" in
                impact*)
                    # Low frequency thump
                    ffmpeg -f lavfi -i "sine=frequency=60:duration=0.3" -af "afade=t=out:st=0.1:d=0.2" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                glitch*)
                    # White noise burst
                    ffmpeg -f lavfi -i "anoisesrc=d=0.5:c=white:a=0.3" -af "afade=t=out:st=0.2:d=0.3" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                whoosh*|transition*)
                    # Frequency sweep
                    ffmpeg -f lavfi -i "sine=frequency=200:duration=0.5" -af "asetrate=44100*2,afade=t=out:st=0.2:d=0.3" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                coin*)
                    # High ping
                    ffmpeg -f lavfi -i "sine=frequency=1200:duration=0.3" -af "afade=t=out:st=0.1:d=0.2" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                ui*|step*)
                    # Medium ping
                    ffmpeg -f lavfi -i "sine=frequency=800:duration=0.2" -af "afade=t=out:st=0.05:d=0.15" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                warning*)
                    # Alarm-like
                    ffmpeg -f lavfi -i "sine=frequency=400:duration=0.5" -af "tremolo=f=10:d=0.7,afade=t=out:st=0.2:d=0.3" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                rumble*)
                    # Low rumble
                    ffmpeg -f lavfi -i "anoisesrc=d=1.5:c=pink:a=0.4" -af "lowpass=f=100,afade=t=out:st=0.5:d=1" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                logo*)
                    # Epic chord-like
                    ffmpeg -f lavfi -i "sine=frequency=220:duration=1.5" -af "afade=t=in:st=0:d=0.1,afade=t=out:st=0.5:d=1" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                badge*)
                    # Achievement chime
                    ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.5" -af "afade=t=out:st=0.2:d=0.3" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
                *)
                    # Default short beep
                    ffmpeg -f lavfi -i "sine=frequency=440:duration=0.3" -af "afade=t=out:st=0.1:d=0.2" -y "$SFX_DIR/$file" 2>/dev/null
                    ;;
            esac
            echo "  ✓ Generated placeholder: $file"
        else
            echo "  - Skipped (exists): $file"
        fi
    done

    # Generate placeholder music (60 seconds of ambient drone)
    if [ ! -f "$MUSIC_DIR/synthwave-energy.mp3" ]; then
        echo ""
        echo "Generating placeholder music track (60s)..."
        ffmpeg -f lavfi -i "sine=frequency=110:duration=60" \
               -af "tremolo=f=0.1:d=0.3,lowpass=f=300,volume=0.3" \
               -y "$MUSIC_DIR/synthwave-energy.mp3" 2>/dev/null
        echo "  ✓ Generated placeholder: synthwave-energy.mp3"
    fi

    echo ""
    echo "✅ Placeholder audio generated!"
    echo ""
    echo "These are simple tones for timing preview."
    echo "Replace with real sounds from:"
    echo "  - https://pixabay.com/sound-effects/"
    echo "  - https://mixkit.co/free-sound-effects/"
    echo "  - https://freesound.org/"
    echo ""

else
    echo "⚠ ffmpeg not found - cannot generate placeholders"
    echo ""
    echo "Install ffmpeg:"
    echo "  macOS:   brew install ffmpeg"
    echo "  Ubuntu:  sudo apt install ffmpeg"
    echo "  Windows: choco install ffmpeg"
    echo ""
fi

echo "📁 Audio folder structure:"
echo ""
ls -la "$SFX_DIR" 2>/dev/null || echo "  (sfx folder empty)"
echo ""
ls -la "$MUSIC_DIR" 2>/dev/null || echo "  (music folder empty)"
echo ""
echo "🎬 Next steps:"
echo "1. Preview video at http://localhost:3003"
echo "2. Enable audio in src/MainVideo.tsx (uncomment AudioManager)"
echo "3. Replace placeholders with real sounds"
echo "4. Fine-tune timing in src/lib/audioConfig.ts"
