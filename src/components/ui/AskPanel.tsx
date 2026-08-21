import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {useAuth} from '@site/src/telemark/useAuth';
import {signInWithGoogle} from '@site/src/telemark/googleAuth';
import {askSharpAi, type Citation} from '@site/src/telemark/askSharpAi';
import {trackEvent} from '@site/src/telemark/analytics';
import styles from './AskPanel.module.css';

/**
 * Ask a question about the lesson you are reading.
 *
 * The panel sends the page title and the nearest heading along with the
 * question. That is the difference between a search box and a tutor: a student
 * looking at the clearance table asks "why is this 3.2 and not 3.0", and
 * without knowing what "this" is, the question is unanswerable.
 *
 * Answers are grounded in the curriculum and the official FTC documentation,
 * and every answer carries its sources, because a confident wrong answer about
 * a hole size is worse than no answer: the student cannot tell.
 */
export default function AskPanel(): React.JSX.Element {
  const {user, loading} = useAuth();
  const {pathname} = useLocation();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  // A new lesson is a new conversation. Leaving the previous answer up under a
  // different heading invites reading it as an answer about this page.
  useEffect(() => {
    setAnswer('');
    setCitations([]);
    setError(null);
  }, [pathname]);

  useEffect(() => () => abort.current?.abort(), []);

  const ask = useCallback(async () => {
    const text = question.trim();
    if (!text || busy || !user) return;

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    setBusy(true);
    setAnswer('');
    setCitations([]);
    setError(null);

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch {
      setError('Could not confirm your sign-in. Try again.');
      setBusy(false);
      return;
    }

    trackEvent('ai_question_asked', {surface: 'lesson_panel'});

    await askSharpAi(
      text,
      {idToken, page: currentPage(), signal: controller.signal},
      {
        onMeta: setCitations,
        onToken: (t) => setAnswer((prev) => prev + t),
        onError: (message) => setError(message),
      },
    );
    setBusy(false);
  }, [question, busy, user]);

  if (loading) return <div className={styles.panel} aria-hidden="true" />;

  if (!user) {
    return (
      <section className={styles.panel}>
        <p className={styles.title}>Stuck on this lesson?</p>
        <p className={styles.blurb}>
          Sign in to ask about anything on this page. Answers come from these
          lessons and the official FTC documentation, with links to where they
          came from.
        </p>
        <button type="button" className={styles.signIn} onClick={() => signInWithGoogle()}>
          Sign in to ask
        </button>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <p className={styles.title}>Ask about this lesson</p>
      <div className={styles.row}>
        <input
          className={styles.input}
          value={question}
          placeholder="Why is the clearance hole 3.2 and not 3.0?"
          aria-label="Ask a question about this lesson"
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void ask();
          }}
        />
        <button
          type="button"
          className={styles.askBtn}
          onClick={() => void ask()}
          disabled={busy || question.trim().length === 0}
        >
          {busy ? 'Thinking' : 'Ask'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {answer && (
        <div className={styles.answer}>
          {answer.split('\n').filter(Boolean).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {citations.length > 0 && (
        <>
          <p className={styles.sourcesLabel}>Sources</p>
          <ol className={styles.sources}>
            {citations.map((c) => (
              <li key={c.n}>
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.title || c.url}
                </a>
                {c.sourceName && <span className={styles.sourceName}> {c.sourceName}</span>}
              </li>
            ))}
          </ol>
        </>
      )}

      <p className={styles.limit}>
        Answers are generated and can be wrong. Check them against the lesson
        before you cut metal.
      </p>
    </section>
  );
}

/** Title plus the heading nearest the top of the viewport. */
function currentPage() {
  if (typeof document === 'undefined') return undefined;
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  let section = '';
  for (const heading of Array.from(document.querySelectorAll('.theme-doc-markdown h2, .theme-doc-markdown h3'))) {
    if (heading.getBoundingClientRect().top > 120) break;
    section = heading.textContent?.replace('#', '').trim() || section;
  }
  return {title, section, url: window.location.href};
}
