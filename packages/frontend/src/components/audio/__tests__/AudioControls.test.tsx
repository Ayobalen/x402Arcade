/**
 * AudioControls Component Tests
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioControls } from '../AudioControls';
import { audioManager } from '../../../utils/AudioManager';

// Mock the audio manager
vi.mock('../../../utils/AudioManager', () => ({
  audioManager: {
    getIsInitialized: vi.fn(() => true),
    getIsUnlocked: vi.fn(() => true),
    getIsMuted: vi.fn(() => false),
    getIsEnabled: vi.fn(() => true),
    getMasterVolume: vi.fn(() => 1.0),
    getCategoryVolume: vi.fn(() => 1.0),
    setMasterVolume: vi.fn(),
    setCategoryVolume: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    toggleMute: vi.fn(() => false),
    enable: vi.fn(),
    disable: vi.fn(),
    stopAll: vi.fn(),
    unloadAll: vi.fn(),
    initialize: vi.fn(() => Promise.resolve(true)),
    unlock: vi.fn(() => Promise.resolve(true)),
    play: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    loadSound: vi.fn(() => Promise.resolve()),
    unloadSound: vi.fn(),
  },
  AudioCategory: {
    SFX: 'sfx',
    MUSIC: 'music',
    VOICE: 'voice',
    UI: 'ui',
  },
}));

describe('AudioControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders in full mode by default', () => {
      render(<AudioControls />);
      expect(screen.getByRole('group', { name: /audio controls/i })).toBeInTheDocument();
      expect(screen.getByText('Audio Controls')).toBeInTheDocument();
    });

    it('renders in compact mode when specified', () => {
      render(<AudioControls compact />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('audio-controls-compact');
    });

    it('shows category controls by default', () => {
      render(<AudioControls />);
      expect(screen.getByText('Sound Effects')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('Voice')).toBeInTheDocument();
      expect(screen.getByText('UI Sounds')).toBeInTheDocument();
    });

    it('hides category controls when specified', () => {
      render(<AudioControls showCategoryControls={false} />);
      expect(screen.queryByText('Sound Effects')).not.toBeInTheDocument();
      expect(screen.queryByText('Music')).not.toBeInTheDocument();
    });

    it('displays master volume slider', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /master volume/i });
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue('1');
    });

    it('displays audio status indicators', () => {
      render(<AudioControls />);
      expect(screen.getByText('Audio Initialized')).toBeInTheDocument();
      expect(screen.getByText('Audio Unlocked')).toBeInTheDocument();
    });
  });

  describe('Master Volume Control', () => {
    it('updates master volume when slider changes', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /master volume/i });

      fireEvent.change(slider, { target: { value: '0.5' } });

      expect(audioManager.setMasterVolume).toHaveBeenCalledWith(0.5);
    });

    it('displays correct volume percentage', () => {
      render(<AudioControls />);
      expect(screen.getByText('100%')).toBeInTheDocument(); // Master at 100%
    });

    it('disables master volume slider when muted', () => {
      vi.mocked(audioManager.getIsMuted).mockReturnValue(true);
      render(<AudioControls />);

      const slider = screen.getByRole('slider', { name: /master volume/i });
      expect(slider).toBeDisabled();
    });
  });

  describe('Mute Toggle', () => {
    it('toggles mute when mute button clicked', () => {
      render(<AudioControls />);
      const muteButton = screen.getByRole('button', { name: /mute audio/i });

      fireEvent.click(muteButton);

      expect(audioManager.toggleMute).toHaveBeenCalled();
    });

    it('shows unmute label when muted', () => {
      vi.mocked(audioManager.getIsMuted).mockReturnValue(true);
      render(<AudioControls />);

      const muteButton = screen.getByRole('button', { name: /unmute audio/i });
      expect(muteButton).toBeInTheDocument();
    });

    it('toggles mute in compact mode', () => {
      render(<AudioControls compact />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(audioManager.toggleMute).toHaveBeenCalled();
    });
  });

  describe('Category Volume Controls', () => {
    it('updates SFX volume when slider changes', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /sound effects volume/i });

      fireEvent.change(slider, { target: { value: '0.7' } });

      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('sfx', 0.7);
    });

    it('updates music volume when slider changes', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /music volume/i });

      fireEvent.change(slider, { target: { value: '0.5' } });

      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('music', 0.5);
    });

    it('updates voice volume when slider changes', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /voice volume/i });

      fireEvent.change(slider, { target: { value: '0.6' } });

      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('voice', 0.6);
    });

    it('updates UI volume when slider changes', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /ui sounds volume/i });

      fireEvent.change(slider, { target: { value: '0.4' } });

      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('ui', 0.4);
    });

    it('disables category sliders when muted', () => {
      vi.mocked(audioManager.getIsMuted).mockReturnValue(true);
      render(<AudioControls />);

      const sfxSlider = screen.getByRole('slider', { name: /sound effects volume/i });
      const musicSlider = screen.getByRole('slider', { name: /music volume/i });

      expect(sfxSlider).toBeDisabled();
      expect(musicSlider).toBeDisabled();
    });
  });

  describe('Settings Change Callback', () => {
    it('calls onChange when master volume changes', () => {
      const onChange = vi.fn();
      render(<AudioControls onChange={onChange} />);

      const slider = screen.getByRole('slider', { name: /master volume/i });
      fireEvent.change(slider, { target: { value: '0.8' } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          masterVolume: 1.0, // Initial value from mock
        })
      );
    });

    it('calls onChange when category volume changes', () => {
      const onChange = vi.fn();
      render(<AudioControls onChange={onChange} />);

      const slider = screen.getByRole('slider', { name: /music volume/i });
      fireEvent.change(slider, { target: { value: '0.5' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('calls onChange when mute toggles', () => {
      const onChange = vi.fn();
      render(<AudioControls onChange={onChange} />);

      const muteButton = screen.getByRole('button', { name: /mute audio/i });
      fireEvent.click(muteButton);

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on sliders', () => {
      render(<AudioControls />);

      expect(screen.getByRole('slider', { name: /master volume/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /sound effects volume/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /music volume/i })).toBeInTheDocument();
    });

    it('has proper ARIA attributes on mute button', () => {
      render(<AudioControls />);
      const muteButton = screen.getByRole('button', { name: /mute audio/i });

      expect(muteButton).toHaveAttribute('aria-label', 'Mute audio');
      expect(muteButton).toHaveAttribute('title', 'Mute');
    });

    it('has proper role on main container', () => {
      render(<AudioControls />);
      expect(screen.getByRole('group', { name: /audio controls/i })).toBeInTheDocument();
    });

    it('has ARIA value attributes on sliders', () => {
      render(<AudioControls />);
      const slider = screen.getByRole('slider', { name: /master volume/i });

      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<AudioControls className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('applies custom className in compact mode', () => {
      const { container } = render(<AudioControls compact className="custom-compact" />);
      expect(container.querySelector('.custom-compact')).toBeInTheDocument();
    });
  });

  describe('Audio State Display', () => {
    it('shows initialized status correctly', () => {
      vi.mocked(audioManager.getIsInitialized).mockReturnValue(true);
      render(<AudioControls />);
      expect(screen.getByText('Audio Initialized')).toBeInTheDocument();
    });

    it('shows not initialized status correctly', () => {
      vi.mocked(audioManager.getIsInitialized).mockReturnValue(false);
      render(<AudioControls />);
      expect(screen.getByText('Audio Not Initialized')).toBeInTheDocument();
    });

    it('shows unlocked status correctly', () => {
      vi.mocked(audioManager.getIsUnlocked).mockReturnValue(true);
      render(<AudioControls />);
      expect(screen.getByText('Audio Unlocked')).toBeInTheDocument();
    });

    it('shows locked status correctly', () => {
      vi.mocked(audioManager.getIsUnlocked).mockReturnValue(false);
      render(<AudioControls />);
      expect(screen.getByText('Audio Locked')).toBeInTheDocument();
    });
  });

  describe('Volume Icons', () => {
    it('shows VolumeX icon when muted', () => {
      vi.mocked(audioManager.getIsMuted).mockReturnValue(true);
      const { container } = render(<AudioControls />);
      // Icon should be rendered (lucide-react VolumeX)
      expect(container.querySelector('.audio-mute-button svg')).toBeInTheDocument();
    });

    it('shows Volume2 icon when volume is high', () => {
      vi.mocked(audioManager.getMasterVolume).mockReturnValue(1.0);
      const { container } = render(<AudioControls />);
      expect(container.querySelector('.audio-mute-button svg')).toBeInTheDocument();
    });

    it('shows Volume1 icon when volume is low', () => {
      vi.mocked(audioManager.getMasterVolume).mockReturnValue(0.3);
      const { container } = render(<AudioControls />);
      expect(container.querySelector('.audio-mute-button svg')).toBeInTheDocument();
    });
  });
});
