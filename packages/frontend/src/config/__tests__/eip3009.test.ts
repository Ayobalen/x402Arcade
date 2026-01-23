/**
 * Unit tests for EIP-3009 configuration module
 *
 * Tests nonce generation, signature parsing, EIP-712 domain configuration,
 * and USDC utility functions.
 *
 * @module config/__tests__/eip3009.test
 */

import {
  // Constants
  USDC_NAME,
  USDC_VERSION,
  // EIP-712 types
  EIP712_DOMAIN_TYPE,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE,
  // Domain functions
  getUsdcEip712Domain,
  createEip712Domain,
  // Message utilities
  createTransferWithAuthorizationMessage,
  // Nonce generation
  generateNonce,
  // Signature utilities
  parseSignature,
  combineSignature,
  validateSignatureComponents,
  // USDC utilities
  parseUSDC,
  formatUSDC,
  formatUSDCWithSymbol,
} from '../eip3009'

import { CRONOS_TESTNET_CHAIN_ID, USDC_CONTRACT_ADDRESS } from '../chain'

// ============================================================================
// Constants
// ============================================================================

describe('EIP-3009 Constants', () => {
  describe('USDC_NAME', () => {
    it('should be defined', () => {
      expect(USDC_NAME).toBeDefined()
    })

    it('should be a string', () => {
      expect(typeof USDC_NAME).toBe('string')
    })

    it('should be the correct USDC name for Cronos Testnet', () => {
      expect(USDC_NAME).toBe('Bridged USDC (Stargate)')
    })
  })

  describe('USDC_VERSION', () => {
    it('should be defined', () => {
      expect(USDC_VERSION).toBeDefined()
    })

    it('should be "1" for testnet', () => {
      expect(USDC_VERSION).toBe('1')
    })
  })
})

// ============================================================================
// EIP-712 Types
// ============================================================================

describe('EIP-712 Types', () => {
  describe('EIP712_DOMAIN_TYPE', () => {
    it('should be defined', () => {
      expect(EIP712_DOMAIN_TYPE).toBeDefined()
    })

    it('should be an array', () => {
      expect(Array.isArray(EIP712_DOMAIN_TYPE)).toBe(true)
    })

    it('should have name field', () => {
      expect(EIP712_DOMAIN_TYPE).toContainEqual({ name: 'name', type: 'string' })
    })

    it('should have version field', () => {
      expect(EIP712_DOMAIN_TYPE).toContainEqual({ name: 'version', type: 'string' })
    })

    it('should have chainId field', () => {
      expect(EIP712_DOMAIN_TYPE).toContainEqual({ name: 'chainId', type: 'uint256' })
    })

    it('should have verifyingContract field', () => {
      expect(EIP712_DOMAIN_TYPE).toContainEqual({ name: 'verifyingContract', type: 'address' })
    })
  })

  describe('TRANSFER_WITH_AUTHORIZATION_TYPES', () => {
    it('should be defined', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_TYPES).toBeDefined()
    })

    it('should have TransferWithAuthorization array', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization).toBeDefined()
      expect(Array.isArray(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization)).toBe(true)
    })

    it('should have from field', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization).toContainEqual({
        name: 'from',
        type: 'address',
      })
    })

    it('should have to field', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization).toContainEqual({
        name: 'to',
        type: 'address',
      })
    })

    it('should have value field', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization).toContainEqual({
        name: 'value',
        type: 'uint256',
      })
    })

    it('should have nonce field with bytes32 type', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization).toContainEqual({
        name: 'nonce',
        type: 'bytes32',
      })
    })
  })

  describe('TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE', () => {
    it('should be "TransferWithAuthorization"', () => {
      expect(TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE).toBe('TransferWithAuthorization')
    })
  })
})

// ============================================================================
// Domain Functions
// ============================================================================

describe('EIP-712 Domain Functions', () => {
  describe('getUsdcEip712Domain', () => {
    it('should return a domain object', () => {
      const domain = getUsdcEip712Domain()
      expect(domain).toBeDefined()
    })

    it('should have correct name', () => {
      const domain = getUsdcEip712Domain()
      expect(domain.name).toBe(USDC_NAME)
    })

    it('should have correct version', () => {
      const domain = getUsdcEip712Domain()
      expect(domain.version).toBe(USDC_VERSION)
    })

    it('should have correct chainId', () => {
      const domain = getUsdcEip712Domain()
      expect(domain.chainId).toBe(CRONOS_TESTNET_CHAIN_ID)
    })

    it('should have correct verifyingContract', () => {
      const domain = getUsdcEip712Domain()
      expect(domain.verifyingContract).toBe(USDC_CONTRACT_ADDRESS)
    })
  })

  describe('createEip712Domain', () => {
    it('should create a custom domain', () => {
      const customDomain = createEip712Domain({
        name: 'Custom Token',
        version: '2',
        chainId: 25,
        verifyingContract: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      })

      expect(customDomain.name).toBe('Custom Token')
      expect(customDomain.version).toBe('2')
      expect(customDomain.chainId).toBe(25)
      expect(customDomain.verifyingContract).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should accept bigint chainId', () => {
      const domain = createEip712Domain({
        name: 'Test',
        version: '1',
        chainId: BigInt(338),
        verifyingContract: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      })

      expect(domain.chainId).toBe(BigInt(338))
    })
  })
})

// ============================================================================
// Nonce Generation
// ============================================================================

describe('Nonce Generation', () => {
  describe('generateNonce', () => {
    it('should return a hex string', () => {
      const nonce = generateNonce()
      expect(typeof nonce).toBe('string')
    })

    it('should start with 0x', () => {
      const nonce = generateNonce()
      expect(nonce.startsWith('0x')).toBe(true)
    })

    it('should be 66 characters long (0x + 64 hex chars)', () => {
      const nonce = generateNonce()
      expect(nonce.length).toBe(66)
    })

    it('should only contain valid hex characters after 0x', () => {
      const nonce = generateNonce()
      const hexPart = nonce.slice(2)
      expect(hexPart).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate unique nonces', () => {
      const nonces = new Set<string>()
      for (let i = 0; i < 100; i++) {
        nonces.add(generateNonce())
      }
      // All 100 nonces should be unique
      expect(nonces.size).toBe(100)
    })

    it('should return a bytes32 compatible value', () => {
      const nonce = generateNonce()
      // 32 bytes = 64 hex characters
      expect(nonce.slice(2).length).toBe(64)
    })
  })
})

// ============================================================================
// Signature Parsing
// ============================================================================

describe('Signature Parsing', () => {
  // Sample signature (65 bytes = 130 hex chars + 0x)
  const validSignature =
    '0x' +
    'a'.repeat(64) + // r (32 bytes)
    'b'.repeat(64) + // s (32 bytes)
    '1b' // v (1 byte = 27 in hex)

  describe('parseSignature', () => {
    it('should parse a valid signature', () => {
      const result = parseSignature(validSignature as `0x${string}`)
      expect(result).toBeDefined()
    })

    it('should extract r value correctly', () => {
      const result = parseSignature(validSignature as `0x${string}`)
      expect(result.r).toBe('0x' + 'a'.repeat(64))
    })

    it('should extract s value correctly', () => {
      const result = parseSignature(validSignature as `0x${string}`)
      expect(result.s).toBe('0x' + 'b'.repeat(64))
    })

    it('should extract v value correctly', () => {
      const result = parseSignature(validSignature as `0x${string}`)
      expect(result.v).toBe(27)
    })

    it('should handle v=28 signatures', () => {
      const sig28 = '0x' + 'a'.repeat(64) + 'b'.repeat(64) + '1c' // 1c = 28
      const result = parseSignature(sig28 as `0x${string}`)
      expect(result.v).toBe(28)
    })

    it('should handle EIP-155 style v=0', () => {
      const sig0 = '0x' + 'a'.repeat(64) + 'b'.repeat(64) + '00'
      const result = parseSignature(sig0 as `0x${string}`)
      expect(result.v).toBe(27) // Normalized to 27
    })

    it('should handle EIP-155 style v=1', () => {
      const sig1 = '0x' + 'a'.repeat(64) + 'b'.repeat(64) + '01'
      const result = parseSignature(sig1 as `0x${string}`)
      expect(result.v).toBe(28) // Normalized to 28
    })
  })

  describe('combineSignature', () => {
    it('should combine r, s, v into signature', () => {
      const r = '0x' + 'a'.repeat(64)
      const s = '0x' + 'b'.repeat(64)
      const v = 27

      const signature = combineSignature(r as `0x${string}`, s as `0x${string}`, v)
      expect(signature.startsWith('0x')).toBe(true)
      expect(signature.length).toBe(132) // 0x + 64 + 64 + 2
    })

    it('should be reversible with parseSignature', () => {
      const r = '0x' + 'a'.repeat(64)
      const s = '0x' + 'b'.repeat(64)
      const v = 28

      const signature = combineSignature(r as `0x${string}`, s as `0x${string}`, v)
      const parsed = parseSignature(signature)

      expect(parsed.r).toBe(r)
      expect(parsed.s).toBe(s)
      expect(parsed.v).toBe(v)
    })
  })

  describe('validateSignatureComponents', () => {
    it('should not throw for valid components', () => {
      const sig = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(64),
        v: 27,
      }

      expect(() => validateSignatureComponents(sig)).not.toThrow()
    })

    it('should not throw for v=28', () => {
      const sig = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(64),
        v: 28,
      }

      expect(() => validateSignatureComponents(sig)).not.toThrow()
    })

    it('should throw for invalid r length', () => {
      const sig = {
        r: '0x' + 'a'.repeat(62), // Too short
        s: '0x' + 'b'.repeat(64),
        v: 27,
      }

      expect(() => validateSignatureComponents(sig)).toThrow()
    })

    it('should throw for invalid s length', () => {
      const sig = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(62), // Too short
        v: 27,
      }

      expect(() => validateSignatureComponents(sig)).toThrow()
    })

    it('should throw for invalid v value', () => {
      const sig = {
        r: '0x' + 'a'.repeat(64),
        s: '0x' + 'b'.repeat(64),
        v: 26, // Invalid
      }

      expect(() => validateSignatureComponents(sig)).toThrow()
    })
  })
})

// ============================================================================
// USDC Utilities
// ============================================================================

describe('USDC Utilities', () => {
  describe('parseUSDC', () => {
    it('should convert 1 USDC to 1000000', () => {
      expect(parseUSDC('1')).toBe(1000000n)
    })

    it('should convert 0.01 USDC to 10000', () => {
      expect(parseUSDC('0.01')).toBe(10000n)
    })

    it('should convert 1.50 USDC to 1500000', () => {
      expect(parseUSDC('1.50')).toBe(1500000n)
    })

    it('should handle number input', () => {
      expect(parseUSDC(1.5)).toBe(1500000n)
    })

    it('should handle very small amounts', () => {
      expect(parseUSDC('0.000001')).toBe(1n)
    })

    it('should handle zero', () => {
      expect(parseUSDC('0')).toBe(0n)
    })

    it('should handle large amounts', () => {
      expect(parseUSDC('1000000')).toBe(1000000000000n)
    })
  })

  describe('formatUSDC', () => {
    it('should convert 1000000 to 1', () => {
      expect(formatUSDC(1000000n)).toBe('1.00')
    })

    it('should convert 10000 to 0.01', () => {
      expect(formatUSDC(10000n)).toBe('0.01')
    })

    it('should convert 1500000 to 1.50', () => {
      expect(formatUSDC(1500000n)).toBe('1.50')
    })

    it('should handle zero', () => {
      expect(formatUSDC(0n)).toBe('0.00')
    })

    it('should handle number input', () => {
      expect(formatUSDC(1000000)).toBe('1.00')
    })

    it('should handle string input', () => {
      expect(formatUSDC('1000000')).toBe('1.00')
    })
  })

  describe('formatUSDCWithSymbol', () => {
    it('should include $ symbol prefix', () => {
      const formatted = formatUSDCWithSymbol(1000000n)
      expect(formatted).toContain('$')
      expect(formatted.startsWith('$')).toBe(true)
    })

    it('should format amount correctly', () => {
      const formatted = formatUSDCWithSymbol(1500000n)
      expect(formatted).toBe('$1.50')
    })

    it('should format 1 USDC correctly', () => {
      const formatted = formatUSDCWithSymbol(1000000n)
      expect(formatted).toBe('$1.00')
    })
  })
})

// ============================================================================
// Message Creation
// ============================================================================

describe('Message Creation', () => {
  describe('createTransferWithAuthorizationMessage', () => {
    const testFrom = '0x1111111111111111111111111111111111111111' as `0x${string}`
    const testTo = '0x2222222222222222222222222222222222222222' as `0x${string}`
    const testNonce = generateNonce()

    it('should create a valid message', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      expect(message).toBeDefined()
    })

    it('should include from address', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      expect(message.from).toBe(testFrom)
    })

    it('should include to address', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      expect(message.to).toBe(testTo)
    })

    it('should include value as string (for uint256 compatibility)', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      // Value is converted to string for uint256 compatibility
      expect(message.value).toBe('1000000')
    })

    it('should include nonce', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      expect(message.nonce).toBe(testNonce)
    })

    it('should set validAfter to "0" by default', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      // validAfter is returned as string for uint256 compatibility
      expect(message.validAfter).toBe('0')
    })

    it('should set validBefore to future time by default', () => {
      const now = Math.floor(Date.now() / 1000)
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
      })

      expect(Number(message.validBefore)).toBeGreaterThan(now)
    })

    it('should accept string value', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: '1000000',
        nonce: testNonce,
      })

      // String values are passed through as-is
      expect(message.value).toBe('1000000')
    })

    it('should accept number value', () => {
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000,
        nonce: testNonce,
      })

      // Number values are converted to string for uint256 compatibility
      expect(message.value).toBe('1000000')
    })

    it('should accept custom validAfter', () => {
      const customValidAfter = 1000n
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
        validAfter: customValidAfter,
      })

      // validAfter is returned as string
      expect(message.validAfter).toBe('1000')
    })

    it('should accept custom validBefore', () => {
      const customValidBefore = BigInt(Math.floor(Date.now() / 1000) + 7200)
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
        validBefore: customValidBefore,
      })

      // validBefore is returned as string
      expect(message.validBefore).toBe(customValidBefore.toString())
    })

    it('should accept validitySeconds option', () => {
      const now = Math.floor(Date.now() / 1000)
      const message = createTransferWithAuthorizationMessage({
        from: testFrom,
        to: testTo,
        value: 1000000n,
        nonce: testNonce,
        validitySeconds: 7200, // 2 hours
      })

      // Should be approximately now + 7200 seconds
      const validBefore = Number(message.validBefore)
      expect(validBefore).toBeGreaterThanOrEqual(now + 7190)
      expect(validBefore).toBeLessThanOrEqual(now + 7210)
    })
  })
})
