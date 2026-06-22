# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm test           # run unit tests with Vitest
ng generate component features/foo/bar   # scaffold component (tests skipped by default)
```

## Architecture

Single-page Angular 21 app with no routing. The entire UI is one view: `DashboardComponent`.

**Data flow:**
1. On init, `DashboardComponent` calls `CryptoService.loadTopCoins()`.
2. The service fetches the top 25 coins by market cap from the CoinGecko REST API, filters out stablecoins and wrapped tokens (`SKIP_IDS`), and keeps the top 10.
3. After the REST response, the service opens a Binance WebSocket (`wss://stream.binance.com`) subscribing to `<symbol>usdt@ticker` streams for each coin's live price updates.
4. All state (`coins`, `connected`, `loading`, `error`, `lastUpdated`) is held as Angular signals on `CryptoService` and consumed reactively in templates.

**Key patterns:**
- `CryptoService` is `providedIn: 'root'` and owns the full WebSocket lifecycle including 2-second auto-reconnect. It implements `OnDestroy` to clean up.
- `CoinRowComponent` uses an **attribute selector** (`[app-coin-row]`) so it renders as a `<tr>` element rather than a wrapper tag. It uses `effect()` in the constructor to detect price direction changes and drives a 700ms CSS flash signal (`up`/`down`).
- `livePrice`/`change24h` on each `Coin` start as `null` and are populated by WebSocket updates; components fall back to the CoinGecko snapshot values until then.
- `ng generate` schematics are configured with `skipTests: true` for all artifact types — do not add `--skip-tests` manually.
- Styles use SCSS; component styles are scoped, global styles are in `src/styles.scss`.

## Git conventions

- Squash all commits into a single commit before pushing to `main`.
- Never add Claude as a co-author (`Co-Authored-By:` trailer) in commit messages.
- Branch naming: `AI-DEMO-{issueNumber}-{author}` — e.g. `AI-DEMO-1-phaletski`
- PR title format: `[AI-DEMO] Short description` — e.g. `[AI-DEMO] Add light theme support`
