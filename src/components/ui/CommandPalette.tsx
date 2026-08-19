import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useAuth} from '@site/src/telemark/useAuth';
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
  track: 'software' | 'mechanical' | 'action';
  locked: boolean;
}

const ACTIONS: Command[] = [
  {id: 'a-sw', title: 'Software track', path: '/curriculum', group: 'Go to', track: 'action', locked: false},
  {id: 'a-eng', title: 'Engineering track', path: '/mechanical', group: 'Go to', track: 'action', locked: false},
  {id: 'a-paths', title: 'Engineering learning paths', path: '/mechanical/learning-paths', group: 'Go to', track: 'action', locked: false},
  {id: 'a-cad', title: 'CAD practice exercises', path: '/mechanical/cad-practice', group: 'Go to', track: 'action', locked: false},
  {id: 'a-sim', title: 'Simulator', path: '/simulator', group: 'Go to', track: 'action', locked: false},
  {id: 'a-dash', title: 'Dashboard', path: '/dashboard', group: 'Go to', track: 'action', locked: false},
  {id: 'a-search', title: 'Full search page', path: '/search', group: 'Go to', track: 'action', locked: false},
];

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
      })),
    [entries, user],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ACTIONS.concat(lessons.slice(0, 8));
    const scored = ACTIONS.concat(lessons)
      .map((command) => {
        const haystack = `${command.title} ${command.path}`.toLowerCase();
        const index = haystack.indexOf(needle);
        if (index === -1) return null;
        // Earlier matches and title matches rank higher.
        return {command, score: index + (command.track === 'action' ? -20 : 0)};
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
      history.push(command.path);
    },
    [close, history],
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
                    {command.track === 'action' ? 'Page' : command.track === 'mechanical' ? 'Eng' : 'SW'}
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
