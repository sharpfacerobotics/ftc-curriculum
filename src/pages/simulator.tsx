import React, { useRef } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import pageStyles from './index.module.css';
import { trackEvent } from '../telemark/analytics';

export default function SimulatorPage(): React.JSX.Element {
  const simulatorRef = useRef<HTMLDivElement>(null);
  const launchTrackedRef = useRef(false);

  const openFullscreen = () => {
    if (document.fullscreenElement === simulatorRef.current) {
      document.exitFullscreen();
      return;
    }
    simulatorRef.current?.requestFullscreen();
    trackEvent('simulator_fullscreen', { simulator: 'simulator_page_navigator' });
  };

  const trackLaunch = () => {
    if (launchTrackedRef.current) return;
    launchTrackedRef.current = true;
    trackEvent('simulator_launch', { simulator: 'simulator_page_navigator' });
  };

  return (
    <Layout title="Simulator — Telemark" noFooter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
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

          <div className={pageStyles.simulatorToolbar}>
            <button
              type="button"
              className={pageStyles.simulatorToolbarButton}
              onClick={openFullscreen}
            >
              <i className="fa-solid fa-expand" aria-hidden="true" />
              Fullscreen Simulator
            </button>
          </div>

          <div className={pageStyles.simulatorWrapper} ref={simulatorRef}>
            <iframe
              src="/telemark/simulator/navigator.html"
              allowFullScreen
              allow="fullscreen"
              title="Telemark Simulator"
              scrolling="yes"
              onLoad={trackLaunch}
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
