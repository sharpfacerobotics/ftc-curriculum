import React from 'react';
import styles from './LessonPhoto.module.css';

export interface LessonPhotoProps {
  /**
   * Path under static/, for example 'img/mechanical/stripped-thread.jpg'.
   * When omitted, the component renders the shot request instead, so the
   * lesson stays useful and the gap stays visible.
   */
  src?: string;
  /** Required. Describes the photograph for anyone who cannot see it. */
  alt: string;
  /** Shown under the image. Says what the reader should notice. */
  caption: string;
  /** What to photograph, precise enough that someone can go and shoot it. */
  shot: string;
  /** Framing guidance: distance, lighting, what must be in frame. */
  framing?: string;
  credit?: string;
}

/**
 * A photograph in a lesson, or a request for one.
 *
 * Real photographs of real failures teach faster than any drawing: a stripped
 * thread or a bound slide is instantly recognisable once seen. Rather than
 * fabricating images, this component renders a labelled request describing
 * exactly what to shoot, and swaps to the photograph once a team supplies one.
 */
export default function LessonPhoto({
  src,
  alt,
  caption,
  shot,
  framing,
  credit,
}: LessonPhotoProps): React.JSX.Element {
  return (
    <figure className={styles.figure}>
      {src ? (
        <img
          className={styles.image}
          src={useBaseUrlSafe(src)}
          alt={alt}
          loading="lazy"
        />
      ) : (
        <div className={styles.placeholder} role="note" aria-label={`Photograph needed: ${shot}`}>
          <span className={styles.placeholderLabel}>Photograph needed</span>
          <span className={styles.shot}>{shot}</span>
          {framing && <span className={styles.shotMeta}>Framing: {framing}</span>}
          <span className={styles.shotMeta}>
            Add the file to static/ and pass its path as the src prop.
          </span>
        </div>
      )}
      <figcaption className={styles.caption}>
        {caption}
        {credit && <span className={styles.credit}>Photo: {credit}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Prefixes the site base URL without pulling in a hook, so the component can be
 * rendered in the Node test harness.
 */
function useBaseUrlSafe(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `/telemark/${src.replace(/^\/+/, '')}`;
}
