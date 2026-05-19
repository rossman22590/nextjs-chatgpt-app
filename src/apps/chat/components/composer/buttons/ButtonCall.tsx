import * as React from 'react';

import { Box, Button, IconButton, Tooltip } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';
import CallIcon from '@mui/icons-material/Call';


const callConversationLegend =
  <Box sx={{ px: 1, py: 0.75, lineHeight: '1.5rem', color: 'var(--joy-palette-text-primary)' }}>
    Quick call regarding this chat
  </Box>;

const mobileSx: SxProps = {
  mr: { xs: 1, md: 2 },
};

const desktopSx: SxProps = {
  '--Button-gap': '1rem',
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


export const ButtonCallMemo = React.memo(ButtonCall);

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

function ButtonCall(props: { isMobile?: boolean, disabled?: boolean, onClick: () => void }) {
  return props.isMobile ? (
    <IconButton aria-label="Call" variant='soft' color='primary' disabled={props.disabled} onClick={props.onClick} sx={{ ...mobileSx, ...hoverSx, minWidth: 40, minHeight: 40 } as SxProps}>
      <CallIcon />
    </IconButton>
  ) : (
    <Tooltip disableInteractive variant='solid' arrow placement='right' title={callConversationLegend}>
      <Button aria-label="Call" variant='soft' color='primary' disabled={props.disabled} onClick={props.onClick} endDecorator={<CallIcon />} sx={{ ...desktopSx, minHeight: 40 }}>
        Call
      </Button>
    </Tooltip>
  );
}