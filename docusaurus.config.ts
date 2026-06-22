import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import fs from 'node:fs';
import path from 'node:path';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

function localCommit(): string {
  try {
    const gitDirectory = path.join(process.cwd(), '.git');
    const head = fs.readFileSync(path.join(gitDirectory, 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) return head;
    return fs.readFileSync(
      path.join(gitDirectory, head.slice('ref: '.length)),
      'utf8',
    ).trim();
  } catch {
    return 'unknown';
  }
}

const buildCommit = process.env.TELEMARK_BUILD_COMMIT
  ?? process.env.GITHUB_SHA
  ?? localCommit();

const config: Config = {
  title: 'Telemark | Sharp Face Robotics',
  tagline: 'FTC Java, from setup to autonomous.',
  favicon: 'img/telemark.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://sharpfacerobotics.github.io',
  baseUrl: '/telemark/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sharpfacerobotics', // Usually your GitHub org/user name.
  projectName: 'telemark', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  customFields: {
    buildCommit,
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/sharpfacerobotics/ftc-curriculum/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-VXW7YL7R06',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    './plugins/telemark-search',
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true, // Lock to dark mode — matches your brand
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Telemark',
      logo: {
        alt: 'Telemark Logo',
        src: 'img/telemark.png',
      },
      items: [
        {
          to: '/curriculum',
          label: 'Curriculum',
          position: 'left',
        },
        {
          to: '/simulator',
          label: 'Simulator',
          position: 'left',
        },
        {
          to: '/search',
          label: 'Search',
          position: 'left',
        },
        {
          href: 'https://github.com/sharpfacerobotics/ftc-curriculum',
          label: 'GitHub',
          position: 'left',
        },
        {
          to: '/dashboard',
          label: 'Dashboard',
          position: 'right',
          className: 'navbar-auth-link',
        },
      ],
      style: 'dark',
    },
    footer: {
      style: 'dark',
      copyright:
        '© 2026 Telemark. Built by FTC Team Sharp Face Robotics #30450. Built with Docusaurus. Not affiliated with FIRST®',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
