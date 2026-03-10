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
  backgroundColor: 'var(--agi-shell-elevated)',
  border: '1px solid rgba(160, 32, 240, 0.15)',
  borderRadius: '999px',
  boxShadow: '0 4px 24px rgba(160, 32, 240, 0.14), 0 1px 6px rgba(0, 0, 0, 0.06)',
  backdropFilter: 'blur(20px) saturate(150%)',
  zIndex: themeZIndexBeamView + 1,
  position: 'absolute',
  bottom: '2rem',
  right: { xs: '1rem', md: '2rem' },
  gap: 0.5,
  px: 2,
  py: 0.75,
  '--Button-gap': '0.5rem',
  transition: 'box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease',
  '&:hover': {
    boxShadow: '0 8px 36px rgba(160, 32, 240, 0.22), 0 2px 10px rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(160, 32, 240, 0.30)',
    transform: 'translateY(-2px)',
  },
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