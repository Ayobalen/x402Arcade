# UI Sound Effects

This directory contains UI sound effect files for the x402 Arcade application.

## Required Sound Files

The following sound files are required for the UI sound system to work:

### Button Sounds

- `button-click.mp3` - Generic button click
- `button-click-primary.mp3` - Primary button click
- `button-click-secondary.mp3` - Secondary button click
- `button-click-danger.mp3` - Danger/warning button click

### Menu Sounds

- `menu-hover.mp3` - Menu item hover sound
- `menu-select.mp3` - Menu item selection sound
- `menu-open.mp3` - Menu open sound
- `menu-close.mp3` - Menu close sound

### Notification Sounds

- `notification-success.mp3` - Success notification
- `notification-error.mp3` - Error notification
- `notification-warning.mp3` - Warning notification
- `notification-info.mp3` - Info notification

### Modal Sounds

- `modal-open.mp3` - Modal open sound
- `modal-close.mp3` - Modal close sound

### Toggle Sounds

- `toggle-on.mp3` - Toggle switch on
- `toggle-off.mp3` - Toggle switch off

### Tab/Navigation Sounds

- `tab-switch.mp3` - Tab switch sound
- `page-change.mp3` - Page change sound

### Misc UI Sounds

- `checkbox-check.mp3` - Checkbox check sound
- `checkbox-uncheck.mp3` - Checkbox uncheck sound
- `dropdown-open.mp3` - Dropdown open sound
- `dropdown-close.mp3` - Dropdown close sound

## Sound Requirements

- **Format**: MP3 or OGG (MP3 recommended for broadest compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps or higher
- **Duration**: 50-500ms (short and snappy)
- **File Size**: < 50KB per sound (preferably < 20KB)
- **Volume**: Normalized to -3dB peak

## Recommended Sources

1. **Free Sound Libraries**:
   - [Freesound.org](https://freesound.org) - Creative Commons licensed sounds
   - [Zapsplat](https://www.zapsplat.com) - Free UI sound effects
   - [Mixkit](https://mixkit.co/free-sound-effects/) - Free sound effects

2. **Sound Generators**:
   - [jsfxr](https://sfxr.me/) - Browser-based retro sound generator
   - [ChipTone](https://sfbgames.itch.io/chiptone) - Advanced chiptune sound designer

3. **Paid Libraries** (optional):
   - [UI SFX Pack](https://assetstore.unity.com) - Unity Asset Store
   - [Interface SFX](https://www.pond5.com) - Professional UI sounds

## Creating Custom Sounds

If generating sounds with jsfxr or ChipTone:

1. **Button clicks**: Short, sharp, higher-pitched (0.05-0.1s)
2. **Menu hover**: Very short, subtle (0.03-0.05s)
3. **Notifications**:
   - Success: Ascending tone, pleasant (0.2-0.4s)
   - Error: Descending tone, slightly harsh (0.2-0.3s)
   - Warning: Mid-range, attention-grabbing (0.2-0.3s)
4. **Modals**: Swoosh or whoosh sounds (0.1-0.3s)
5. **Toggles**: Click-clack sounds (0.05-0.1s)

## Fallback Behavior

If sound files are missing:

- The application will log warnings to the console
- UI interactions will work normally (silently)
- Audio system will skip missing sounds gracefully

## Testing Sounds

After adding sound files:

```bash
# Test in browser dev tools console
const { UISounds } = await import('/src/utils/UISounds');
const uiSounds = UISounds.getInstance();
await uiSounds.initialize();
uiSounds.clickButton('primary');
```

## Volume Configuration

Default volumes are configured in `src/utils/UISounds.ts`:

- Button clicks: 0.4-0.6
- Menu sounds: 0.3-0.5
- Notifications: 0.5-0.7
- Modals: 0.5
- Toggles: 0.4

Adjust the `volume` property in the sound asset definitions if needed.
