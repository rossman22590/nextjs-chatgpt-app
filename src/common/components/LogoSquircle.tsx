import * as React from 'react';
import { SvgIcon } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';

export const LogoSquircle = (props: {
  sx?: SxProps
}) => (
  <SvgIcon
    titleAccess='Application logo'
    viewBox='0 0 24 24' // Adjusted the view box to standard 24x24 for icons
    width='24' height='24'
    fill='currentColor'
    stroke='none' strokeWidth={0}
    strokeLinecap='round' strokeLinejoin='round'
    {...props}
  >
    <path d="M12 .587l3.515 7.118 7.488 1.09-5.417 5.277 1.279 7.453L12 18.896l-6.865 3.629 1.279-7.453-5.417-5.277 7.488-1.09z"/>
  </SvgIcon>
);
