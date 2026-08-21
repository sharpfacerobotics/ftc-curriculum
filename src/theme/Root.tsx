import React, {type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import {matchRoutes} from 'react-router-config';
import routes from '@generated/routes';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ContentLock from '@site/src/components/ContentLock';
import ReadingProgress from '@site/src/components/ui/ReadingProgress';
import AskLauncher from '@site/src/components/ui/AskLauncher';
import {getUnitNumber, getUnitSlug, isProtectedUnit} from '@site/src/telemark/accessPolicy';
import {useAuth} from '@site/src/telemark/useAuth';

interface RootProps {
  children: ReactNode;
}

function siteRelativePath(pathname: string, baseUrl: string): string {
  const normalizedBase = `/${baseUrl.replace(/^\/+|\/+$/g, '')}`;
  if (normalizedBase !== '/' && pathname === normalizedBase) return '/';
  if (normalizedBase !== '/' && pathname.startsWith(`${normalizedBase}/`)) {
    return pathname.slice(normalizedBase.length) || '/';
  }
  return pathname;
}

function isPublicRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  // /curriculum renders nothing but a redirect to the software landing, so
  // gating it would trap anyone arriving from an old bookmark on a lock screen
  // instead of forwarding them.
  return (
    normalized === '/'
    || normalized === '/login'
    // Search indexes titles for every lesson but redacts the excerpt of any
    // protected one, so browsing it signed out is safe and is the point: you
    // cannot decide whether an account is worth making if you cannot see what
    // is behind it.
    || normalized === '/search'
    // The tools page holds the design calculators, which compute from numbers
    // the student types and contain no lesson content. The Java simulators on
    // it gate themselves through AuthenticatedSimulatorNavigator, so gating
    // the whole page only hid the calculators for no benefit.
    || normalized === '/simulator'
    || normalized === '/curriculum'
    || normalized === '/engineering'
  );
}

export default function Root({children}: RootProps): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const {pathname} = useLocation();
  const {user, loading} = useAuth();
  const relativePath = siteRelativePath(pathname, siteConfig.baseUrl);
  const unitNumber = getUnitNumber(relativePath);
  const unitSlug = getUnitSlug(relativePath);
  const publicUnit = unitNumber !== null && !isProtectedUnit(unitNumber);

  // A path that matches nothing is a 404, not protected content. Without this
  // a mistyped URL told a signed out visitor to sign in, and signing in then
  // showed them the real 404 anyway.
  // Routes are registered with the site's baseUrl, so the full pathname has to
  // be matched rather than the site-relative one. Matching the relative path
  // silently matched nothing, which made every page look like a 404 and turned
  // the gate off entirely.
  const matched = matchRoutes(routes, pathname);
  const isNotFound =
    matched.length === 0 || matched.every((entry) => entry.route.path === '*');

  if (isNotFound || isPublicRoute(relativePath) || publicUnit || user) {
    return (
      <>
        <ReadingProgress />
        <AskLauncher />
        {children}
      </>
    );
  }

  const contentType = unitNumber !== null
    ? 'lesson'
    : relativePath === '/simulator'
      ? 'simulator'
      : 'site';

  return (
    <main style={{minHeight: '100vh', padding: '1px 1rem'}}>
      <ContentLock
        unitNumber={unitNumber ?? undefined}
        unitSlug={unitSlug}
        contentType={contentType}
        loading={loading}
      />
    </main>
  );
}
