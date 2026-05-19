import * as React from 'react';

import { Box, List, Sheet, styled } from '@mui/joy';

import { NavItemApp } from '~/common/app.nav';
import { adjustContentScaling, themeScalingMap, themeZIndexDesktopPanel } from '~/common/app.theme';
import { useIsMobile } from '~/common/components/useMatchMedia';
import { useUIContentScaling } from '~/common/stores/store-ui';

import { PanelContentPortal } from './PanelContentPortal';
import { optimaClosePanel, useOptimaPanelOpen } from '../useOptima';


const DesktopPanelFixRoot = styled(Box)({
  width: 'var(--AGI-Desktop-Panel-width)',
  flexShrink: 0,
  flexGrow: 0,
  zIndex: themeZIndexDesktopPanel,
  '&[data-closed="true"]': {
    contain: 'strict',
    pointerEvents: 'none',
  },
  '&.panel-peeking': {
    zIndex: themeZIndexDesktopPanel + 1,
  },
});

const DesktopPanelTranslatingSheet = styled(Sheet)({
  width: '100%',
  height: 'calc(100dvh - 2rem)',
  marginTop: '1rem',
  marginBottom: '1rem',
  background: 'var(--agi-shell-bg)',
  border: '1px solid var(--agi-shell-border)',
  borderRadius: '30px',
  boxShadow: 'var(--agi-shell-shadow)',
  backdropFilter: 'blur(24px) saturate(160%)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  transform: 'none',
  transition: 'transform 0.42s cubic-bezier(.17,.84,.44,1), box-shadow 0.42s cubic-bezier(.17,.84,.44,1), border-color 0.2s ease',
  willChange: 'transform, box-shadow',
  '&[data-closed="true"]': {
    transform: 'translateX(108%)',
    borderColor: 'transparent',
  },
  '&.panel-peeking': {
    transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
    boxShadow: 'var(--agi-shell-shadow-strong)',
    borderColor: 'var(--agi-shell-border-strong)',
  },
}) as typeof Sheet;


export function DesktopPanel(props: { component: React.ElementType, currentApp?: NavItemApp }) {

  const isMobile = useIsMobile();
  const contentScaling = adjustContentScaling(useUIContentScaling(), isMobile ? 1 : 0);
  const { panelShownAsPanel, panelShownAsPeeking, panelAsPopup } = useOptimaPanelOpen(false, props.currentApp);
  const isOpen = panelShownAsPanel || panelShownAsPeeking;

  React.useEffect(() => {
    if (panelAsPopup)
      optimaClosePanel();
  }, [panelAsPopup]);

  return (
    <DesktopPanelFixRoot
      data-closed={!isOpen}
      className={panelShownAsPeeking ? 'panel-peeking' : undefined}
    >

      <DesktopPanelTranslatingSheet
        component={props.component}
        data-closed={!isOpen}
        className={panelShownAsPeeking ? 'panel-peeking' : undefined}
      >

        <List size={themeScalingMap[contentScaling]?.optimaPanelGroupSize} sx={{ '--ListItem-minHeight': '2.5rem', py: 0, flex: 0 }} />

        {!panelAsPopup && <PanelContentPortal />}

      </DesktopPanelTranslatingSheet>

    </DesktopPanelFixRoot>
  );
}
