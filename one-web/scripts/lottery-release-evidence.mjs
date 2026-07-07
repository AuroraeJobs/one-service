import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const reportPath = path.join(webRoot, 'reports', 'lottery-route-smoke-summary.json');
const fixturePath = path.join(scriptDir, 'fixtures', 'lottery-route-smoke.json');
const evidencePath = path.join(webRoot, 'reports', 'lottery-release-evidence.md');

const readJson = async filePath => JSON.parse(await readFile(filePath, 'utf8'));

const escapeCell = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

const statusLabel = summary => {
  if (summary.status === 'PASSED' && summary.failureCount === 0) {
    return 'PASSED';
  }
  return summary.status || 'UNKNOWN';
};

const renderRouteRows = routes =>
  routes
    .map(
      route =>
        `| ${escapeCell(route.label)} | \`${escapeCell(route.route)}\` | ${escapeCell(route.component)} | ${route.mockApiCount} | ${route.emptyStateCount} | ${route.errorStateCount} |`
    )
    .join('\n');

const renderSourceRows = sourceChecks =>
  sourceChecks
    .map(
      check =>
        `| ${escapeCell(check.scope || check.file)} | \`${escapeCell(check.file)}\` | ${(check.includes || []).length} | ${(check.excludes || []).length} |`
    )
    .join('\n');

const run = async () => {
  const [summary, fixture] = await Promise.all([readJson(reportPath), readJson(fixturePath)]);
  const sourceChecks = fixture.sourceChecks || [];
  const checkedRoutes = summary.checkedRoutes || [];

  const markdown = `# Lottery Release Evidence

Generated from \`npm run lottery:smoke\`.

## Summary

| Field | Value |
| --- | --- |
| Target | ${escapeCell(summary.target)} |
| Generated at | ${escapeCell(summary.generatedAt)} |
| Status | ${escapeCell(statusLabel(summary))} |
| Mode | ${escapeCell(summary.mode)} |
| Provider network | ${escapeCell(summary.providerNetwork)} |
| Routes | ${summary.routeCount} |
| Checks | ${summary.checkCount} |
| Failures | ${summary.failureCount} |

## Protected Browser QA

| Gate | Evidence |
| --- | --- |
| Authentication | ${escapeCell(summary.authentication)} |
| Backend/proxy | Manual browser screenshots require the local backend and Vite proxy to reach project-owned lottery APIs. |
| Known blocker | \`ECONNREFUSED\` on \`/lottery/records/draws?page=0&size=500\` means backend/proxy availability is blocking browser evidence. |
| Fallback | Static smoke and build remain baseline verification when login or backend availability blocks screenshots. |

## Source Guards

| Scope | File | Includes | Excludes |
| --- | --- | ---: | ---: |
${sourceChecks.length ? renderSourceRows(sourceChecks) : '| None |  | 0 | 0 |'}

## Checked Routes

| Label | Route | Component | APIs | Empty States | Error States |
| --- | --- | --- | ---: | ---: | ---: |
${checkedRoutes.length ? renderRouteRows(checkedRoutes) : '| None |  |  | 0 | 0 | 0 |'}

## Failures

${summary.failures?.length ? summary.failures.map(failure => `- ${failure.scope}: ${failure.detail}`).join('\n') : 'No failures.'}
`;

  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, markdown);
  console.log(`[lottery-evidence] wrote ${path.relative(webRoot, evidencePath)}`);
};

run().catch(error => {
  console.error('[lottery-evidence] unexpected failure');
  console.error(error);
  process.exitCode = 1;
});
