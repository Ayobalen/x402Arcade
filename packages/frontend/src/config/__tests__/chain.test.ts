/**
 * Unit tests for chain configuration module
 *
 * Tests chain definitions, URL helpers, USDC configuration,
 * and environment variable support.
 *
 * @module config/__tests__/chain.test
 */

import {
  // Chain constants
  CRONOS_TESTNET_CHAIN_ID,
  // URL helpers
  getChainId,
  getRpcUrl,
  getExplorerUrl,
  getTxUrl,
  getAddressUrl,
  getTokenUrl,
  // USDC configuration
  USDC_CONTRACT_ADDRESS,
  DEFAULT_USDC_ADDRESS,
  USDC_CONFIG,
  getUsdcContractAddress,
  getUsdcAddress,
  // Chain configuration
  defaultChain,
  // Facilitator configuration
  DEFAULT_FACILITATOR_URL,
  getFacilitatorUrl,
} from '../chain'

// ============================================================================
// Chain Constants
// ============================================================================

describe('Chain Constants', () => {
  describe('CRONOS_TESTNET_CHAIN_ID', () => {
    it('should be defined', () => {
      expect(CRONOS_TESTNET_CHAIN_ID).toBeDefined()
    })

    it('should be 338 (Cronos Testnet)', () => {
      expect(CRONOS_TESTNET_CHAIN_ID).toBe(338)
    })

    it('should be a number type', () => {
      expect(typeof CRONOS_TESTNET_CHAIN_ID).toBe('number')
    })
  })

  describe('defaultChain', () => {
    it('should be defined', () => {
      expect(defaultChain).toBeDefined()
    })

    it('should have correct chain id', () => {
      expect(defaultChain.id).toBe(338)
    })

    it('should have name property', () => {
      expect(defaultChain.name).toBeDefined()
      expect(typeof defaultChain.name).toBe('string')
    })

    it('should have nativeCurrency defined', () => {
      expect(defaultChain.nativeCurrency).toBeDefined()
      // Note: viem uses 'tCRO' (lowercase t) for testnet
      expect(defaultChain.nativeCurrency.symbol).toBe('tCRO')
      expect(defaultChain.nativeCurrency.decimals).toBe(18)
    })

    it('should have rpcUrls defined', () => {
      expect(defaultChain.rpcUrls).toBeDefined()
      expect(defaultChain.rpcUrls.default).toBeDefined()
    })

    it('should have blockExplorers defined', () => {
      expect(defaultChain.blockExplorers).toBeDefined()
    })
  })
})

// ============================================================================
// Environment Variable Helpers
// ============================================================================

describe('Environment Variable Helpers', () => {
  describe('getChainId', () => {
    it('should return 338 as default', () => {
      expect(getChainId()).toBe(338)
    })

    it('should return a number', () => {
      expect(typeof getChainId()).toBe('number')
    })
  })

  describe('getRpcUrl', () => {
    it('should return default RPC URL', () => {
      const url = getRpcUrl()
      expect(url).toBeDefined()
      expect(typeof url).toBe('string')
      expect(url).toContain('https://')
    })

    it('should return valid URL format', () => {
      const url = getRpcUrl()
      expect(() => new URL(url)).not.toThrow()
    })
  })

  describe('getExplorerUrl', () => {
    it('should return default explorer URL', () => {
      const url = getExplorerUrl()
      expect(url).toBeDefined()
      expect(url).toContain('cronos')
    })

    it('should return valid URL format', () => {
      const url = getExplorerUrl()
      expect(() => new URL(url)).not.toThrow()
    })

    it('should point to testnet explorer', () => {
      const url = getExplorerUrl()
      expect(url).toContain('testnet')
    })
  })

  describe('defaultChain (via getChainId)', () => {
    it('should use same chain ID as getChainId', () => {
      expect(defaultChain.id).toBe(getChainId())
    })
  })
})

// ============================================================================
// URL Builder Functions
// ============================================================================

describe('URL Builder Functions', () => {
  const testTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const testAddress = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0'

  describe('getTxUrl', () => {
    it('should return a valid URL', () => {
      const url = getTxUrl(testTxHash)
      expect(() => new URL(url)).not.toThrow()
    })

    it('should include the transaction hash', () => {
      const url = getTxUrl(testTxHash)
      expect(url).toContain(testTxHash)
    })

    it('should include /tx/ path', () => {
      const url = getTxUrl(testTxHash)
      expect(url).toContain('/tx/')
    })

    it('should use the explorer base URL', () => {
      const url = getTxUrl(testTxHash)
      expect(url).toContain(getExplorerUrl())
    })
  })

  describe('getAddressUrl', () => {
    it('should return a valid URL', () => {
      const url = getAddressUrl(testAddress)
      expect(() => new URL(url)).not.toThrow()
    })

    it('should include the address', () => {
      const url = getAddressUrl(testAddress)
      expect(url).toContain(testAddress)
    })

    it('should include /address/ path', () => {
      const url = getAddressUrl(testAddress)
      expect(url).toContain('/address/')
    })
  })

  describe('getTokenUrl', () => {
    it('should return a valid URL', () => {
      const url = getTokenUrl(testAddress)
      expect(() => new URL(url)).not.toThrow()
    })

    it('should include the token address', () => {
      const url = getTokenUrl(testAddress)
      expect(url).toContain(testAddress)
    })

    it('should include /token/ path', () => {
      const url = getTokenUrl(testAddress)
      expect(url).toContain('/token/')
    })
  })
})

// ============================================================================
// USDC Configuration
// ============================================================================

describe('USDC Configuration', () => {
  describe('DEFAULT_USDC_ADDRESS', () => {
    it('should be defined', () => {
      expect(DEFAULT_USDC_ADDRESS).toBeDefined()
    })

    it('should be a valid address format', () => {
      expect(DEFAULT_USDC_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should be the devUSDC.e contract address', () => {
      expect(DEFAULT_USDC_ADDRESS).toBe('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0')
    })
  })

  describe('USDC_CONTRACT_ADDRESS', () => {
    it('should be defined', () => {
      expect(USDC_CONTRACT_ADDRESS).toBeDefined()
    })

    it('should be a valid address format', () => {
      expect(USDC_CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should match DEFAULT_USDC_ADDRESS when no env override', () => {
      // Without env variable, should use default
      expect(USDC_CONTRACT_ADDRESS).toBe(DEFAULT_USDC_ADDRESS)
    })
  })

  describe('getUsdcContractAddress', () => {
    it('should return an address', () => {
      const address = getUsdcContractAddress()
      expect(address).toBeDefined()
    })

    it('should return valid address format', () => {
      const address = getUsdcContractAddress()
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should return default when no env variable', () => {
      const address = getUsdcContractAddress()
      expect(address).toBe(DEFAULT_USDC_ADDRESS)
    })
  })

  describe('getUsdcAddress', () => {
    it('should return address for Cronos Testnet', () => {
      const address = getUsdcAddress(CRONOS_TESTNET_CHAIN_ID)
      expect(address).toBeDefined()
      expect(address).toBe(USDC_CONTRACT_ADDRESS)
    })

    it('should return undefined for unsupported chain', () => {
      const address = getUsdcAddress(1) // Ethereum mainnet
      expect(address).toBeUndefined()
    })

    it('should return undefined for unknown chain', () => {
      const address = getUsdcAddress(99999)
      expect(address).toBeUndefined()
    })
  })

  describe('USDC_CONFIG', () => {
    it('should be defined', () => {
      expect(USDC_CONFIG).toBeDefined()
    })

    it('should have address property', () => {
      expect(USDC_CONFIG.address).toBe(USDC_CONTRACT_ADDRESS)
    })

    it('should have decimals of 6', () => {
      expect(USDC_CONFIG.decimals).toBe(6)
    })

    it('should have symbol of USDC', () => {
      expect(USDC_CONFIG.symbol).toBe('USDC')
    })

    it('should have name property', () => {
      expect(USDC_CONFIG.name).toBeDefined()
      expect(typeof USDC_CONFIG.name).toBe('string')
    })
  })
})

// ============================================================================
// Facilitator Configuration
// ============================================================================

describe('Facilitator Configuration', () => {
  describe('DEFAULT_FACILITATOR_URL', () => {
    it('should be defined', () => {
      expect(DEFAULT_FACILITATOR_URL).toBeDefined()
    })

    it('should be a valid URL', () => {
      expect(() => new URL(DEFAULT_FACILITATOR_URL)).not.toThrow()
    })

    it('should be the Cronos Labs facilitator', () => {
      expect(DEFAULT_FACILITATOR_URL).toContain('cronoslabs')
    })
  })

  describe('getFacilitatorUrl', () => {
    it('should return a string', () => {
      const url = getFacilitatorUrl()
      expect(typeof url).toBe('string')
    })

    it('should return a valid URL', () => {
      const url = getFacilitatorUrl()
      expect(() => new URL(url)).not.toThrow()
    })

    it('should return default when no env variable', () => {
      const url = getFacilitatorUrl()
      expect(url).toBe(DEFAULT_FACILITATOR_URL)
    })
  })
})
