import * as React from 'react';

import { Box } from '@mui/joy';
import type { BoxProps } from '@mui/joy';

/**
 * White / glass-morphism auth cards use light backgrounds; when the app is in dark mode,
 * Joy tokens default to light text — unreadable on white. This subtree forces the light palette.
 */
export const AuthLightSurface = (props: { children: React.ReactNode; sx?: BoxProps['sx'] }) => (
  <Box data-joy-color-scheme="light" sx={props.sx}>
    {props.children}
  </Box>
);
