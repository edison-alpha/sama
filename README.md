# Sama frontend

Next.js app for Sama: rebalance together on BNB Chain, trade only the difference.

## Setup

```bash
pnpm install
cp .env.example .env.local   # then set NEXT_PUBLIC_PRIVY_APP_ID
pnpm dev                     # http://localhost:3200
```

In the Privy dashboard, enable the Email and Wallet login methods, turn on EVM embedded wallets, and add your
origins (e.g. `http://localhost:3200`) to the allowed domains.

## Fonts

The UI uses Apple's **SF Pro Rounded** (`components/font/`), loaded through `next/font/local`. It is Apple's font and
subject to Apple's licence terms (https://developer.apple.com/fonts/).
