import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import styles from './ReadingProgress.module.css';

/**
 * How far through the lesson you are.
 *
 * Engineering lessons run long, and a bar at the top answers "how much is
 * left" without scrolling to find out. Only shown on lesson routes, since it
 * means nothing on the homepage or the dashboard.
 */
export default function ReadingProgress(): React.JSX.Element | null {
  const {pathname} = useLocation();
  const [percent, setPercent] = useState(0);

  const onLesson = /\/(docs|engineering)\//.test(pathname);

  useEffect(() => {
    if (!onLesson) return undefined;

    function update() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setPercent(scrollable > 0 ? Math.min((doc.scrollTop / scrollable) * 100, 100) : 0);
    }

    update();
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [onLesson, pathname]);

  if (!onLesson) return null;

  return (
    <div
      className={`${styles.bar} ${percent < 0.5 ? styles.hidden : ''}`}
      style={{width: `${percent}%`}}
      role="progressbar"
      aria-label="Lesson reading progress"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}
