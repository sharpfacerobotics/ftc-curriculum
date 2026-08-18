import React, {type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ContentLock from '@site/src/components/ContentLock';
import {getUnitNumber, isProtectedUnit} from '@site/src/telemark/accessPolicy';
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
  return normalized === '/' || normalized === '/login';
}

export default function Root({children}: RootProps): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const {pathname} = useLocation();
  const {user, loading} = useAuth();
  const relativePath = siteRelativePath(pathname, siteConfig.baseUrl);
  const unitNumber = getUnitNumber(relativePath);
  const publicUnit = unitNumber !== null && !isProtectedUnit(unitNumber);

  if (isPublicRoute(relativePath) || publicUnit || user) {
    return <>{children}</>;
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
        contentType={contentType}
        loading={loading}
      />
    </main>
  );
}
