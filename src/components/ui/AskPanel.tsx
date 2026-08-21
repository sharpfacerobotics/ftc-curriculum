import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {useAuth} from '@site/src/telemark/useAuth';
import {signInWithGoogle} from '@site/src/telemark/googleAuth';
import {askSharpAi, type PageContext} from '@site/src/telemark/askSharpAi';
import {trackEvent} from '@site/src/telemark/analytics';
import styles from './AskPanel.module.css';

interface Message {
  role: 'you' | 'ai';
  text: string;
}

/**
 * A tutor you talk to about the lesson in front of you.
 *
 * It is a conversation rather than a search box because the second question is
 * usually the real one: a student asks what a clearance hole is, then asks why
 * theirs binds anyway. The last turns travel with each question so a follow-up
 * that says "it" has something to point at.
 *
 * It also watches which heading is on screen and says so, because a student
 * needs to know it can see what they are looking at before they will trust it
 * with "why is this 3.2 and not 3.0".
 */
export default function AskPanel(): React.JSX.Element {
  const {user, loading} = useAuth();
  const {pathname} = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [here, setHere] = useState<PageContext | null>(null);
  const abort = useRef<AbortController | null>(null);
  const thread = useRef<HTMLDivElement>(null);

  // A new lesson is a new conversation. Carrying the previous thread under a
  // different heading invites reading it as being about this page.
  useEffect(() => {
    setMessages([]);
  }, [pathname]);

  // Tracked while scrolling so the panel can show what it is looking at, not
  // only use it silently when a question is sent.
  useEffect(() => {
    const update = () => setHere(currentPage());
    update();
    window.addEventListener('scroll', update, {passive: true});
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);

  useEffect(() => {
    thread.current?.scrollTo({top: thread.current.scrollHeight});
  }, [messages]);

  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy || !user) return;

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    // Only complete exchanges are context; the turn in flight is the question.
    const history = pairsFrom(messages);
    setMessages((prev) => [...prev, {role: 'you', text}, {role: 'ai', text: ''}]);
    setDraft('');
    setBusy(true);

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch {
      replaceLast(setMessages, 'Could not confirm your sign-in. Try again.');
      setBusy(false);
      return;
    }

    trackEvent('ai_question_asked', {surface: 'lesson_chat'});

    await askSharpAi(
      text,
      {idToken, page: currentPage(), history, signal: controller.signal},
      {
        onToken: (t) =>
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {role: 'ai', text: next[next.length - 1].text + t};
            return next;
          }),
        onError: (message) => replaceLast(setMessages, message),
      },
    );
    setBusy(false);
  }, [draft, busy, user, messages]);

  if (loading) return <div className={styles.panel} aria-hidden="true" />;

  if (!user) {
    return (
      <section className={styles.panel}>
        <p className={styles.title}>Stuck on this lesson?</p>
        <p className={styles.blurb}>
          Sign in and ask. It can see which lesson you have open and which part
          you are reading, so you can ask about what is in front of you.
        </p>
        <button type="button" className={styles.signIn} onClick={() => signInWithGoogle()}>
          Sign in to ask
        </button>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      {here && (
        <p className={styles.here}>
          <span className={styles.hereDot} aria-hidden="true" />
          Reading {here.title}
          {here.section ? <> · {here.section}</> : null}
        </p>
      )}

      <div className={styles.thread} ref={thread} aria-live="polite">
        {messages.length === 0 && (
          <p className={styles.empty}>
            Ask anything about this lesson. Try &ldquo;explain this part again&rdquo; or
            &ldquo;why does that number matter&rdquo;.
          </p>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={message.role === 'you' ? styles.fromYou : styles.fromAi}
          >
            {message.text === '' ? (
              <span className={styles.typing} aria-label="Thinking">
                <span className={styles.typingDot} />
              </span>
            ) : (
              message.text.split('\n').filter(Boolean).map((line, n) => <p key={n}>{line}</p>)
            )}
          </div>
        ))}
      </div>

      <div className={styles.row}>
        <input
          className={styles.input}
          value={draft}
          placeholder="Ask about this lesson"
          aria-label="Ask about this lesson"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
        />
        <button
          type="button"
          className={styles.askBtn}
          onClick={() => void send()}
          disabled={busy || draft.trim().length === 0}
        >
          {busy ? '...' : 'Send'}
        </button>
      </div>

      <p className={styles.limit}>
        It can be wrong. Check anything you are about to cut or buy against the
        lesson.
      </p>
    </section>
  );
}

function replaceLast(
  set: React.Dispatch<React.SetStateAction<Message[]>>,
  text: string,
): void {
  set((prev) => {
    const next = [...prev];
    next[next.length - 1] = {role: 'ai', text};
    return next;
  });
}

/** Completed question and answer pairs, oldest first. */
function pairsFrom(messages: Message[]): {question: string; answer: string}[] {
  const pairs: {question: string; answer: string}[] = [];
  for (let i = 0; i < messages.length - 1; i += 1) {
    if (messages[i].role === 'you' && messages[i + 1].role === 'ai' && messages[i + 1].text) {
      pairs.push({question: messages[i].text, answer: messages[i + 1].text});
    }
  }
  return pairs.slice(-2);
}

/** The lesson title plus the heading nearest the top of the viewport. */
function currentPage(): PageContext | null {
  if (typeof document === 'undefined') return null;
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  let section = '';
  for (const heading of Array.from(
    document.querySelectorAll('.theme-doc-markdown h2, .theme-doc-markdown h3'),
  )) {
    if (heading.getBoundingClientRect().top > 140) break;
    // Docusaurus appends a zero width character to every heading for its
    // anchor link, which would travel into the prompt as noise.
    section = heading.textContent?.replace(/[#\u200b]/g, '').trim() || section;
  }
  return {title, section, url: window.location.href};
}
