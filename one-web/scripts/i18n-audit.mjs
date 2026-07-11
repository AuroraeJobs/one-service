import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.join(webRoot, 'src');
const englishLocaleRoot = path.join(sourceRoot, 'i18n', 'locales', 'en-US');
const englishLocaleFile = path.join(sourceRoot, 'i18n', 'locales', 'en-US.ts');
const legacyResourceFile = path.join(englishLocaleRoot, 'lotteryText.ts');
const localizedTextResolverFile = path.join(sourceRoot, 'i18n', 'resolveLocalizedText.ts');
const hanPattern = /\p{Script=Han}/u;
const directI18nFiles = new Set([
  path.join('src', 'components', 'LotteryOverviewPage.tsx'),
  path.join('src', 'components', 'lottery', 'LotterySummaryCards.tsx'),
]);

const listSourceFiles = async directory => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listSourceFiles(entryPath));
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
};

const loadLegacyTranslator = async () => {
  const source = await readFile(legacyResourceFile, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  return import(moduleUrl);
};

const loadLocalizedTextResolver = async () => {
  const source = await readFile(localizedTextResolverFile, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  const module = await import(moduleUrl);
  return module.resolveLocalizedText;
};

const getPropertyName = (name, sourceFile) => {
  if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
  if (ts.isIdentifier(name)) return name.text;
  return name.getText(sourceFile);
};

const collectExplicitMessages = async () => {
  const resourceFiles = (await listSourceFiles(englishLocaleRoot))
    .filter(file => file !== legacyResourceFile);
  const messages = new Map();

  for (const file of [englishLocaleFile, ...resourceFiles]) {
    const source = await readFile(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const visit = node => {
      if (
        ts.isVariableDeclaration(node)
        && ts.isIdentifier(node.name)
        && /messages$/i.test(node.name.text)
        && ts.isObjectLiteralExpression(node.initializer)
      ) {
        node.initializer.properties.forEach(property => {
          if (ts.isPropertyAssignment(property)) {
            const key = getPropertyName(property.name, sourceFile);
            const templates = [];
            if (ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer)) {
              templates.push(property.initializer.text);
            } else if (ts.isObjectLiteralExpression(property.initializer)) {
              property.initializer.properties.forEach(pluralProperty => {
                if (
                  ts.isPropertyAssignment(pluralProperty)
                  && (ts.isStringLiteral(pluralProperty.initializer) || ts.isNoSubstitutionTemplateLiteral(pluralProperty.initializer))
                ) {
                  templates.push(pluralProperty.initializer.text);
                }
              });
            }
            if (templates.length > 0) messages.set(key, templates);
          }
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return messages;
};

const getPlaceholders = template => (
  [...template.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)]
    .map(match => match[1])
    .sort()
    .join(',')
);

const findTranslationCalls = async files => {
  const calls = [];
  const directI18nFailures = [];
  let legacyBinaryReferences = 0;
  let lotteryLegacyBinaryReferences = 0;

  for (const file of files) {
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    const source = await readFile(file, 'utf8');
    const fileLegacyReferences = source.match(/\bisEnglish\b/g)?.length ?? 0;
    legacyBinaryReferences += fileLegacyReferences;
    if (
      path.basename(file).startsWith('Lottery')
      || file.includes(`${path.sep}components${path.sep}lottery${path.sep}`)
    ) {
      lotteryLegacyBinaryReferences += fileLegacyReferences;
    }
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const relativeFile = path.relative(webRoot, file);
    const checkDirectI18n = directI18nFiles.has(relativeFile);
    const visit = (node, insideTranslationCall = false, insideJsx = false) => {
      const translationCall = ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && ['t', 'translateText'].includes(node.expression.text);
      if (
        translationCall
      ) {
        const argument = node.arguments[0];
        if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
          const location = sourceFile.getLineAndCharacterOfPosition(argument.getStart(sourceFile));
          calls.push({
            file: relativeFile,
            line: location.line + 1,
            key: argument.text,
          });
        }
      }
      const nextInsideTranslationCall = insideTranslationCall || translationCall;
      const nextInsideJsx = insideJsx
        || ts.isJsxElement(node)
        || ts.isJsxSelfClosingElement(node)
        || ts.isJsxFragment(node)
        || ts.isJsxAttribute(node)
        || ts.isJsxExpression(node);
      const visibleLiteral = ts.isJsxText(node)
        || ts.isStringLiteral(node)
        || ts.isNoSubstitutionTemplateLiteral(node)
        || ts.isTemplateExpression(node);
      if (
        checkDirectI18n
        && nextInsideJsx
        && !nextInsideTranslationCall
        && visibleLiteral
        && hanPattern.test(node.getText(sourceFile))
      ) {
        const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        directI18nFailures.push({
          file: relativeFile,
          line: location.line + 1,
          text: node.getText(sourceFile),
        });
      }
      ts.forEachChild(node, child => visit(child, nextInsideTranslationCall, nextInsideJsx));
    };
    visit(sourceFile);
  }

  return { calls, directI18nFailures, legacyBinaryReferences, lotteryLegacyBinaryReferences };
};

const run = async () => {
  const [sourceFiles, explicitMessages, englishTranslators, resolveLocalizedText] = await Promise.all([
    listSourceFiles(sourceRoot),
    collectExplicitMessages(),
    loadLegacyTranslator(),
    loadLocalizedTextResolver(),
  ]);
  const { translateEnglishText, translateCompleteEnglishText } = englishTranslators;
  const explicitMessageKeys = new Set(explicitMessages.keys());
  const {
    calls,
    directI18nFailures,
    legacyBinaryReferences,
    lotteryLegacyBinaryReferences,
  } = await findTranslationCalls(sourceFiles);
  const missing = calls.filter(({ key }) => {
    if (!hanPattern.test(key) || explicitMessageKeys.has(key)) return false;
    const interpolatedSample = key.replace(/\{\{\s*[\w.-]+\s*\}\}/g, '1');
    return hanPattern.test(translateEnglishText(interpolatedSample));
  });
  const invalidExplicitMessages = [];
  explicitMessages.forEach((templates, key) => {
    const expectedPlaceholders = getPlaceholders(key);
    templates.forEach(template => {
      if (hanPattern.test(template)) {
        invalidExplicitMessages.push(`${key} -> ${template} (contains Chinese)`);
      }
      if (getPlaceholders(template) !== expectedPlaceholders) {
        invalidExplicitMessages.push(`${key} -> ${template} (placeholder mismatch)`);
      }
    });
  });
  const metadataResolutionCases = [
    { source: '首页', translated: '首Page', curatedTranslation: 'Home', expected: 'Home' },
    {
      source: '统一管理油车加油、电车充电、充电站和车辆接口数据。',
      translated: '统一管理油车加油, 电车充电, 充电站和车辆API Data.',
      curatedTranslation: 'Manage fuel records, EV charging, charging stations, and vehicle interface data in one place.',
      expected: 'Manage fuel records, EV charging, charging stations, and vehicle interface data in one place.',
    },
    { source: '彩票研究', translated: '宝くじ研究', expected: '宝くじ研究' },
  ];
  const metadataResolutionFailures = metadataResolutionCases.filter(testCase => (
    resolveLocalizedText(testCase) !== testCase.expected
  ));
  const completeFallbackCases = [
    { source: '首页', expected: '首页' },
    { source: '已运行', expected: '已运行' },
    { source: '彩票研究', expected: 'Lottery Research' },
  ];
  const completeFallbackFailures = completeFallbackCases.filter(testCase => (
    translateCompleteEnglishText(testCase.source) !== testCase.expected
  ));

  console.log(`[i18n-audit] checked ${calls.length} t()/translateText() calls`);
  console.log(`[i18n-audit] explicit English keys: ${explicitMessageKeys.size}`);
  console.log(`[i18n-audit] legacy isEnglish references: ${legacyBinaryReferences}`);
  console.log(`[i18n-audit] lottery legacy isEnglish references: ${lotteryLegacyBinaryReferences}`);
  console.log(`[i18n-audit] life metadata resolution cases: ${metadataResolutionCases.length}`);
  console.log(`[i18n-audit] complete fallback cases: ${completeFallbackCases.length}`);
  console.log(`[i18n-audit] direct lottery overview i18n files: ${directI18nFiles.size}`);

  if (
    missing.length === 0
    && invalidExplicitMessages.length === 0
    && metadataResolutionFailures.length === 0
    && completeFallbackFailures.length === 0
    && directI18nFailures.length === 0
  ) {
    console.log('[i18n-audit] PASSED: every migrated Chinese key has a complete English translation');
    return;
  }

  console.error(`[i18n-audit] FAILED: ${missing.length} migrated keys still contain untranslated Chinese`);
  missing.forEach(item => {
    console.error(`- ${item.file}:${item.line} ${item.key}`);
  });
  if (invalidExplicitMessages.length > 0) {
    console.error(`[i18n-audit] FAILED: ${invalidExplicitMessages.length} invalid explicit English messages`);
    invalidExplicitMessages.forEach(detail => console.error(`- ${detail}`));
  }
  if (metadataResolutionFailures.length > 0) {
    console.error(`[i18n-audit] FAILED: ${metadataResolutionFailures.length} life metadata resolution cases`);
    metadataResolutionFailures.forEach(testCase => console.error(`- ${testCase.source}`));
  }
  if (completeFallbackFailures.length > 0) {
    console.error(`[i18n-audit] FAILED: ${completeFallbackFailures.length} complete fallback cases`);
    completeFallbackFailures.forEach(testCase => console.error(`- ${testCase.source}`));
  }
  if (directI18nFailures.length > 0) {
    console.error(`[i18n-audit] FAILED: ${directI18nFailures.length} untranslated overview JSX values`);
    directI18nFailures.forEach(item => console.error(`- ${item.file}:${item.line} ${item.text}`));
  }
  process.exitCode = 1;
};

run().catch(error => {
  console.error('[i18n-audit] unexpected failure');
  console.error(error);
  process.exitCode = 1;
});
