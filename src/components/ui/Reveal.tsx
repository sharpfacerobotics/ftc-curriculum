import React from 'react';
import {useReveal} from './useReveal';
import styles from './Reveal.module.css';

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * `delayMs` staggers siblings so a grid arrives as a sequence rather than all
 * at once, which reads as intentional rather than as a page still loading.
 */
export default function Reveal({
  children,
  delayMs = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: React.ReactNode;
  delayMs?: number;
  as?: 'div' | 'section' | 'li';
  className?: string;
}): React.JSX.Element {
  const {ref, revealed} = useReveal<HTMLElement>();
  // The element type varies, so the ref is widened to HTMLElement here rather
  // than making the whole component generic for no practical gain.
  const Element = Tag as React.ElementType;

  return (
    <Element
      ref={ref}
      className={`${styles.reveal} ${revealed ? styles.revealed : ''} ${className}`}
      style={revealed && delayMs ? {transitionDelay: `${delayMs}ms`} : undefined}
    >
      {children}
    </Element>
  );
}
