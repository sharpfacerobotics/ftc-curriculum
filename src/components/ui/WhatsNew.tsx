import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useColorMode} from '@docusaurus/theme-common';
import {LATEST_RELEASE} from '@site/src/telemark/changelog';
import styles from './WhatsNew.module.css';

export const DISMISSED_VERSION_KEY = 'telemark.whatsNew.dismissedVersion';

function readDismissedVersion(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_VERSION_KEY);
  } catch {
    return null;
  }
}

function rememberDismissal(version: string): void {
  try {
    window.localStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch {
    // The modal still closes for this page view. It returns on the next visit
    // because the browser did not allow a permanent dismissal to be stored.
  }
}

export default function WhatsNew(): React.JSX.Element | null {
  const {colorMode} = useColorMode();
  const [isOpen, setIsOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLElement>(null);
  const dismissRef = React.useRef<HTMLButtonElement>(null);
  const lightImageSrc = useBaseUrl(LATEST_RELEASE.image ?? '/img/releases/1.9.png');
  const darkImageSrc = useBaseUrl(
    LATEST_RELEASE.darkImage
      ?? LATEST_RELEASE.image
      ?? '/img/releases/1.9(black).png',
  );
  const imageSrc = colorMode === 'light' ? lightImageSrc : darkImageSrc;
  const changelogHref = useBaseUrl('/changelog');

  React.useEffect(() => {
    setIsOpen(readDismissedVersion() !== LATEST_RELEASE.version);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dismissRef.current?.focus();

    const keepFocusInDialog = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (controls.length === 0) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', keepFocusInDialog);
    return () => {
      document.removeEventListener('keydown', keepFocusInDialog);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dismiss = (): void => {
    rememberDismissal(LATEST_RELEASE.version);
    setIsOpen(false);
  };

  return (
    <div className={styles.backdrop}>
      <section
        ref={dialogRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-heading"
        aria-describedby="whats-new-summary"
      >
        <button
          ref={dismissRef}
          type="button"
          className={styles.dismiss}
          onClick={dismiss}
          aria-label={`Dismiss Telemark version ${LATEST_RELEASE.version} announcement`}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className={styles.content}>
          <p className={styles.eyebrow}>New in Telemark {LATEST_RELEASE.version}</p>
          <h2 className={styles.title} id="whats-new-heading">
            {LATEST_RELEASE.title}
          </h2>
          <p className={styles.body} id="whats-new-summary">
            {LATEST_RELEASE.body}
          </p>

          <ul className={styles.list}>
            {LATEST_RELEASE.additions.map((addition) => (
              <li key={addition}>{addition}</li>
            ))}
          </ul>

          <div className={styles.actions}>
            {LATEST_RELEASE.href && (
              <Link className={styles.primary} to={LATEST_RELEASE.href}>
                Try multi-file projects
              </Link>
            )}
            <Link className={styles.all} to={changelogHref}>
              See all changes
            </Link>
          </div>
        </div>

        <div className={styles.visual}>
          <img
            className={styles.image}
            src={imageSrc}
            alt={LATEST_RELEASE.imageAlt ?? ''}
          />
        </div>
      </section>
    </div>
  );
}
