import React, {type ReactNode} from 'react';
import DefaultNavbarItemMobile from '@theme/NavbarItem/DefaultNavbarItem/Mobile';
import DefaultNavbarItemDesktop from '@theme/NavbarItem/DefaultNavbarItem/Desktop';
import type {Props} from '@theme/NavbarItem/DefaultNavbarItem';

export default function DefaultNavbarItem({
  mobile = false,
  position,
  ...props
}: Props): ReactNode {
  const isAuthItem = props.className?.split(/\s+/).includes('navbar-auth-link');
  const Comp = mobile ? DefaultNavbarItemMobile : DefaultNavbarItemDesktop;

  const resolvedProps = isAuthItem
    ? {
        ...props,
        to: '/dashboard',
        label: 'Dashboard',
      }
    : props;

  return (
    <Comp
      {...resolvedProps}
      activeClassName={
        resolvedProps.activeClassName
        ?? (mobile ? 'menu__link--active' : 'navbar__link--active')
      }
    />
  );
}
