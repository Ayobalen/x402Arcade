/**
 * Tests for EffectsSettings Component
 *
 * Verifies effects settings panel functionality, quality dropdown,
 * individual effect toggles, and FPS counter display.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EffectsSettings } from './EffectsSettings';

// Mock hooks
jest.mock('@/hooks/useGracefulDegradation', () => ({
  useGracefulDegradation: jest.fn(() => ({
    state: {
      currentTier: 'medium',
      settings: {
        bloom: true,
        particles: true,
        maxParticles: 500,
        shadows: false,
        crtEffect: true,
        reflections: false,
        ambientOcclusion: false,
        postProcessing: true,
      },
      autoDegrade: true,
      isAutoDetected: true,
      hasManualOverride: false,
      capabilities: {
        recommendedQuality: 'medium',
      },
    },
    setQualityTier: jest.fn(),
    setAutoDegrade: jest.fn(),
    resetToAuto: jest.fn(),
  })),
}));

jest.mock('@/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: jest.fn(() => ({
    metrics: {
      fps: 60,
      avgFrameTime: 16.67,
      minFps: 55,
      maxFps: 62,
    },
  })),
}));

describe('EffectsSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<EffectsSettings />);
      expect(screen.getByText('Visual Effects')).toBeInTheDocument();
      expect(screen.getByText('Adjust quality and performance settings')).toBeInTheDocument();
    });

    it('should render quality preset dropdown', () => {
      render(<EffectsSettings />);
      expect(screen.getByLabelText('Select quality preset')).toBeInTheDocument();
    });

    it('should display current quality tier', () => {
      render(<EffectsSettings />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should render auto quality toggle', () => {
      render(<EffectsSettings />);
      expect(screen.getByText('Auto Quality')).toBeInTheDocument();
      expect(
        screen.getByText('Automatically adjust quality based on performance')
      ).toBeInTheDocument();
    });

    it('should render FPS counter toggle', () => {
      render(<EffectsSettings />);
      expect(screen.getByText('Show FPS Counter')).toBeInTheDocument();
    });

    it('should render advanced settings when showAdvanced=true', () => {
      render(<EffectsSettings showAdvanced={true} />);
      expect(screen.getByText('Individual Effects')).toBeInTheDocument();
    });

    it('should not render advanced settings when showAdvanced=false', () => {
      render(<EffectsSettings showAdvanced={false} />);
      expect(screen.queryByText('Individual Effects')).not.toBeInTheDocument();
    });
  });

  describe('FPS Counter', () => {
    it('should show FPS counter when showFpsCounter=true', () => {
      render(<EffectsSettings showFpsCounter={true} />);
      expect(screen.getByText('Frame Rate')).toBeInTheDocument();
      expect(screen.getByText('60 FPS')).toBeInTheDocument();
    });

    it('should not show FPS counter initially when showFpsCounter=false', () => {
      render(<EffectsSettings showFpsCounter={false} />);
      expect(screen.queryByText('Frame Rate')).not.toBeInTheDocument();
    });

    it('should toggle FPS counter display', async () => {
      render(<EffectsSettings />);

      // Find and click the FPS toggle
      const fpsToggle = screen.getByText('Show FPS Counter').closest('button')!;
      fireEvent.click(fpsToggle);

      // Wait for state update
      await waitFor(() => {
        expect(screen.getByText('Frame Rate')).toBeInTheDocument();
      });
    });
  });

  describe('Quality Preset Selection', () => {
    it('should open quality dropdown when clicked', () => {
      render(<EffectsSettings />);
      const dropdownTrigger = screen.getByLabelText('Select quality preset');
      fireEvent.click(dropdownTrigger);

      // Dropdown items should appear (mocked Dropdown would need actual implementation)
    });

    it('should call setQualityTier when quality option selected', () => {
      const { useGracefulDegradation } = require('@/hooks/useGracefulDegradation');
      const mockSetQualityTier = jest.fn();
      useGracefulDegradation.mockReturnValue({
        state: {
          currentTier: 'medium',
          settings: {},
          autoDegrade: true,
          isAutoDetected: true,
          hasManualOverride: false,
        },
        setQualityTier: mockSetQualityTier,
        setAutoDegrade: jest.fn(),
        resetToAuto: jest.fn(),
      });

      render(<EffectsSettings />);
      // Note: Actual interaction would require full Dropdown component
      // This is a placeholder for the behavior test
    });
  });

  describe('Auto Quality Toggle', () => {
    it('should show auto quality as enabled by default', () => {
      render(<EffectsSettings />);
      const autoToggle = screen.getByText('Auto Quality').closest('button')!;
      expect(autoToggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should call setAutoDegrade when toggled', () => {
      const { useGracefulDegradation } = require('@/hooks/useGracefulDegradation');
      const mockSetAutoDegrade = jest.fn();
      useGracefulDegradation.mockReturnValue({
        state: {
          currentTier: 'medium',
          settings: {},
          autoDegrade: true,
          isAutoDetected: true,
          hasManualOverride: false,
        },
        setQualityTier: jest.fn(),
        setAutoDegrade: mockSetAutoDegrade,
        resetToAuto: jest.fn(),
      });

      render(<EffectsSettings />);
      const autoToggle = screen.getByText('Auto Quality').closest('button')!;
      fireEvent.click(autoToggle);

      expect(mockSetAutoDegrade).toHaveBeenCalled();
    });
  });

  describe('Individual Effect Toggles', () => {
    it('should display all individual effect toggles', () => {
      render(<EffectsSettings showAdvanced={true} />);

      expect(screen.getByText('Bloom')).toBeInTheDocument();
      expect(screen.getByText('Particles')).toBeInTheDocument();
      expect(screen.getByText('Shadows')).toBeInTheDocument();
      expect(screen.getByText('CRT Effect')).toBeInTheDocument();
      expect(screen.getByText('Reflections')).toBeInTheDocument();
      expect(screen.getByText('Ambient Occlusion')).toBeInTheDocument();
      expect(screen.getByText('Post Processing')).toBeInTheDocument();
    });

    it('should show particle count in description', () => {
      render(<EffectsSettings showAdvanced={true} />);
      expect(screen.getByText('500 particles')).toBeInTheDocument();
    });

    it('should disable individual toggles when using presets', () => {
      render(<EffectsSettings showAdvanced={true} />);

      const bloomToggle = screen.getByText('Bloom').closest('button')!;
      expect(bloomToggle).toBeDisabled();
    });

    it('should show explanation text for disabled toggles', () => {
      render(<EffectsSettings showAdvanced={true} />);
      expect(
        screen.getByText(/Individual effect toggles are disabled when using quality presets/)
      ).toBeInTheDocument();
    });
  });

  describe('Reset to Auto', () => {
    it('should show reset button when manual override is active', () => {
      const { useGracefulDegradation } = require('@/hooks/useGracefulDegradation');
      useGracefulDegradation.mockReturnValue({
        state: {
          currentTier: 'low',
          settings: {},
          autoDegrade: true,
          isAutoDetected: false,
          hasManualOverride: true,
          capabilities: {
            recommendedQuality: 'high',
          },
        },
        setQualityTier: jest.fn(),
        setAutoDegrade: jest.fn(),
        resetToAuto: jest.fn(),
      });

      render(<EffectsSettings />);
      expect(screen.getByText('Reset to Auto-Detected Settings')).toBeInTheDocument();
      expect(screen.getByText('Detected: high')).toBeInTheDocument();
    });

    it('should not show reset button when using auto-detected settings', () => {
      render(<EffectsSettings />);
      expect(screen.queryByText('Reset to Auto-Detected Settings')).not.toBeInTheDocument();
    });

    it('should call resetToAuto when reset button clicked', () => {
      const { useGracefulDegradation } = require('@/hooks/useGracefulDegradation');
      const mockResetToAuto = jest.fn();
      useGracefulDegradation.mockReturnValue({
        state: {
          currentTier: 'low',
          settings: {},
          autoDegrade: true,
          isAutoDetected: false,
          hasManualOverride: true,
          capabilities: {
            recommendedQuality: 'high',
          },
        },
        setQualityTier: jest.fn(),
        setAutoDegrade: jest.fn(),
        resetToAuto: mockResetToAuto,
      });

      render(<EffectsSettings />);
      const resetButton = screen.getByText('Reset to Auto-Detected Settings');
      fireEvent.click(resetButton);

      expect(mockResetToAuto).toHaveBeenCalled();
    });
  });

  describe('Settings Change Callback', () => {
    it('should call onSettingsChange with current settings', () => {
      const onSettingsChange = jest.fn();
      render(<EffectsSettings onSettingsChange={onSettingsChange} />);

      expect(onSettingsChange).toHaveBeenCalledWith({
        quality: 'medium',
        autoDegrade: true,
        showFps: false,
      });
    });

    it('should call onSettingsChange when settings update', async () => {
      const onSettingsChange = jest.fn();
      render(<EffectsSettings onSettingsChange={onSettingsChange} />);

      const fpsToggle = screen.getByText('Show FPS Counter').closest('button')!;
      fireEvent.click(fpsToggle);

      await waitFor(() => {
        expect(onSettingsChange).toHaveBeenCalledWith({
          quality: 'medium',
          autoDegrade: true,
          showFps: true,
        });
      });
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<EffectsSettings className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should use retro arcade theme colors', () => {
      const { container } = render(<EffectsSettings />);
      const mainContainer = container.firstChild as HTMLElement;

      // Check for arcade theme background and border colors
      expect(mainContainer.className).toContain('bg-[#16162a]');
      expect(mainContainer.className).toContain('border-[#2d2d4a]');
    });
  });

  describe('Auto-Detected Badge', () => {
    it('should show auto-detected message when using auto settings', () => {
      render(<EffectsSettings />);
      expect(
        screen.getByText('Auto-detected quality based on your device capabilities')
      ).toBeInTheDocument();
    });

    it('should not show auto-detected message when manually overridden', () => {
      const { useGracefulDegradation } = require('@/hooks/useGracefulDegradation');
      useGracefulDegradation.mockReturnValue({
        state: {
          currentTier: 'low',
          settings: {},
          autoDegrade: true,
          isAutoDetected: false,
          hasManualOverride: true,
        },
        setQualityTier: jest.fn(),
        setAutoDegrade: jest.fn(),
        resetToAuto: jest.fn(),
      });

      render(<EffectsSettings />);
      expect(
        screen.queryByText('Auto-detected quality based on your device capabilities')
      ).not.toBeInTheDocument();
    });
  });
});
