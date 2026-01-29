# Audio Guide for x402Arcade Video

## Quick Setup (5 minutes)

You need **16 sound effects** and **1 music track**. Here's exactly where to get them.

---

## Step 1: Download Sound Effects

### From Pixabay (Free, No Attribution Required)

1. **Impact Sounds** - [pixabay.com/sound-effects/search/impact](https://pixabay.com/sound-effects/search/impact/)
   - Download: "cinematic-bass-hit" or "deep-impact" → Save as `impact-deep.mp3`
   - Download: "heavy-impact" or "punch-impact" → Save as `impact-heavy.mp3`
   - Download: "punch" or "hit" → Save as `impact-punch.mp3`

2. **Whoosh/Transition** - [pixabay.com/sound-effects/search/whoosh](https://pixabay.com/sound-effects/search/whoosh/)
   - Download: "whoosh" or "swoosh" → Save as `whoosh-cyber.mp3`
   - Download: "transition-swoosh" → Save as `transition-swoosh.mp3`

3. **Glitch/Digital** - [pixabay.com/sound-effects/search/glitch](https://pixabay.com/sound-effects/search/glitch/)
   - Download: "glitch" or "digital-error" → Save as `glitch-digital.mp3`

4. **UI Sounds** - [pixabay.com/sound-effects/search/interface](https://pixabay.com/sound-effects/search/interface/)
   - Download: "ui-click" or "blip" → Save as `ui-blip.mp3`
   - Download: "confirm" or "accept" → Save as `ui-confirm.mp3`
   - Download: "success" or "complete" → Save as `ui-success.mp3`

5. **Coin Sound** - [pixabay.com/sound-effects/search/coin](https://pixabay.com/sound-effects/search/coin/)
   - Download: "coin-insert" or "arcade-coin" → Save as `coin-insert.mp3`

6. **Warning** - [pixabay.com/sound-effects/search/warning](https://pixabay.com/sound-effects/search/warning/)
   - Download: "warning-alert" or "alarm" → Save as `warning-alarm.mp3`

7. **Bass/Rumble** - [pixabay.com/sound-effects/search/rumble](https://pixabay.com/sound-effects/search/rumble/)
   - Download: "bass-rumble" or "sub-bass" → Save as `rumble-bass.mp3`

8. **Ping/Notification** - [pixabay.com/sound-effects/search/notification](https://pixabay.com/sound-effects/search/notification/)
   - Download: "ping" or "notification" → Save as `step-ping.mp3`
   - Download: "chime" or "achievement" → Save as `badge-chime.mp3`

9. **Logo Reveal** - [pixabay.com/sound-effects/search/logo](https://pixabay.com/sound-effects/search/logo/)
   - Download: "logo-reveal" or "epic-hit" → Save as `logo-reveal.mp3`

---

## Step 2: Download Background Music

### Recommended: Electronic/Synthwave Track

**Option A: Pixabay Music** (Free)

- [pixabay.com/music/search/synthwave](https://pixabay.com/music/search/synthwave/)
- Search: "synthwave", "electronic", "cyberpunk", "tech"
- Need: 60+ second track
- Save as: `synthwave-energy.mp3`

**Option B: Uppbeat** (Free with attribution)

- [uppbeat.io](https://uppbeat.io/)
- Search: "electronic" or "tech"
- Great for hackathon videos

**Option C: Epidemic Sound** (Paid, highest quality)

- [epidemicsound.com](https://www.epidemicsound.com/)
- Search: "technology", "gaming", "synth"

---

## Step 3: Place Files

Put all downloaded files in these folders:

```
x402arcade-video/
└── public/
    └── audio/
        ├── sfx/
        │   ├── impact-deep.mp3
        │   ├── impact-heavy.mp3
        │   ├── impact-punch.mp3
        │   ├── glitch-digital.mp3
        │   ├── whoosh-cyber.mp3
        │   ├── transition-swoosh.mp3
        │   ├── coin-insert.mp3
        │   ├── ui-blip.mp3
        │   ├── ui-confirm.mp3
        │   ├── ui-success.mp3
        │   ├── warning-alarm.mp3
        │   ├── rumble-bass.mp3
        │   ├── step-ping.mp3
        │   ├── logo-reveal.mp3
        │   └── badge-chime.mp3
        └── music/
            └── synthwave-energy.mp3
```

---

## Step 4: Enable Audio in Video

Once files are in place, edit `src/MainVideo.tsx`:

```tsx
// Change this:
{
  /* <AudioManager /> */
}

// To this:
<AudioManager />;
```

---

## Step 5: Preview & Adjust

1. Open Remotion Studio: http://localhost:3003
2. Select "Main" composition
3. Play through and listen
4. Adjust volumes in `src/lib/audioConfig.ts` if needed

---

## Audio Timing Reference

| Moment           | Frame   | Time      | Sound             |
| ---------------- | ------- | --------- | ----------------- |
| "$0.01" appears  | 0       | 0:00      | impact-deep       |
| Glitch effect    | 3       | 0:00      | glitch-digital    |
| Subtitle in      | 12      | 0:00      | whoosh-cyber      |
| Scene transition | 58      | 0:02      | transition-swoosh |
| "$0.01 game"     | 68      | 0:02      | coin-insert       |
| "$2.00 gas"      | 83      | 0:03      | warning-alarm     |
| "$2.01" total    | 98      | 0:03      | impact-heavy      |
| "200x"           | 120     | 0:04      | impact-punch      |
| Demo starts      | 150     | 0:05      | transition-swoosh |
| Step indicators  | various | 0:05-0:52 | step-ping         |
| Logo reveal      | 1560    | 0:52      | logo-reveal       |
| Hackathon badge  | 1605    | 0:54      | badge-chime       |

---

## Volume Guidelines

- **Music**: 0.25 (quiet background)
- **Major impacts**: 0.7-0.8
- **Transitions**: 0.5-0.6
- **UI sounds**: 0.3-0.4
- **Step pings**: 0.35

The music automatically "ducks" (gets quieter) during important moments.

---

## Alternative: Quick & Minimal

If you're short on time, just get these 4 essential sounds:

1. `impact-deep.mp3` - For "$0.01" reveal
2. `impact-heavy.mp3` - For "$2.01" problem
3. `logo-reveal.mp3` - For ending
4. `synthwave-energy.mp3` - Background music

Edit `src/MainVideo.tsx` to use `<AudioManagerMinimal />` instead.

---

## Troubleshooting

**"Audio file not found" error:**

- Check file is in correct folder
- Check filename matches exactly (case-sensitive)
- Ensure file is .mp3 format

**Audio too loud/quiet:**

- Edit volumes in `src/lib/audioConfig.ts`
- Each sound has a `volume` property (0-1)

**Audio out of sync:**

- Adjust `frame` property in `SOUND_CUES` array
- frame = seconds × 30

---

## Pro Tips

1. **Test with headphones** - Catch subtle timing issues
2. **Export test renders** - Audio behaves differently in preview vs export
3. **Keep it subtle** - For hackathon judges, less is more
4. **Match the energy** - Punchy sounds for hook/CTA, subtle for demo
