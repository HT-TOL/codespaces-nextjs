# Merge safety investigation — OCODEJS Codespaces

## Observed GitHub records

- PR #1 was merged at 2026-11-23 13:31:55 UTC. GitHub reports `merged_by.login = zskbot`.
- PR #2 was merged at 2026-11-23 13:34:36 UTC. GitHub reports `merged_by.login = zskbot`.
- Both PRs report `auto_merge = null`.
- Repository metadata reports `allow_auto_merge = false`.
- The repository rulesets endpoint returned an empty list.
- The branch-protection endpoint returned HTTP 403 to the connected GitHub integration. Therefore the effective protection state of `main` could not be verified.

## What this proves — and what it does not

The GitHub API attributes both merge operations to the repository owner's account, `zskbot`. The available records do not identify whether the action came from a person in the GitHub UI, a personal access token, or an integration acting as that account. Auto-merge is not the explanation shown by the API. The precise initiating mechanism remains unverified.

## Current safeguard

- Do not open PR #3 yet.
- Continue only on `feat/ocodejs-codespaces-firebase-session`.
- Do not call merge, update-PR, close-PR, or base-branch mutation operations.
- CI is pull-request-only, so feature pushes do not repeatedly request runners while runner availability is unresolved.
- Do not claim CI success when the run has no runner steps or logs.

## Required repository-side control

Before creating another PR, configure a main-branch ruleset that:
1. Requires pull requests.
2. Requires at least one approval from a reviewer other than the author.
3. Requires the CI status checks.
4. Dismisses stale approvals after new commits.
5. Blocks force pushes and branch deletion.
6. Does not grant bypass to the repository owner or automation identities for the protected rules.

The connected integration cannot currently write or verify branch-protection settings. A repository administrator must apply and verify the ruleset in GitHub Settings before PR creation resumes.
