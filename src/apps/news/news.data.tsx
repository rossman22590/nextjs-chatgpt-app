import * as React from 'react';
import { Box, Typography } from '@mui/joy';
import { ExternalLink } from '~/common/components/ExternalLink';

export const NewsItems = [
  {
    versionCode: 'latest',
    items: [
      { 
        text: (
          <>
            For latest news visit our support site: {' '}
            <ExternalLink href='https://your-support-site.com'>
              Support & News
            </ExternalLink>
          </>
        ) 
      },
    ],
  },
];
