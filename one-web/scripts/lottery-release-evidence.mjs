import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const reportPath = path.join(webRoot, 'reports', 'lottery-route-smoke-summary.json');
const fixturePath = path.join(scriptDir, 'fixtures', 'lottery-route-smoke.json');
const evidencePath = path.join(webRoot, 'reports', 'lottery-release-evidence.md');
const evidenceReport = path.relative(webRoot, evidencePath);
const historyDir = path.join(webRoot, 'reports', 'lottery-release-history');
const historyIndexPath = path.join(historyDir, 'README.md');
const checkOnly = process.argv.includes('--check');
const archiveOnly = process.argv.includes('--archive');

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

const snapshotName = summary => {
  const generatedAt = summary.generatedAt || new Date().toISOString();
  const safeTimestamp = generatedAt.replace(/[:.]/g, '-');
  const status = String(summary.status || 'UNKNOWN').toLowerCase();
  return `${safeTimestamp}-${status}.md`;
};

const renderHistoryIndex = (summary, snapshotFile) => `# Lottery Release History

This directory stores committed snapshots generated from \`npm run lottery:release-archive\`.

| Field | Value |
| --- | --- |
| Latest snapshot | [${snapshotFile}](${snapshotFile}) |
| Latest target | ${escapeCell(summary.target)} |
| Latest generated at | ${escapeCell(summary.generatedAt)} |
| Latest status | ${escapeCell(statusLabel(summary))} |
| Latest checks | ${summary.checkCount} |
| Latest routes | ${summary.routeCount} |

## Usage

\`\`\`bash
npm run lottery:release-archive
\`\`\`

Run this after a release-check pass when the evidence should be kept as a durable handoff snapshot.
`;

const renderMarkdown = (summary, fixture) => {
  const sourceChecks = fixture.sourceChecks || [];
  const checkedRoutes = summary.checkedRoutes || [];

  return `# Lottery Release Evidence

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
};

const run = async () => {
  const [summary, fixture] = await Promise.all([readJson(reportPath), readJson(fixturePath)]);
  const markdown = renderMarkdown(summary, fixture);

  if (checkOnly) {
    const current = await readFile(evidencePath, 'utf8');
    if (current !== markdown) {
      console.error(`[lottery-evidence] stale report: ${evidenceReport}`);
      console.error('[lottery-evidence] run `npm run lottery:release-evidence` to refresh it');
      process.exitCode = 1;
      return;
    }
    console.log(`[lottery-evidence] fresh ${evidenceReport}`);
    return;
  }

  if (archiveOnly) {
    const current = await readFile(evidencePath, 'utf8');
    if (current !== markdown) {
      console.error(`[lottery-evidence] stale report: ${evidenceReport}`);
      console.error('[lottery-evidence] run `npm run lottery:release-evidence` before archiving');
      process.exitCode = 1;
      return;
    }
    const snapshotFile = snapshotName(summary);
    const snapshotPath = path.join(historyDir, snapshotFile);
    await mkdir(historyDir, { recursive: true });
    await writeFile(snapshotPath, current);
    await writeFile(historyIndexPath, renderHistoryIndex(summary, snapshotFile));
    console.log(`[lottery-evidence] archived ${path.relative(webRoot, snapshotPath)}`);
    console.log(`[lottery-evidence] updated ${path.relative(webRoot, historyIndexPath)}`);
    return;
  }

  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, markdown);
  console.log(`[lottery-evidence] wrote ${evidenceReport}`);
};

run().catch(error => {
  console.error('[lottery-evidence] unexpected failure');
  console.error(error);
  process.exitCode = 1;
});
