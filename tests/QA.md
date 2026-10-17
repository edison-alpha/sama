# Verification record

Scope: the QA fixes following the documentation repair in `965d876`. Browser checks use local Chrome, mock data, and an isolated development fixture. This is not a claim of certification on every device or assistive technology.

## Changes and regression evidence

- Market range changes retain the matching label and ignore late successes and failures.
- Background polling waits for an outstanding request so slow responses can finish.
- Receive, Send, Convert BNB, Circle creation, reusable Sheet, activity detail, and docs dialogs contain keyboard focus, close with Escape, lock background scrolling, and restore their trigger.
- Transaction dialogs yield to the wallet SDK prompt and retain entered values.
- Portfolio actions wrap at narrow widths; the token grid also fits Indonesian currency formatting.
- Receive shows the full address across wrapped lines, with a usable copy button at 320 px.
- Landing statistics reflow on tablets, its carousel can receive keyboard focus, and its content has a main landmark.
- Shared semantic text/action colors have stronger light/dark contrast; zero balances retain readable text.
- Offline navigation returns a bilingual HTML recovery page that reloads the requested URL.
- Proof uses absolute configured server URLs, reports unavailable evidence, and derives explorer URLs from the evidence chain.
- Settings reports load/save failures and prevents overlapping saves.
- Read-only assistant examples expose document content rather than an unnamed textbox.

## Execution

Verified on 2026-10-17 with macOS, Node.js 24, and local Chrome. The main browser run passed 24 tests, including the six-width matrix and seven Axe audits. The initial polling assertion was corrected to account for React development Strict Mode repeating its mount effect; its focused rerun passed. All 25 distinct browser regressions are verified (24 in the main run, 1 in the focused rerun). Unit tests: 3 passed. The final production build and TypeScript check passed. Commands:

```sh
pnpm test:unit
pnpm build
PLAYWRIGHT_CHANNEL=chrome pnpm exec playwright test
PLAYWRIGHT_CHANNEL=chrome pnpm exec playwright test --grep "slow polling"
pnpm exec tsc --noEmit
git diff --check
```

The browser suite checks nine routes at 320, 390, 768, 1024, 1280, and 1440 px; additional EN/ID portfolio and Receive checks run at 320 px. Automated WCAG A/AA audits cover portfolio, settings, and circles in light/dark themes, plus the Receive dialog. Docs keyboard tests cover menu open/close and search navigation. Layout checks compare document width with viewport width. Manual screenshot review covered the 320 px Indonesian portfolio and Receive dialog, the 320 px docs menu, 1440 px docs frame, and 768 px landing statistics.

## Antislop delivery gate

Direction: retain Sama's existing coral accent, typographic hierarchy, rounded controls, and documentation frame. Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. The gate below applies to the changed interface and recorded interactions.

### Hard gate

- R-02 PASS: new status and recovery copy contains no em dash.
- R-03 PASS: 54 route/viewport checks fit 320–1440 px; EN/ID portfolio and full-address Receive checks fit 320 px.
- R-17 PASS: no statistics added; existing protocol statistics retained.
- R-18 PASS: no testimonials added.
- R-23 PASS: existing logos, avatar system, and navigation retained.
- R-24 PASS: docs search reaches the matching documentation page; reload and Proof retry have real destinations.
- R-25 PASS: automated light/dark audits pass on the changed solid surfaces; the contrast checker measured secondary text at 5.30:1 on the light app surface and 8.35:1 on dark. Layered illustration scenes are outside this contrast claim.
- R-26 PASS: dialog triggers open, Escape closes, settings errors expose Retry, and offline reload navigates.
- R-27 PASS: market loading, settings failure, and unavailable Proof states have visible feedback.
- R-28 PASS: no FAQ added or changed.
- R-32 PASS: recorded Tab containment, Escape dismissal, and trigger restoration checks pass for shared dialogs.
- R-33 PASS: behavior and styles are implemented in repository source; no runtime patch or external injection.
- R-34 PASS: portfolio, settings, and circles audits pass in both themes.
- R-35 PASS: final production build/typecheck passed; 24 browser tests passed together and the corrected polling test passed its focused rerun.
- R-36 PASS: no new security, performance, or customer claims.
- R-37 PASS: direction and dials retain the existing Sama identity described above.
- R-38 PASS: no marketing content fabricated; fixtures are isolated mock test data and return 404 in production.

### Purpose gate

- R-01 PASS: no new gradient or glow introduced.
- R-04 PASS: existing close, copy, and transaction icons keep their control-specific meaning.
- R-06 PASS: existing fonts retained; amounts retain tabular figures.
- R-07 PASS: no decorative grid added.
- R-08 PASS: no decorative arrows added.
- R-09 PASS: no new promotional badge added.
- R-10 PASS: no additional glass surface introduced; native backdrop separates the active modal.
- R-12 PASS: existing modal elevation retained for foreground separation.
- R-13 PASS: no new glow introduced.
- R-14 PASS: no feature cards added; statistics reflow according to available width.
- R-19 PASS: existing transitions retained; tests run with reduced motion enabled.
- R-22 PASS: no illustration added.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 1 / MOTION 1 explicitly retained.
- Consistency PASS: repairs add no ornamental motion or new page composition.
- Focal point PASS: portfolio total, dialog title, and docs heading remain the primary anchors in reviewed screenshots.
- Whitespace PASS: stacked actions and statistics use spacing to separate content at narrow widths.
- Accent PASS: coral identifies primary controls and selected navigation, with semantic colors reserved for status.
- Motif PASS: rounded controls and Sama's existing type and avatar system remain consistent.
- Design read PASS: preserve the existing interface while correcting layout and interaction defects.

### Craftsmanship and quality locks

- C-1 PASS: grid changes prevent intrinsic-width overflow; contrast changes improve legibility; the dialog primitive provides inert backgrounds.
- C-2 PASS: changed controls have recorded open, close, navigation, retry, or copy behavior.
- C-3 PASS: no decorative or filler section added.
- C-4 PASS: six-width matrix, light/dark audits, Shift+Tab/Tab/Escape, clipboard, offline recovery, and delayed API scenarios passed.
- C-5 PASS: no testimonial, statistic, or claim invented.
- R-05 PASS: existing content composition retained.
- R-11 PASS: existing button, field, panel, and table radius differences retained.
- R-15 PASS: new recovery actions explicitly say Retry or Reload.
- R-16 PASS: no marketing buzzwords added.
- R-20 PASS: existing Sama identity retained.
- R-21 PASS: system/light/dark preference behavior retained.
- R-29 PASS: semantic palette adjusted within the existing color roles.
- R-30 PASS: no replacement design or external product clone introduced.
- R-31 PASS: each visual change has a concrete layout, contrast, or interaction reason recorded above.

## Remaining integration checks

Real Privy prompts, transaction rejection, network switching, insufficient gas, and live backend behavior still require staging credentials and test wallets. Physical devices, Safari/Firefox, and screen-reader sessions were not exercised. Automated contrast analysis of layered scenes is not a substitute for manual contrast measurement.

The GitHub Actions job is supplied in `qa-workflow.example.yml`. It is not active: the available push credential lacks the OAuth `workflow` scope needed to create workflow files.
