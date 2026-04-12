import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import pageStyles from './index.module.css';

export default function SimulatorPage(): React.JSX.Element {
  return (
    <Layout title="Simulator — Telemark" noFooter>
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
          <p className={pageStyles.sectionLabel}>// simulator.live[]</p>
          <h1 className={pageStyles.sectionTitle}>Telemark Simulator</h1>
          <p className={pageStyles.sectionDesc}>
            Launch the browser-based simulator here, then jump back into the
            curriculum whenever you want more guided practice.
          </p>

          <div className={pageStyles.simulatorWrapper}>
            <iframe
              src="/ftc-curriculum/simulator/index.html"
              allowFullScreen
              title="Telemark Simulator"
              scrolling="no"
            />
          </div>

          <div className={pageStyles.heroActions}>
            <Link to="/curriculum" className={pageStyles.btnSecondary}>
              View Curriculum
            </Link>
            <Link to="/docs/unit-01/prerequisites" className={pageStyles.btnPrimary}>
              Begin Unit 1
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
