import * as React from 'react';

import { Box, Sheet, styled } from '@mui/joy';

import { checkVisibleNav, NavItemApp } from '~/common/app.nav';
import { themeZIndexDesktopDrawer } from '~/common/app.theme';

import { OPTIMA_DRAWER_BACKGROUND } from '../optima.config';
import { optimaCloseDrawer, optimaOpenDrawer, useOptimaDrawerOpen, useOptimaDrawerPeeking } from '../useOptima';
import { useOptimaPortalOutRef } from '../portals/useOptimaPortalOutRef';


const DesktopDrawerFixRoot = styled(Box)({
  width: 'var(--AGI-Desktop-Drawer-width)',
  flexShrink: 0,
  flexGrow: 0,
  zIndex: themeZIndexDesktopDrawer,
  '&[data-closed="true"]': {
    contain: 'strict',
    pointerEvents: 'none',
  },
  '&.drawer-peeking': {
    zIndex: themeZIndexDesktopDrawer + 1,
  },
});

const DesktopDrawerTranslatingSheet = styled(Sheet)({
  width: '100%',
  height: 'calc(100dvh - 1.5rem)',
  marginTop: '0.75rem',
  marginBottom: '0.75rem',
  background: `${OPTIMA_DRAWER_BACKGROUND}`,
  border: '1px solid var(--agi-shell-border)',
  borderRadius: '16px',
  boxShadow: 'var(--agi-shell-shadow)',
  backdropFilter: 'blur(24px) saturate(150%)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transform: 'none',
  transition: 'transform 0.42s cubic-bezier(.17,.84,.44,1), box-shadow 0.42s cubic-bezier(.17,.84,.44,1), border-color 0.2s ease',
  willChange: 'transform, box-shadow',
  '&[data-closed="true"]': {
    transform: 'translateX(-108%)',
    borderColor: 'transparent',
  },
  '&.drawer-peeking': {
    transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
    boxShadow: 'var(--agi-shell-shadow-strong)',
    borderColor: 'var(--agi-shell-border-strong)',
  },
}) as typeof Sheet;


export function DesktopDrawer(props: { component: React.ElementType, currentApp?: NavItemApp }) {

  const drawerPortalRef = useOptimaPortalOutRef('optima-portal-drawer', 'DesktopDrawer');

  const _isDrawerOpen = useOptimaDrawerOpen();
  const isDrawerPeeking = useOptimaDrawerPeeking();
  const isDrawerOpen = _isDrawerOpen || isDrawerPeeking;

  const currentAppUsesDrawer = !props.currentApp?.hideDrawer;
  React.useEffect(() => {
    if (!currentAppUsesDrawer)
      optimaCloseDrawer();
  }, [currentAppUsesDrawer]);

  const shallOpenNavForSharedLink = !props.currentApp?.hideDrawer && checkVisibleNav(props.currentApp);
  React.useEffect(() => {
    if (shallOpenNavForSharedLink)
      optimaOpenDrawer();
  }, [shallOpenNavForSharedLink]);


  return (
    <DesktopDrawerFixRoot
      data-closed={!isDrawerOpen}
      className={isDrawerPeeking ? 'drawer-peeking' : undefined}
    >

      <DesktopDrawerTranslatingSheet
        ref={drawerPortalRef}
        component={props.component}
        data-closed={!isDrawerOpen}
        className={isDrawerPeeking ? 'drawer-peeking' : undefined}
      />

    </DesktopDrawerFixRoot>
  );
}
