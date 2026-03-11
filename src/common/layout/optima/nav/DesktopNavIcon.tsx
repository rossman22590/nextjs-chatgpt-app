import { Box, IconButton, styled } from '@mui/joy';

import { animationColorBeamScatterINV } from '~/common/util/animUtils';

import { OPTIMA_NAV_RADIUS } from '../optima.config';


export const DesktopNavGroupBox = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  '--GroupMarginY': '0.2rem',
});


export const navItemClasses = {
  typeMenu: 'NavButton-typeMenu',
  typeApp: 'NavButton-typeApp',
  typeLinkOrModal: 'NavButton-typeLink',
  dev: 'NavButton-dev',
  active: 'NavButton-active',
  paneOpen: 'NavButton-paneOpen',
  attractive: 'NavButton-attractive',
};

export const DesktopNavIcon = styled(IconButton)(({ theme }) => ({
  '--MarginX': '0.25rem',
  marginBlock: 'var(--GroupMarginY)',
  padding: 0,
  borderRadius: '10px',
  color: theme.palette.text.secondary,
  backgroundColor: 'transparent',
  transition: 'transform 0.2s cubic-bezier(.4,0,.2,1), background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, border-radius 0.25s ease, margin 0.2s ease, padding 0.2s ease',

  [`&.${navItemClasses.typeApp},&.${navItemClasses.typeLinkOrModal}`]: {
    '--Icon-fontSize': '1.25rem',
  },

  [`&.${navItemClasses.typeMenu}`]: {
    backgroundColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.1)',
    border: '1px solid rgba(var(--joy-palette-primary-mainChannel) / 0.16)',
    '&:active': {
      transform: 'rotate(90deg)',
      transition: 'transform 0.2s ease',
    },
  },

  [`&.${navItemClasses.typeApp}`]: {
    '--IconButton-size': 'calc(var(--Bar) - 2 * var(--MarginX))',
  },

  '&:hover': {
    backgroundColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.12)',
    color: theme.palette.text.primary,
    boxShadow: 'var(--joy-shadow-xs)',
  },

  [`&.${navItemClasses.active}`]: {
    background: 'linear-gradient(135deg, var(--joy-palette-primary-solidBg) 0%, var(--joy-palette-primary-solidHoverBg) 100%)',
    color: 'var(--joy-palette-primary-solidColor)',
    boxShadow: 'var(--joy-shadow-sm)',
  },

  [`&.${navItemClasses.paneOpen}`]: {
    borderStartStartRadius: `var(--joy-radius-${OPTIMA_NAV_RADIUS})`,
    borderEndStartRadius: `var(--joy-radius-${OPTIMA_NAV_RADIUS})`,
    borderStartEndRadius: 0,
    borderEndEndRadius: 0,
    marginLeft: 'calc(2 * var(--MarginX))',
    paddingRight: 'calc(2 * var(--MarginX))',
  },
  [`&.${navItemClasses.paneOpen}:hover`]: {
    borderRadius: `var(--joy-radius-${OPTIMA_NAV_RADIUS})`,
    marginLeft: 0,
    paddingRight: 0,
  },

  [`&.${navItemClasses.attractive}`]: {
    '--Icon-fontSize': '2rem',
    animation: `${animationColorBeamScatterINV} 4s infinite`,
  },

  [`&.${navItemClasses.dev}`]: {
    border: '2px dashed red',
  },

})) as typeof IconButton;
