import React, {useEffect, useMemo, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {signInWithGoogle} from '@site/src/telemark/googleAuth';
import {trackEvent} from '@site/src/telemark/analytics';
import {useAuth} from '@site/src/telemark/useAuth';
import {
  isSimulatorAuthRequest,
  SIMULATOR_AUTH_STATE,
  type SimulatorAuthStateMessage,
} from '@site/src/telemark/accessPolicy';

interface AuthenticatedSimulatorNavigatorProps {
  simulatorId: string;
  wrapperClassName: string;
  toolbarClassName: string;
  toolbarButtonClassName: string;
  allowHomepageDemos?: boolean;
}

export default function AuthenticatedSimulatorNavigator({
  simulatorId,
  wrapperClassName,
  toolbarClassName,
  toolbarButtonClassName,
  allowHomepageDemos = false,
}: AuthenticatedSimulatorNavigatorProps): React.JSX.Element {
  const {user, loading} = useAuth();
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const launchTrackedRef = useRef(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const navigatorUrl = useBaseUrl('/simulator/navigator.html');
  const authenticated = Boolean(user);
  const iframeSrc = useMemo(
    () => {
      const params = new URLSearchParams({
        authenticated: authenticated ? '1' : '0',
      });
      if (allowHomepageDemos) params.set('homepageDemos', '1');
      return `${navigatorUrl}?${params.toString()}`;
    },
    [allowHomepageDemos, authenticated, navigatorUrl],
  );

  function sendAuthState() {
    const message: SimulatorAuthStateMessage = {
      type: SIMULATOR_AUTH_STATE,
      authenticated,
    };
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }

  useEffect(() => {
    if (loading) return;
    sendAuthState();
  }, [authenticated, loading]);

  useEffect(() => {
    async function handleMessage(event: MessageEvent<unknown>) {
      if (
        event.origin !== window.location.origin
        || event.source !== iframeRef.current?.contentWindow
        || !isSimulatorAuthRequest(event.data)
      ) {
        return;
      }

      const {unit, destination = 'unknown'} = event.data;
      trackEvent('simulator_gate_request', {
        unit_number: unit,
        simulator: simulatorId,
        destination,
      });

      if (user) {
        sendAuthState();
        return;
      }

      setSignInError(null);
      trackEvent('content_unlock_attempt', {
        unit_number: unit,
        surface: 'simulator_navigator',
      });

      try {
        await signInWithGoogle();
        trackEvent('content_unlock_success', {
          unit_number: unit,
          surface: 'simulator_navigator',
        });
      } catch (signInError) {
        console.error('Telemark simulator unlock failed:', signInError);
        setSignInError('Sign-in did not finish. Select the locked simulator to try again.');
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [simulatorId, user]);

  async function openFullscreen() {
    if (document.fullscreenElement === shellRef.current) {
      await document.exitFullscreen();
      return;
    }

    await shellRef.current?.requestFullscreen();
    trackEvent('simulator_fullscreen', {simulator: simulatorId});
  }

  function handleLoad() {
    sendAuthState();
    if (launchTrackedRef.current) return;
    launchTrackedRef.current = true;
    trackEvent('simulator_launch', {simulator: simulatorId});
  }

  return (
    <>
      <div className={toolbarClassName}>
        <button
          type="button"
          className={toolbarButtonClassName}
          onClick={openFullscreen}
        >
          <i className="fa-solid fa-expand" aria-hidden="true" />
          Fullscreen Simulator
        </button>
      </div>

      <div className={wrapperClassName} ref={shellRef}>
        {loading ? (
          <div
            role="status"
            style={{
              display: 'grid',
              height: '100%',
              placeItems: 'center',
              color: 'rgba(232, 244, 255, 0.55)',
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '12px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Checking simulator access…
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={iframeSrc}
            src={iframeSrc}
            allowFullScreen
            allow="fullscreen"
            title="Telemark Simulator"
            scrolling="yes"
            onLoad={handleLoad}
          />
        )}
      </div>

      {signInError && (
        <p
          role="alert"
          style={{
            margin: '0.75rem 0 0',
            color: '#ff9d7a',
            fontSize: '13px',
          }}
        >
          {signInError}
        </p>
      )}
    </>
  );
}
