/**
 * Tests for chain constants module
 */

import { chainConstants } from '../../../../src/lib/chain/constants.js';

describe('Chain Constants', () => {
  it('should export chainConstants object', () => {
    expect(chainConstants).toBeDefined();
    expect(typeof chainConstants).toBe('object');
  });

  it('should be importable as default export', async () => {
    const module = await import('../../../../src/lib/chain/constants.js');
    expect(module.default).toBeDefined();
    expect(module.default).toBe(chainConstants);
  });

  it('should be importable from index', async () => {
    const module = await import('../../../../src/lib/chain/index.js');
    expect(module.chainConstants).toBeDefined();
    expect(module.chainConstants).toBe(chainConstants);
  });

  it('should be an empty object (placeholder)', () => {
    expect(Object.keys(chainConstants)).toEqual([]);
  });
});
