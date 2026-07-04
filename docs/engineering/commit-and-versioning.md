# Commit Message And Versioning Standard

Last updated: 2026-07-04

Use this document for all future code, documentation, and release commits in this repository unless a user explicitly asks for a different format.

## Commit Message Standard

Commit messages must follow a Conventional Commit style:

```text
<type>(<scope>): <summary>
```

Examples:

```text
feat(lottery): add provider probe diagnostics
fix(lottery): classify proxy 403 sync failures
docs(engineering): add commit and versioning standards
test(stock): cover sync summary rate calculation
chore(release): prepare v26.1.0
```

### Types

- `feat`: user-facing feature or API capability.
- `fix`: bug fix, incorrect behavior, broken integration, or production-facing failure handling.
- `docs`: documentation-only change.
- `test`: test-only change or meaningful test coverage expansion.
- `refactor`: code restructuring without intended behavior change.
- `perf`: performance improvement.
- `style`: formatting-only change without behavior change.
- `build`: build system, dependency, Maven, npm, or packaging change.
- `ci`: CI workflow or automation change.
- `chore`: maintenance task that does not fit the other types.
- `revert`: revert a previous commit.

### Scopes

Use the smallest stable scope that helps future history search.

Preferred scopes:

- Product/module scopes: `lottery`, `stock`, `ai`, `record`, `security`, `web`, `common`.
- Infrastructure scopes: `build`, `deps`, `release`, `docs`, `config`.
- Cross-cutting project rule changes: `engineering`.

If a change spans several modules, use the dominant product scope when there is one. Use `common`, `web`, `build`, or `engineering` for true cross-cutting work.

### Summary Rules

- Keep the first line under 72 characters when practical.
- Use imperative wording: `add`, `fix`, `update`, `preserve`, `classify`.
- Keep the summary specific enough to identify the behavior or artifact changed.
- Do not use vague summaries such as `update`, `fix bug`, or `changes`.
- Prefer English for the commit header so tooling and release notes stay consistent.

### Body And Footer

Add a body when the change needs operational context, migration notes, or verification details.

Useful body sections:

```text
Why:
- Explain the problem or decision.

What:
- List important behavior or contract changes.

Verify:
- mvn -pl one-record/one-record-service -Dtest=ExampleTest test
- cd one-web && npm run build
```

Use footers when needed:

```text
BREAKING CHANGE: describe incompatible API, data, or config change
Refs: #123
```

### Delivery Rules

- Keep commits atomic and reviewable.
- Do not mix unrelated user changes into the commit.
- Before every commit, check `git status --short`, review staged files, and run `git diff --cached --check`.
- Run focused tests or frontend build for the touched behavior.
- Push after each completed milestone when code or documentation changes are committed.
- If the worktree contains unrelated changes, leave them unstaged and mention that in the handoff.

## Version Management

This repository uses one system version for release management and module iteration documents for planning.

### Version Sources

- Root `pom.xml` `<version>` is the canonical system/backend artifact version.
- `one-web/package.json` `version` follows the system release version when preparing a release build.
- Git release tags use `v<MAJOR>.<MINOR>.<PATCH>`, for example `v26.1.0`.
- Module roadmap files such as `docs/lottery/iterations/*` and `docs/stock/iterations/*` are planning versions, not artifact versions.

### Version Format

Use semantic versioning:

```text
MAJOR.MINOR.PATCH[-SNAPSHOT]
```

- `MAJOR`: incompatible API, storage, deployment, or runtime generation change.
- `MINOR`: backward-compatible feature set, usually a planned monthly product version.
- `PATCH`: backward-compatible bug fix, reliability fix, docs correction, or small operational improvement.
- `-SNAPSHOT`: active development version on `master`.

The current project version is `26.0.0-SNAPSHOT`. Do not bump the system version just because a plan document changes; bump it only when preparing or starting a release cycle.

### Release Flow

1. Finish the planned milestone checklist and verification.
2. Update release notes or the relevant module plan with the shipped scope.
3. Change root `pom.xml` from `X.Y.Z-SNAPSHOT` to `X.Y.Z`.
4. Change `one-web/package.json` to `X.Y.Z` for a frontend release build.
5. Run backend/frontend verification appropriate for the release.
6. Commit with `chore(release): prepare vX.Y.Z`.
7. Create Git tag `vX.Y.Z`.
8. Push the release commit and tag.
9. Start the next development version, usually `X.Y.(Z+1)-SNAPSHOT` for patch work or `X.(Y+1).0-SNAPSHOT` for the next monthly feature version.
10. Commit with `chore(release): start vNEXT-SNAPSHOT`.

### Version Bump Examples

- Provider diagnostics, data repair, and daily operation hardening for a month: `26.1.0-SNAPSHOT` during development, `v26.1.0` on release.
- A small fix for lottery sync error wording after a release: `26.1.1-SNAPSHOT` during development, `v26.1.1` on release.
- A breaking storage migration or incompatible API cleanup: next major version, for example `27.0.0-SNAPSHOT`.

### Release Safety Rules

- Release commits must contain version and release-note changes only.
- Feature/fix commits must not quietly bump the system version.
- Tags are immutable release markers; do not move a published tag.
- If a release needs rollback, create a new patch version with a revert or forward fix.
- Keep module iteration checklists current so release notes can be derived from completed work.
