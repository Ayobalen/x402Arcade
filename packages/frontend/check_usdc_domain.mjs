import { createPublicClient, http } from 'viem';
import { cronosTestnet } from 'viem/chains';

const USDC_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

const client = createPublicClient({
  chain: cronosTestnet,
  transport: http()
});

async function checkUsdcDomain() {
  console.log('Querying USDC contract:', USDC_ADDRESS);
  console.log('');

  try {
    // Query name()
    const name = await client.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }]
      }],
      functionName: 'name'
    });

    console.log('Contract name():', name);

    // Query version() for EIP-712
    const version = await client.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'version',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }]
      }],
      functionName: 'version'
    });

    console.log('Contract version():', version);

    // Query symbol() for reference
    const symbol = await client.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }]
      }],
      functionName: 'symbol'
    });

    console.log('Contract symbol():', symbol);
    console.log('');
    console.log('=== EIP-712 Domain Parameters ===');
    console.log(`name: '${name}'`);
    console.log(`version: '${version}'`);
    console.log(`chainId: 338`);
    console.log(`verifyingContract: '${USDC_ADDRESS}'`);

  } catch (error) {
    console.error('Error querying contract:', error.message);
  }
}

checkUsdcDomain();
