import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {CHANGELOG, formatChangeDate} from '@site/src/telemark/changelog';
import styles from './changelog.module.css';

/**
 * Everything that has changed, in full.
 *
 * The homepage card only carries what is new to one reader; this is the whole
 * record, so a returning student can find the thing they half remember.
 */
export default function Changelog(): React.JSX.Element {
  return (
    <Layout
      title="Changelog"
      description="What has changed on Telemark: the curriculum, the simulators, and the design tools."
    >
      <main className={styles.page}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Changelog</p>
          <h1 className={styles.title}>What has changed</h1>
          <p className={styles.blurb}>
            Only changes that alter what you can do. Newest first.
          </p>
        </header>

        <ol className={styles.list}>
          {CHANGELOG.map((entry) => (
            <li key={entry.date + entry.title} className={styles.entry}>
              <div className={styles.meta}>
                <time dateTime={entry.date} className={styles.date}>
                  {formatChangeDate(entry.date)}
                </time>
                <span className={styles.kind}>{entry.kind}</span>
              </div>
              <div>
                <h2 className={styles.entryTitle}>{entry.title}</h2>
                <p className={styles.body}>{entry.body}</p>
                {entry.href && (
                  <Link className={styles.go} to={entry.href}>
                    Try it →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </main>
    </Layout>
  );
}
