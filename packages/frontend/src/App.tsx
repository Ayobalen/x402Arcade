import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#00ffff] mb-4">
          x402 Arcade
        </h1>
        <p className="text-[#94a3b8] mb-8">
          Insert a Penny, Play for Glory
        </p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-6 py-3 bg-gradient-to-r from-[#00ffff] to-[#ff00ff] rounded-lg font-semibold text-black hover:opacity-90 transition-opacity"
        >
          Count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
