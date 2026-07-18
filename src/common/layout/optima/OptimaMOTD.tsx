import * as React from 'react';
import TimeAgo from 'react-timeago';

import { Box, Button, IconButton, Sheet, Typography } from '@mui/joy';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { Release } from '~/common/app.release';
import { adminModelsSetDisabledIds } from '~/common/stores/store-admin-models';
import { frontendHashString } from '~/common/util/textUtils';
import { themeZIndexPageBar } from '~/common/app.theme';
import { uiSetDismissed, useUIIsDismissed } from '~/common/stores/store-ui';
import { apiAsyncNode } from '~/common/util/trpc.client';


const MOTD_COLOR = 'primary';
const MOTD_PREFIX = 'motd-';
const LIVE_BANNER_PREFIX = 'admin-banner-';

export const optimaHasMOTD = true;

type LiveBanner = Awaited<ReturnType<typeof apiAsyncNode.admin.getBanner.query>>;
type BannerTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type RenderBanner = {
  key: string;
  tone: BannerTone;
  title: string | null;
  message: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  buildTimestamp: string | null;
};


/**
 * Message of the day plus the live admin broadcast banner.
 */
export function OptimaMOTD() {
  const [liveBanner, setLiveBanner] = React.useState<LiveBanner>(null);

  React.useEffect(() => {
    let disposed = false;

    const loadBanner = () => {
      apiAsyncNode.admin.getBanner
        .query()
        .then((banner) => {
          if (!disposed) setLiveBanner(banner);
        })
        .catch(() => {
          if (!disposed) setLiveBanner(null);
        });
      // piggyback: refresh the admin-disabled model list into its client store (used by the model selector)
      apiAsyncNode.admin.getDisabledModels
        .query()
        .then(({ disabledIds }) => {
          if (!disposed) adminModelsSetDisabledIds(disabledIds);
        })
        .catch(() => { /* leave the last-known list in place on transient errors */ });
    };

    loadBanner();
    const interval = window.setInterval(loadBanner, 60_000);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  const deploymentBanner = React.useMemo<RenderBanner | null>(() => {
    const rawMOTD = process.env.NEXT_PUBLIC_MOTD;
    if (!rawMOTD?.trim()) return null;

    const buildInfo = Release.buildInfo('frontend');
    const message = rawMOTD
      .replace(/{{app_build_hash}}/g, buildInfo.gitSha || '')
      .replace(/{{app_build_pkgver}}/g, buildInfo.pkgVersion || '')
      .replace(/{{app_deployment_type}}/g, buildInfo.deploymentType || '');

    return {
      key: MOTD_PREFIX + frontendHashString(message),
      tone: MOTD_COLOR,
      title: null,
      message,
      ctaLabel: null,
      ctaUrl: null,
      buildTimestamp: buildInfo.timestamp || '',
    };
  }, []);

  const banner = React.useMemo<RenderBanner | null>(() => {
    if (liveBanner?.enabled && liveBanner.message.trim()) {
      return {
        key: LIVE_BANNER_PREFIX + frontendHashString(`${liveBanner.updatedAt}:${liveBanner.message}`),
        tone: liveBanner.tone,
        title: liveBanner.title,
        message: liveBanner.message,
        ctaLabel: liveBanner.ctaLabel,
        ctaUrl: liveBanner.ctaUrl,
        buildTimestamp: null,
      };
    }

    return deploymentBanner;
  }, [deploymentBanner, liveBanner]);

  const dismissed = useUIIsDismissed(banner?.key ?? null);

  if (!banner || dismissed === true) return null;

  function renderMessageWithTimeAgo(message: string, buildTimestamp: string | null) {
    if (message.includes('{{app_build_time}}')) {
      const parts = message.split('{{app_build_time}}');
      return <>{parts[0]}{buildTimestamp && <TimeAgo date={buildTimestamp} />}{parts[1]}</>;
    }
    return message;
  }

  return (
    <Sheet
      id='optima-motd'
      component='header'
      variant='solid'
      sx={{ zIndex: themeZIndexPageBar }}
    >
      <Typography
        component='div'
        level='title-sm'
        variant='soft'
        color={banner.tone}
        endDecorator={
          <IconButton
            size='sm'
            variant='soft'
            color={banner.tone}
            onClick={() => uiSetDismissed(banner.key)}
            sx={{ ml: 'auto' }}
          >
            <CloseRoundedIcon />
          </IconButton>
        }
        sx={{
          mt: 1,
          mx: 1,
          borderRadius: 'sm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ p: 1, lineHeight: 'xl', display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <CampaignRoundedIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          {banner.title && (
            <Typography component='span' level='title-sm' color={banner.tone} sx={{ fontWeight: 800 }}>
              {banner.title}
            </Typography>
          )}
          <Box component='span'>{renderMessageWithTimeAgo(banner.message, banner.buildTimestamp)}</Box>
          {banner.ctaLabel && banner.ctaUrl && (
            <Button component='a' href={banner.ctaUrl} target={banner.ctaUrl.startsWith('http') ? '_blank' : undefined} size='sm' variant='solid' color={banner.tone}>
              {banner.ctaLabel}
            </Button>
          )}
        </Box>
      </Typography>
    </Sheet>
  );
}
