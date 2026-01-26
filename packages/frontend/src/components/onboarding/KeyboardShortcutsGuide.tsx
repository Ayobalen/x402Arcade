/**
 * KeyboardShortcutsGuide Component
 *
 * Shows all available keyboard shortcuts in a modal.
 * Can be opened with ? key or from help menu.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores';
import { Modal } from '@/components/ui/Modal';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      {
        keys: ['?'],
        description: 'Show keyboard shortcuts',
      },
      {
        keys: ['H'],
        description: 'Open help modal',
      },
      {
        keys: ['Esc'],
        description: 'Close modals/pause game',
      },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      {
        keys: ['G', 'H'],
        description: 'Go to home',
      },
      {
        keys: ['G', 'P'],
        description: 'Go to play',
      },
      {
        keys: ['G', 'L'],
        description: 'Go to leaderboard',
      },
    ],
  },
  {
    title: 'Snake',
    shortcuts: [
      {
        keys: ['↑', 'W'],
        description: 'Move up',
      },
      {
        keys: ['←', 'A'],
        description: 'Move left',
      },
      {
        keys: ['↓', 'S'],
        description: 'Move down',
      },
      {
        keys: ['→', 'D'],
        description: 'Move right',
      },
      {
        keys: ['P'],
        description: 'Pause',
      },
    ],
  },
  {
    title: 'Tetris',
    shortcuts: [
      {
        keys: ['←'],
        description: 'Move left',
      },
      {
        keys: ['→'],
        description: 'Move right',
      },
      {
        keys: ['↑'],
        description: 'Rotate',
      },
      {
        keys: ['↓'],
        description: 'Soft drop',
      },
      {
        keys: ['Space'],
        description: 'Hard drop',
      },
      {
        keys: ['P'],
        description: 'Pause',
      },
    ],
  },
  {
    title: 'Pong',
    shortcuts: [
      {
        keys: ['↑'],
        description: 'Move paddle up',
      },
      {
        keys: ['↓'],
        description: 'Move paddle down',
      },
      {
        keys: ['P'],
        description: 'Pause',
      },
    ],
  },
  {
    title: 'Breakout',
    shortcuts: [
      {
        keys: ['←'],
        description: 'Move paddle left',
      },
      {
        keys: ['→'],
        description: 'Move paddle right',
      },
      {
        keys: ['Space'],
        description: 'Launch ball',
      },
      {
        keys: ['P'],
        description: 'Pause',
      },
    ],
  },
  {
    title: 'Space Invaders',
    shortcuts: [
      {
        keys: ['←'],
        description: 'Move left',
      },
      {
        keys: ['→'],
        description: 'Move right',
      },
      {
        keys: ['Space'],
        description: 'Shoot',
      },
      {
        keys: ['P'],
        description: 'Pause',
      },
    ],
  },
];

export function KeyboardShortcutsGuide() {
  const { showKeyboardShortcuts, openKeyboardShortcuts, closeKeyboardShortcuts } =
    useOnboardingStore();

  // Listen for ? key to open shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openKeyboardShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [openKeyboardShortcuts]);

  return (
    <Modal
      isOpen={showKeyboardShortcuts}
      onClose={closeKeyboardShortcuts}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 mb-4">
            <Keyboard size={32} className="text-cyan-400" />
          </div>
          <p className="text-slate-400">Master these shortcuts to play like a pro</p>
        </div>

        {/* Shortcut Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              className="bg-[#16162a] border border-[#2d2d4a] rounded-lg p-4"
            >
              {/* Group Title */}
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-magenta-400 rounded-full" />
                {group.title}
              </h3>

              {/* Shortcuts */}
              <div className="space-y-3">
                {group.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    {/* Keys */}
                    <div className="flex gap-1 shrink-0">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          {keyIndex > 0 && <span className="text-slate-600 mx-1">then</span>}
                          <kbd className="px-2 py-1 bg-[#0a0a0a] border border-cyan-500/30 rounded text-cyan-400 font-mono text-sm min-w-[32px] text-center shadow-inner">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <span className="text-slate-300 text-sm">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Tip */}
        <div className="text-center pt-4 border-t border-[#2d2d4a]">
          <p className="text-sm text-slate-400">
            <kbd className="px-2 py-1 bg-[#16162a] border border-cyan-500/30 rounded text-cyan-400 font-mono text-xs">
              ?
            </kbd>{' '}
            Press{' '}
            <kbd className="px-2 py-1 bg-[#16162a] border border-cyan-500/30 rounded text-cyan-400 font-mono text-xs">
              ?
            </kbd>{' '}
            anytime to view this guide
          </p>
        </div>
      </div>
    </Modal>
  );
}
