import * as React from 'react';

import { Box, Container } from '@mui/joy';

import type { NavItemApp } from '~/common/app.nav';
import { isPwa } from '~/common/util/pwaUtils';
import { useUIPreferencesStore } from '~/common/stores/store-ui';

import { PageCore } from './PageCore';
import { useOptimaDrawerOpen, useOptimaPanelOpen } from './useOptima';


export function PageWrapper(props: { component: React.ElementType, currentApp?: NavItemApp, isMobile: boolean, children: React.ReactNode }) {

  const isDrawerOpen = useOptimaDrawerOpen();
  const { panelShownAsPanel } = useOptimaPanelOpen(props.isMobile, props.currentApp);
  const amplitude = useUIPreferencesStore(state =>
    (isPwa() || props.isMobile || props.currentApp?.fullWidth) ? 'full' : state.centerMode,
  );

  if (props.isMobile)
    return (
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Container id='app-page-container' disableGutters maxWidth={false}>
          <PageCore component={props.component} currentApp={props.currentApp} isFull isMobile>
            {props.children}
          </PageCore>
        </Container>
      </Box>
    );

  const isFull = amplitude === 'full';

  return (
    <Box
      sx={{
        flex: '1 1 0px',
        overflow: 'hidden',
        marginLeft: !isDrawerOpen ? 'calc(-1 * var(--AGI-Desktop-Drawer-width))' : 0,
        marginRight: !panelShownAsPanel ? 'calc(-1 * var(--AGI-Desktop-Panel-width))' : 0,
        transition: 'margin-left 0.42s cubic-bezier(.17,.84,.44,1), margin-right 0.42s cubic-bezier(.17,.84,.44,1)',
        willChange: 'margin-left, margin-right',
      }}
    >

      <Container
        id='app-page-container'
        disableGutters
        maxWidth={isFull ? false : amplitude === 'narrow' ? 'md' : 'xl'}
        sx={{
          position: 'relative',
          px: { md: 0.5, xl: !isFull ? 0.75 : 0 },
          pb: 0.75,
          boxShadow: 'none',
        }}
      >

        <PageCore component={props.component} currentApp={props.currentApp} isFull={isFull} isMobile={false}>
          {props.children}
        </PageCore>

      </Container>

    </Box>
  );
}
