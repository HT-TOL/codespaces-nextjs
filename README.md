# OCODEJS Codespaces

OCodeJS-branded cloud development workspace with a Hybrid provider strategy.

## Current phase

The branded Next.js dashboard is available. The dashboard hands users off to
GitHub Codespaces, but it does **not** yet create or manage Codespaces through
the API. The independent OCodeJS container runtime is disabled and not
provisioned.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Platform status

`GET /api/platform` reports implemented capabilities. It does not expose
credentials and does not claim provider connectivity or workspace readiness.

## Architecture

See [Hybrid Architecture](docs/architecture/hybrid.md) and the draft
[Control API contract](docs/api/openapi.yaml).

## Security and rollout

Do not enable workspace execution until identity, ownership checks, durable
queue semantics, resource quotas, default-deny networking, secret handling,
tenant isolation, cancellation, recovery, and container escape tests are
implemented and verified.

No production deployment, DNS change, paid compute, or credential setup is
part of this PR.
