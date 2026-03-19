import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Telemark | Sharp Face Robotics',
  tagline: 'A structured, level-gated curriculum built by student engineers.',
  favicon: 'img/ehs-logo.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://sharpfacerobotics.github.io',
  baseUrl: '/ftc-curriculum/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sharpfacerobotics', // Usually your GitHub org/user name.
  projectName: 'ftc-curriculum', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',

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
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true, // Lock to dark mode — matches your brand
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'EHS Robotics | Telemark',
      logo: {
        alt: 'Telemark Logo',
        src: 'img/telemark.png', // we'll place your logo here next
      },
      style: 'dark',
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} EHS Robotics. Built with Docusaurus.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
