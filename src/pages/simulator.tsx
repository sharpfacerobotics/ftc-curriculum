import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import pageStyles from './index.module.css';
import AuthenticatedSimulatorNavigator from '../components/AuthenticatedSimulatorNavigator';
import SimulatorWorkflow from '../components/SimulatorWorkflow';

export default function SimulatorPage(): React.JSX.Element {
  return (
    <Layout title="Simulator — Telemark" noFooter>
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
            Write Java, run the same Init and Start sequence used in FTC, then
            compare telemetry, requirements, and robot behavior as you debug.
          </p>
          <SimulatorWorkflow
            className={pageStyles.simulatorWorkflow}
            itemClassName={pageStyles.simulatorStep}
            taskClassName={pageStyles.simulatorTasks}
          />
          <p className={pageStyles.simulatorLimit}>
            Simulation checks code and modeled behavior. Use a physical robot
            to verify wiring, motor direction, traction, and final tuning.
          </p>

          <AuthenticatedSimulatorNavigator
            simulatorId="simulator_page_navigator"
            wrapperClassName={pageStyles.simulatorWrapper}
            toolbarClassName={pageStyles.simulatorToolbar}
            toolbarButtonClassName={pageStyles.simulatorToolbarButton}
          />

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
