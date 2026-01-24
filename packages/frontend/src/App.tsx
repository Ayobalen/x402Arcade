import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { formatBalance } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Balance } from '@/components/wallet/Balance';

function App() {
  const [count, setCount] = useState(0);

  // Test values for formatBalance
  const testValues = [
    { value: '0', label: 'Zero' },
    { value: '0.001', label: 'Very small (< 0.01)' },
    { value: '0.1', label: 'Small' },
    { value: '42.5678', label: 'Regular' },
    { value: '1234.5678', label: 'With thousands' },
    { value: '1000000.99', label: 'One million' },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header with wallet connection */}
        <Header showBalance />

        {/* Main content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-[#00ffff] mb-2">x402 Arcade</h1>
            <p className="text-[#94a3b8] mb-8">Insert a Penny, Play for Glory</p>

            {/* Balance component demo */}
            <div className="mb-8 p-6 bg-[#16162a] border border-[#2d2d4a] rounded-xl">
              <h2 className="text-2xl font-bold text-[#00ffff] mb-4">Standalone Balance Widget</h2>
              <div className="flex items-center gap-4">
                <Balance showRefresh />
              </div>
            </div>

            {/* formatBalance Test Section */}
            <div className="mb-8 p-6 bg-[#16162a] border border-[#2d2d4a] rounded-xl">
              <h2 className="text-2xl font-bold text-[#00ffff] mb-4">Balance Formatting Tests</h2>
              <div className="space-y-4">
                {testValues.map(({ value, label }) => (
                  <div key={value} className="flex flex-col gap-2">
                    <div className="text-[#94a3b8] text-sm">
                      {label}: {value}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                      <div className="text-sm">
                        <span className="text-[#00ffff]">Default: </span>
                        <span className="font-mono">{formatBalance(value)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#00ffff]">$ prefix: </span>
                        <span className="font-mono">
                          {formatBalance(value, { useDollarSign: true })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#00ffff]">4 decimals: </span>
                        <span className="font-mono">{formatBalance(value, { decimals: 4 })}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-[#00ffff]">No symbol: </span>
                        <span className="font-mono">
                          {formatBalance(value, { showSymbol: false })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Counter Test */}
            <div className="text-center">
              <button
                onClick={() => setCount((c) => c + 1)}
                className="px-6 py-3 bg-gradient-to-r from-[#00ffff] to-[#ff00ff] rounded-lg font-semibold text-black hover:opacity-90 transition-opacity"
              >
                Count is {count}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
