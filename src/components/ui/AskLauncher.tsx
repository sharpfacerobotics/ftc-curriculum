import React, {useCallback, useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {animate} from 'animejs';
import {allowed, DUR, EASE} from '@site/src/telemark/motion';
import AskPanel from './AskPanel';
import styles from './AskLauncher.module.css';

/**
 * A standing way to ask, from any page.
 *
 * The panel at the foot of a lesson is where a student ends up after reading.
 * This is for the other case: they are halfway down, stuck now, and should not
 * have to scroll past the thing confusing them to find the box. It stays out
 * of the way until asked for, which is why it is a mark in the corner rather
 * than a bar across the page.
 */
export default function AskLauncher(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const logo = useBaseUrl('img/sharp-ai.svg');

  // Arrives a beat after the page settles, so it reads as something the page
  // offers rather than another element competing with the first paint.
  useEffect(() => {
    if (!button.current || !allowed()) return;
    animate(button.current, {
      opacity: [0, 1],
      scale: [0.82, 1],
      duration: DUR.slow,
      ease: EASE,
      delay: 600,
    });
  }, []);

  useEffect(() => {
    if (!dock.current || !open) return;
    if (!allowed()) return;
    // Grows from the corner it was summoned from rather than sliding in from
    // off screen, so the button and the panel read as the same object.
    animate(dock.current, {
      opacity: [0, 1],
      scale: [0.96, 1],
      translateY: [8, 0],
      duration: DUR.base,
      ease: EASE,
    });
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      {open && (
        <div
          className={styles.dock}
          ref={dock}
          role="dialog"
          aria-modal="false"
          aria-label="Ask Sharp AI"
        >
          <div className={styles.dockHead}>
            <img className={styles.dockLogo} src={logo} alt="" width="20" height="20" />
            {/* Sharp AI is its own product; this panel is one place it shows
                up. The link is how a student finds the rest of it. */}
            <a
              className={styles.dockTitle}
              href="https://sharp-ai-8a1.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sharp AI
              <span className={styles.dockOut} aria-hidden="true"> ↗</span>
            </a>
            <button
              type="button"
              className={styles.dockClose}
              onClick={close}
              aria-label="Close Sharp AI"
            >
              ✕
            </button>
          </div>
          <div className={styles.dockBody}>
            <AskPanel />
          </div>
        </div>
      )}

      <button
        type="button"
        ref={button}
        className={`${styles.launcher} ${open ? styles.launcherOpen : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Close Sharp AI' : 'Ask Sharp AI about this page'}
      >
        <img className={styles.mark} src={logo} alt="" width="28" height="28" />
        <span className={styles.label}>Ask</span>
      </button>
    </>
  );
}
