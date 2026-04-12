import React, { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';
import styles from './login.module.css';

export default function LoginPage(): React.JSX.Element {
  const { user, loading } = useAuth();
  const history           = useHistory();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      history.push('/ftc-curriculum/dashboard');
    }
  }, [user, loading, history]);

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, provider);
      history.push('/ftc-curriculum/dashboard');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Layout title="Sign In — Telemark" noFooter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap"
        rel="stylesheet"
      />

      <main className={styles.page}>
        <div className={styles.gridBg}   aria-hidden="true" />
        <div className={styles.scanline} aria-hidden="true" />

        <div className={styles.card}>
          {/* Corner accents */}
          <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.br}`} aria-hidden="true" />

          {/* Logo hex */}
          <div className={styles.logoWrap}>
            <svg width="56" height="56" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path
                d="M18 2L32 10V26L18 34L4 26V10L18 2Z"
                stroke="url(#lg)"
                strokeWidth="1.5"
                fill="rgba(0,191,255,0.06)"
              />
              <text
                x="18" y="22"
                textAnchor="middle"
                fontFamily="Rajdhani, sans-serif"
                fontWeight="700"
                fontSize="10"
                fill="#00BFFF"
              >
                EHS
              </text>
              <defs>
                <linearGradient id="lg" x1="4" y1="2" x2="32" y2="34">
                  <stop stopColor="#00BFFF" />
                  <stop offset="1" stopColor="#39FF14" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <p className={styles.eyebrow}>Powered by</p>
          <h1 className={styles.brand}>Telemark</h1>
          <p className={styles.sub}>
            Sign in to track your progress across the live curriculum and pick
            up exactly where you left off.
          </p>

          <button className={styles.googleBtn} onClick={handleSignIn}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
            </svg>
            Continue with Google
          </button>

          <p className={styles.privacy}>
            Your progress is private and only visible to you.
          </p>
        </div>
      </main>
    </Layout>
  );
}
