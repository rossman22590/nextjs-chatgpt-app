import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box, IconButton, Typography } from '@mui/joy';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { Link } from '~/common/components/Link';


export const OptimaDrawerHeader = (props: {
  title: string,
  onClose: () => void,
  onTitleClick?: () => void,
  sx?: SxProps,
  children?: React.ReactNode,
}) =>
  <Box
    sx={{
      minHeight: 'calc(var(--AGI-Nav-width) + 8px)',
      px: 1,
      mx: 0.75,
      mt: 0.75,
      mb: 0.5,
      background: 'var(--agi-shell-elevated)',
      border: '1px solid var(--agi-shell-border)',
      borderRadius: '22px',
      boxShadow: '0 14px 34px rgba(99 56 150 / 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1,
      ...(props.sx || {}),
    }}
  >

    {props.children || <IconButton disabled variant='plain' />}

    {props.onTitleClick ? (
      <Link href='#' color='neutral' onClick={props.onTitleClick}>
        <Typography level='title-md' sx={{ fontFamily: 'display', letterSpacing: '-0.03em' }}>
          {props.title}
        </Typography>
      </Link>) : (
      <Typography level='title-md' sx={{ fontFamily: 'display', letterSpacing: '-0.03em' }}>
        {props.title}
      </Typography>
    )}

    <IconButton aria-label='Close Drawer' size='sm' onClick={props.onClose}>
      <CloseRoundedIcon />
    </IconButton>

  </Box>;
