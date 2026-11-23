# OCODEJS Codespaces — Hybrid Architecture

## Status

Design and integration foundation only. This repository does not yet provision workspaces or operate an independent container runtime.

## Product boundary

OCODEJS Codespaces owns:
- Branded web workspace and developer experience.
- Workspace Control API and provider abstraction.
- Workspace metadata, lifecycle state, policy enforcement, audit events, and provider routing.
- Future isolated runtime orchestration and preview gateway.

Initial provider:
- GitHub Codespaces remains the actual compute provider.
- The first integration is an explicit hand-off to GitHub Codespaces.
- No GitHub OAuth, GitHub App, PAT, or Codespaces API credentials are assumed to exist.
- The UI must not claim a workspace is running or GitHub is connected unless verified by a real provider response.

Future provider:
- An independently operated, isolated container runtime may be added behind the same provider interface.
- It is disabled until isolation, queue durability, resource quotas, network policy, recovery, and abuse controls pass security tests.

## Logical architecture

Browser / OCodeJS Web IDE
  -> OCodeJS Workspace Control API
      -> Authentication and authorization
      -> Workspace metadata store
      -> Durable job queue
      -> Provider adapter
          -> GitHub Codespaces adapter (initial hand-off)
          -> OCodeJS isolated runtime adapter (future, disabled)
      -> Audit and telemetry

## Provider contract

Every provider adapter must expose:
- capabilities(): report supported operations without claiming readiness.
- createWorkspace(input, principal): create or request a workspace.
- getWorkspace(providerWorkspaceId, principal): fetch authoritative state.
- stopWorkspace(providerWorkspaceId, principal): stop a workspace.
- deleteWorkspace(providerWorkspaceId, principal): delete a workspace.
- getConnection(providerWorkspaceId, principal): return a short-lived connection or launch URL.

The control plane must validate principal ownership on every operation. Provider identifiers are opaque and never treated as authorization.

## Lifecycle

requested -> queued -> provisioning -> running -> stopping -> stopped
                         |                    |
                         +-> failed            +-> deleted

Only provider-confirmed transitions may enter running or stopped. Requests are idempotent and carry an idempotency key. Queue claims require leases; expired leases are recoverable. Retries use bounded exponential backoff and a dead-letter state.

## Security requirements

- No privileged containers and no Docker socket mounts.
- One isolated workspace per execution boundary; never share writable workspace volumes across tenants.
- Non-root runtime user, read-only base filesystem where practical, bounded writable volumes.
- CPU, memory, process, disk, wall-clock, and concurrency quotas.
- Default-deny network egress with explicit allowlists; block cloud metadata endpoints and internal control-plane ranges.
- Secrets are injected at runtime, never written to images, logs, source, or workspace metadata.
- Short-lived scoped credentials; redact tokens and environment values from logs.
- Enforce authorization at the control plane and provider boundary.
- Audit create, start, stop, delete, credential, and policy events.
- Cancellation and timeout must terminate the complete process/container boundary.
- No production workloads until escape-boundary and cross-tenant tests pass.

## Data model (logical)

Workspace:
- id, owner_id, repository, ref, provider, provider_workspace_id
- lifecycle_state, requested_template, region, resource_profile
- created_at, updated_at, expires_at, last_activity_at

WorkspaceJob:
- id, workspace_id, operation, idempotency_key
- state, attempt, lease_owner, lease_expires_at
- requested_at, started_at, finished_at, error_code

AuditEvent:
- id, actor_id, workspace_id, action, outcome, timestamp
- request_id, redacted_metadata

Persist metadata and queue state in a durable transactional store before enabling provisioning. Do not use process memory as the source of truth.

## API outline (versioned)

- GET /api/platform — safe capability and integration status.
- POST /api/v1/workspaces — request workspace creation (not enabled in this UI-only phase).
- GET /api/v1/workspaces — list only caller-owned workspaces.
- GET /api/v1/workspaces/:id — fetch caller-owned workspace.
- POST /api/v1/workspaces/:id/stop — request stop.
- DELETE /api/v1/workspaces/:id — request deletion.
- GET /api/v1/workspaces/:id/events — authorized lifecycle events.

All mutating endpoints require authenticated identity, CSRF protection where cookie sessions are used, schema validation, rate limits, idempotency, audit records, and ownership checks.

## Rollout gates

1. Branded dashboard and truthful capability status.
2. Authentication and GitHub identity verification.
3. Provider adapter integration with least-privilege credentials.
4. Durable metadata store, queue, leases, retries, cancellation, and recovery.
5. Isolated runtime and security test suite.
6. Preview gateway, quotas, observability, and abuse response.
7. Controlled staging pilot. Production requires a separate explicit approval.

## Current non-goals

No runtime provisioning, terminal execution, filesystem service, port proxy, persistent database, OAuth setup, DNS changes, paid compute, or production deployment is performed by this PR.
