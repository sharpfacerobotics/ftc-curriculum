const fs = require('node:fs');
const path = require('node:path');

function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function readFrontMatter(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match ? match[1].trim() : '';
}

function unitNumberFor(file) {
  const match = file.match(/unit-(\d{2})/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function cleanExcerpt(source) {
  const cleaned = source
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^import .*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/:::[\s\S]*?:::/g, ' ')
    .replace(/^#\s+.+$/m, '')
    .replace(/^---$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`[\]()>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 260) return cleaned;
  return `${cleaned.slice(0, 260).replace(/\s+\S*$/, '')}…`;
}

function routeFor(file, source) {
  const slug = readFrontMatter(source, 'slug');
  if (slug) {
    return `/docs/${slug.replace(/^\/+/, '')}`;
  }
  const relative = path.relative(path.resolve(__dirname, '../../docs'), file);
  const directory = path.dirname(relative).replaceAll(path.sep, '/');
  const id = readFrontMatter(source, 'id') || path.basename(file, '.mdx');
  return `/docs/${directory === '.' ? '' : `${directory}/`}${id}`.replace(/\/index$/, '');
}

module.exports = function telemarkSearchPlugin(context) {
  return {
    name: 'telemark-search',

    async loadContent() {
      const docsRoot = path.resolve(context.siteDir, 'docs');
      return walk(docsRoot)
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => {
          const source = fs.readFileSync(file, 'utf8');
          const unit = unitNumberFor(file);
          const isProtected = unit !== null && unit >= 1;
          const title = readFrontMatter(source, 'title')
            || source.match(/^#\s+(.+)$/m)?.[1]?.trim()
            || path.basename(file, '.mdx');
          const label = readFrontMatter(source, 'sidebar_label') || title;

          return {
            title,
            label,
            path: routeFor(file, source),
            unit,
            protected: isProtected,
            excerpt: isProtected ? '' : cleanExcerpt(source),
          };
        })
        .sort((a, b) => a.path.localeCompare(b.path));
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },

    async postBuild({outDir}) {
      fs.writeFileSync(
        path.join(outDir, 'build-meta.json'),
        `${JSON.stringify({
          commit: context.siteConfig.customFields.buildCommit,
          builtAt: new Date().toISOString(),
        }, null, 2)}\n`,
      );
    },
  };
};
