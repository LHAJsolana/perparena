# PerpArena Security and Production Hardening

PerpArena is a public portfolio prototype, not a production exchange, broker,
custodian, or financial service.

## Environment

- `DATABASE_URL` must be PostgreSQL.
- Production readiness treats `DATABASE_URL` as required.
- `NEXT_PUBLIC_APP_URL` is the only public URL-like variable.
- `.env` and `.env*.local` are ignored by Git.
- `.env.example` contains placeholders only.
- Production is deployed on Vercel with `DATABASE_URL` stored as an encrypted
  server-side variable and `NEXT_PUBLIC_APP_URL` set to
  `https://perparena.vercel.app`.

## Admin Safety

Admin routes are a demonstration administration environment. Mutating server
actions are disabled in production and disabled by default elsewhere.

Development mutation mode requires:

```bash
PERPARENA_ADMIN_MUTATIONS=enabled
```

The public demo recalculation API also supports an optional
`PERPARENA_ADMIN_TOKEN`; when configured, callers must send it in
`x-perparena-admin-token`.

This is not a complete authentication system.

## Database Safety

- PostgreSQL is the only supported persistence target.
- There is no file, memory, SQLite, or mock fallback.
- Seeding is explicit through `npm run db:seed`.
- Migrations are separate from seed execution.
- `simulation:reset` refuses to run with `NODE_ENV=production`.

## Headers

The Next.js configuration sets baseline browser hardening headers:

- `Content-Security-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Permissions-Policy`

HSTS is not configured in the application because HTTPS enforcement depends on
the hosting platform.

## Error Handling

Public route handlers return consistent JSON error shapes and do not expose
stack traces or connection strings. The application error boundary avoids
rendering raw exception messages.

## Known Limits

- No distributed rate limiting is configured.
- No production monitoring integration is configured.
- The CSP allows inline styles/scripts needed by the current Next.js prototype.
- Admin controls are safe for portfolio demonstration, not production
  operations.
- `npm audit --audit-level=high` reports remaining transitive
  ESLint/minimatch/brace-expansion and Next.js/PostCSS advisories. The available
  automated fixes require breaking ecosystem changes; no critical advisories
  remain.
