import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box } from '@mui/joy';

import { themeBgApp, themeZIndexPageBar } from '~/common/app.theme';
import type { NavItemApp } from '~/common/app.nav';
import { ExpanderControlledBox } from '~/common/components/ExpanderControlledBox';

import { OptimaBar } from '~/common/layout/optima/bar/OptimaBar';
import { optimaHasMOTD, OptimaMOTD } from '~/common/layout/optima/OptimaMOTD';
import { ChromelessFloatingButtons } from './ChromelessFloatingButtons';
import { useOptimaChromeless } from './useOptima';


const pageCoreSx: SxProps = {
  position: 'relative',
  isolation: 'isolate',
  backgroundColor: themeBgApp,
  backgroundImage: 'var(--agi-page-gradient)',
  minHeight: '100dvh',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'background-color 0.5s cubic-bezier(.17,.84,.44,1), box-shadow 0.4s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(140deg, var(--joy-palette-primary-softBg), transparent 28%), var(--agi-shell-glow)',
    opacity: 1,
    pointerEvents: 'none',
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
};

const pageCoreFullSx: SxProps = {
  ...pageCoreSx,
  borderRadius: 0,
  border: 'none',
  boxShadow: 'none',
};

const pageCoreContainedSx: SxProps = {
  ...pageCoreSx,
  borderRadius: { xs: 0, md: '20px' },
  border: { xs: 'none', md: '1px solid var(--agi-shell-border)' },
  boxShadow: { xs: 'none', md: 'var(--agi-shell-shadow)' },
};

const pageCoreBrighterSx: SxProps = {
  ...pageCoreContainedSx,
  backgroundColor: 'background.surface',
};

const pageCoreBarSx: SxProps = {
  zIndex: themeZIndexPageBar,
};


export const PageCore = (props: {
  component: React.ElementType,
  currentApp?: NavItemApp,
  isFull: boolean,
  isMobile: boolean,
  children: React.ReactNode,
}) => {

  const isChromeless = useOptimaChromeless();

  return <Box
    component={props.component}
    sx={props.currentApp?.pageBrighter ? pageCoreBrighterSx : props.isFull ? pageCoreFullSx : pageCoreContainedSx}
  >

    {optimaHasMOTD && <OptimaMOTD />}

    <ExpanderControlledBox expanded={!isChromeless}>
      <OptimaBar
        component='header'
        currentApp={props.currentApp}
        isMobile={props.isMobile}
        sx={pageCoreBarSx}
      />
    </ExpanderControlledBox>
    {isChromeless && <ChromelessFloatingButtons />}

    {props.children}

  </Box>;
};
