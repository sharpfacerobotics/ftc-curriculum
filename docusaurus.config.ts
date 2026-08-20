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
  tagline: 'FTC software and engineering, from setup to competition.',
  favicon: 'img/telemark.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: process.env.TELEMARK_URL ?? 'https://sharpfacerobotics.github.io',
  // GitHub Pages serves the site under /telemark/, but a preview host, a
  // tunnel, or a custom domain serves it from the root. Overridable so a
  // build can target either without editing this file.
  baseUrl: process.env.TELEMARK_BASE_URL ?? '/telemark/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sharpfacerobotics', // Usually your GitHub org/user name.
  projectName: 'telemark', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // The gtag plugin calls window.gtag on every client side route change, but
  // Docusaurus only injects its inline stub in production builds. In dev, or
  // any time an ad blocker stops the remote script, window.gtag is undefined
  // and navigation throws. This defines the standard queueing stub when one is
  // missing, which is also how analytics is meant to degrade: events queue on
  // dataLayer and are delivered if the real script ever loads.
  headTags: [
    {
      tagName: 'script',
      attributes: {},
      innerHTML:
        'window.dataLayer=window.dataLayer||[];'
        + 'if(typeof window.gtag!=="function"){'
        + 'window.gtag=function(){window.dataLayer.push(arguments)}}',
    },
  ],

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
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'mechanical',
        path: 'mechanical',
        routeBasePath: 'mechanical',
        sidebarPath: './sidebarsMechanical.ts',
        editUrl:
          'https://github.com/sharpfacerobotics/ftc-curriculum/tree/main/',
      },
    ],
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
          to: '/docs',
          label: 'Software',
          position: 'left',
        },
        {
          to: '/mechanical',
          label: 'Mechanical',
          position: 'left',
        },
        {
          to: '/simulator',
          label: 'Tools',
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
