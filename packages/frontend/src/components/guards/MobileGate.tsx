import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface MobileGateProps {
  children: ReactNode;
}

/**
 * MobileGate - Shows a friendly message to mobile users
 *
 * Desktop is recommended because:
 * 1. Wallet signing is easier on desktop (MetaMask extension)
 * 2. Games require keyboard controls (arrows, WASD)
 * 3. Better gameplay experience on larger screens
 *
 * Mobile version coming soon!
 */
export function MobileGate({ children }: MobileGateProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if user previously dismissed
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('mobile-gate-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleContinueAnyway = () => {
    sessionStorage.setItem('mobile-gate-dismissed', 'true');
    setDismissed(true);
  };

  if (!isMobile || dismissed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Arcade cabinet icon */}
        <div className="text-8xl mb-6 animate-bounce">🕹️</div>

        {/* Main message */}
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
          Desktop Mode Required
        </h1>

        <p className="text-gray-300 text-lg mb-6">
          x402Arcade is optimized for desktop play with keyboard controls.
        </p>

        {/* Reasons */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 mb-6 text-left border border-purple-500/20">
          <p className="text-purple-400 font-semibold mb-3 text-sm uppercase tracking-wide">
            Why Desktop?
          </p>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">⌨️</span>
              <span>Games use keyboard controls (Arrow keys, WASD)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">🦊</span>
              <span>MetaMask extension works best on desktop</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">🖥️</span>
              <span>Better gameplay on larger screens</span>
            </li>
          </ul>
        </div>

        {/* Coming soon badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-4 py-2 rounded-full mb-6 border border-purple-500/30">
          <span className="text-yellow-400">📱</span>
          <span className="text-sm text-gray-300">Mobile version coming soon!</span>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">
            Open <span className="text-cyan-400 font-mono">x402arcade.vercel.app</span> on your
            computer
          </p>

          {/* Continue anyway button - subtle */}
          <button
            onClick={handleContinueAnyway}
            className="text-gray-500 hover:text-gray-400 text-xs underline underline-offset-2 transition-colors"
          >
            Continue anyway (limited experience)
          </button>
        </div>

        {/* Hackathon badge */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-gray-600 text-xs">Built for Cronos x402 PayTech Hackathon</p>
        </div>
      </div>
    </div>
  );
}

export default MobileGate;
