import * as React from 'react';
import { SvgIcon } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';

export const LogoSquircle = (props: {
  sx?: SxProps
}) => (
  <SvgIcon
  {...props}
  viewBox="0 0 24 24"
>
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#FFC0CB"/>
  <circle cx="9" cy="12" r="1" fill="#000"/>
  <circle cx="15" cy="12" r="1" fill="#000"/>
  <path d="M7 15c0 1.66 2.69 3 5 3s5-1.34 5-3" fill="#FFD700"/>
  <path d="M12,7 l-6,3 6,3 6,-3 -6,-3zm0,2.25l4,2 -4,2 -4,-2 4,-2z" fill="#5C6BC0"/>
  <polygon points="6,10 12,13 18,10 12,7" fill="#A020F0"/>
</SvgIcon>
);
