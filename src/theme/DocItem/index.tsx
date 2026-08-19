import React from 'react';
import {HtmlClassNameProvider} from '@docusaurus/theme-common';
import {DocProvider} from '@docusaurus/plugin-content-docs/client';
import type {Props} from '@theme/DocItem';
import DocItemMetadata from '@theme/DocItem/Metadata';
import DocItemLayout from '@theme/DocItem/Layout';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import ContentLock from '@site/src/components/ContentLock';
import {useAuth} from '@site/src/telemark/useAuth';
import {getUnitNumber, getUnitSlug, isProtectedUnit} from '@site/src/telemark/accessPolicy';

export default function DocItem(props: Props): React.JSX.Element {
  const {user, loading} = useAuth();
  const docHtmlClassName = `docs-doc-id-${props.content.metadata.id}`;
  const MDXComponent = props.content;
  const docPath = props.content.metadata.permalink ?? props.content.metadata.id;
  const unitNumber = getUnitNumber(docPath);
  const unitSlug = getUnitSlug(docPath);
  const protectedDocument =
    unitNumber !== null && isProtectedUnit(unitNumber);

  const showGate = protectedDocument && (loading || !user);

  return (
    <DocProvider content={props.content}>
      <HtmlClassNameProvider className={docHtmlClassName}>
        <DocItemMetadata />
        {showGate ? (
          <div className="container margin-vert--lg">
            <DocBreadcrumbs />
            <ContentLock unitNumber={unitNumber} unitSlug={unitSlug} loading={loading} />
          </div>
        ) : (
          <DocItemLayout>
            <MDXComponent />
          </DocItemLayout>
        )}
      </HtmlClassNameProvider>
    </DocProvider>
  );
}
