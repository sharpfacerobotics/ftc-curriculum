import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  CHANGELOG,
  LATEST_CHANGE,
  changesSince,
  hasUsedSiteBefore,
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
    if (seen) {
      setEntries(changesSince(seen));
      return;
    }

    // No record of a previous visit. That is either a genuinely new reader or
    // somebody who was using the site before this card existed, and the two
    // look identical from the date alone. Saved progress or a saved draft
    // tells them apart, and without this check every reader the site already
    // had was told nothing had changed.
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    if (hasUsedSiteBefore(storage)) {
      setEntries(CHANGELOG.slice(0, 4));
      return;
    }

    // A genuinely new reader. Record where they came in and show nothing: a
    // list of changes means nothing without a version of the site to compare
    // it against.
    writeSeen(LATEST_CHANGE);
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
