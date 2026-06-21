import React, {useEffect, useRef, useState} from 'react';
import {trackEvent} from '@site/src/telemark/analytics';

type SimulatorFrameProps = {
  src: string;
  title: string;
  wrapperClassName?: string;
  iframeClassName?: string;
  width?: string;
  height?: string;
  iframeStyle?: React.CSSProperties;
  loading?: 'eager' | 'lazy';
};

export default function SimulatorFrame({
  src,
  title,
  wrapperClassName = 'simulator-wrapper',
  iframeClassName = 'telemark-simulator',
  width,
  height,
  iframeStyle,
  loading = 'lazy',
}: SimulatorFrameProps): React.JSX.Element {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const launchTrackedRef = useRef(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!shellRef.current) return;
    if (document.fullscreenElement === shellRef.current) {
      await document.exitFullscreen();
      return;
    }
    await shellRef.current.requestFullscreen();
    trackEvent('simulator_fullscreen', {simulator: title});
  };

  const trackLaunch = () => {
    if (launchTrackedRef.current) return;
    launchTrackedRef.current = true;
    trackEvent('simulator_launch', {simulator: title});
  };

  return (
    <div className="simulator-fullscreen-shell" ref={shellRef}>
      <div className="simulator-fullscreen-toolbar">
        <button className="simulator-fullscreen-button" type="button" onClick={toggleFullscreen}>
          {isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
        </button>
      </div>
      <div className={wrapperClassName}>
        <iframe
          src={src}
          className={iframeClassName}
          width={width}
          height={height}
          style={iframeStyle}
          title={title}
          loading={loading}
          allowFullScreen
          onLoad={trackLaunch}
        />
      </div>
    </div>
  );
}
