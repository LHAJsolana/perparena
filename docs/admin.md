# Demonstration Admin Control Center

PerpArena admin is a portfolio demonstration, not a secured production operations system.

## Protection Model

Phase 11 uses read-only demo mode by default.

Mutations are allowed only when:

- `NODE_ENV` is not `production`
- `PERPARENA_ADMIN_MUTATIONS=enabled`

All admin pages display:

> Demonstration administration environment.

When mutation mode is disabled, server actions return a clear failure message and do not write to the database.

## Supported Workflows

- Competition list
- Competition detail
- Draft competition creation
- Date configuration
- Supported-market selection
- Scoring-weight configuration
- Division configuration
- Quest configuration
- Competition-status changes
- Score recalculation
- Integrity-review queue
- Flag resolution, dismissal, or score-limitation confirmation
- Synthetic result export
- Configuration validation

## Scoring Weights

Scoring weights must be non-negative and total exactly 100:

- Performance
- Risk management
- Consistency
- Qualified activity
- Market diversity

Changing weights requires an explicit scoring version. The admin demo does not silently mutate historical leaderboard snapshots.

## Dates

Date validation requires:

- End after start
- UTC policy for interpretation
- Status transitions consistent with dates

## Export

The JSON export includes:

- Competition metadata
- Final rankings
- Component scores
- Integrity status
- Simulation disclaimer
- Scoring version

The export does not include secrets, connection strings, internal database IDs, or private keys.

## Limitations

This is not a production authorization system. Future phases would need authentication, authorization, audit trails, CSRF hardening beyond framework defaults, rate limits, and operational monitoring.
