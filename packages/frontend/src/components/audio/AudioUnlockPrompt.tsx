/**
 * AudioUnlockPrompt - Component to prompt user to unlock audio
 *
 * Displays a button/message when audio requires user interaction
 * Required for Safari and iOS devices
 *
 * @module AudioUnlockPrompt
 */

/* eslint-disable no-console */

import React, { useState, useEffect } from 'react';
import { useAudio } from '../../hooks/useAudio';

interface AudioUnlockPromptProps {
  /**
   * Custom message to display
   */
  message?: string;

  /**
   * Whether to auto-hide after unlock
   */
  autoHide?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Callback when audio is unlocked
   */
  onUnlock?: () => void;
}

/**
 * AudioUnlockPrompt Component
 *
 * Shows a prompt to unlock audio on browsers that require user interaction
 */
export const AudioUnlockPrompt: React.FC<AudioUnlockPromptProps> = ({
  message = 'Click to enable sound',
  autoHide = true,
  className = '',
  onUnlock,
}) => {
  const audio = useAudio(true, false); // Don't auto-unlock
  const [isVisible, setIsVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  /**
   * Check if we should show the prompt
   */
  useEffect(() => {
    if (audio.isInitialized && !audio.isUnlocked) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [audio.isInitialized, audio.isUnlocked]);

  /**
   * Handle unlock button click
   */
  const handleUnlock = async () => {
    setIsUnlocking(true);

    try {
      const success = await audio.unlock();

      if (success) {
        if (autoHide) {
          setIsVisible(false);
        }

        if (onUnlock) {
          onUnlock();
        }
      }
    } catch (error) {
       
      console.error('[AudioUnlockPrompt] Failed to unlock:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`audio-unlock-prompt ${className}`}
      role="dialog"
      aria-live="polite"
      aria-label="Audio unlock prompt"
    >
      <button
        onClick={handleUnlock}
        disabled={isUnlocking}
        className="audio-unlock-button"
        aria-label={message}
      >
        <svg
          className="audio-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <span>{isUnlocking ? 'Enabling...' : message}</span>
      </button>

      <style>{`
        .audio-unlock-prompt {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        }

        .audio-unlock-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
        }

        .audio-unlock-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
          background: linear-gradient(135deg, #9D6FFA 0%, #B89FFA 100%);
        }

        .audio-unlock-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .audio-unlock-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .audio-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .audio-unlock-prompt {
            bottom: 16px;
            right: 16px;
            left: 16px;
          }

          .audio-unlock-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioUnlockPrompt;
