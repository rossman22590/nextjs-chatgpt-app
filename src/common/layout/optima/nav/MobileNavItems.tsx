import * as React from 'react';
import Router from 'next/router';

import { Box, Button, ButtonGroup, ColorPaletteProp, Sheet } from '@mui/joy';
import LoginIcon from '@mui/icons-material/Login';
import SettingsIcon from '@mui/icons-material/Settings';

import { ROUTE_APP_NEWS } from '~/common/app.routes';
import { checkDivider, checkVisibileIcon, NavItemApp, navItems } from '~/common/app.nav';
import { AuthButton } from '~/common/components/auth/AuthButton';

import { BringTheLove } from './BringTheLove';
import { optimaCloseDrawer, optimaOpenModels, optimaOpenPreferences } from '../useOptima';


// configuration
const INVERT_PANE = true; // if true, the pane will be darker
const COLOR_PANE: ColorPaletteProp = 'neutral';


const _styles = {

  sheet: {
    // borderTopLeftRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
    // borderTopRightRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
    display: 'grid',
    rowGap: 0.5,
    py: 2,
    ...(INVERT_PANE ? {} : {
      borderTop: '1px solid',
      borderTopColor: 'divider',
    }),
  } as const,

  appsButtonGroup: {
    '--ButtonGroup-separatorSize': 0,
    '--ButtonGroup-connected': 0,
    gap: 1,
    justifyContent: 'center',
    overflowX: 'auto',
  } as const,

  button: {
    minWidth: '5.5rem',
    p: '0.5rem 0 0.375rem',
    borderRadius: 'sm',
    color: INVERT_PANE ? 'text.secondary' : undefined,
    fontWeight: 'sm',
    lineHeight: 'xs',
    '&[aria-selected="true"]': {
      boxShadow: INVERT_PANE ? `inset 1px 1px 3px -2px var(--joy-palette-${COLOR_PANE}-solidBg)` : undefined,
      // backgroundColor: INVERT_PANE ? undefined : 'background.popup',
      color: INVERT_PANE ? 'text.primary' : undefined,
      fontWeight: 'lg',
    },
    // layout
    flexDirection: 'column',
    gap: 0.75,
  } as const,

  linksGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: 1,
  } as const,

} as const;


/**
 * This can be plugged to the Drawer or Panel, to have nav items on Mobile.
 */
export function MobileNavItems(props: { currentApp?: NavItemApp }) {

  // group apps into visible (rendered as of now) and overflow (rendered with a dropdown menu)
  let crossedDivider = false;
  const visibleApps: NavItemApp[] = [];
  // const overflowApps: NavItemApp[] = [];

  const handleNavigate = React.useCallback((path: string, closeDrawer: boolean = true) => {
    void Router.push(path);
    if (closeDrawer)
      optimaCloseDrawer();
  }, []);

  // Only show core apps on mobile - filter out dev/hidden items
  const coreApps = ['/', '/draw', '/chat', '/personas'];
  
  navItems.apps.forEach((app) => {
    // Skip if not visible or is a dev item
    if (!checkVisibileIcon(app, true, props.currentApp)) return;
    if (app.isDev || app._delete) return;
    if (checkDivider(app)) {
      crossedDivider = true;
      return;
    }
    
    // Only show core apps on mobile
    if (coreApps.includes(app.route)) {
      visibleApps.push(app);
    }
  });

  return (

    <Sheet color={COLOR_PANE} variant={INVERT_PANE ? 'solid' : 'soft'} invertedColors={INVERT_PANE} sx={_styles.sheet}>

      {/* Group 1: Apps */}
      <ButtonGroup
        component='nav'
        sx={_styles.appsButtonGroup}
      >
        {visibleApps.map((app) => {
          const isActive = app === props.currentApp;
          return (
            <Button
              key={'app-' + (app.mobileName || app.name)}
              aria-selected={isActive}
              size='sm'
              color={COLOR_PANE}
              variant={isActive ? (INVERT_PANE ? 'soft' : 'solid') : 'plain'}
              onClick={() => handleNavigate(app.landingRoute || app.route, !!app.hideDrawer)}
              sx={_styles.button}
            >
              {(isActive && app.iconActive) ? <app.iconActive /> : <app.icon />}
              <Box component='span'>
                {app.mobileName || app.name}
              </Box>
            </Button>
          );
        })}
      </ButtonGroup>

      {/* Group 2: Essential Links */}
      <Box sx={_styles.linksGroup}>
        {/* Settings */}
        <Button
          size='sm'
          color='neutral'
          variant='plain'
          onClick={() => optimaOpenPreferences()}
          sx={_styles.button}
        >
          <SettingsIcon />
          <Box component='span'>
            Settings
          </Box>
        </Button>

        {/* Enhanced Sign in/out button */}
        <AuthButton
          variant="text"
          size="sm"
          sx={_styles.button}
        />
      </Box>

    </Sheet>

  );
}