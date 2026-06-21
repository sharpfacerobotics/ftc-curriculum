import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {useHistory} from '@docusaurus/router';
import Layout from '@theme/Layout';
import pageStyles from './index.module.css';
import {useAuth} from '../telemark/useAuth';
import {signInWithGoogle} from '../telemark/googleAuth';
import {trackEvent} from '../telemark/analytics';
import {isProtectedUnit} from '../telemark/accessPolicy';
import {
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNIT_COUNT,
  CURRICULUM_UNITS,
} from '../telemark/curriculum';

export default function CurriculumPage(): React.JSX.Element {
  const {user} = useAuth();
  const history = useHistory();
  const [unlockingUnit, setUnlockingUnit] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  async function unlockUnit(unit: (typeof CURRICULUM_UNITS)[number]) {
    const unitNumber = Number.parseInt(unit.slug.replace('unit-', ''), 10);
    setUnlockingUnit(unit.slug);
    setUnlockError(null);
    trackEvent('content_unlock_attempt', {
      unit_number: unitNumber,
      surface: 'curriculum_page_card',
    });

    try {
      await signInWithGoogle();
      trackEvent('content_unlock_success', {
        unit_number: unitNumber,
        surface: 'curriculum_page_card',
      });
      history.push(unit.overviewPath);
    } catch (signInError) {
      console.error('Telemark unit unlock failed:', signInError);
      setUnlockError('Sign-in did not finish. Select a locked unit to try again.');
    } finally {
      setUnlockingUnit(null);
    }
  }

  return (
    <Layout title="Curriculum — Telemark" noFooter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />

      <main className={pageStyles.lp}>
        <div className={pageStyles.gridBg} aria-hidden="true" />
        <div className={pageStyles.scanline} aria-hidden="true" />
        <div className={`${pageStyles.cornerAccent} ${pageStyles.tl}`} aria-hidden="true" />
        <div className={`${pageStyles.cornerAccent} ${pageStyles.tr}`} aria-hidden="true" />
        <div className={`${pageStyles.cornerAccent} ${pageStyles.bl}`} aria-hidden="true" />
        <div className={`${pageStyles.cornerAccent} ${pageStyles.br}`} aria-hidden="true" />

        <section className={pageStyles.section}>
          <p className={pageStyles.sectionLabel}>// curriculum.live[]</p>
          <h1 className={pageStyles.sectionTitle}>Live Curriculum</h1>
          <p className={pageStyles.sectionDesc}>
            {CURRICULUM_UNIT_COUNT} units and {CURRICULUM_LESSON_COUNT} lessons,
            organized in the same sequence used throughout the docs and dashboard.
          </p>

          <div className={pageStyles.curriculumGrid}>
            {CURRICULUM_UNITS.map((unit) => {
              const unitNumber = Number.parseInt(unit.slug.replace('unit-', ''), 10);
              const locked = !user && isProtectedUnit(unitNumber);
              const cardContent = (
                <>
                <div className={pageStyles.unitNum}>{unit.label}</div>
                <div className={pageStyles.unitTitle}>{unit.title}</div>
                <div className={pageStyles.unitDesc}>
                  {unit.desc} {unit.lessonCount} lessons are currently available in this unit.
                </div>
                <span className={`${pageStyles.unitTag} ${locked ? pageStyles.tagLocked : pageStyles.tagBasic}`}>
                  {locked && <i className="fa-solid fa-lock" aria-hidden="true" />}
                  {' '}
                  {locked ? 'Account required' : unit.tier}
                </span>
                </>
              );

              if (locked) {
                return (
                  <button
                    type="button"
                    key={unit.id}
                    className={`${pageStyles.unitCard} ${pageStyles.unitCardLocked}`}
                    onClick={() => unlockUnit(unit)}
                    disabled={unlockingUnit === unit.slug}
                    aria-label={`Sign in to unlock ${unit.label}: ${unit.title}`}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link to={unit.overviewPath} key={unit.id} className={pageStyles.unitCard}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
          {unlockError && <p className={pageStyles.unlockError}>{unlockError}</p>}

          <div className={pageStyles.heroActions}>
            <Link to={CURRICULUM_UNITS[0].startPath} className={pageStyles.btnPrimary}>
              Begin Unit 1
            </Link>
            <Link to="/dashboard" className={pageStyles.btnSecondary}>
              Open Dashboard
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
