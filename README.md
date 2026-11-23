# OCODEJS Codespaces

OCodeJS-branded cloud development workspace with a Hybrid provider strategy.

## Implemented foundation

- Firebase Google sign-in client using the existing public OCodeJS Firebase project configuration.
- Server-side Firebase ID token verification with Google JWKS (jose).
- Workspace list/detail/create API scoped by Firebase-authenticated membership; roles are owner, editor, and viewer. Owner identity comes only from the verified Firebase token.
- PostgreSQL schema for workspaces, durable jobs, and audit events.
- Durable queue primitives: idempotent enqueue, atomic SKIP LOCKED claim, worker leases, lease extension, bounded retry/backoff, dead-letter state, cancellation request, and expired-lease recovery.
- GitHub Codespaces hand-off adapter. It creates a launch URL only; it does not provision a Codespace.

## Run locally

    npm install
    cp .env.example .env.local
    npm run dev

Firebase client values are public app configuration, not server secrets. The existing OCodeJS Firebase project is used by default; override with NEXT_PUBLIC_FIREBASE_* values when needed. Add the actual Preview hostname to Firebase Authentication's authorized domains and enable Google as a sign-in provider before testing OAuth redirects.

For PostgreSQL, set DATABASE_URL in the server environment and apply the schema:

    npm run migrate

The migration is additive and uses CREATE TABLE IF NOT EXISTS. No database is provisioned or modified automatically.

## API

- GET /api/platform — capability status.
- GET /api/session — verifies the Bearer Firebase ID token.
- GET /api/v1/workspaces — lists only the caller's workspaces.
- POST /api/v1/workspaces — creates an owner-scoped hand-off record. Requires an Idempotency-Key header and JSON { repository, ref, template }.
- GET /api/v1/workspaces/:id — returns a workspace only to its members.
- GET /api/v1/workspaces/:id/members — lists member UIDs and roles for workspace members.
- POST /api/v1/workspaces/:id/members — owner-only role assignment to a Firebase UID (editor or viewer); the API does not resolve or verify the target account, and access is granted only when a signed-in UID matches.

All workspace APIs fail closed when Firebase verification or PostgreSQL is unavailable. A successful hand-off response is not proof that GitHub created a Codespace.

## Verification

    npm test
    npm run build

The CI workflow runs tests and a Next.js build on pull requests targeting main. It is not triggered by feature-branch pushes. No production deployment, DNS change, paid compute, or credential provisioning is part of this work.

## Merge safety

See [merge safety investigation](docs/merge-safety.md). PR #3 remains unopened until the main-branch ruleset is applied and verified.

## Security boundaries

The independent OCodeJS container runtime remains disabled. Do not execute user code until non-root isolation, resource quotas, default-deny networking, secret redaction, cross-tenant isolation, cancellation, recovery, and container escape tests pass.
