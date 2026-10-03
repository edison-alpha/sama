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

The UI uses Apple's **SF Pro Rounded**, which Apple's licence does not allow us to redistribute, so the font files are
not in this repository. Download SF Pro from https://developer.apple.com/fonts/ and place these files in
`components/font/` before building:

`SF-Pro-Rounded-Light.otf`, `SF-Pro-Rounded-Regular.otf`, `SF-Pro-Rounded-Medium.otf`, `SF-Pro-Rounded-Semibold.otf`,
`SF-Pro-Rounded-Bold.otf`, `SF-Pro-Rounded-Heavy.otf`
