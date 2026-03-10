import type { SxProps } from '@mui/joy/styles/types';

import { animationColorRainbow } from '~/common/util/animUtils';


export const messageAsideColumnSx: SxProps = {
  position: 'sticky',
  top: '0.5rem',
  minWidth: { xs: 36, md: 40 },
  maxWidth: 48,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.25,
  pt: 0.125,
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
  fontSize: '0.75rem',
  lineHeight: 1.25,
  color: 'text.tertiary',
  fontWeight: 'md',
  textAlign: 'center',
};

export const messageAvatarLabelAnimatedSx: SxProps = {
  animation: `${animationColorRainbow} 5s linear infinite`,
};
