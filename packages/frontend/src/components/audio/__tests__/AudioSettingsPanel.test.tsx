/**
 * AudioSettingsPanel Component Tests
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioSettingsPanel } from '../AudioSettingsPanel';
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

describe('AudioSettingsPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Audio Settings')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AudioSettingsPanel isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close audio settings/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('renders volume presets', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Quick Presets')).toBeInTheDocument();
      expect(screen.getByText('Full Volume')).toBeInTheDocument();
      expect(screen.getByText('Balanced')).toBeInTheDocument();
      expect(screen.getByText('Quiet')).toBeInTheDocument();
      expect(screen.getByText('Muted')).toBeInTheDocument();
    });

    it('renders audio controls', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Audio Controls')).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /master volume/i })).toBeInTheDocument();
    });

    it('renders reset button', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close audio settings/i });

      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop clicked', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const backdrop = screen.getByRole('dialog');

      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when panel content clicked', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const title = screen.getByText('Audio Settings');

      fireEvent.click(title);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Volume Presets', () => {
    it('applies full volume preset', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const fullVolumeButton = screen.getByRole('button', { name: /apply full volume preset/i });

      fireEvent.click(fullVolumeButton);

      expect(audioManager.setMasterVolume).toHaveBeenCalledWith(1.0);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('sfx', 1.0);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('music', 0.7);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('voice', 1.0);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('ui', 0.8);
    });

    it('applies balanced preset', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const balancedButton = screen.getByRole('button', { name: /apply balanced preset/i });

      fireEvent.click(balancedButton);

      expect(audioManager.setMasterVolume).toHaveBeenCalledWith(0.7);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('sfx', 0.8);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('music', 0.5);
    });

    it('applies quiet preset', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const quietButton = screen.getByRole('button', { name: /apply quiet preset/i });

      fireEvent.click(quietButton);

      expect(audioManager.setMasterVolume).toHaveBeenCalledWith(0.4);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('sfx', 0.5);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('music', 0.3);
    });

    it('applies muted preset', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const mutedButton = screen.getByRole('button', { name: /apply muted preset/i });

      fireEvent.click(mutedButton);

      expect(audioManager.setMasterVolume).toHaveBeenCalledWith(0);
      expect(audioManager.mute).toHaveBeenCalled();
    });

    it('unmutes when applying non-muted preset while muted', () => {
      vi.mocked(audioManager.getIsMuted).mockReturnValue(true);
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const fullVolumeButton = screen.getByRole('button', { name: /apply full volume preset/i });

      fireEvent.click(fullVolumeButton);

      expect(audioManager.unmute).toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('resets to default values when reset button clicked', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const resetButton = screen.getByRole('button', { name: /reset to defaults/i });

      fireEvent.click(resetButton);

      expect(audioManager.setMasterVolume).toHaveBeenCalledWith(1.0);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('sfx', 1.0);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('music', 0.7);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('voice', 1.0);
      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('ui', 0.8);
      expect(audioManager.unmute).toHaveBeenCalled();
    });
  });

  describe('Panel Positioning', () => {
    it('applies center position by default', () => {
      const { container } = render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const panel = container.querySelector('.audio-settings-panel');
      expect(panel).not.toHaveClass('position-right');
      expect(panel).not.toHaveClass('position-left');
    });

    it('applies right position when specified', () => {
      const { container } = render(
        <AudioSettingsPanel isOpen={true} onClose={mockOnClose} position="right" />
      );
      const panel = container.querySelector('.audio-settings-panel');
      expect(panel).toHaveClass('position-right');
    });

    it('applies left position when specified', () => {
      const { container } = render(
        <AudioSettingsPanel isOpen={true} onClose={mockOnClose} position="left" />
      );
      const panel = container.querySelector('.audio-settings-panel');
      expect(panel).toHaveClass('position-left');
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'audio-settings-title');
    });

    it('has proper title id', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const title = screen.getByText('Audio Settings');
      expect(title).toHaveAttribute('id', 'audio-settings-title');
    });

    it('has accessible close button', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close audio settings/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close audio settings');
    });

    it('has accessible preset buttons', () => {
      render(<AudioSettingsPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: /apply full volume preset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply balanced preset/i })).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to backdrop', () => {
      const { container } = render(
        <AudioSettingsPanel isOpen={true} onClose={mockOnClose} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
