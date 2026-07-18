import * as React from 'react';

import { Box, Chip, CircularProgress, IconButton, LinearProgress, Typography } from '@mui/joy';
import RefreshIcon from '@mui/icons-material/Refresh';

import { apiAsyncNode } from '~/common/util/trpc.client';


type MyUsageData = Awaited<ReturnType<typeof apiAsyncNode.usage.myUsage.query>>;


/** '0%' reads as broken when there IS usage: show '<1%' and keep a visible bar sliver instead. */
export function usagePctLabel(pct: number, used: number): string {
  if (used > 0 && pct < 1) return '<1%';
  return `${pct.toFixed(0)}%`;
}

function UsageBarRow(props: {
  label: string;
  sub: string;
  pct: number;
  hasUsage: boolean;
  barColor: 'primary' | 'neutral' | 'warning' | 'danger';
  rightText: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ minWidth: 0, flex: '0 0 40%' }}>
        <Typography level='body-sm'>{props.label}</Typography>
        <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
          {props.sub}
        </Typography>
      </Box>
      <LinearProgress
        determinate
        // any usage at all gets a visible sliver, so the bar never looks dead
        value={props.hasUsage ? Math.max(props.pct, 2) : 0}
        color={props.barColor}
        size='sm'
        sx={{ flex: 1, borderRadius: 'xl' }}
      />
      <Typography level='body-xs' sx={{ flex: '0 0 auto', minWidth: 64, textAlign: 'right', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {props.rightText}
      </Typography>
    </Box>
  );
}


function _timeUntil(ts: number): string {
  const minutes = Math.max(1, Math.ceil((ts - Date.now()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function _timeAgo(ts: number): string {
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 60) return 'less than a minute ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}


/**
 * User-facing usage limits panel (Settings): shows the weekly (rolling 7-day)
 * plan allowance with a progress bar, similar to other AI chat apps.
 */
export function UsageLimitsSettings() {

  // state
  const [usage, setUsage] = React.useState<MyUsageData | null>(null);
  const [loadedAt, setLoadedAt] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);

  const refresh = React.useCallback(() => {
    setLoading(true);
    apiAsyncNode.usage.myUsage.query()
      .then((data) => {
        setUsage(data);
        setLoadedAt(Date.now());
        setUnavailable(false);
      })
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);


  // not signed in / no server: don't show a broken panel
  if (unavailable)
    return (
      <Typography level='body-sm' sx={{ color: 'text.tertiary' }}>
        Usage limits are not available. Sign in to see your weekly allowance.
      </Typography>
    );

  if (!usage)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size='sm' />
      </Box>
    );


  const isUnlimited = usage.weeklyLimit == null;
  // unlimited (admin) accounts: draw the bar against the plan default, purely as a reference
  const limit = usage.weeklyLimit ?? usage.planWeeklyDefault;
  const used = usage.weeklyUsed;
  const noCredits = usage.reason === 'no_credits';
  const pct = (limit != null && limit > 0) ? Math.min(100, (used / limit) * 100) : 0;
  const barColor = isUnlimited ? 'neutral' as const : pct > 90 ? 'danger' as const : pct > 70 ? 'warning' as const : 'primary' as const;

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>

      {/* Header: title + plan */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography level='title-sm'>Your usage limits</Typography>
        <Chip size='sm' variant='soft' color={usage.plan === 'ULTRA' ? 'warning' : 'primary'}>
          {usage.planLabel}
        </Chip>
        {isUnlimited && (
          <Chip size='sm' variant='soft' color='neutral'>
            Unlimited
          </Chip>
        )}
      </Box>

      {/* Weekly limit bars */}
      {!usage.isActive ? (
        <Typography level='body-sm' sx={{ color: 'text.tertiary' }}>
          Your account is inactive. Contact your admin to activate access.
        </Typography>
      ) : noCredits ? (
        <Typography level='body-sm' sx={{ color: 'text.tertiary' }}>
          Your account has no credits yet. Contact your admin to enable your plan allowance.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5 }}>

          {/* Current session: rolling 5-hour burst window, gates ALL models */}
          {(() => {
            const s = usage.session;
            const sUnlimited = !s || s.limit == null;
            const sLimit = s?.limit ?? 0;
            const sUsed = s?.used ?? 0;
            const sPct = sLimit > 0 ? Math.min(100, (sUsed / sLimit) * 100) : 0;
            const sExhausted = !sUnlimited && sLimit > 0 && sUsed >= sLimit;
            return (
              <UsageBarRow
                label='Current session'
                sub={sExhausted && s?.freesAt
                  ? `Limit reached - frees up in ${_timeUntil(s.freesAt)}`
                  : sUsed > 0
                    ? `${sUsed.toLocaleString()} of ${sUnlimited ? 'unlimited' : sLimit.toLocaleString()} tokens - last 5 hours`
                    : 'Starts when a message is sent'}
                pct={sPct}
                hasUsage={sUsed > 0}
                barColor={sExhausted ? 'danger' : sUnlimited ? 'neutral' : sPct > 70 ? 'warning' : 'primary'}
                rightText={sUnlimited ? 'Unlimited' : `${usagePctLabel(sPct, sUsed)} used`}
              />
            );
          })()}

          {/* All models: weighted usage vs the weekly allowance */}
          <UsageBarRow
            label='All models'
            sub={used > 0 ? `${used.toLocaleString()} of ${(limit ?? 0).toLocaleString()} tokens` : 'Starts when a message is sent'}
            pct={pct}
            hasUsage={used > 0}
            barColor={barColor}
            rightText={isUnlimited ? 'Unlimited' : `${usagePctLabel(pct, used)} used`}
          />

          {/* Premium families: their share of the allowance, blocked state when the limit is hit */}
          {(usage.modelGroups ?? []).map((group) => {
            const gPct = (limit != null && limit > 0) ? Math.min(100, (group.weighted / limit) * 100) : 0;
            const gBlocked = group.blocked && !isUnlimited;
            return (
              <UsageBarRow
                key={group.id}
                label={group.label}
                sub={gBlocked
                  ? 'Limit reached - unavailable until usage frees up'
                  : group.used > 0 ? `${group.used.toLocaleString()} tokens - counts 3x (${group.weighted.toLocaleString()})` : `You haven't used ${group.label} yet`}
                pct={gPct}
                hasUsage={group.used > 0}
                barColor={gBlocked ? 'danger' : gPct > 70 ? 'warning' : 'primary'}
                rightText={gBlocked ? 'Blocked' : isUnlimited ? 'Unlimited' : `${usagePctLabel(gPct, group.used)} of limit`}
              />
            );
          })}

          <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
            {isUnlimited
              ? `Measured over the last 7 days - bars shown against the ${usage.planLabel} reference limit.`
              : 'Measured over the last 7 days - usage frees up as it ages past 7 days. Premium models (Fable, GPT Pro / Sol) consume your allowance 3x faster, and are the only models paused when the limit is reached.'}
          </Typography>
        </Box>
      )}

      {/* Footer: last updated + refresh */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
          Last updated: {loadedAt ? _timeAgo(loadedAt) : '...'}
        </Typography>
        <IconButton size='sm' variant='plain' loading={loading} onClick={refresh} aria-label='Refresh usage'>
          <RefreshIcon sx={{ fontSize: 'lg' }} />
        </IconButton>
      </Box>

    </Box>
  );
}
