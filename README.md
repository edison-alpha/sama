# Sama frontend

Next.js app for Sama: pairs share-token rebalances between wallets on BNB Chain.

## Setup

```bash
pnpm install
cp .env.example .env.local   # then set NEXT_PUBLIC_PRIVY_APP_ID
pnpm dev                     # http://localhost:3200
```

In the Privy dashboard, enable the Email and Wallet login methods, turn on EVM embedded wallets, and add your
origins (e.g. `http://localhost:3200`) to the allowed domains.

Token pages (`/markets/[symbol]`: chart, market cap, latest trades) read the backend's open `/api/market` routes in
both modes, so set `NEXT_PUBLIC_SAMA_API_URL` to a running `sama-backend` to see them, even in mock mode.

## Fonts

The UI uses Apple's **SF Pro Rounded** (`components/font/`), loaded through `next/font/local`. It is Apple's font and
subject to Apple's licence terms (https://developer.apple.com/fonts/).
