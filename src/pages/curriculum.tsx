import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import pageStyles from './index.module.css';
import {
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNIT_COUNT,
  CURRICULUM_UNITS,
} from '../telemark/curriculum';

export default function CurriculumPage(): React.JSX.Element {
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
            {CURRICULUM_UNIT_COUNT} units, {CURRICULUM_LESSON_COUNT} lessons,
            and a dashboard that tracks the same lesson order you see in the docs.
          </p>

          <div className={pageStyles.curriculumGrid}>
            {CURRICULUM_UNITS.map((unit) => (
              <Link to={unit.overviewPath} key={unit.id} className={pageStyles.unitCard}>
                <div className={pageStyles.unitNum}>{unit.label}</div>
                <div className={pageStyles.unitTitle}>{unit.title}</div>
                <div className={pageStyles.unitDesc}>
                  {unit.desc} {unit.lessonCount} lessons are live in this unit.
                </div>
                <span className={`${pageStyles.unitTag} ${pageStyles.tagBasic}`}>
                  {unit.tier}
                </span>
              </Link>
            ))}
          </div>

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
