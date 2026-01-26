# x402Arcade Manim Demo Animation

Beautiful 3Blue1Brown-style explainer video showing how x402 Protocol makes blockchain gaming economically viable.

## Overview

This 60-second animation uses Manim (Mathematical Animation Engine) to create a visually stunning explanation of:

1. The penny problem ($0.01 games)
2. The impossible math (gas fees)
3. The x402 solution (gasless transactions)
4. The impact (200x cost reduction)

## Features

- **3Blue1Brown-style animations**: Smooth transitions, progressive revelation, visual continuity
- **Exact color palette** from x402Arcade app (cyan #00ffff, magenta #ff00ff)
- **Professional animations**: Glow effects, shake animations, staggered reveals
- **Mathematical storytelling**: Visual proof of the economic breakthrough

## Installation

### 1. Install Manim Community Edition

```bash
# macOS (using Homebrew)
brew install py3cairo ffmpeg
brew install --cask mactex-no-gui  # For LaTeX support

# Install Manim via pip
pip install manim

# Or use conda
conda install -c conda-forge manim
```

### 2. Verify Installation

```bash
manim --version
```

## Usage

### Render the Animation

```bash
# Navigate to this directory
cd /Users/mujeeb/projects/x402Arcade/manim-demo

# Render in low quality (fast preview)
manim -pql x402_demo.py X402Demo

# Render in medium quality
manim -pqm x402_demo.py X402Demo

# Render in high quality (production)
manim -pqh x402_demo.py X402Demo

# Render in 4K quality
manim -pqk x402_demo.py X402Demo
```

### Quality Flags

- `-ql`: Low quality (480p15) - fast for testing
- `-qm`: Medium quality (720p30) - good for preview
- `-qh`: High quality (1080p60) - production ready
- `-qk`: 4K quality (2160p60) - maximum quality

### Other Useful Flags

- `-p`: Preview video after rendering
- `-s`: Save last frame as image
- `-a`: Render all scenes in file
- `--format=gif`: Export as GIF instead of MP4

## Output

The rendered video will be saved to:

```
/Users/mujeeb/projects/x402Arcade/manim-demo/media/videos/x402_demo/[quality]/X402Demo.mp4
```

## Customization

### Colors

All colors match the x402Arcade app exactly:

```python
CYAN = "#00ffff"      # Primary
MAGENTA = "#ff00ff"   # Secondary
GREEN = "#00ff88"     # Success
RED = "#ff3366"       # Error
BG_PRIMARY = "#0a0a0f"    # Dark background
```

### Timing

Adjust timing by modifying `run_time` and `wait()` parameters:

```python
self.play(animation, run_time=2)  # Make animation longer
self.wait(1.5)                     # Add pause
```

### Text

Change any text by modifying the Text() objects:

```python
Text("Your text here", font_size=48, color=CYAN)
```

## Scenes Breakdown

1. **Scene 1: Hook** (0-10s) - Penny reveal with gradient and glow
2. **Scene 2: Impossible Math** (10-25s) - Gas fee problem with shake effect
3. **Scene 3: Solution** (25-45s) - x402 Protocol benefits cards
4. **Scene 4: Impact** (45-60s) - Metric cards in 2x2 grid

## Tips for Best Results

1. **First render in low quality** (`-ql`) to check timing and composition
2. **Use high quality** (`-qh`) for final hackathon submission
3. **Preview with `-p` flag** to auto-open the video
4. **Export individual scenes** for easier editing:
   ```bash
   manim -pqh x402_demo.py X402Demo::scene_1_hook
   ```

## Troubleshooting

### LaTeX Errors

If you get LaTeX errors and don't need mathematical equations:

```bash
# Install without LaTeX (text mode only)
pip install manim-no-latex
```

### FFmpeg Not Found

```bash
# macOS
brew install ffmpeg

# Check installation
ffmpeg -version
```

### Cairo Errors

```bash
# macOS
brew install py3cairo

# Linux
sudo apt-get install libcairo2-dev
```

## Next Steps

1. Render the animation in high quality
2. Combine with screen recording of the actual app
3. Add voiceover narration (optional)
4. Edit together in video editor (iMovie, Final Cut, DaVinci Resolve)

## Resources

- [Manim Documentation](https://docs.manim.community/)
- [3Blue1Brown YouTube](https://www.youtube.com/c/3blue1brown)
- [Manim Example Gallery](https://docs.manim.community/en/stable/examples.html)

---

**Created for x402Arcade - DoraHacks Hackathon**
