import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './MarkComplete.module.css';

interface MarkCompleteProps {
  nextUnit: string;       // e.g. "/docs/unit-02/intro"
  nextUnitName: string;   // e.g. "Unit 2: OpMode Structure"
}

export default function MarkComplete({
  nextUnit,
  nextUnitName,
}: MarkCompleteProps): React.JSX.Element {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successHeader}>
          <span className={styles.successIcon} aria-hidden="true">✓</span>
          <span className={styles.successTitle}>Unit Complete</span>
        </div>
        <p className={styles.successMsg}>
          Nice work. You've marked this unit as complete — hold yourself to it.
        </p>
        <Link to={nextUnit} className={styles.nextBtn}>
          Proceed to {nextUnitName} →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.completeBox}>
      <div className={styles.completeInner}>
        <div className={styles.completeText}>
          <p className={styles.completeTitle}>Ready to move on?</p>
          <p className={styles.completeDesc}>
            Only mark complete if you genuinely understand the material.
            There are no shortcuts in competition.
          </p>
        </div>
        <button className={styles.completeBtn} onClick={() => setDone(true)}>
          Mark as Complete
        </button>
      </div>
    </div>
  );
}