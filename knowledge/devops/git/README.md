# Git

## Core concepts

- Git records project history as commits. A branch is a movable reference to a
  commit; the working tree and staging area are separate from committed history.
- `merge` joins histories and can retain a merge commit. `rebase` replays a
  branch's commits on a new base, producing new commit IDs. Rebase is useful for
  a private feature branch, but rewriting a shared/published branch requires
  explicit team coordination because collaborators' history changes.
- A pull request is a review and policy boundary, not a replacement for Git
  itself. Protect the main branch with required checks/review and use a small,
  traceable change set.
- A release should identify an immutable commit SHA and artifact digest. A
  branch name or mutable tag alone is not sufficient deployment evidence.

## Safe operational workflow

1. Inspect before changing history: `git status`, `git log --oneline --graph`,
   and `git diff` establish the branch, uncommitted work, and intended change.
2. Fetch remote state before integrating: `git fetch --prune`, then compare the
   intended range. Resolve a conflict from the affected code and tests, not by
   mechanically choosing one side.
3. Before a destructive recovery, preserve a reference or use a new branch.
   `git reflog` can identify prior local HEAD positions, but recovery must be
   reviewed before force-pushing or changing a protected branch.
4. Use `--force-with-lease`, not blind `--force`, when a coordinated rewrite of
   a remote feature branch is genuinely required. It still needs confirmation
   that no collaborator's work will be overwritten.

## Interview answer points

- **Merge vs rebase:** merge preserves the topology of two histories; rebase
  creates equivalent new commits on another base. Prefer the team's documented
  policy; do not rebase public/shared work without coordination.
- **Reset vs revert:** reset moves a local reference and can discard local work;
  revert creates a new commit that undoes an earlier change. For an already
  shared production branch, a reviewed revert is usually safer and auditable.
- **`fetch` vs `pull`:** fetch obtains remote refs without integrating them;
  pull also integrates according to configured merge/rebase behavior. Inspect
  first when a release branch or incident is involved.
- **Cherry-pick:** it applies a selected commit's patch onto another branch. It
  is useful for a controlled hotfix, but can duplicate history and needs tests,
  conflict review, and traceability to the original change.

## Practical interview scenarios

### A bad change is already merged into the release branch

- **Inspect:** identify the deployed commit/artifact and whether the change is
  causal; check dependencies and database compatibility before changing history.
- **Act:** create a reviewed `git revert` for the offending shared commit, then
  deploy the known-good immutable artifact through the normal release path. Do
  not reset and force-push a protected release branch during an incident.
- **Verify:** confirm the new commit is present, the intended digest is running,
  the user-facing SLI recovered, and the follow-up release plan addresses the
  original regression.

### A developer needs to recover work after an incorrect local reset or rebase

- **Inspect:** stop further destructive commands, save the current worktree if
  needed, then inspect `git reflog` and the commit graph for the prior HEAD.
- **Act:** create a recovery branch at the confirmed commit and compare it with
  the intended branch. Restore or cherry-pick only the reviewed commits.
- **Verify:** run the affected tests, compare the final diff, and push a normal
  reviewable branch rather than force-updating shared history.

### A secret was committed to Git

- **Act first:** revoke or rotate the secret immediately. Removing a file in a
  later commit does not make an exposed credential safe.
- **Investigate:** determine repository visibility, clones, CI logs, artifacts,
  deployments, and audit activity. Follow the platform's approved history
  rewrite procedure only after rotation and communication.
- **Prevent:** use secret scanning and pre-commit/CI controls, inject runtime
  credentials from approved identity or secret systems, and verify the revoked
  credential cannot authenticate.

## Senior production lens

- A senior Git workflow protects the delivery boundary: protected branches,
  reviewed changes, required status checks, signed or otherwise traceable
  release artifacts, and narrow permissions for humans and automation.
- Decide between trunk-based development and release branches from release
  cadence, compatibility, and support requirements; avoid long-lived branches
  merely to postpone integration risk.
- A revert should identify the exact deployed artifact and compatibility
  boundary. Reverting source does not automatically reverse a database,
  configuration, or externally visible data migration.
- A committed secret is an exposure, even if history is rewritten. Revoke and
  rotate it, audit possible use, remove it from future paths, then decide
  whether history cleanup is warranted by the remaining risk.

## Concise interview delivery

“Git gives us traceable commits and branches. I use merge or rebase according to
whether history is shared: rebase rewrites commit IDs, so I avoid it on shared
release branches. For a production rollback I prefer a reviewed revert and a
known-good artifact, then verify the deployed digest and service SLI.”

## Common pitfalls

- Do not use force-push to solve a shared-branch conflict without coordination.
- Do not resolve a conflict by automatically choosing `ours` or `theirs` before
  understanding the behavior and running tests.
- Do not assume deleting a committed secret removes the exposure; rotate it.

## Official references

- [Git merge](https://git-scm.com/docs/git-merge)
- [Git rebase](https://git-scm.com/docs/git-rebase)
- [Git reset](https://git-scm.com/docs/git-reset)
- [Git reflog](https://git-scm.com/docs/git-reflog)
