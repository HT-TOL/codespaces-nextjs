# Merge safety investigation — OCODEJS Codespaces

## Observed GitHub records

- PR #1 was merged at 2026-11-23 13:31:55 UTC. GitHub reports `merged_by.login = zskbot`.
- PR #2 was merged at 2026-11-23 13:34:36 UTC. GitHub reports `merged_by.login = zskbot`.
- Both PRs report `auto_merge = null`.
- Repository metadata reports `allow_auto_merge = false`.
- The repository rulesets endpoint returned an empty list.
- GitHub branch metadata explicitly reports `main.protected = false`.

## What this proves — and what it does not

The GitHub API attributes both merge operations to the repository owner's account, `zskbot`. The confirmed safety gap is that `main` has no branch protection and no repository rulesets, so GitHub enforces no pull-request approval gate on merges. The available records do not identify whether a person in the GitHub UI, a personal access token, or an integration acting as that account initiated them. Auto-merge is not the explanation shown by the API. The exact initiating client remains unverified.

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

The connected integration exposes read access to rulesets but no ruleset/branch-protection write action. A repository administrator must apply and verify the ruleset in GitHub Settings before PR creation resumes.

Repository settings: https://github.com/zskbot/codespaces-ocodejs/settings/branches
