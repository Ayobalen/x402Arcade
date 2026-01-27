#!/bin/bash
# Script to set all environment variables for x402arcade-api

cd /Users/mujeeb/projects/x402Arcade/packages/backend

# Function to add env var
add_env() {
  local key=$1
  local value=$2
  echo "$value" | vercel env add "$key" production --yes 2>/dev/null || echo "Skipped $key (may already exist)"
}

echo "Setting environment variables for x402arcade-api..."

add_env "PORT" "3001"
add_env "HOST" "0.0.0.0"
add_env "CORS_ORIGIN" "https://x402arcade.vercel.app"
add_env "REDIS_URL" "redis://default:1uJB3FzxjLmNVrmZevhj39dj6ehLz0vh@redis-13361.c57.us-east-1-4.ec2.cloud.redislabs.com:13361"
add_env "JWT_SECRET" "dev_secret_key_at_least_32_characters_long_for_testing"
add_env "CHAIN_ID" "338"
add_env "RPC_URL" "https://evm-t3.cronos.org/"
add_env "EXPLORER_URL" "https://explorer.cronos.org/testnet"
add_env "USDC_CONTRACT_ADDRESS" "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
add_env "USDC_DECIMALS" "6"
add_env "USDC_DOMAIN_VERSION" "1"
add_env "ARCADE_WALLET_ADDRESS" "0xadc87b0a9d300ef1bad6e46f276c552c15aa5386"
add_env "FACILITATOR_URL" "https://facilitator.cronoslabs.org"
add_env "SNAKE_PRICE_USDC" "0.01"
add_env "TETRIS_PRICE_USDC" "0.02"
add_env "PRIZE_POOL_PERCENTAGE" "70"
add_env "SESSION_EXPIRY_MINUTES" "30"
add_env "RATE_LIMIT_ENABLED" "false"
add_env "RATE_LIMIT_MAX_REQUESTS" "100"
add_env "RATE_LIMIT_WINDOW_MS" "900000"

echo "Done! All environment variables set."
