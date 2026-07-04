# Stock Quality Gates

Last updated: 2026-07-03

## Completed Gates

- Backend compiles with JDK 21.
- Frontend changed files pass ESLint.
- Full frontend build passes after unrelated TypeScript errors were fixed.
- Quote provider failure path is covered by unit tests.
- Quote cache uses millisecond timestamps for time fields such as `fetchedAt`.
- Stock watchlist uses millisecond timestamps for `createdAt` and `updatedAt`.
- Remaining backend `LocalDateTime` fields/usages are migrated to millisecond timestamps.
- Investment page mobile and desktop layout has been checked.
- Documentation is updated after each completed milestone.
- Changes are reviewed with `git status --short` and `git diff --stat`.
- Completed milestones are committed and pushed.
- Future commits follow `docs/engineering/commit-and-versioning.md`.
- Provider abstraction rule is still true.
- MongoDB plus Redis storage rule is still true.

## Current Verification Commands

Frontend full build:

```bash
cd one-web
npm run build
```

Backend compile with JDK 21:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:$PATH mvn -pl one-record/one-record-service -am compile -DskipTests
```

Stock service tests:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin:/Users/aurorae/Program/Git/Apache/Maven/maven3.6.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin mvn -q -pl one-record/one-record-service -am test -Dtest=StockMarketServiceTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
```
