/**
 * CoinCollect Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CoinCollect } from '@/components/ui/CoinCollect';

const meta = {
  title: 'UI/CoinCollect',
  component: CoinCollect,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Animates a coin traveling from start to end position along a bezier curve. The coin spins during flight and triggers a pulse effect at the destination.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    start: {
      control: 'object',
      description: 'Starting position {x, y}',
    },
    end: {
      control: 'object',
      description: 'Ending position {x, y}',
    },
    duration: {
      control: { type: 'range', min: 0.3, max: 2, step: 0.1 },
      description: 'Flight duration in seconds',
    },
    coinSize: {
      control: { type: 'range', min: 16, max: 48, step: 4 },
      description: 'Size of the coin in pixels',
    },
    color: {
      control: 'color',
      description: 'Color of the coin',
    },
    onArrive: {
      action: 'arrived',
      description: 'Callback when coin reaches destination',
    },
    onComplete: {
      action: 'complete',
      description: 'Callback when animation fully completes',
    },
  },
} satisfies Meta<typeof CoinCollect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    start: { x: 100, y: 400 },
    end: { x: 700, y: 100 },
    duration: 0.8,
  },
};

export const ShortDistance: Story = {
  args: {
    start: { x: 300, y: 300 },
    end: { x: 500, y: 200 },
    duration: 0.5,
  },
};

export const LongDistance: Story = {
  args: {
    start: { x: 50, y: 500 },
    end: { x: 750, y: 50 },
    duration: 1.2,
  },
};

export const FastAnimation: Story = {
  args: {
    start: { x: 100, y: 400 },
    end: { x: 700, y: 100 },
    duration: 0.4,
  },
};

export const SlowAnimation: Story = {
  args: {
    start: { x: 100, y: 400 },
    end: { x: 700, y: 100 },
    duration: 1.5,
  },
};

export const LargeCoin: Story = {
  args: {
    start: { x: 100, y: 400 },
    end: { x: 700, y: 100 },
    coinSize: 40,
  },
};

export const SmallCoin: Story = {
  args: {
    start: { x: 100, y: 400 },
    end: { x: 700, y: 100 },
    coinSize: 16,
  },
};

export const CustomColors: Story = {
  args: {
    start: { x: 100, y: 400 },
    end: { x: 700, y: 100 },
    color: '#ff00ff',
  },
};

// Interactive demo with button to trigger
export const Interactive: Story = {
  render: () => {
    const [coins, setCoins] = useState<Array<{ id: number }>>([]);
    const [nextId, setNextId] = useState(0);

    const collectCoin = () => {
      setCoins([...coins, { id: nextId }]);
      setNextId(nextId + 1);
    };

    const handleComplete = (id: number) => {
      setCoins(coins.filter(c => c.id !== id));
    };

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <button
          onClick={collectCoin}
          className="absolute top-20 left-20 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold"
          style={{ zIndex: 10 }}
        >
          Collect Coin!
        </button>
        <div
          className="absolute top-20 right-20 px-6 py-3 bg-purple-800 text-white rounded-lg font-bold"
          style={{ zIndex: 10 }}
        >
          Wallet
        </div>
        {coins.map((coin) => (
          <CoinCollect
            key={coin.id}
            start={{ x: 150, y: 150 }}
            end={{ x: window.innerWidth - 150, y: 100 }}
            onComplete={() => handleComplete(coin.id)}
          />
        ))}
      </div>
    );
  },
};

// Multiple coins at once
export const MultipleCoinBurst: Story = {
  render: () => {
    const [coins, setCoins] = useState<Array<{ id: number }>>([]);
    const [nextId, setNextId] = useState(0);

    const burstCoins = () => {
      const newCoins = Array.from({ length: 5 }, (_, i) => ({ id: nextId + i }));
      setCoins([...coins, ...newCoins]);
      setNextId(nextId + 5);
    };

    const handleComplete = (id: number) => {
      setCoins(coins.filter(c => c.id !== id));
    };

    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <button
          onClick={burstCoins}
          className="absolute px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold"
          style={{
            zIndex: 10,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          Collect 5 Coins!
        </button>
        <div
          className="absolute top-20 right-20 px-6 py-3 bg-purple-800 text-white rounded-lg font-bold"
          style={{ zIndex: 10 }}
        >
          💰 Wallet
        </div>
        {coins.map((coin, index) => (
          <CoinCollect
            key={coin.id}
            start={{ x: centerX, y: centerY }}
            end={{
              x: (typeof window !== 'undefined' ? window.innerWidth : 800) - 150,
              y: 100
            }}
            duration={0.8 + index * 0.1}
            onComplete={() => handleComplete(coin.id)}
          />
        ))}
      </div>
    );
  },
};

// Game UI example
export const GameCoinCollection: Story = {
  render: () => {
    const [balance, setBalance] = useState(0);
    const [coins, setCoins] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const [nextId, setNextId] = useState(0);

    const spawnCoin = () => {
      const x = 100 + Math.random() * 300;
      const y = 200 + Math.random() * 200;
      setCoins([...coins, { id: nextId, x, y }]);
      setNextId(nextId + 1);
    };

    const handleArrive = () => {
      setBalance(balance + 10);
    };

    const handleComplete = (id: number) => {
      setCoins(coins.filter(c => c.id !== id));
    };

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <div className="absolute top-8 left-8 text-white">
          <button
            onClick={spawnCoin}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
          >
            Earn Coin
          </button>
        </div>
        <div
          className="absolute top-8 right-8 px-6 py-3 bg-purple-900 text-white rounded-lg font-bold"
          style={{ zIndex: 10, fontSize: 24, fontFamily: 'Orbitron, sans-serif' }}
        >
          💰 {balance} Coins
        </div>
        {coins.map((coin) => (
          <CoinCollect
            key={coin.id}
            start={{ x: coin.x, y: coin.y }}
            end={{ x: (typeof window !== 'undefined' ? window.innerWidth : 800) - 150, y: 50 }}
            onArrive={handleArrive}
            onComplete={() => handleComplete(coin.id)}
          />
        ))}
      </div>
    );
  },
};
