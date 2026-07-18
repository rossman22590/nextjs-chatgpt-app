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
  fontSize: '0.65rem',
  lineHeight: 1.3,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'text.tertiary',
  fontWeight: 600,
  textAlign: 'center',
  opacity: 0.7,
  // clamp long model names to 3 lines - the full name is in the hover tooltip
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export const messageAvatarLabelAnimatedSx: SxProps = {
  ...messageAvatarLabelSx,
  animation: `${animationColorRainbow} 5s linear infinite`,
};
