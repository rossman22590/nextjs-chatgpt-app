import type { SxProps } from '@mui/joy/styles/types';

import { animationColorRainbow } from '~/common/util/animUtils';


export const messageAsideColumnSx: SxProps = {
  position: 'sticky',
  top: '0.5rem',
  minWidth: { xs: 36, md: 44 },
  maxWidth: 52,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.5,
  pt: 0.25,
  alignSelf: 'flex-start',
  '&.msg-edit-button': {
    gap: 0.25,
  },
};

export const messageZenAsideColumnSx: SxProps = {
  ...messageAsideColumnSx,
  minWidth: undefined,
  maxWidth: undefined,
  mx: -1,
};

export const messageAvatarLabelSx: SxProps = {
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  maxWidth: '100%',
  fontSize: '0.6rem',
  lineHeight: 1.2,
  // NOTE: no uppercase / letter-spacing - both widen the text and force long model names (e.g. 'GPT-5.6 Terra Pro')
  // to wrap into a ragged multi-line stack in the narrow avatar column. Mixed-case stays compact.
  textTransform: 'none',
  color: 'text.tertiary',
  fontWeight: 600,
  textAlign: 'center',
  opacity: 0.7,
  // clamp to 2 tidy lines - the full name is in the hover tooltip
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export const messageAvatarLabelAnimatedSx: SxProps = {
  ...messageAvatarLabelSx,
  animation: `${animationColorRainbow} 5s linear infinite`,
};

// Mobile-specific: Compact sticky header bar
// Note: backgroundColor is set dynamically in the component based on message role
export const messageMobileHeaderSx: SxProps = {
  position: 'sticky',
  top: 0,
  zIndex: 2, // on top of the textarea outline when editing

  minHeight: '2.5rem', // 40px, while the rendercode buttons have 44 (4 + 36 + 4), but this doesn't feel small
  pl: 1.5,
  pr: 1,
  mx: -0.5,
  mb: 0.125,

  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

// Edit controls bar when in Beam
export const messageEditBeamControlsTopSx: SxProps = {
  ...messageMobileHeaderSx,
  top: '3rem',
  backgroundColor: 'warning.softHoverBg',
  justifyContent: 'flex-end',
};
