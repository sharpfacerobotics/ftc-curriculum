import React, {type ReactNode} from 'react';
import DefaultNavbarItemMobile from '@theme/NavbarItem/DefaultNavbarItem/Mobile';
import DefaultNavbarItemDesktop from '@theme/NavbarItem/DefaultNavbarItem/Desktop';
import type {Props} from '@theme/NavbarItem/DefaultNavbarItem';
import {useAuth} from '@site/src/telemark/useAuth';

export default function DefaultNavbarItem({
  mobile = false,
  position,
  ...props
}: Props): ReactNode {
  const {user, loading} = useAuth();
  const isAuthItem = props.className?.split(/\s+/).includes('navbar-auth-link');
  const Comp = mobile ? DefaultNavbarItemMobile : DefaultNavbarItemDesktop;

  const resolvedProps = isAuthItem
    ? {
        ...props,
        to: user ? '/dashboard' : '/login',
        label: user ? 'Dashboard' : 'Sign In',
        'aria-busy': loading || undefined,
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
