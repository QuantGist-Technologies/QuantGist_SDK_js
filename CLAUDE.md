# CLAUDE.md — quantgist-js

**Layer:** L1 Open Source · **Tentpole:** T2 SDK  
**npm package name:** `quantgist-js`  
**Target:** Node 20+, browser-compatible (no Node-only APIs in core)

---

## Purpose

Official TypeScript/JavaScript SDK for the QuantGist API. Used by dashboard builders, Discord/Telegram bots, Next.js apps, and NestJS backends. Companion to `quantgist-python`.

## Aha moment
> "I'm rendering live macro events in my React dashboard in under 10 minutes."

---

## Commands

```bash
pnpm install          # install deps
pnpm build            # tsup — outputs CJS + ESM to dist/
pnpm test             # vitest
pnpm lint             # eslint + prettier check
pnpm typecheck        # tsc --noEmit
```

## Package structure

```
quantgist-js/
├── src/
│   ├── index.ts          # re-exports everything public
│   ├── client.ts         # QuantGistClient class
│   ├── types.ts          # TypeScript interfaces matching API schema
│   ├── errors.ts         # QuantGistError hierarchy
│   └── utils.ts          # url building, header helpers
├── examples/
│   ├── node-quickstart.ts
│   ├── next-dashboard/   # minimal Next.js example
│   └── discord-bot/      # minimal Discord.js example
├── tests/
│   └── client.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## API conventions

- Base URL: configurable, defaults to `https://api.quantgist.com/v1`
- Auth: `X-API-Key` header
- Client reads key from `QUANTGIST_API_KEY` env var, or passed as constructor arg
- All methods return typed interfaces — never `any`
- Uses `fetch` (native) — no axios. Polyfill not bundled (consumers handle it)
- Responses are typed, errors throw `QuantGistError` subclasses

## Build rules

- Dual CJS + ESM output via `tsup`
- Export `types` field in `package.json` pointing to `.d.ts`
- Zero runtime dependencies — `fetch` only
- `"sideEffects": false` in `package.json`
- Tree-shakeable — each resource (events, calendar, webhooks) is a separate import

---

## Publishing

```bash
pnpm build
pnpm publish --access public
```
