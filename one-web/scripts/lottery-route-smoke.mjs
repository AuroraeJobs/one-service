import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const fixturePath = path.join(scriptDir, 'fixtures', 'lottery-route-smoke.json');
const reportPath = path.join(webRoot, 'reports', 'lottery-route-smoke-summary.json');

const readText = async relativePath => readFile(path.join(webRoot, relativePath), 'utf8');
const readJson = async filePath => JSON.parse(await readFile(filePath, 'utf8'));

const checks = [];
const failures = [];

const record = (passed, scope, detail) => {
  const check = { scope, detail, status: passed ? 'PASS' : 'FAIL' };
  checks.push(check);
  if (!passed) {
    failures.push(check);
  }
};

const containsEvery = (content, values) => values.every(value => content.includes(value));

const apiMemberExists = (apiSource, apiName) => {
  const [objectName, memberName] = apiName.split('.');
  return Boolean(
    objectName &&
    memberName &&
    apiSource.includes(`export const ${objectName}`) &&
    (apiSource.includes(`${memberName}:`) || apiSource.includes(`${memberName}: (`))
  );
};

const routeElementExists = (routeSource, route, component) =>
  routeSource.includes(`path: '${route}'`) && routeSource.includes(`element: <${component} />`);

const run = async () => {
  const fixture = await readJson(fixturePath);
  const routeSource = await readText('src/routes/lifeRoutes.tsx');
  const navSource = await readText('src/constants/lifeDataModules.tsx');
  const apiSource = await readText('src/services/api.ts');

  record(fixture.mode === 'mocked-fixture', 'fixture', 'uses mocked fixture mode');
  record(fixture.providerNetwork === 'not-required', 'fixture', 'does not require live lottery provider network');
  record(Array.isArray(fixture.consoleErrors) && fixture.consoleErrors.length === 0, 'fixture', 'declares zero expected console errors');
  record(navSource.includes('secondary?: boolean'), 'navigation', 'supports secondary child nav entries');
  record(navSource.includes("label: '研究'") && navSource.includes('secondary: true'), 'navigation', 'prediction research entries can be collapsed from the context strip');
  record(navSource.includes("label: '历史'") && navSource.includes('secondary: true'), 'navigation', 'prediction history stays available from the parent dropdown');

  for (const route of fixture.routes || []) {
    const scope = route.route;
    let componentSource = '';
    try {
      componentSource = await readText(route.componentFile);
      record(true, scope, `component file exists: ${route.componentFile}`);
    } catch (error) {
      record(false, scope, `component file exists: ${route.componentFile}`);
      continue;
    }

    record(routeElementExists(routeSource, route.route, route.component), scope, 'protected route maps to expected component');
    record(navSource.includes(`path: '${route.route}'`), scope, 'lottery navigation exposes the route');
    record(Boolean(route.fixtureData && Object.keys(route.fixtureData).length), scope, 'fixture data is present');
    record(!componentSource.includes('fetch('), scope, 'component does not bypass project API client with fetch');
    record(!componentSource.includes('axios.'), scope, 'component does not call axios directly');
    record(componentSource.includes('console.error'), scope, 'component has controlled console-error handling');
    record(containsEvery(componentSource, route.emptyStates || []), scope, 'empty-state text is present');
    record(containsEvery(componentSource, route.errorStates || []), scope, 'error-state text is present');

    for (const apiName of route.mockApis || []) {
      record(componentSource.includes(apiName), scope, `component calls ${apiName}`);
      record(apiMemberExists(apiSource, apiName), scope, `API contract exists for ${apiName}`);
    }
  }

  const summary = {
    target: fixture.target,
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'FAILED' : 'PASSED',
    mode: fixture.mode,
    authentication: fixture.authentication,
    providerNetwork: fixture.providerNetwork,
    routeCount: fixture.routes?.length || 0,
    checkCount: checks.length,
    failureCount: failures.length,
    failures,
    checkedRoutes: (fixture.routes || []).map(route => ({
      route: route.route,
      label: route.label,
      component: route.component,
      mockApiCount: route.mockApis?.length || 0,
      emptyStateCount: route.emptyStates?.length || 0,
      errorStateCount: route.errorStates?.length || 0
    }))
  };

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`);

  if (failures.length) {
    console.error(`[lottery-smoke] FAILED ${failures.length}/${checks.length} checks`);
    for (const failure of failures) {
      console.error(`- ${failure.scope}: ${failure.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[lottery-smoke] PASSED ${checks.length} checks across ${summary.routeCount} routes`);
  console.log(`[lottery-smoke] report: ${path.relative(webRoot, reportPath)}`);
};

run().catch(error => {
  console.error('[lottery-smoke] unexpected failure');
  console.error(error);
  process.exitCode = 1;
});
