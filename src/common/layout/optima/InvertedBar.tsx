import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box, Sheet, styled } from '@mui/joy';


export const InvertedBarCornerItem = styled(Box)({
  width: 'var(--Bar)',
  height: 'var(--Bar)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0,
});


const StyledSheet = styled(Sheet)({
  '--Bar': 'var(--AGI-Nav-width)',
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--agi-shell-bg)',
  border: '1px solid var(--agi-shell-border)',
  boxShadow: 'var(--agi-shell-shadow)',
  backdropFilter: 'blur(32px) saturate(170%)',
  overflow: 'hidden',
  isolation: 'isolate',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'var(--agi-shell-glow)',
    opacity: 0.6,
    pointerEvents: 'none',
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
}) as typeof Sheet;


export const InvertedBar = (props: {
  id?: string,
  component: React.ElementType,
  direction: 'horizontal' | 'vertical',
  sx?: SxProps
  children: React.ReactNode,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void,
}) => {

  const sx: SxProps = React.useMemo(() => (
    props.direction === 'horizontal'
      ? {
        flexDirection: 'row',
        minHeight: 'calc(var(--Bar) + 4px)',
        margin: { xs: '0.375rem', md: '0.75rem 0.75rem 0.5rem' },
        paddingInline: '0.25rem',
        borderRadius: '16px',
        ...props.sx,
      } : {
        flexDirection: 'column',
        minWidth: 'calc(var(--Bar) + 4px)',
        margin: '0.75rem 0.5rem 0.75rem 0.75rem',
        paddingBlock: '0.25rem',
        borderRadius: '16px',
        ...props.sx,
      }
  ), [props.direction, props.sx]);


  return (
    <StyledSheet
      id={props.id}
      component={props.component}
      variant='plain'
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      sx={sx}
    >
      {props.children}
    </StyledSheet>
  );
};
