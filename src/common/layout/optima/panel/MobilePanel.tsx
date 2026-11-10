import * as React from 'react';

import { Box, Drawer } from '@mui/joy';

import type { NavItemApp } from '~/common/app.nav';
import { WhatsNewPanelRow } from '~/modules/news/components/WhatsNewIndicators';

import { OPTIMA_DRAWER_MOBILE_RADIUS, OPTIMA_PANEL_GROUPS_SPACING } from '../optima.config';
import { OptimaPanelGroupedList } from './OptimaPanelGroupedList';
import { PanelContentPortal } from './PanelContentPortal';
import { PreferencesListItem } from './items/PreferencesListItem';
import { optimaClosePanel, useOptimaPanelOpen } from '../useOptima';


export function MobilePanel(props: { component: React.ElementType, currentApp?: NavItemApp }) {

  const { panelShownAsPanel } = useOptimaPanelOpen(true, props.currentApp);

  return (
    <Drawer
      id='mobile-panel'
      component={props.component}
      disableEnforceFocus
      anchor='right'
      open={panelShownAsPanel}
      onClose={optimaClosePanel}
      sx={{
        '--Drawer-horizontalSize': 'clamp(30%, var(--AGI-Mobile-Panel-width), 100%)', // unrounded where CSS round() is missing
        '@supports (width: round(1px, 1px))': {
          '--Drawer-horizontalSize': 'round(clamp(30%, var(--AGI-Mobile-Panel-width), 100%), 1px)',
        },
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
            background: 'var(--agi-shell-bg)',
            border: '1px solid var(--agi-shell-border)',
            borderTopLeftRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
            borderBottomLeftRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
            boxShadow: 'var(--agi-shell-shadow-strong)',
            backdropFilter: 'blur(24px) saturate(160%)',
          },
        },
      }}
    >

      <Box sx={{
        height: '100%',
        overflowY: 'auto',
        pb: OPTIMA_PANEL_GROUPS_SPACING,
      }}>

        <Box sx={{ py: 0.5, mb: OPTIMA_PANEL_GROUPS_SPACING }}>
          <OptimaPanelGroupedList>
            <PreferencesListItem autoClosePanel />
          </OptimaPanelGroupedList>
        </Box>

        <PanelContentPortal />

        <WhatsNewPanelRow />

      </Box>

    </Drawer>
  );
}
