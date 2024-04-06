import * as React from 'react';

import { Button, Card, CardContent, Grid, Typography } from '@mui/joy';
import LaunchIcon from '@mui/icons-material/Launch';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';

import { Link } from '~/common/components/Link';


export const beamReleaseDate = '2024-04-01T22:00:00Z';
export const beamBlogUrl = 'https://calendly.com/techinschools/30min';

export const beamNewsCallout =
  <Card variant='solid' invertedColors>
    <CardContent sx={{ gap: 2 }}>
      <Typography level='title-lg'>
        Get Support if you need help!
      </Typography>
      <Typography level='body-sm'>
      AI Tutor represents an unprecedented, multi-model AI chat system that enhances the process of uncovering optimal solutions by harnessing the combined capabilities of various Large Language Models (LLMs).
        {/*Beam is a world-first, multi-model AI chat modality. By combining the strenghts of diverse LLMs, Beam allows you to find better answers, faster.*/}
      </Typography>
      <Grid container spacing={1}>
        <Grid xs={12} sm={7}>
          <Button
            fullWidth variant='soft' color='primary' endDecorator={<LaunchIcon />}
            component={Link} href={beamBlogUrl} noLinkStyle target='_blank'
          >
            Live Support
          </Button>
        </Grid>
        <Grid xs={12} sm={5} sx={{ display: 'flex', flexAlign: 'center', justifyContent: 'center' }}>
          {/*<Button*/}
          {/*  fullWidth variant='outlined' color='primary' startDecorator={<ThumbUpRoundedIcon />}*/}
          {/*  // endDecorator={<LaunchIcon />}*/}
          {/*  component={Link} href={beamHNUrl} noLinkStyle target='_blank'*/}
          {/*>*/}
          {/*  on Hackernews 🙏*/}
          {/*</Button>*/}
        </Grid>
      </Grid>
    </CardContent>
  </Card>;