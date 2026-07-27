# Security Policy

PerpArena is a portfolio prototype, not production financial infrastructure.

## Supported Version

Only the current `main` branch is maintained.

## Reporting Issues

Please report security concerns through GitHub issues or by contacting the
repository owner. Do not include secrets, private keys, passwords, tokens, or
complete connection strings in public reports.

## Scope

Relevant issues include:

- secret exposure
- unsafe admin mutation behavior
- public stack traces
- database URL leakage
- unsafe export data
- dependency vulnerabilities
- bypasses of production reset or seed safeguards

Out of scope:

- claims that PerpArena should execute real trades
- requests to add custody, deposits, or real rewards
- issues requiring fake live market data

## Current Limitations

- No full production authentication system.
- No distributed rate limiting.
- No production monitoring integration.
- Dependency audit advisories require careful upgrade work.
