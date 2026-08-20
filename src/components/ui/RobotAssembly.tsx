import React from 'react';
import styles from './RobotAssembly.module.css';

/**
 * A robot drawing itself into place, part by part.
 *
 * Line art rather than a rendered video: the page is one accent on near black,
 * and a photographic robot would be the only full-colour object on the site.
 * White strokes on the page background keep it in the same register as the
 * rest of the page, and it costs a few kilobytes instead of a download.
 *
 * The order is the order a robot is actually built, which is also the order the
 * mechanical track teaches: chassis, drivetrain, then the mechanisms that sit
 * on top of it. Each part settles into place on opacity and transform only, so
 * nothing animates a layout property and the whole loop stays on the
 * compositor.
 */
export default function RobotAssembly(): React.JSX.Element {
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.svg}
        viewBox="0 0 320 240"
        role="img"
        aria-label="A line drawing of an FTC robot assembling itself: chassis, wheels, linear slide, and intake."
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Build plate */}
          <g className={`${styles.part} ${styles.p1}`} strokeWidth="1.6">
            <rect x="70" y="150" width="180" height="46" rx="4" />
            <path d="M70 173h180" strokeWidth="0.8" opacity="0.45" />
          </g>

          {/* Drivetrain */}
          <g className={`${styles.part} ${styles.p2}`} strokeWidth="1.6">
            <circle cx="102" cy="196" r="18" />
            <circle cx="102" cy="196" r="6" strokeWidth="1" />
            <circle cx="218" cy="196" r="18" />
            <circle cx="218" cy="196" r="6" strokeWidth="1" />
            <path d="M102 214h116" strokeWidth="0.8" opacity="0.4" />
          </g>

          {/* Uprights and cross brace */}
          <g className={`${styles.part} ${styles.p3}`} strokeWidth="1.6">
            <path d="M96 150V78M224 150V78" />
            <path d="M96 104h128" strokeWidth="1" opacity="0.6" />
          </g>

          {/* Linear slide, drawn extended */}
          <g className={`${styles.part} ${styles.p4}`} strokeWidth="1.6">
            <rect x="140" y="44" width="40" height="106" rx="3" />
            <path d="M150 60v78M170 60v78" strokeWidth="0.8" opacity="0.5" />
          </g>

          {/* Intake */}
          <g className={`${styles.part} ${styles.p5}`} strokeWidth="1.6">
            <path d="M180 62h44a10 10 0 0 1 10 10v16" />
            <circle cx="234" cy="98" r="11" />
            <path d="M234 91v14" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* Measurement marks, the last thing added to any real drawing */}
          <g className={`${styles.part} ${styles.p6}`} strokeWidth="0.8" opacity="0.5">
            <path d="M70 214v10M250 214v10M70 219h180" />
            <path d="M262 44v152M258 44h8M258 196h8" />
          </g>
        </g>
      </svg>
      <figcaption className={styles.caption}>
        Chassis, drivetrain, structure, slide, intake. The order the track
        teaches, and the order a robot survives being built in.
      </figcaption>
    </figure>
  );
}
