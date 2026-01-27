import { readFileSync } from 'fs';

const API_URL = 'http://localhost:3001';

async function testPayment() {
  console.log('\n🎮 Testing x402 Payment Flow\n');

  // Step 1: Get payment requirements (402 response)
  console.log('Step 1: Request game without payment...');
  const step1 = await fetch(`${API_URL}/api/v1/play/snake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  console.log(`Status: ${step1.status} (expecting 402)`);
  const paymentReq = await step1.json();
  console.log('Payment required:', JSON.stringify(paymentReq, null, 2).substring(0, 300) + '...\n');

  // Step 2: Load test authorization data
  console.log('Step 2: Load test authorization...');
  const authData = JSON.parse(readFileSync('/tmp/test_facilitator.json', 'utf8'));
  console.log('Authorization loaded:', JSON.stringify(authData, null, 2).substring(0, 200) + '...\n');

  // Step 3: Create X-Payment header (proper format)
  console.log('Step 3: Creating X-Payment header...');

  // Combine v, r, s into single signature
  const v = authData.authorization.v.toString(16).padStart(2, '0');
  const r = authData.authorization.r.slice(2);
  const s = authData.authorization.s.slice(2);
  const signature = `0x${r}${s}${v}`;

  const paymentHeader = {
    x402Version: '1',
    scheme: 'exact',
    network: 'cronos-testnet',
    payload: {
      from: authData.authorization.from,
      to: authData.authorization.to,
      value: authData.authorization.value,
      validAfter: authData.authorization.validAfter,
      validBefore: authData.authorization.validBefore,
      nonce: authData.authorization.nonce,
      signature: signature,
      asset: authData.tokenAddress
    }
  };

  const base64Payment = Buffer.from(JSON.stringify(paymentHeader)).toString('base64');
  console.log('X-Payment header created (base64 length):', base64Payment.length);
  console.log('X-Payment header:', JSON.stringify(paymentHeader, null, 2).substring(0, 250) + '...\n');

  // Step 4: Send payment
  console.log('Step 4: Sending payment to backend...');
  const step4 = await fetch(`${API_URL}/api/v1/play/snake`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': base64Payment
    }
  });

  console.log(`Response status: ${step4.status}`);
  const responseText = await step4.text();
  console.log('Response body:');
  try {
    const json = JSON.parse(responseText);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(responseText.substring(0, 500));
  }

  if (step4.status === 200 || step4.status === 201) {
    console.log('\n✅ ✅ ✅  PAYMENT SUCCESSFUL! ✅ ✅ ✅');
    console.log('Game session created successfully!');
  } else {
    console.log('\n❌ PAYMENT FAILED!');
    console.log('Check backend logs for details');
  }
}

testPayment().catch(console.error);
