import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  CHANGELOG,
  LATEST_CHANGE,
  changesSince,
  type ChangeEntry,
} from '@site/src/telemark/changelog';
import styles from './WhatsNew.module.css';

const SEEN_KEY = 'telemark.lastSeenChange';

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    // Private windows and blocked site data both throw here. A missing card is
    // the correct outcome; a crashed homepage is not.
    return null;
  }
}

function writeSeen(value: string): void {
  try {
    window.localStorage.setItem(SEEN_KEY, value);
  } catch {
    /* nothing to do: the card simply shows again next time */
  }
}

/**
 * A card for someone who has been here before.
 *
 * It answers the question a returning student actually has, which is not "what
 * is this site" but "what is different since I last looked". A first-time
 * visitor gets nothing at all: a list of changes is only meaningful against a
 * version of the site you already remember.
 *
 * The check runs after mount, never during render, because it reads storage
 * that does not exist on the server and would otherwise differ between the
 * HTML that is served and the HTML that hydrates.
 */
export default function WhatsNew(): React.JSX.Element | null {
  const [entries, setEntries] = React.useState<readonly ChangeEntry[]>([]);
  const changelogHref = useBaseUrl('/changelog');

  React.useEffect(() => {
    const seen = readSeen();
    if (!seen) {
      // First visit: record where they came in, so the next real change shows.
      writeSeen(LATEST_CHANGE);
      return;
    }
    setEntries(changesSince(seen));
  }, []);

  if (entries.length === 0) return null;

  const dismiss = (): void => {
    writeSeen(LATEST_CHANGE);
    setEntries([]);
  };

  return (
    <aside className={styles.card} aria-labelledby="whats-new-heading">
      <div className={styles.head}>
        <p className={styles.eyebrow} id="whats-new-heading">
          New since you were last here
        </p>
        <button
          type="button"
          className={styles.dismiss}
          onClick={dismiss}
          aria-label="Dismiss what is new"
        >
          Got it
        </button>
      </div>

      <ul className={styles.list}>
        {entries.slice(0, 4).map((entry) => (
          <li key={entry.date + entry.title} className={styles.item}>
            <span className={styles.kind} data-kind={entry.kind}>
              {entry.kind}
            </span>
            <div>
              <p className={styles.title}>
                {entry.href ? (
                  <Link to={entry.href}>{entry.title}</Link>
                ) : (
                  entry.title
                )}
              </p>
              <p className={styles.body}>{entry.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {(entries.length > 4 || CHANGELOG.length > entries.length) && (
        <Link className={styles.all} to={changelogHref}>
          Everything that has changed →
        </Link>
      )}
    </aside>
  );
}
