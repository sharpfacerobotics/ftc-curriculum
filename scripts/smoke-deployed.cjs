const assert = require('node:assert/strict');

const baseUrl = (process.env.TELEMARK_DEPLOY_URL
  || 'https://sharpfacerobotics.github.io/telemark').replace(/\/$/, '');
const expectedCommit = process.env.TELEMARK_BUILD_COMMIT || process.env.GITHUB_SHA;

async function fetchWithRetry(route, attempts = 8) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const separator = route.includes('?') ? '&' : '?';
      const cacheKey = expectedCommit || Date.now();
      const response = await fetch(
        `${baseUrl}${route}${separator}telemark_smoke=${cacheKey}`,
        {cache: 'no-store'},
      );
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }
    }
  }
  throw lastError;
}

async function main() {
  const meta = await fetchWithRetry('/build-meta.json').then((response) => response.json());
  if (expectedCommit) assert.equal(meta.commit, expectedCommit);

  const homepage = await fetchWithRetry('/').then((response) => response.text());
  assert.match(homepage, />15</);
  assert.match(homepage, />95</);

  for (const route of [
    '/curriculum',
    '/simulator',
    '/search',
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
