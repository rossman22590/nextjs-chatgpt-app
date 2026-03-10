import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box, Button, IconButton, Typography } from '@mui/joy';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

import { themeZIndexBeamView } from '~/common/app.theme';

import { useScrollToBottom } from './useScrollToBottom';


const inlineButtonSx: SxProps = {
  my: -0.25,
} as const;

const absoluteButtonSx: SxProps = {
  ...inlineButtonSx,
  backgroundColor: 'background.surface',
  border: '1px solid',
  borderColor: 'neutral.outlinedBorder',
  borderRadius: 'var(--joy-radius-full)',
  boxShadow: 'sm',
  zIndex: themeZIndexBeamView + 1,
  position: 'absolute',
  bottom: '2rem',
  right: { xs: '1rem', md: '2rem' },
  gap: 0.5,
  px: 1.5,
  py: 0.75,
  '--Button-gap': '0.5rem',
} as const;


export function ScrollToBottomButton(props: { inline?: boolean }) {
  const { atBottom, stickToBottom, setStickToBottom } = useScrollToBottom();

  const handleStickToBottom = React.useCallback(() => {
    setStickToBottom(true);
  }, [setStickToBottom]);

  if (atBottom || stickToBottom)
    return null;

  if (props.inline) {
    return (
      <IconButton
        aria-label="Scroll to bottom"
        variant="plain"
        onClick={handleStickToBottom}
        size="sm"
        sx={inlineButtonSx}
      >
        <KeyboardDoubleArrowDownIcon sx={{ fontSize: 'xl' }} />
      </IconButton>
    );
  }

  return (
    <Button
      aria-label="Scroll to bottom"
      variant="outlined"
      color="neutral"
      size="sm"
      onClick={handleStickToBottom}
      endDecorator={<KeyboardDoubleArrowDownIcon sx={{ fontSize: 'md' }} />}
      sx={absoluteButtonSx}
    >
      <Typography level="body-sm">Scroll to bottom</Typography>
    </Button>
  );
}