import * as React from 'react';

import type { ColorPaletteProp, SxProps } from '@mui/joy/styles/types';
import { Box, Button, IconButton, Tooltip } from '@mui/joy';

import { ChatBeamIcon } from '~/common/components/icons/ChatBeamIcon';
import { KeyStroke } from '~/common/components/KeyStroke';
import { animationEnterBelow } from '~/common/util/animUtils';


const legendBoxSx = { px: 1, py: 0.75, lineHeight: '1.5rem', color: 'var(--joy-palette-text-primary)' } as const;

const desktopLegend =
  <Box sx={legendBoxSx}>
    Combine the answers from multiple models<br />
    <KeyStroke combo='Ctrl + Enter' sx={{ mt: 0.5, mb: 0.25 }} />
  </Box>;

const desktopLegendNoContent =
  <Box sx={legendBoxSx}>
    Enter the text to Beam, then press this
  </Box>;

const mobileSx: SxProps = {
  mr: { xs: 1, md: 2 },
};

const desktopSx: SxProps = {
  '--Button-gap': '1rem',
  backgroundColor: 'background.popup',
  boxShadow: '0 4px 16px -4px rgb(var(--joy-palette-primary-mainChannel) / 10%)',
  animation: `${animationEnterBelow} 0.1s ease-out`,
  transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
  /* Theme-based hover: primary tint + softColor (dark text in light mode, light in dark) */
  '&:hover:not(:disabled)': {
    backgroundColor: 'var(--joy-palette-primary-softActiveBg)',
    color: 'var(--joy-palette-primary-softColor)',
    boxShadow: '0 2px 8px -2px rgb(var(--joy-palette-primary-mainChannel) / 25%)',
  },
  '&:hover:not(:disabled) svg': {
    color: 'var(--joy-palette-primary-softColor)',
  },
};


export const ButtonBeamMemo = React.memo(ButtonBeam);

function ButtonBeam(props: {
  isMobile?: boolean,
  color?: ColorPaletteProp,
  disabled?: boolean,
  hasContent?: boolean,
  onClick: () => void,
}) {
  const hoverSx: SxProps = {
    transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
    '&:hover:not(:disabled)': {
      backgroundColor: 'var(--joy-palette-primary-softActiveBg)',
      color: 'var(--joy-palette-primary-softColor)',
      boxShadow: '0 2px 8px -2px rgb(var(--joy-palette-primary-mainChannel) / 25%)',
    },
    '&:hover:not(:disabled) svg': {
      color: 'var(--joy-palette-primary-softColor)',
    },
  };
  return props.isMobile ? (
    <IconButton aria-label="Beam (multiple models)" variant='outlined' color={props.color ?? 'primary'} disabled={props.disabled} onClick={props.onClick} sx={{ ...mobileSx, ...hoverSx, minWidth: 40, minHeight: 40 }}>
      <ChatBeamIcon />
    </IconButton>
  ) : (
    <Tooltip disableInteractive variant='solid' arrow placement='right' title={props.hasContent ? desktopLegend : desktopLegendNoContent}>
      <Button aria-label="Beam (combine multiple models)" variant='soft' color={props.color ?? 'primary'} disabled={props.disabled} onClick={props.onClick} endDecorator={<ChatBeamIcon />} sx={{ ...desktopSx, minHeight: 40 }}>
        Beam
      </Button>
    </Tooltip>
  );
}