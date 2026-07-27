# Contributing

Thanks for taking an interest in PerpArena.

PerpArena is a simulated portfolio prototype. Contributions must preserve the
core safety boundaries:

- no real trade execution
- no custody
- no deposits
- no real rewards
- no fake live-market claims
- no financial advice
- no conclusive fraud-detection claims
- no copied protocol branding or proprietary implementation

## Development

```bash
npm install
npm run db:generate
npm run dev
```

Before opening a pull request, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Run Playwright when changing user flows:

```bash
npm run test:e2e
```

## Documentation

Update docs when changing:

- analytics formulas
- scoring rules
- integrity heuristics
- database schema
- API boundaries
- deployment requirements

## Pull Request Expectations

- Keep changes focused.
- Add meaningful tests for behavior changes.
- Do not commit secrets or `.env` files.
- Document limitations honestly.
