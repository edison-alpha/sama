# Frontend regression tests

Use Node.js 24 for the test runner.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium
pnpm test:unit
pnpm test:e2e
```

To use an installed Chrome instead of downloading Chromium:

```sh
PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
```

The browser suite builds the production app, then starts two localhost servers:
production on 43200 for public pages, offline behavior, and production access checks;
development on 43210 for isolated component tests with mock portfolio data and a mock signer.

The `/qa-fixture/[screen]/[symbol]` fixture only responds when `NODE_ENV=development`,
`SAMA_QA_FIXTURE=1`, and API mode is mock. It supplies a session only to the fixture
component tree. It does not bypass login on application routes. The suite checks
that production returns 404 for the fixture and still redirects signed-out app users.
The test server does not use real accounts, secrets, or blockchain transactions.

Covered regressions include out-of-order market responses, slow polling, keyboard focus and Escape
in wallet/Circle/Sheet dialogs, EN/ID mobile portfolio layout, tablet statistics,
offline recovery, evidence-specific explorer URLs, settings failures, six responsive
widths (320–1440 px), and accessibility
on light/dark solid surfaces. Axe findings on layered scenes still need manual review.

`qa-workflow.example.yml` contains the GitHub Actions job for these checks. Copy it to
`.github/workflows/qa.yml` when using credentials allowed to create workflows. The
credentials available during this change have repository access without the OAuth
`workflow` scope, so this template is not activated automatically.

Before releasing transaction changes, also verify rejected signatures, network switches,
insufficient gas, and backend failures against a staging backend and test wallets.
