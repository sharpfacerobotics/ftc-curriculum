import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import {useBasePath} from '@site/src/telemark/useBasePath';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useAuth} from '@site/src/telemark/useAuth';
import {TOOL_CATALOG} from '@site/src/components/mechanical/toolCatalog';
import styles from './CommandPalette.module.css';

interface SearchEntry {
  title: string;
  label: string;
  path: string;
  track: 'software' | 'mechanical';
  unit: number | null;
  protected: boolean;
  excerpt: string;
}

interface Command {
  id: string;
  title: string;
  path: string;
  group: string;
  track: 'software' | 'mechanical' | 'action' | 'tool';
  locked: boolean;
  /** Title, label, and path: the things a person half remembers. */
  meta: string;
  /** Lesson body text, so a topic word finds the lesson that teaches it. */
  body: string;
}

function action(id: string, title: string, path: string): Command {
  return {
    id,
    title,
    path,
    group: 'Go to',
    track: 'action',
    locked: false,
    meta: `${title} ${path}`.toLowerCase(),
    body: '',
  };
}

const ACTIONS: Command[] = [
  action('a-sw', 'Software track', '/curriculum'),
  action('a-eng', 'Mechanical track', '/mechanical'),
  action('a-paths', 'Mechanical learning paths', '/mechanical/learning-paths'),
  action('a-cad', 'CAD practice exercises', '/mechanical/cad-practice'),
  action('a-sim', 'Simulator', '/simulator'),
  action('a-dash', 'Dashboard', '/dashboard'),
  action('a-search', 'Full search page', '/search'),
];

/**
 * The calculators and checkers, which live in a tab strip rather than at their
 * own routes. Without these, searching "gear ratio" finds lessons about gears
 * and not the tool that works one out.
 */
const TOOLS: Command[] = TOOL_CATALOG.map((tool) => ({
  id: `tool-${tool.id}`,
  title: tool.name,
  path: `/simulator#${tool.id}`,
  group: 'Tools',
  track: 'tool',
  locked: false,
  meta: `${tool.name} ${tool.group} ${tool.keywords}`.toLowerCase(),
  body: '',
}));

/**
 * Keyboard-first navigation across both tracks.
 *
 * The site has 130 lessons spread over two sidebars, so finding a specific one
 * meant knowing which track it lived in. This searches everything from any
 * page. It reuses the index the search plugin already builds rather than
 * shipping a second one.
 */
export default function CommandPalette(): React.JSX.Element | null {
  const entries = usePluginData('telemark-search') as SearchEntry[] | undefined;
  const {user} = useAuth();
  const history = useHistory();
  const basePath = useBasePath();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const lessons = useMemo<Command[]>(
    () =>
      (entries ?? []).map((entry) => ({
        id: entry.path,
        title: entry.title,
        path: entry.path,
        group: entry.track === 'mechanical' ? 'Mechanical' : 'Software',
        track: entry.track,
        locked: entry.protected && !user,
        meta: `${entry.title} ${entry.label} ${entry.path}`.toLowerCase(),
        // Empty for protected lessons by design, so gated content is not
        // searchable by people who cannot read it.
        body: entry.excerpt.toLowerCase(),
      })),
    [entries, user],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ACTIONS.concat(TOOLS.slice(0, 4)).concat(lessons.slice(0, 6));
    const scored = ACTIONS.concat(TOOLS)
      .concat(lessons)
      .map((command) => {
        // Three tiers, so a lesson whose title is the query always outranks one
        // that merely mentions it in passing. Searching only titles was the
        // reason a real topic word returned nothing at all.
        const inTitle = command.title.toLowerCase().indexOf(needle);
        const inMeta = command.meta.indexOf(needle);
        const inBody = command.body.indexOf(needle);
        let score: number;
        if (inTitle >= 0) score = inTitle;
        else if (inMeta >= 0) score = 100 + inMeta;
        else if (inBody >= 0) score = 500 + inBody;
        else return null;
        if (command.track === 'action') score -= 20;
        return {command, score};
      })
      .filter(Boolean) as {command: Command; score: number}[];
    return scored.sort((a, b) => a.score - b.score).slice(0, 24).map((s) => s.command);
  }, [query, lessons]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setCursor(0);
  }, []);

  const go = useCallback(
    (command: Command) => {
      close();
      history.push(basePath(command.path));
    },
    [close, history, basePath],
  );

  // Global shortcut. Cmd+K on macOS, Ctrl+K elsewhere, and / when not typing.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing =
        event.target instanceof HTMLElement
        && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (event.key === '/' && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${cursor}"]`);
    node?.scrollIntoView({block: 'nearest'});
  }, [cursor]);

  if (!open) {
    return (
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen(true)}
        aria-label="Open quick search"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <span aria-hidden="true">⌕</span>
        Search
        <kbd>⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className={styles.backdrop}
      role="button"
      tabIndex={-1}
      aria-label="Close quick search"
      onClick={close}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.searchRow}>
          <span className={styles.prompt} aria-hidden="true">telemark &gt;</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            placeholder="Search lessons, modules, and pages"
            aria-label="Search lessons, modules, and pages"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') close();
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (event.key === 'Enter' && results[cursor]) {
                event.preventDefault();
                go(results[cursor]);
              }
            }}
          />
        </div>

        <div className={styles.results} ref={listRef}>
          {results.length === 0 && (
            <p className={styles.empty}>No lesson or page matches that.</p>
          )}
          {results.map((command, index) => {
            const previous = results[index - 1];
            const showGroup = !previous || previous.group !== command.group;
            const badgeClass =
              command.track === 'mechanical'
                ? styles.badgeEngineering
                : command.track === 'software'
                  ? styles.badgeSoftware
                  : styles.badgeAction;
            return (
              <React.Fragment key={command.id}>
                {showGroup && <p className={styles.group}>{command.group}</p>}
                <button
                  type="button"
                  data-index={index}
                  className={`${styles.item} ${index === cursor ? styles.itemActive : ''}`}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => go(command)}
                >
                  <span className={`${styles.badge} ${badgeClass}`}>
                    {command.track === 'action'
                      ? 'Page'
                      : command.track === 'tool'
                        ? 'Tool'
                        : command.track === 'mechanical'
                          ? 'Eng'
                          : 'SW'}
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{command.title}</span>
                    <span className={styles.itemPath}>{command.path}</span>
                  </span>
                  {command.locked && (
                    <span className={styles.lock} title="Sign in required">
                      sign in
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span><kbd>/</kbd> to reopen</span>
        </div>
      </div>
    </div>
  );
}
