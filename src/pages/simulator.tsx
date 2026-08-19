import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import pageStyles from './simulator.module.css';
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
            <Link to="/docs/unit-00/classes-and-objects" className={pageStyles.btnPrimary}>
              Begin Unit 0
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
