import * as React from 'react';

import { Box, Drawer } from '@mui/joy';

import type { NavItemApp } from '~/common/app.nav';

import { MobileNavItems } from '../nav/MobileNavItems';
import { OPTIMA_DRAWER_BACKGROUND, OPTIMA_DRAWER_MOBILE_RADIUS } from '../optima.config';
import { optimaCloseDrawer, useOptimaDrawerOpen } from '../useOptima';
import { useOptimaPortalOutRef } from '../portals/useOptimaPortalOutRef';


function DrawerContentPortal() {
  const drawerPortalRef = useOptimaPortalOutRef('optima-portal-drawer', 'MobileDrawer');
  return (
    <Box
      ref={drawerPortalRef}
      sx={{
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    />
  );
}

export function MobileDrawer(props: { component: React.ElementType, currentApp?: NavItemApp }) {

  const isDrawerOpen = useOptimaDrawerOpen();

  return (
    <Drawer
      id='mobile-drawer'
      component={props.component}
      disableEnforceFocus
      open={isDrawerOpen}
      onClose={optimaCloseDrawer}
      sx={{
        '--Drawer-horizontalSize': 'round(clamp(30%, var(--AGI-Mobile-Drawer-width), 100%), 1px)',
        '--Drawer-transitionDuration': '0.2s',
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(12 8 20 / 0.32)',
          },
        },
        content: {
          sx: {
            background: OPTIMA_DRAWER_BACKGROUND,
            border: '1px solid var(--agi-shell-border)',
            borderTopRightRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
            borderBottomRightRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
            boxShadow: 'var(--agi-shell-shadow-strong)',
            backdropFilter: 'blur(24px) saturate(160%)',
            overflow: 'hidden',
          },
        },
      }}
    >

      <DrawerContentPortal />

      <MobileNavItems currentApp={props.currentApp} />

    </Drawer>
  );
}
