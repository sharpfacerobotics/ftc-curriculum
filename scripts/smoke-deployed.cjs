const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/**
 * Counts come from the curriculum data rather than being written in here.
 *
 * This check previously asserted a literal 97, which silently became wrong the
 * moment the homepage stopped rendering that figure on its own, and the failure
 * surfaced as a red deploy rather than as an obviously stale test.
 */
const tsCache = new Map();

function loadTelemark(name) {
  const file = path.resolve(__dirname, '..', 'src/telemark', `${name}.ts`);
  if (tsCache.has(file)) return tsCache.get(file);
  const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  });
  const module = {};
  tsCache.set(file, module);
  new Function('exports', 'require', 'module', outputText)(
    module,
    (id) => (id.startsWith('./') ? loadTelemark(id.slice(2)) : require(id)),
    {exports: module},
  );
  return module;
}

const software = loadTelemark('curriculum');
const blocks = loadTelemark('blocksCurriculum');
const mechanical = loadTelemark('mechanical');
const tracks = loadTelemark('tracks');

const baseUrl = (process.env.TELEMARK_DEPLOY_URL
  || 'https://sharpfacerobotics.github.io/telemark').replace(/\/$/, '');
const expectedCommit = process.env.TELEMARK_BUILD_COMMIT || process.env.GITHUB_SHA;
const retryDelayMs = Number.parseInt(
  process.env.TELEMARK_SMOKE_RETRY_DELAY_MS || '15000',
  10,
);

async function fetchWithRetry(route, attempts = 8, validate) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const separator = route.includes('?') ? '&' : '?';
      const cacheKey = `${expectedCommit || Date.now()}-${attempt}`;
      const response = await fetch(
        `${baseUrl}${route}${separator}telemark_smoke=${cacheKey}`,
        {cache: 'no-store'},
      );
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      if (validate) await validate(response.clone());
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  throw lastError;
}

async function main() {
  const meta = await fetchWithRetry(
    '/build-meta.json',
    12,
    async (response) => {
      const deployedMeta = await response.json();
      if (expectedCommit && deployedMeta.commit !== expectedCommit) {
        throw new Error(
          `Deployment still serves ${deployedMeta.commit}; expected ${expectedCommit}`,
        );
      }
    },
  ).then((response) => response.json());

  const homepage = await fetchWithRetry('/').then((response) => response.text());
  // Both track cards must render their own counts, and the summary line the
  // combined total. Between them these prove the homepage is showing real
  // curriculum data for both tracks rather than one track and a placeholder.
  const softwareStat = `${blocks.BLOCKS_LESSON_COUNT + software.CURRICULUM_LESSON_COUNT} software lessons`;
  const mechanicalStat = `${mechanical.MECHANICAL_UNIT_COUNT} modules · ${mechanical.MECHANICAL_LESSON_COUNT} lessons`;
  const combined = tracks.TOTAL_LESSON_COUNT;
  assert.ok(homepage.includes(softwareStat), `homepage missing "${softwareStat}"`);
  assert.ok(homepage.includes(mechanicalStat), `homepage missing "${mechanicalStat}"`);
  assert.match(homepage, new RegExp(`>${combined}<`), `homepage missing combined count ${combined}`);

  for (const route of [
    '/curriculum',
    '/simulator',
    '/search',
    '/docs/unit-00',
    '/docs/unit-00/classes-and-objects',
    '/docs/unit-01/prerequisites',
    '/docs/unit-06/opmode-active',
  ]) {
    await fetchWithRetry(route);
  }

  await fetchWithRetry('/docs/unit-10/get-current-position');

  console.log(`Deployment smoke test passed for ${meta.commit.slice(0, 12)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
