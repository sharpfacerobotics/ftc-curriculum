import React, {type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import {matchRoutes} from 'react-router-config';
import routes from '@generated/routes';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ContentLock from '@site/src/components/ContentLock';
import ReadingProgress from '@site/src/components/ui/ReadingProgress';
import AskLauncher from '@site/src/components/ui/AskLauncher';
import {getUnitNumber, getUnitSlug, isProtectedLessonPath} from '@site/src/telemark/accessPolicy';
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

export default function Root({children}: RootProps): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const {pathname} = useLocation();
  const {user, loading} = useAuth();
  const relativePath = siteRelativePath(pathname, siteConfig.baseUrl);
  const unitNumber = getUnitNumber(relativePath);
  const unitSlug = getUnitSlug(relativePath);
  const protectedLesson = isProtectedLessonPath(relativePath);

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

  // Track landings, unit overviews, learning paths, official docs, tools, and
  // every other normal site page stay public. The account request appears only
  // after a student deliberately opens a lesson in a gated unit.
  if (isNotFound || !protectedLesson || user) {
    return (
      <>
        <ReadingProgress />
        <AskLauncher />
        {children}
      </>
    );
  }

  return (
    <main style={{minHeight: '100vh', padding: '1px 1rem'}}>
      <ContentLock
        unitNumber={unitNumber ?? undefined}
        unitSlug={unitSlug}
        contentType="lesson"
        loading={loading}
      />
    </main>
  );
}
