/**
 * HelpModal Component
 *
 * Comprehensive help and FAQ system for users.
 * Organized into categories with searchable content.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Wallet,
  Gamepad2,
  CreditCard,
  Trophy,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  links?: Array<{ text: string; url: string }>;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: typeof Wallet;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Wallet,
    items: [
      {
        question: 'What is x402 Arcade?',
        answer:
          'x402 Arcade is a gasless arcade gaming platform on Cronos blockchain. You pay tiny amounts (pennies) to play classic games and compete for prize pools, with zero gas fees thanks to the x402 protocol.',
      },
      {
        question: 'How do I start playing?',
        answer:
          '1. Connect your Web3 wallet (MetaMask recommended)\n2. Make sure you have USDC on Cronos Testnet\n3. Browse games and click "Pay & Play"\n4. Sign the payment authorization\n5. Start playing immediately!',
      },
      {
        question: 'Do I need cryptocurrency?',
        answer:
          'Yes, you need a small amount of USDC (devUSDC.e) on Cronos Testnet. Each game costs $0.01-$0.02. You can get test USDC from the Cronos faucet.',
        links: [
          {
            text: 'Cronos Faucet',
            url: 'https://cronos.org/faucet',
          },
        ],
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & x402',
    icon: CreditCard,
    items: [
      {
        question: 'What is the x402 protocol?',
        answer:
          'x402 is an HTTP-native payment protocol that enables gasless micropayments. The facilitator covers all gas costs, so you only pay the game price with no additional fees.',
      },
      {
        question: 'Why do I need to sign a transaction?',
        answer:
          "You're signing an EIP-3009 authorization that allows the facilitator to transfer your USDC for the game payment. This is a one-time signature per game, not a blockchain transaction, so it's instant and free.",
      },
      {
        question: 'How much does each game cost?',
        answer:
          'Games cost between $0.01-$0.02 USDC per play. The exact price is shown on each game card. 70% of all payments go to the daily prize pool.',
      },
      {
        question: 'Are there any gas fees?',
        answer:
          'No! The x402 facilitator covers all gas fees. You only pay the game price. This is what makes micropayments practical on blockchain.',
      },
    ],
  },
  {
    id: 'gameplay',
    title: 'Gameplay',
    icon: Gamepad2,
    items: [
      {
        question: 'What games are available?',
        answer:
          'We currently offer 5 classic arcade games: Snake, Tetris, Pong, Breakout, and Space Invaders. Each has authentic retro gameplay with modern polish.',
      },
      {
        question: 'What are the controls?',
        answer:
          'Most games use arrow keys or WASD for movement. Spacebar is used for shooting/special actions. Press P or Escape to pause. Each game shows controls when you start playing.',
      },
      {
        question: 'How is my score submitted?',
        answer:
          'Your score is automatically submitted to the leaderboard when the game ends. No additional action needed!',
      },
      {
        question: 'Can I pause the game?',
        answer:
          'Yes! Press P or Escape to pause. Your session remains active, but the game timer may continue running depending on the game.',
      },
    ],
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard & Prizes',
    icon: Trophy,
    items: [
      {
        question: 'How do leaderboards work?',
        answer:
          'Each game has three leaderboards: Daily (resets at midnight UTC), Weekly (resets Monday), and All-Time. Your highest score for each period is shown.',
      },
      {
        question: 'How do I win prizes?',
        answer:
          'The top player on the daily leaderboard for each game wins 70% of all payments made for that game that day. Winners are announced at midnight UTC.',
      },
      {
        question: 'When are prizes distributed?',
        answer:
          'Daily prizes are calculated and distributed automatically at midnight UTC. Check the Prizes page to see current pool amounts and past winners.',
      },
      {
        question: 'Can I see my ranking?',
        answer:
          'Yes! Your entry on the leaderboard is highlighted in cyan with a "(You)" label. You can filter by game and time period to see your rankings.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: HelpCircle,
    items: [
      {
        question: "Wallet won't connect",
        answer:
          "1. Make sure MetaMask is installed\n2. Refresh the page\n3. Check that you're on Cronos Testnet (chain ID 338)\n4. Try disconnecting and reconnecting",
      },
      {
        question: 'Payment failed',
        answer:
          "1. Check your USDC balance\n2. Make sure you signed the authorization\n3. Verify you're on Cronos Testnet\n4. Try refreshing and starting again",
      },
      {
        question: "Game won't load",
        answer:
          'Try refreshing the page. Make sure you completed the payment flow. Check browser console for errors. If problems persist, clear cache and try again.',
      },
      {
        question: "Score didn't submit",
        answer:
          'Scores submit automatically at game over. If you closed the window too quickly, the submission may have failed. Play another game to submit a new score.',
      },
    ],
  },
];

export function HelpModal() {
  const { showHelp, closeHelp } = useOnboardingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['getting-started']);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Filter categories and items based on search
  const filteredCategories = FAQ_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        searchQuery === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  return (
    <Modal isOpen={showHelp} onClose={closeHelp} title="Help & FAQ" size="xl">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
            className="w-full"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const Icon = category.icon;

            return (
              <div key={category.id} className="border border-[#2d2d4a] rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-[#16162a] hover:bg-[#1a1a2e] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                    <span className="text-xs text-slate-400 bg-[#2d2d4a] px-2 py-1 rounded-full">
                      {category.items.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-400" />
                  )}
                </button>

                {/* Category Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-[#2d2d4a]">
                        {category.items.map((item, index) => {
                          const itemId = `${category.id}-${index}`;
                          const isItemExpanded = expandedItems.includes(itemId);

                          return (
                            <div key={itemId} className="bg-[#0a0a0a]">
                              {/* Question */}
                              <button
                                onClick={() => toggleItem(itemId)}
                                className="w-full px-6 py-4 flex items-start justify-between hover:bg-[#16162a] transition-colors text-left"
                              >
                                <span className="text-white font-medium pr-4">{item.question}</span>
                                {isItemExpanded ? (
                                  <ChevronDown size={18} className="text-cyan-400 shrink-0 mt-1" />
                                ) : (
                                  <ChevronRight
                                    size={18}
                                    className="text-slate-400 shrink-0 mt-1"
                                  />
                                )}
                              </button>

                              {/* Answer */}
                              <AnimatePresence>
                                {isItemExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-6 pb-4 text-slate-300 whitespace-pre-line">
                                      {item.answer}

                                      {/* Links */}
                                      {item.links && item.links.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                          {item.links.map((link, linkIndex) => (
                                            <a
                                              key={linkIndex}
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                                            >
                                              <ExternalLink size={14} />
                                              <span>{link.text}</span>
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No results found for &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d2d4a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3d3d5a;
        }
      `}</style>
    </Modal>
  );
}
