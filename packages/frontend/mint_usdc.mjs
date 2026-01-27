import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { cronosTestnet } from 'viem/chains';

const USDC_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';
const PRIVATE_KEY = '0x09c11b27d8b72e33e4b2ec0093a0f54df7bc3c3eb6ef2f33e93d48d8d7b4a36d';

const publicClient = createPublicClient({
  chain: cronosTestnet,
  transport: http()
});

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: cronosTestnet,
  transport: http()
});

async function mintUSDC() {
  console.log('Wallet address:', account.address);
  console.log('USDC contract:', USDC_ADDRESS);
  console.log('');

  // Check current balance
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log('Current USDC balance:', (Number(balance) / 1e6).toFixed(6), 'USDC');
  } catch (e) {
    console.log('Could not read balance:', e.message);
  }

  console.log('');
  console.log('Attempting to mint USDC...');
  console.log('');

  // Try common faucet/mint function names
  const mintFunctions = [
    { name: 'mint', args: [account.address, 100000000n] }, // 100 USDC
    { name: 'faucet', args: [] },
    { name: 'drip', args: [] },
    { name: 'claim', args: [] },
    { name: 'mint', args: [100000000n] }, // Different signature
  ];

  for (const fn of mintFunctions) {
    try {
      console.log(`Trying ${fn.name}(${fn.args.join(', ')})...`);

      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: parseAbi([`function ${fn.name}(${fn.args.length === 2 ? 'address,uint256' : fn.args.length === 1 && typeof fn.args[0] === 'bigint' ? 'uint256' : ''})`]),
        functionName: fn.name,
        args: fn.args
      });

      console.log('✅ Transaction sent:', hash);
      console.log('Waiting for confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Confirmed in block:', receipt.blockNumber);

      // Check new balance
      const newBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [account.address]
      });
      console.log('New USDC balance:', (Number(newBalance) / 1e6).toFixed(6), 'USDC');
      return;
    } catch (e) {
      console.log('❌ Failed:', e.message.split('\n')[0]);
    }
  }

  console.log('');
  console.log('Could not mint USDC automatically.');
  console.log('The contract may not have a public mint function.');
}

mintUSDC().catch(console.error);
