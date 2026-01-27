/**
 * Transaction History Page
 *
 * Displays user's payment transaction history including:
 * - Game payments (money spent)
 * - Prize payouts (money earned)
 * - Transaction details with block explorer links
 * - Summary statistics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  ExternalLink,
  Trophy,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';

/**
 * API base URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Transaction History Entry Interface
 */
interface TransactionEntry {
  id: string;
  type: 'game_payment' | 'prize_payout';
  gameType: string | null;
  gameName: string | null;
  amount: number;
  timestamp: string;
  txHash: string;
  status: string;
  score: number | null;
  explorerUrl: string;
}

/**
 * Transaction Summary Interface
 */
interface TransactionSummary {
  playerAddress: string;
  totalSpent: number;
  totalEarned: number;
  netBalance: number;
  gamesPlayed: number;
  prizesWon: number;
}

/**
 * Format date for display
 */
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format address for display (truncate middle)
 */
function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Transaction History Page Component
 */
export const TransactionHistory: React.FC = () => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'game_payment' | 'prize_payout'>('all');

  // Set page title
  useEffect(() => {
    document.title = 'Transaction History - x402Arcade';
  }, []);

  // Fetch transaction history and summary
  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch transaction history
        const historyResponse = await fetch(
          `${API_BASE_URL}/api/v1/transactions/${address}?limit=100`
        );

        if (!historyResponse.ok) {
          throw new Error('Failed to fetch transaction history');
        }

        const historyData = await historyResponse.json();
        setTransactions(historyData.transactions || []);

        // Fetch summary statistics
        const summaryResponse = await fetch(
          `${API_BASE_URL}/api/v1/transactions/${address}/summary`
        );

        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch transaction summary');
        }

        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  // Filter transactions based on selected type
  const filteredTransactions =
    selectedType === 'all' ? transactions : transactions.filter((tx) => tx.type === selectedType);

  // Not connected state
  if (!address) {
    return (
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Wallet size={64} className="mx-auto mb-4 text-[var(--color-text-tertiary)]" />
            <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-[var(--color-text-tertiary)]">
              Please connect your wallet to view your transaction history
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3">
            <History
              size={40}
              className="text-[var(--color-primary)]"
              style={{ filter: 'drop-shadow(0 0 10px var(--color-primary-glow))' }}
            />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
              Transaction History
            </h1>
          </div>
          <p className="text-lg text-[var(--color-text-tertiary)] max-w-2xl mx-auto">
            Your complete payment history for {formatAddress(address)}
          </p>
        </motion.div>

        {/* Summary Cards */}
        {summary && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Total Spent */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={20} className="text-[var(--color-error)]" />
                <p className="text-sm text-[var(--color-text-tertiary)]">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                ${summary.totalSpent.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {summary.gamesPlayed} games played
              </p>
            </div>

            {/* Total Earned */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-[var(--color-success)]" />
                <p className="text-sm text-[var(--color-text-tertiary)]">Total Earned</p>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                ${summary.totalEarned.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {summary.prizesWon} prizes won
              </p>
            </div>

            {/* Net Balance */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={20} className="text-[var(--color-primary)]" />
                <p className="text-sm text-[var(--color-text-tertiary)]">Net Balance</p>
              </div>
              <p
                className={cn(
                  'text-2xl font-bold font-mono',
                  summary.netBalance >= 0
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-error)]'
                )}
              >
                {summary.netBalance >= 0 ? '+' : ''}${summary.netBalance.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Lifetime</p>
            </div>

            {/* Trophy */}
            <div className="p-4 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={20} className="text-[var(--color-warning)]" />
                <p className="text-sm text-[var(--color-text-tertiary)]">Win Rate</p>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                {summary.gamesPlayed > 0
                  ? ((summary.prizesWon / summary.gamesPlayed) * 100).toFixed(1)
                  : '0.0'}
                %
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Prize wins</p>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div
          className="flex gap-2 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              selectedType === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]'
                : 'bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
            )}
          >
            All Transactions
          </button>
          <button
            onClick={() => setSelectedType('game_payment')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
              selectedType === 'game_payment'
                ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]'
                : 'bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
            )}
          >
            <Gamepad2 size={16} />
            Game Payments
          </button>
          <button
            onClick={() => setSelectedType('prize_payout')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
              selectedType === 'prize_payout'
                ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]'
                : 'bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
            )}
          >
            <Trophy size={16} />
            Prize Payouts
          </button>
        </motion.div>

        {/* Transaction List */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
              <p className="mt-4 text-[var(--color-text-tertiary)]">Loading transactions...</p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-xl bg-[var(--color-surface-primary)] border border-[var(--color-error)] text-center">
              <p className="text-[var(--color-error)]">{error}</p>
            </div>
          )}

          {!loading && !error && filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <History
                size={64}
                className="mx-auto mb-4 text-[var(--color-text-tertiary)] opacity-50"
              />
              <p className="text-[var(--color-text-tertiary)]">
                {selectedType === 'all'
                  ? 'No transactions yet. Start playing to see your history!'
                  : selectedType === 'game_payment'
                    ? 'No game payments yet. Play a game to get started!'
                    : 'No prize payouts yet. Win a daily or weekly competition!'}
              </p>
            </div>
          )}

          <AnimatePresence>
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                className={cn(
                  'p-4 rounded-xl border shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all',
                  tx.type === 'game_payment'
                    ? 'bg-[var(--color-surface-primary)] border-[var(--color-border)]'
                    : 'bg-[var(--color-surface-primary)] border-[var(--color-success)]'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        tx.type === 'game_payment'
                          ? 'bg-[var(--color-bg-secondary)]'
                          : 'bg-[var(--color-success)]/10'
                      )}
                    >
                      {tx.type === 'game_payment' ? (
                        <Gamepad2 size={20} className="text-[var(--color-primary)]" />
                      ) : (
                        <Trophy size={20} className="text-[var(--color-success)]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[var(--color-text-primary)]">
                          {tx.type === 'game_payment'
                            ? `Played ${tx.gameName || 'Game'}`
                            : 'Prize Payout'}
                        </h3>
                        {tx.score !== null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
                            Score: {tx.score.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
                        <span>{formatDate(tx.timestamp)}</span>
                        <span className="hidden sm:inline">•</span>
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                        >
                          {formatAddress(tx.txHash)}
                          <ExternalLink size={12} />
                        </a>
                        <span className="hidden sm:inline">•</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] uppercase font-medium',
                            tx.status === 'completed' || tx.status === 'confirmed'
                              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                              : tx.status === 'pending' || tx.status === 'active'
                                ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                                : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                          )}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-lg font-bold font-mono',
                        tx.type === 'game_payment'
                          ? 'text-[var(--color-error)]'
                          : 'text-[var(--color-success)]'
                      )}
                    >
                      {tx.type === 'game_payment' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">USDC</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default TransactionHistory;
