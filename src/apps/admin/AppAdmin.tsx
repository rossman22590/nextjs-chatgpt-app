import * as React from 'react';

import { useSession } from 'next-auth/react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  LinearProgress,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Switch,
  Table,
  Textarea,
  Tooltip,
  Typography,
} from '@mui/joy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import BlockIcon from '@mui/icons-material/Block';
import BoltIcon from '@mui/icons-material/Bolt';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PaidIcon from '@mui/icons-material/Paid';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import SpeedIcon from '@mui/icons-material/Speed';
import TokenIcon from '@mui/icons-material/Token';
import TuneIcon from '@mui/icons-material/Tune';
import LayersIcon from '@mui/icons-material/Layers';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import WarningIcon from '@mui/icons-material/Warning';

import { useShallow } from 'zustand/react/shallow';

import { isAdminEmail } from '~/common/auth/adminEmails';
import { apiAsyncNode } from '~/common/util/trpc.client';
import type { DLLM } from '~/common/stores/llms/llms.types';
import { getLLMLabel } from '~/common/stores/llms/llms.types';
import { getAllModelParameterValues } from '~/common/stores/llms/llms.parameters';
import { groupLLMsByService } from '~/common/stores/llms/components/llms.dropdown.utils';
import { useModelsStore } from '~/common/stores/llms/store-llms';
import { adminModelsSetDisabledIds, useAdminModelsStore } from '~/common/stores/store-admin-models';

// A disabled model is blocked in two id spaces: the DLLM id (client selector / pre-flight) and the
// provider ref / llmRef (the id the AIX server guard sees). Store BOTH so enforcement matches everywhere.
function modelBlockIds(llm: DLLM): string[] {
  const llmRef = getAllModelParameterValues(llm.initialParameters, llm.userParameters).llmRef;
  return Array.from(new Set([llm.id, ...(llmRef ? [llmRef] : [])]));
}

type AdminStats = Awaited<ReturnType<typeof apiAsyncNode.admin.globalStats.query>>;
type AdminUser = Awaited<ReturnType<typeof apiAsyncNode.admin.listUsers.query>>[number];
type TopUser = Awaited<ReturnType<typeof apiAsyncNode.admin.topUsers.query>>[number];
type UsageOverview = Awaited<ReturnType<typeof apiAsyncNode.admin.usageOverview.query>>;
type AdminBanner = Awaited<ReturnType<typeof apiAsyncNode.admin.getAdminBanner.query>>;
type UserUsage = Awaited<ReturnType<typeof apiAsyncNode.admin.getUserUsage.query>>;
type UserLog = Awaited<ReturnType<typeof apiAsyncNode.admin.getUserLogs.query>>[number];
type AdminSystemPersona = Awaited<ReturnType<typeof apiAsyncNode.admin.listSystemPersonas.query>>[number];

type ActiveView = 'overview' | 'people' | 'credits' | 'models' | 'personas' | 'broadcast';
type UserFilter = 'all' | 'attention' | 'active' | 'inactive' | 'zero' | 'near' | 'unlimited' | 'premium' | 'ultra';
type SortField = 'name' | 'status' | 'monthTokens' | 'remaining' | 'limit' | 'lastSeen' | 'conversations';
type SortDir = 'asc' | 'desc';
type BannerTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
type JoyColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type BannerDraft = {
  enabled: boolean;
  tone: BannerTone;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  expiresAt: string;
};

type PersonaDraft = {
  id: string;
  title: string;
  description: string;
  systemMessage: string;
  systemMessageNotes: string;
  symbol: string;
  imageUri: string;
  examplesText: string;
  highlighted: boolean;
  isActive: boolean;
};

const emptyBannerDraft: BannerDraft = {
  enabled: false,
  tone: 'warning',
  title: '',
  message: '',
  ctaLabel: '',
  ctaUrl: '',
  expiresAt: '',
};

const emptyPersonaDraft: PersonaDraft = {
  id: '',
  title: '',
  description: '',
  systemMessage: '',
  systemMessageNotes: '',
  symbol: '',
  imageUri: '',
  examplesText: '',
  highlighted: false,
  isActive: true,
};

const creditPresets = [
  { label: '250K', value: 250_000 },
  { label: '1M', value: 1_000_000 },
  { label: '2M', value: 2_000_000 },
  { label: '5M', value: 5_000_000 },
];

const planMeta = {
  PREMIUM: { label: 'Premium', color: 'primary' as JoyColor },
  ULTRA: { label: 'Ultra', color: 'warning' as JoyColor },
} as const;

function planChip(plan: string | null | undefined): { label: string; color: JoyColor } {
  return plan === 'ULTRA' ? planMeta.ULTRA : planMeta.PREMIUM;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtCost(cents: number | null | undefined): string {
  if (!cents) return '$0.00';
  const dollars = cents / 100;
  return dollars < 0.01 ? '$' + dollars.toFixed(4) : '$' + dollars.toFixed(2);
}

function fmtDateTime(value: Date | string | null | undefined): string {
  if (!value) return 'Never';
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Never';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtDate(value: Date | string | null | undefined): string {
  if (!value) return 'Never';
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Never';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isUserActive(isActive: boolean | null | undefined): boolean {
  return isActive !== false;
}

function getMonthTokens(user: AdminUser): number {
  return user.monthUsage?._sum?.totalTokens ?? 0;
}

// Weekly (rolling 7-day) tokens: this is the window limits are enforced on
function getWeekTokens(user: AdminUser): number {
  return user.weekUsage?._sum?.totalTokens ?? 0;
}

function getLastSeen(user: AdminUser): Date | null {
  return user.allTimeUsage?._max?.createdAt ?? null;
}

function tokenLimitPct(tokenLimit: number | null | undefined, usedTokens: number): number {
  if (tokenLimit == null || tokenLimit <= 0) return 0;
  return Math.min(100, (usedTokens / tokenLimit) * 100);
}

function tokenLimitLabel(tokenLimit: number | null | undefined): string {
  if (tokenLimit == null) return 'Unlimited';
  if (tokenLimit === 0) return 'Blocked';
  return fmtNum(tokenLimit) + ' /wk';
}

function tokenRemainingValue(tokenLimit: number | null | undefined, usedTokens: number): number | null {
  if (tokenLimit == null) return null;
  return Math.max(0, tokenLimit - usedTokens);
}

function tokenRemainingLabel(tokenLimit: number | null | undefined, usedTokens: number): string {
  const remaining = tokenRemainingValue(tokenLimit, usedTokens);
  return remaining == null ? 'Unlimited' : fmtNum(remaining);
}

// NOTE: health/attention are computed on the ENFORCED window: weekly usage vs the effective
// weekly limit (per-user override, or the plan default - see usage.plans.ts)
function attentionScore(user: AdminUser): number {
  const used = getWeekTokens(user);
  const limit = user.effectiveWeeklyLimit;
  const pct = tokenLimitPct(limit, used);
  if (!isUserActive(user.isActive)) return 100;
  if (limit === 0) return 92;
  if (limit != null && limit > 0 && used >= limit) return 88;
  if (pct >= 90) return 72;
  if (pct >= 75) return 54;
  return 0;
}

function userHealth(user: AdminUser): { label: string; color: JoyColor; icon: React.ReactNode; detail: string } {
  const used = getWeekTokens(user);
  const limit = user.effectiveWeeklyLimit;
  const pct = tokenLimitPct(limit, used);

  if (!isUserActive(user.isActive)) return { label: 'Inactive', color: 'danger', icon: <PersonOffIcon sx={{ fontSize: 14 }} />, detail: 'Account blocked' };
  if (limit === 0) return { label: 'No credits', color: 'danger', icon: <BlockIcon sx={{ fontSize: 14 }} />, detail: 'Cannot chat' };
  if (limit != null && limit > 0 && used >= limit)
    return { label: 'Exhausted', color: 'danger', icon: <WarningIcon sx={{ fontSize: 14 }} />, detail: 'Weekly limit reached' };
  if (pct >= 90) return { label: 'Critical', color: 'danger', icon: <WarningIcon sx={{ fontSize: 14 }} />, detail: `${pct.toFixed(0)}% of week` };
  if (pct >= 75) return { label: 'Near cap', color: 'warning', icon: <WarningIcon sx={{ fontSize: 14 }} />, detail: `${pct.toFixed(0)}% of week` };
  if (limit == null) return { label: 'Unlimited', color: 'neutral', icon: <AllInclusiveIcon sx={{ fontSize: 14 }} />, detail: 'Admin account' };
  return { label: 'Healthy', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, detail: 'Within budget' };
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function bannerToDraft(banner: AdminBanner | null): BannerDraft {
  if (!banner) return emptyBannerDraft;
  return {
    enabled: banner.enabled,
    tone: banner.tone,
    title: banner.title ?? '',
    message: banner.message ?? '',
    ctaLabel: banner.ctaLabel ?? '',
    ctaUrl: banner.ctaUrl ?? '',
    expiresAt: toDateTimeLocalValue(banner.expiresAt),
  };
}

function examplesToText(examples: unknown): string {
  if (!Array.isArray(examples)) return '';
  return examples
    .map((example) =>
      typeof example === 'string'
        ? example
        : example && typeof example === 'object' && 'prompt' in example
          ? String((example as { prompt?: unknown }).prompt ?? '')
          : '',
    )
    .filter(Boolean)
    .join('\n');
}

function personaToDraft(persona: AdminSystemPersona): PersonaDraft {
  return {
    id: persona.id,
    title: persona.title,
    description: persona.description ?? '',
    systemMessage: persona.systemMessage,
    systemMessageNotes: persona.systemMessageNotes ?? '',
    symbol: persona.symbol ?? '',
    imageUri: persona.imageUri ?? '',
    examplesText: examplesToText(persona.examples),
    highlighted: persona.highlighted,
    isActive: persona.isActive,
  };
}

function personaDraftPayload(draft: PersonaDraft, includeId: boolean) {
  return {
    ...(includeId || draft.id.trim() ? { id: draft.id.trim() } : {}),
    title: draft.title.trim(),
    description: draft.description,
    systemMessage: draft.systemMessage,
    systemMessageNotes: draft.systemMessageNotes,
    symbol: draft.symbol,
    imageUri: draft.imageUri,
    examples: draft.examplesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    highlighted: draft.highlighted,
    isActive: draft.isActive,
  };
}

function Surface(props: { children: React.ReactNode; sx?: any }) {
  return (
    <Box
      sx={{
        border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
        borderRadius: 8,
        background: 'var(--joy-palette-background-surface)',
        overflow: 'hidden',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
}

function SectionHeader(props: { icon: React.ReactNode; title: string; right?: React.ReactNode; sub?: string }) {
  return (
    <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)' }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--joy-palette-neutral-softBg)',
          color: 'text.secondary',
        }}
      >
        {props.icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography level="title-md" sx={{ fontWeight: 800 }}>
          {props.title}
        </Typography>
        {props.sub && (
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {props.sub}
          </Typography>
        )}
      </Box>
      {props.right && <Box sx={{ ml: 'auto' }}>{props.right}</Box>}
    </Box>
  );
}

function MetricTile(props: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: JoyColor }) {
  return (
    <Surface sx={{ flex: '1 1 190px', minWidth: 170, p: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 38,
            height: 38,
            borderRadius: 8,
            color: `var(--joy-palette-${props.color}-plainColor)`,
            background: `var(--joy-palette-${props.color}-softBg)`,
            flexShrink: 0,
          }}
        >
          {props.icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 700 }}>
            {props.label}
          </Typography>
          <Typography level="h3" sx={{ fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
            {props.value}
          </Typography>
          {props.sub && (
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }}>
              {props.sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Surface>
  );
}

function NavButton(props: { icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <Button
      variant={props.active ? 'solid' : 'plain'}
      color={props.active ? 'neutral' : 'neutral'}
      size="sm"
      startDecorator={props.icon}
      endDecorator={
        props.badge != null ? (
          <Chip size="sm" variant="soft">
            {props.badge}
          </Chip>
        ) : undefined
      }
      onClick={props.onClick}
      sx={{
        borderRadius: 8,
        justifyContent: 'flex-start',
        fontWeight: 800,
        ...(props.active
          ? { background: 'var(--joy-palette-neutral-900)', color: '#fff', '&:hover': { background: 'var(--joy-palette-neutral-800)' } }
          : { color: 'text.secondary' }),
      }}
    >
      {props.label}
    </Button>
  );
}

function SortArrow(props: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (props.sortField !== props.field) return null;
  return props.sortDir === 'asc' ? (
    <ArrowUpwardIcon sx={{ fontSize: 14, ml: 0.4, verticalAlign: 'middle' }} />
  ) : (
    <ArrowDownwardIcon sx={{ fontSize: 14, ml: 0.4, verticalAlign: 'middle' }} />
  );
}

function UserIdentity(props: { user: Pick<AdminUser, 'name' | 'email' | 'image'> }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Avatar size="sm" src={props.user.image ?? undefined} sx={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
        {(props.user.name || props.user.email || '?')[0]}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography level="body-sm" noWrap sx={{ fontWeight: 800 }}>
          {props.user.name || 'Unnamed'}
        </Typography>
        <Typography level="body-xs" noWrap sx={{ color: 'text.tertiary' }}>
          {props.user.email}
        </Typography>
      </Box>
    </Box>
  );
}

function UsageProgress(props: { used: number; limit: number | null | undefined }) {
  const pct = tokenLimitPct(props.limit, props.used);
  const isUnlimited = props.limit == null;
  const isZeroCredit = props.limit === 0;
  const state: { label: string; color: JoyColor; fill: string; track: string; text: string } = isUnlimited
    ? { label: 'Unlimited', color: 'neutral', fill: '#64748b', track: 'rgba(100, 116, 139, 0.18)', text: 'No cap' }
    : isZeroCredit
      ? { label: 'No credits', color: 'danger', fill: '#dc2626', track: 'rgba(220, 38, 38, 0.16)', text: '0%' }
      : pct >= 90
        ? { label: 'Critical', color: 'danger', fill: '#dc2626', track: 'rgba(220, 38, 38, 0.16)', text: `${pct.toFixed(0)}%` }
        : pct >= 75
          ? { label: 'Near cap', color: 'warning', fill: '#d97706', track: 'rgba(217, 119, 6, 0.18)', text: `${pct.toFixed(0)}%` }
          : { label: 'Healthy', color: 'success', fill: '#059669', track: 'rgba(5, 150, 105, 0.16)', text: `${pct.toFixed(0)}%` };
  const width = isUnlimited ? 100 : isZeroCredit ? 0 : Math.max(props.used > 0 ? 4 : 0, pct);

  return (
    <Tooltip title={`${fmtNum(props.used)} used${props.limit == null ? '' : ` of ${fmtNum(props.limit)}`} - ${state.label}`}>
      <Box sx={{ minWidth: 190 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.65 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography level="body-xs" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {fmtNum(props.used)}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', lineHeight: 1.1 }}>
              {state.label}
            </Typography>
          </Box>
          <Chip
            size="sm"
            variant="soft"
            color={state.color}
            sx={{ height: 22, minWidth: 52, justifyContent: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}
          >
            {state.text}
          </Chip>
        </Box>
        <Box
          className="admin-usage-track"
          sx={{
            height: 12,
            borderRadius: 8,
            overflow: 'hidden',
            background: state.track,
            border: '1px solid rgba(15, 23, 42, 0.14)',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Box
            sx={{
              width: `${width}%`,
              minWidth: width > 0 ? 5 : 0,
              height: '100%',
              borderRadius: 8,
              background: state.fill,
              boxShadow: width > 0 ? `0 0 0 1px ${state.fill}, 0 0 12px ${state.track}` : undefined,
              transition: 'width 160ms ease',
            }}
          />
        </Box>
        {props.limit != null && props.limit > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.45 }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: 10 }}>
              0
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
              {fmtNum(props.limit)}
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

function DailyUsageBars(props: { overview: UsageOverview | null }) {
  const daily = props.overview?.daily ?? [];
  const max = Math.max(1, ...daily.map((day) => day.tokens));

  return (
    <Box sx={{ px: 2.5, py: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${daily.length || 14}, minmax(10px, 1fr))`, gap: 0.75, alignItems: 'end', height: 150 }}>
        {(daily.length ? daily : Array.from({ length: 14 }, (_, index) => ({ date: String(index), tokens: 0, requests: 0, users: 0, costCents: 0 }))).map(
          (day) => {
            const height = Math.max(6, (day.tokens / max) * 130);
            return (
              <Tooltip key={day.date} title={`${fmtDate(day.date)} - ${fmtNum(day.tokens)} tokens, ${fmtNum(day.requests)} requests`}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 0.75 }}>
                  <Box
                    sx={{
                      height,
                      borderRadius: 6,
                      background: day.tokens ? 'linear-gradient(180deg, #0ea5a4 0%, #2563eb 100%)' : 'var(--joy-palette-neutral-softBg)',
                    }}
                  />
                  <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', fontSize: 10 }}>
                    {fmtDate(day.date).split(' ')[1]}
                  </Typography>
                </Box>
              </Tooltip>
            );
          },
        )}
      </Box>
    </Box>
  );
}

function BannerPreview(props: { draft: BannerDraft }) {
  if (!props.draft.enabled && !props.draft.message.trim()) {
    return (
      <Alert color="neutral" variant="soft" sx={{ borderRadius: 8 }}>
        No live banner
      </Alert>
    );
  }

  return (
    <Alert
      color={props.draft.tone}
      variant="soft"
      startDecorator={<CampaignIcon />}
      endDecorator={
        props.draft.ctaLabel && props.draft.ctaUrl ? (
          <Button component="a" href={props.draft.ctaUrl} size="sm" color={props.draft.tone}>
            {props.draft.ctaLabel}
          </Button>
        ) : undefined
      }
      sx={{ borderRadius: 8, alignItems: 'center' }}
    >
      <Box>
        {props.draft.title.trim() && (
          <Typography level="title-sm" color={props.draft.tone} sx={{ fontWeight: 900 }}>
            {props.draft.title.trim()}
          </Typography>
        )}
        <Typography level="body-sm">{props.draft.message.trim() || 'Banner message'}</Typography>
      </Box>
    </Alert>
  );
}

function LeaderboardRow(props: { rank: number; entry: TopUser; onOpen: () => void }) {
  const user = props.entry.user;
  if (!user) return null;

  return (
    <Box
      onClick={props.onOpen}
      sx={{
        display: 'grid',
        gridTemplateColumns: '36px minmax(0, 1fr) auto auto',
        gap: 1.5,
        alignItems: 'center',
        px: 2.5,
        py: 1.35,
        cursor: 'pointer',
        '&:hover': { background: 'var(--joy-palette-neutral-softBg)' },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          background: props.rank <= 3 ? 'var(--joy-palette-warning-softBg)' : 'var(--joy-palette-neutral-softBg)',
          fontWeight: 900,
        }}
      >
        {props.rank}
      </Box>
      <UserIdentity user={user} />
      <Box sx={{ textAlign: 'right' }}>
        <Typography level="body-sm" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
          {fmtNum(props.entry._sum.totalTokens)}
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
          {fmtCost(props.entry._sum.costCents)}
        </Typography>
      </Box>
      <Chip size="sm" variant="outlined" sx={{ minWidth: 46, fontVariantNumeric: 'tabular-nums' }}>
        {props.entry._count}
      </Chip>
    </Box>
  );
}

function UserDetailModal(props: { userId: string; onClose: () => void; onRefresh: () => void }) {
  const [usage, setUsage] = React.useState<UserUsage | null>(null);
  const [logs, setLogs] = React.useState<UserLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [limitValue, setLimitValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [statusSaving, setStatusSaving] = React.useState(false);
  const [planSaving, setPlanSaving] = React.useState(false);

  const loadData = React.useCallback(() => {
    setIsLoading(true);
    Promise.all([apiAsyncNode.admin.getUserUsage.query({ userId: props.userId }), apiAsyncNode.admin.getUserLogs.query({ userId: props.userId, limit: 80 })])
      .then(([userUsage, userLogs]) => {
        setUsage(userUsage);
        setLogs(userLogs);
        setLimitValue(userUsage.user?.tokenLimit == null ? '' : String(userUsage.user.tokenLimit));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [props.userId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSetLimit = (nextLimit?: number | null) => {
    const parsed = nextLimit !== undefined ? nextLimit : limitValue.trim() === '' ? null : Number.parseInt(limitValue.trim(), 10);

    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      alert('Enter 0 or a positive number. Leave blank to use the plan default.');
      return;
    }

    setSaving(true);
    apiAsyncNode.admin.setTokenLimit
      .mutate({ userId: props.userId, tokenLimit: parsed })
      .then(() => {
        loadData();
        props.onRefresh();
      })
      .catch((error) => alert(error?.message || 'Failed to update credits'))
      .finally(() => setSaving(false));
  };

  const handleToggleActive = () => {
    const nextIsActive = !isUserActive(usage?.user?.isActive);
    setStatusSaving(true);
    apiAsyncNode.admin.setUserActive
      .mutate({ userId: props.userId, isActive: nextIsActive })
      .then(() => {
        loadData();
        props.onRefresh();
      })
      .catch((error) => alert(error?.message || 'Failed to update account status'))
      .finally(() => setStatusSaving(false));
  };

  const handleSetPlan = (plan: 'PREMIUM' | 'ULTRA') => {
    if (usage?.user?.plan === plan) return;
    setPlanSaving(true);
    apiAsyncNode.admin.setUserPlan
      .mutate({ userId: props.userId, plan })
      .then(() => {
        loadData();
        props.onRefresh();
      })
      .catch((error) => alert(error?.message || 'Failed to update plan'))
      .finally(() => setPlanSaving(false));
  };

  const user = usage?.user;
  const weekTokens = usage?.thisWeek?._sum?.totalTokens ?? 0;
  const monthTokens = usage?.thisMonth?._sum?.totalTokens ?? 0;
  const allTimeTokens = usage?.allTime?._sum?.totalTokens ?? 0;
  const userActive = isUserActive(user?.isActive);
  const effectiveLimit = user?.effectiveWeeklyLimit;
  const pct = tokenLimitPct(effectiveLimit, weekTokens);
  const health = user
    ? userHealth({ ...user, monthUsage: usage?.thisMonth as any, weekUsage: usage?.thisWeek as any, allTimeUsage: null, _count: { conversations: 0, messages: 0, usageLogs: 0 } } as AdminUser)
    : null;
  const plan = planChip(user?.plan);

  return (
    <Modal open onClose={props.onClose}>
      <ModalDialog
        sx={{
          width: 'min(1120px, 96vw)',
          maxHeight: '92vh',
          overflow: 'auto',
          p: 0,
          borderRadius: 8,
          border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
        }}
      >
        <ModalClose />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : !user ? (
          <Box sx={{ p: 4 }}>
            <Typography color="danger">User not found</Typography>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                px: 3,
                py: 2.5,
                borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Avatar src={user.image ?? undefined} sx={{ width: 54, height: 54, fontWeight: 900 }}>
                {(user.name || user.email || '?')[0]}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography level="h3" sx={{ fontWeight: 900 }}>
                  {user.name || 'Unnamed user'}
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                  {user.email}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                {health && (
                  <Chip color={health.color} variant="soft" startDecorator={health.icon}>
                    {health.label}
                  </Chip>
                )}
                <Chip color={plan.color} variant="solid" startDecorator={<CreditScoreIcon sx={{ fontSize: 14 }} />}>
                  {plan.label}
                </Chip>
                <Button
                  color={user.plan === 'ULTRA' ? 'primary' : 'warning'}
                  variant="soft"
                  loading={planSaving}
                  onClick={() => handleSetPlan(user.plan === 'ULTRA' ? 'PREMIUM' : 'ULTRA')}
                  sx={{ borderRadius: 8 }}
                >
                  {user.plan === 'ULTRA' ? 'Switch to Premium' : 'Upgrade to Ultra'}
                </Button>
                <Button
                  color={userActive ? 'danger' : 'success'}
                  variant={userActive ? 'outlined' : 'solid'}
                  loading={statusSaving}
                  onClick={handleToggleActive}
                  sx={{ borderRadius: 8 }}
                >
                  {userActive ? 'Set Inactive' : 'Activate'}
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 2.5 }}>
                <Surface>
                  <SectionHeader
                    icon={<CreditScoreIcon sx={{ fontSize: 18 }} />}
                    title="Weekly Allowance"
                    right={
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                        {(user.tokenLimit == null || user.tokenLimit <= 0) && effectiveLimit !== 0 && (
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            {plan.label} default
                          </Typography>
                        )}
                        <Chip
                          variant="soft"
                          color={effectiveLimit === 0 ? 'danger' : effectiveLimit == null ? 'neutral' : pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'success'}
                        >
                          {tokenLimitLabel(effectiveLimit)}
                        </Chip>
                      </Box>
                    }
                  />
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                      <MetricTile
                        color="primary"
                        icon={<TokenIcon />}
                        label="Used, Last 7 Days"
                        value={fmtNum(weekTokens)}
                        sub={`${fmtNum(usage?.thisWeek?._count ?? 0)} requests`}
                      />
                      <MetricTile
                        color="success"
                        icon={<AllInclusiveIcon />}
                        label="Remaining"
                        value={tokenRemainingLabel(effectiveLimit, weekTokens)}
                        sub={effectiveLimit == null ? 'Unlimited account' : `${pct.toFixed(0)}% of weekly limit`}
                      />
                      <MetricTile
                        color="warning"
                        icon={<AttachMoneyIcon />}
                        label="Month Cost"
                        value={fmtCost(usage?.thisMonth?._sum?.costCents)}
                        sub={`${fmtNum(monthTokens)} tokens this month`}
                      />
                    </Box>
                    {effectiveLimit != null && effectiveLimit > 0 && (
                      <LinearProgress
                        determinate
                        value={pct}
                        color={pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 8, mb: 2 }}
                      />
                    )}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
                      <Input
                        size="sm"
                        placeholder="Blank = plan default, 0 = no credits"
                        value={limitValue}
                        onChange={(event) => setLimitValue(event.target.value)}
                        sx={{ minWidth: 220, borderRadius: 8 }}
                      />
                      <Button size="sm" startDecorator={<SaveIcon />} loading={saving} onClick={() => handleSetLimit()} sx={{ borderRadius: 8 }}>
                        Save
                      </Button>
                      <Divider orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {creditPresets.map((preset) => (
                          <Button
                            key={preset.value}
                            size="sm"
                            variant="soft"
                            color="neutral"
                            disabled={saving}
                            onClick={() => handleSetLimit(preset.value)}
                            sx={{ borderRadius: 8 }}
                          >
                            {preset.label} /wk
                          </Button>
                        ))}
                        <Button size="sm" variant="soft" color="neutral" disabled={saving} onClick={() => handleSetLimit(null)} sx={{ borderRadius: 8 }}>
                          Plan default
                        </Button>
                        <Button size="sm" variant="soft" color="danger" disabled={saving} onClick={() => handleSetLimit(0)} sx={{ borderRadius: 8 }}>
                          No credits
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </Surface>

                <Surface>
                  <SectionHeader icon={<QueryStatsIcon sx={{ fontSize: 18 }} />} title="Usage" />
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, p: 2.5 }}>
                    <MetricTile
                      color="primary"
                      icon={<SpeedIcon />}
                      label="All Time Tokens"
                      value={fmtNum(allTimeTokens)}
                      sub={`${fmtNum(usage?.allTime?._count ?? 0)} requests`}
                    />
                    <MetricTile color="success" icon={<PaidIcon />} label="All Time Cost" value={fmtCost(usage?.allTime?._sum?.costCents)} />
                  </Box>
                </Surface>
              </Box>

              <Surface sx={{ mt: 2.5 }}>
                <SectionHeader
                  icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                  title="Recent Activity"
                  right={
                    <IconButton size="sm" variant="plain" onClick={loadData}>
                      <RefreshIcon />
                    </IconButton>
                  }
                />
                {logs.length ? (
                  <Sheet variant="plain" sx={{ overflowX: 'auto' }}>
                    <Table
                      size="sm"
                      stickyHeader
                      sx={{ minWidth: 760, '& th': { fontWeight: 800, color: 'text.tertiary' }, '& td': { verticalAlign: 'middle' } }}
                    >
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Model</th>
                          <th>Operation</th>
                          <th style={{ textAlign: 'right' }}>Input</th>
                          <th style={{ textAlign: 'right' }}>Output</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td>{fmtDateTime(log.createdAt)}</td>
                            <td>
                              <Typography level="body-xs" noWrap sx={{ maxWidth: 240 }}>
                                {log.modelId}
                              </Typography>
                            </td>
                            <td>
                              <Chip size="sm" variant="soft">
                                {log.operation}
                              </Chip>
                            </td>
                            <td style={{ textAlign: 'right' }}>{fmtNum(log.inputTokens)}</td>
                            <td style={{ textAlign: 'right' }}>{fmtNum(log.outputTokens)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtNum(log.totalTokens)}</td>
                            <td style={{ textAlign: 'right' }}>{fmtCost(log.costCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                ) : (
                  <Box sx={{ py: 5, textAlign: 'center', color: 'text.tertiary' }}>
                    <Typography level="body-sm">No usage logs recorded yet</Typography>
                  </Box>
                )}
              </Surface>
            </Box>
          </Box>
        )}
      </ModalDialog>
    </Modal>
  );
}

function PersonaEditorModal(props: {
  mode: 'create' | 'edit';
  draft: PersonaDraft;
  saving: boolean;
  onClose: () => void;
  onDraftChange: (draft: PersonaDraft) => void;
  onSave: () => void;
}) {
  const setField = <K extends keyof PersonaDraft>(field: K, value: PersonaDraft[K]) => {
    props.onDraftChange({ ...props.draft, [field]: value });
  };

  const canSave = !!props.draft.title.trim() && !!props.draft.systemMessage.trim() && (props.mode === 'create' || !!props.draft.id.trim());

  return (
    <Modal open onClose={props.onClose}>
      <ModalDialog
        sx={{
          width: 'min(980px, 96vw)',
          maxHeight: '92vh',
          overflow: 'auto',
          p: 0,
          borderRadius: 8,
          border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
        }}
      >
        <ModalClose />
        <SectionHeader
          icon={<PersonIcon sx={{ fontSize: 18 }} />}
          title={props.mode === 'create' ? 'Add Persona' : 'Edit Persona'}
          sub={props.mode === 'create' ? 'Create a new admin-managed persona' : props.draft.id}
        />
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.75fr 1.25fr' }, gap: 1.5 }}>
              <FormControl>
                <FormLabel>ID</FormLabel>
                <Input
                  value={props.draft.id}
                  disabled={props.mode === 'edit'}
                  placeholder="CareerAI"
                  onChange={(event) => setField('id', event.target.value)}
                  sx={{ borderRadius: 8 }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input value={props.draft.title} placeholder="Career AI" onChange={(event) => setField('title', event.target.value)} sx={{ borderRadius: 8 }} />
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '140px 1fr' }, gap: 1.5 }}>
              <FormControl>
                <FormLabel>Symbol</FormLabel>
                <Input value={props.draft.symbol} placeholder="🎭" onChange={(event) => setField('symbol', event.target.value)} sx={{ borderRadius: 8 }} />
              </FormControl>
              <FormControl>
                <FormLabel>Image URI</FormLabel>
                <Input
                  value={props.draft.imageUri}
                  placeholder="/images/personas/avatar.webp"
                  onChange={(event) => setField('imageUri', event.target.value)}
                  sx={{ borderRadius: 8 }}
                />
              </FormControl>
            </Box>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                minRows={2}
                value={props.draft.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder="Short admin and selector description"
                sx={{ borderRadius: 8 }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>System Prompt</FormLabel>
              <Textarea
                minRows={9}
                value={props.draft.systemMessage}
                onChange={(event) => setField('systemMessage', event.target.value)}
                placeholder="Persona system prompt"
                sx={{ borderRadius: 8, '& textarea': { fontFamily: 'var(--joy-fontFamily-code)', fontSize: '0.84rem' } }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Prompt Notes</FormLabel>
              <Textarea
                minRows={2}
                value={props.draft.systemMessageNotes}
                onChange={(event) => setField('systemMessageNotes', event.target.value)}
                placeholder="Optional internal notes"
                sx={{ borderRadius: 8 }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Examples</FormLabel>
              <Textarea
                minRows={4}
                value={props.draft.examplesText}
                onChange={(event) => setField('examplesText', event.target.value)}
                placeholder="One starter prompt per line"
                sx={{ borderRadius: 8 }}
              />
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Switch checked={props.draft.isActive} onChange={(event) => setField('isActive', event.target.checked)} />
                <Typography level="body-sm" sx={{ fontWeight: 800 }}>
                  Active
                </Typography>
                <Switch checked={props.draft.highlighted} onChange={(event) => setField('highlighted', event.target.checked)} />
                <Typography level="body-sm" sx={{ fontWeight: 800 }}>
                  Highlighted
                </Typography>
              </Stack>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="plain" color="neutral" onClick={props.onClose} sx={{ borderRadius: 8 }}>
                  Cancel
                </Button>
                <Button
                  disabled={!canSave}
                  loading={props.saving}
                  startDecorator={props.mode === 'create' ? <AddIcon /> : <SaveIcon />}
                  onClick={props.onSave}
                  sx={{ borderRadius: 8 }}
                >
                  {props.mode === 'create' ? 'Add Persona' : 'Save Persona'}
                </Button>
              </Box>
            </Box>
          </Stack>
        </Box>
      </ModalDialog>
    </Modal>
  );
}

// --- Models Manager (turn connected models on/off for everyone) ---

function ModelsManager() {

  // all connected models from THIS admin's client store (already loaded in the browser)
  const llms = useModelsStore(useShallow((state) => state.llms));
  const disabledIds = useAdminModelsStore((state) => state.disabledIds);

  const [tab, setTab] = React.useState<'all' | 'active' | 'disabled'>('all');
  const [search, setSearch] = React.useState('');
  const [savingIds, setSavingIds] = React.useState<Set<string>>(new Set());

  // sync the authoritative disabled list from the server on mount (admin view)
  React.useEffect(() => {
    apiAsyncNode.admin.getDisabledModelsAdmin.query()
      .then((res) => adminModelsSetDisabledIds(res.disabledIds))
      .catch(() => { /* keep last-known */ });
  }, []);

  const totalCount = llms.length;
  const disabledCount = React.useMemo(() => llms.filter((llm) => disabledIds.has(llm.id)).length, [llms, disabledIds]);
  const activeCount = totalCount - disabledCount;

  const toggleModels = React.useCallback((models: DLLM[], disabled: boolean) => {
    if (!models.length) return;
    const uiIds = models.map((llm) => llm.id); // savingIds/spinners track the DLLM id
    const blockIds = Array.from(new Set(models.flatMap(modelBlockIds))); // sent to server: DLLM id + llmRef
    setSavingIds((prev) => { const next = new Set(prev); uiIds.forEach((id) => next.add(id)); return next; });
    apiAsyncNode.admin.setModelsDisabled.mutate({ modelIds: blockIds, disabled })
      .then((res) => adminModelsSetDisabledIds(res.disabledIds))
      .catch((error) => alert(error?.message || 'Failed to update models'))
      .finally(() => setSavingIds((prev) => { const next = new Set(prev); uiIds.forEach((id) => next.delete(id)); return next; }));
  }, []);

  // filter by tab + search, then group by service
  const groups = React.useMemo(() => {
    const lc = search.trim().toLowerCase();
    const filtered = llms.filter((llm) => {
      const isDisabled = disabledIds.has(llm.id);
      if (tab === 'active' && isDisabled) return false;
      if (tab === 'disabled' && !isDisabled) return false;
      if (lc && !getLLMLabel(llm).toLowerCase().includes(lc) && !llm.id.toLowerCase().includes(lc)) return false;
      return true;
    });
    return groupLLMsByService(filtered);
  }, [llms, disabledIds, tab, search]);

  const shownCount = groups.reduce((sum, g) => sum + g.models.length, 0);

  if (!totalCount)
    return (
      <Stack spacing={2} sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Surface>
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.tertiary' }}>
            <LayersIcon sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
            <Typography level="body-sm">
              No models are loaded in this browser yet. Open the chat, connect your model services (e.g. OpenRouter), then come back - the list here mirrors the models you have connected.
            </Typography>
          </Box>
        </Surface>
      </Stack>
    );

  return (
    <Stack spacing={2} sx={{ maxWidth: 1180, mx: 'auto' }}>

      {/* Summary tiles */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <MetricTile color="primary" icon={<LayersIcon />} label="Connected Models" value={totalCount} sub="Across all services" />
        <MetricTile color="success" icon={<CheckCircleIcon />} label="Active" value={activeCount} sub="Selectable in chat" />
        <MetricTile color="danger" icon={<BlockIcon />} label="Turned Off" value={disabledCount} sub="Hidden from everyone" />
      </Box>

      <Surface>
        {/* Toolbar */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)' }}>
          <Input
            size="sm"
            placeholder="Search models by name or id"
            startDecorator={<SearchIcon sx={{ fontSize: 18 }} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: '1 1 320px', maxWidth: 560, borderRadius: 8 }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {(['all', 'active', 'disabled'] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={tab === value ? 'solid' : 'soft'}
                color={value === 'disabled' ? 'danger' : value === 'active' ? 'success' : 'neutral'}
                onClick={() => setTab(value)}
                sx={{ borderRadius: 8, textTransform: 'capitalize', minWidth: 84 }}
              >
                {value === 'all' ? `All ${totalCount}` : value === 'active' ? `Active ${activeCount}` : `Off ${disabledCount}`}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Grouped list */}
        <Box sx={{ maxHeight: '62vh', overflow: 'auto' }}>
          {groups.map((group) => {
            const groupDisabledCount = group.models.filter((llm) => disabledIds.has(llm.id)).length;
            const allDisabled = groupDisabledCount === group.models.length;
            const groupSaving = group.models.some((llm) => savingIds.has(llm.id));
            return (
              <Box key={group.serviceId}>
                {/* Service header */}
                <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, background: 'var(--joy-palette-background-level1)', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)' }}>
                  <Typography level="title-sm" sx={{ fontWeight: 800 }}>{group.serviceLabel}</Typography>
                  <Chip size="sm" variant="soft" color="neutral">{group.models.length}</Chip>
                  {groupDisabledCount > 0 && <Chip size="sm" variant="soft" color="danger">{groupDisabledCount} off</Chip>}
                  <Button
                    size="sm"
                    variant="plain"
                    color={allDisabled ? 'success' : 'danger'}
                    loading={groupSaving}
                    startDecorator={<PowerSettingsNewIcon sx={{ fontSize: 15 }} />}
                    onClick={() => toggleModels(group.models, !allDisabled)}
                    sx={{ ml: 'auto', borderRadius: 8 }}
                  >
                    {allDisabled ? 'Enable all' : 'Turn all off'}
                  </Button>
                </Box>
                {/* Models */}
                {group.models.map((llm) => {
                  const isDisabled = disabledIds.has(llm.id);
                  const saving = savingIds.has(llm.id);
                  return (
                    <Box
                      key={llm.id}
                      sx={{ px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid var(--joy-palette-divider)', opacity: isDisabled ? 0.6 : 1 }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography level="body-sm" noWrap sx={{ fontWeight: 700 }}>{getLLMLabel(llm)}</Typography>
                        <Typography level="body-xs" noWrap sx={{ color: 'text.tertiary' }}>{llm.id}</Typography>
                      </Box>
                      <Chip size="sm" variant="soft" color={isDisabled ? 'danger' : 'success'} sx={{ minWidth: 62, justifyContent: 'center' }}>
                        {isDisabled ? 'Off' : 'Active'}
                      </Chip>
                      {saving ? (
                        <CircularProgress size="sm" sx={{ '--CircularProgress-size': '20px' }} />
                      ) : (
                        <Switch
                          checked={!isDisabled}
                          color={isDisabled ? 'danger' : 'success'}
                          onChange={(event) => toggleModels([llm], !event.target.checked)}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
          {!shownCount && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
              <Typography level="body-sm">No models match this view</Typography>
            </Box>
          )}
        </Box>
      </Surface>

      <Typography level="body-xs" sx={{ color: 'text.tertiary', px: 0.5 }}>
        Turned-off models disappear from the model picker for every user and are rejected server-side. Changes apply within a few seconds. This list mirrors the models connected in your own browser.
      </Typography>
    </Stack>
  );
}


export function AppAdmin() {
  const { data: session } = useSession();

  const [checkingAdmin, setCheckingAdmin] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [globalStats, setGlobalStats] = React.useState<AdminStats | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [topUsers, setTopUsers] = React.useState<TopUser[]>([]);
  const [usageOverview, setUsageOverview] = React.useState<UsageOverview | null>(null);
  const [adminBanner, setAdminBanner] = React.useState<AdminBanner | null>(null);
  const [systemPersonas, setSystemPersonas] = React.useState<AdminSystemPersona[]>([]);

  const [activeView, setActiveView] = React.useState<ActiveView>('overview');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [personaSearchQuery, setPersonaSearchQuery] = React.useState('');
  const [userFilter, setUserFilter] = React.useState<UserFilter>('all');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [bulkLimit, setBulkLimit] = React.useState('');
  const [bulkSaving, setBulkSaving] = React.useState(false);
  const [statusSavingUserId, setStatusSavingUserId] = React.useState<string | null>(null);
  const [bannerDraft, setBannerDraft] = React.useState<BannerDraft>(emptyBannerDraft);
  const [bannerSaving, setBannerSaving] = React.useState(false);
  const [personaDraft, setPersonaDraft] = React.useState<PersonaDraft>(emptyPersonaDraft);
  const [personaEditorMode, setPersonaEditorMode] = React.useState<'create' | 'edit' | null>(null);
  const [personaSaving, setPersonaSaving] = React.useState(false);
  const [personaDeletingId, setPersonaDeletingId] = React.useState<string | null>(null);
  const [personaSeeding, setPersonaSeeding] = React.useState(false);

  const loadAllData = React.useCallback(() => {
    if (!isAdmin) return;

    setLoading(true);
    Promise.all([
      apiAsyncNode.admin.globalStats.query(),
      apiAsyncNode.admin.listUsers.query(),
      apiAsyncNode.admin.topUsers.query({ limit: 10 }),
      apiAsyncNode.admin.usageOverview.query(),
      apiAsyncNode.admin.getAdminBanner.query(),
      apiAsyncNode.admin.listSystemPersonas.query(),
    ])
      .then(([stats, userList, top, overview, banner, personas]) => {
        setGlobalStats(stats);
        setUsers(userList);
        setTopUsers(top);
        setUsageOverview(overview);
        setAdminBanner(banner);
        setSystemPersonas(personas);
        setBannerDraft(bannerToDraft(banner));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  React.useEffect(() => {
    if (!session?.user) {
      setCheckingAdmin(false);
      return;
    }

    setCheckingAdmin(true);
    apiAsyncNode.admin.isAdmin
      .query()
      .then((res) => setIsAdmin(res.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingAdmin(false));
  }, [session?.user]);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const accountCounts = React.useMemo(() => {
    const active = users.filter((user) => isUserActive(user.isActive)).length;
    const inactive = users.length - active;
    const zeroCredit = users.filter((user) => user.tokenLimit === 0).length;
    const planDefault = users.filter((user) => user.tokenLimit == null && user.effectiveWeeklyLimit != null).length;
    const premium = users.filter((user) => user.plan !== 'ULTRA').length;
    const ultra = users.filter((user) => user.plan === 'ULTRA').length;
    const nearCap = users.filter((user) => {
      const limit = user.effectiveWeeklyLimit;
      const pct = tokenLimitPct(limit, getWeekTokens(user));
      return limit != null && limit > 0 && pct >= 75;
    }).length;
    const attention = users.filter((user) => attentionScore(user) > 0).length;
    return { active, inactive, zeroCredit, planDefault, premium, ultra, nearCap, attention };
  }, [users]);

  // Weekly capacity vs weekly consumption, over the effective (plan or override) limits
  const creditStats = React.useMemo(() => {
    let allocated = 0;
    let usedAgainstAllocated = 0;
    let finiteUsers = 0;
    for (const user of users) {
      const limit = user.effectiveWeeklyLimit;
      if (limit != null && limit > 0) {
        allocated += limit;
        usedAgainstAllocated += getWeekTokens(user);
        finiteUsers += 1;
      }
    }
    return {
      allocated,
      usedAgainstAllocated,
      finiteUsers,
      pct: allocated > 0 ? Math.min(100, (usedAgainstAllocated / allocated) * 100) : 0,
    };
  }, [users]);

  const priorityUsers = React.useMemo(() => {
    return [...users]
      .filter((user) => attentionScore(user) > 0)
      .sort((a, b) => attentionScore(b) - attentionScore(a))
      .slice(0, 8);
  }, [users]);

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const health = userHealth(user);
      const matchesQuery = !query || user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
      if (!matchesQuery) return false;

      switch (userFilter) {
        case 'attention':
          return attentionScore(user) > 0;
        case 'active':
          return isUserActive(user.isActive);
        case 'inactive':
          return !isUserActive(user.isActive);
        case 'zero':
          return user.tokenLimit === 0;
        case 'near':
          return health.label === 'Near cap' || health.label === 'Critical' || health.label === 'Exhausted';
        case 'unlimited': // 'Plan default' filter: weekly allowance comes from the plan
          return user.tokenLimit == null;
        case 'premium':
          return user.plan !== 'ULTRA';
        case 'ultra':
          return user.plan === 'ULTRA';
        default:
          return true;
      }
    });
  }, [searchQuery, userFilter, users]);

  const sortedUsers = React.useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';

      switch (sortField) {
        case 'name':
          av = (a.name || a.email || '').toLowerCase();
          bv = (b.name || b.email || '').toLowerCase();
          break;
        case 'status':
          av = attentionScore(a);
          bv = attentionScore(b);
          break;
        case 'monthTokens': // weekly usage (the enforced window)
          av = getWeekTokens(a);
          bv = getWeekTokens(b);
          break;
        case 'remaining':
          av = tokenRemainingValue(a.effectiveWeeklyLimit, getWeekTokens(a)) ?? Number.POSITIVE_INFINITY;
          bv = tokenRemainingValue(b.effectiveWeeklyLimit, getWeekTokens(b)) ?? Number.POSITIVE_INFINITY;
          break;
        case 'limit':
          av = a.effectiveWeeklyLimit ?? Number.POSITIVE_INFINITY;
          bv = b.effectiveWeeklyLimit ?? Number.POSITIVE_INFINITY;
          break;
        case 'lastSeen':
          av = getLastSeen(a)?.getTime() ?? 0;
          bv = getLastSeen(b)?.getTime() ?? 0;
          break;
        case 'conversations':
          av = a._count.conversations;
          bv = b._count.conversations;
          break;
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortDir, sortField]);

  const filteredPersonas = React.useMemo(() => {
    const query = personaSearchQuery.trim().toLowerCase();
    if (!query) return systemPersonas;
    return systemPersonas.filter(
      (persona) =>
        persona.id.toLowerCase().includes(query) || persona.title.toLowerCase().includes(query) || (persona.description ?? '').toLowerCase().includes(query),
    );
  }, [personaSearchQuery, systemPersonas]);

  const personaCounts = React.useMemo(() => {
    const active = systemPersonas.filter((persona) => persona.isActive).length;
    const highlighted = systemPersonas.filter((persona) => persona.highlighted).length;
    return {
      active,
      inactive: systemPersonas.length - active,
      highlighted,
    };
  }, [systemPersonas]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const handleToggleUserActive = (userId: string, currentIsActive: boolean) => {
    setStatusSavingUserId(userId);
    apiAsyncNode.admin.setUserActive
      .mutate({ userId, isActive: !currentIsActive })
      .then(() => loadAllData())
      .catch((error) => alert(error?.message || 'Failed to update account status'))
      .finally(() => setStatusSavingUserId(null));
  };

  const handleSetAllLimits = (tokenLimit: number | null) => {
    setBulkSaving(true);
    apiAsyncNode.admin.setAllTokenLimits
      .mutate({ tokenLimit })
      .then((data) => {
        setBulkLimit('');
        alert('Updated ' + data.updated + ' users');
        loadAllData();
      })
      .catch((error) => alert(error?.message || 'Failed to update limits'))
      .finally(() => setBulkSaving(false));
  };

  const handlePublishBanner = (enabledOverride?: boolean) => {
    const enabled = enabledOverride ?? bannerDraft.enabled;
    const expiresAt = fromDateTimeLocalValue(bannerDraft.expiresAt);

    if (enabled && !bannerDraft.message.trim()) {
      alert('Banner message is required when the banner is live.');
      return;
    }

    setBannerSaving(true);
    apiAsyncNode.admin.setAdminBanner
      .mutate({
        enabled,
        tone: bannerDraft.tone,
        title: bannerDraft.title.trim() || null,
        message: bannerDraft.message.trim(),
        ctaLabel: bannerDraft.ctaLabel.trim() || null,
        ctaUrl: bannerDraft.ctaUrl.trim() || null,
        expiresAt,
      })
      .then((banner) => {
        setAdminBanner(banner);
        setBannerDraft(bannerToDraft(banner));
      })
      .catch((error) => alert(error?.message || 'Failed to publish banner'))
      .finally(() => setBannerSaving(false));
  };

  const handleOpenCreatePersona = () => {
    setPersonaDraft(emptyPersonaDraft);
    setPersonaEditorMode('create');
  };

  const handleOpenEditPersona = (persona: AdminSystemPersona) => {
    setPersonaDraft(personaToDraft(persona));
    setPersonaEditorMode('edit');
  };

  const handleSavePersona = () => {
    if (!personaEditorMode) return;
    if (!personaDraft.title.trim() || !personaDraft.systemMessage.trim()) {
      alert('Title and system prompt are required.');
      return;
    }

    setPersonaSaving(true);
    const payload = personaDraftPayload(personaDraft, personaEditorMode === 'edit');
    const request =
      personaEditorMode === 'create'
        ? apiAsyncNode.admin.createSystemPersona.mutate(payload as any)
        : apiAsyncNode.admin.updateSystemPersona.mutate(payload as any);

    request
      .then(() => {
        setPersonaEditorMode(null);
        loadAllData();
      })
      .catch((error) => alert(error?.message || 'Failed to save persona'))
      .finally(() => setPersonaSaving(false));
  };

  const handleDeletePersona = (persona: AdminSystemPersona) => {
    if (!confirm('Delete "' + persona.title + '"?')) return;

    setPersonaDeletingId(persona.id);
    apiAsyncNode.admin.deleteSystemPersona
      .mutate({ id: persona.id })
      .then(() => loadAllData())
      .catch((error) => alert(error?.message || 'Failed to delete persona'))
      .finally(() => setPersonaDeletingId(null));
  };

  const handleSeedPersonas = () => {
    if (!confirm('Seed/refresh personas from the current JSON? Existing seeded IDs will be overwritten.')) return;

    setPersonaSeeding(true);
    apiAsyncNode.admin.seedSystemPersonas
      .mutate()
      .then((result) => {
        alert('Seeded ' + result.upserted + ' personas.');
        loadAllData();
      })
      .catch((error) => alert(error?.message || 'Failed to seed personas'))
      .finally(() => setPersonaSeeding(false));
  };

  if (!session?.user)
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100%', background: 'var(--joy-palette-background-body)' }}>
        <Typography level="h4" sx={{ color: 'text.tertiary' }}>
          Sign in required
        </Typography>
      </Box>
    );

  if (checkingAdmin)
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100%', background: 'var(--joy-palette-background-body)' }}>
        <CircularProgress size="lg" />
      </Box>
    );

  if (!isAdmin)
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100%', background: 'var(--joy-palette-background-body)', p: 3 }}>
        <Stack spacing={1.25} sx={{ alignItems: 'center' }}>
          <ShieldIcon sx={{ fontSize: 48, color: 'text.tertiary' }} />
          <Typography level="h4">Access denied</Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
            Admin privileges required
          </Typography>
        </Stack>
      </Box>
    );

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--joy-palette-background-body)' }}>
      <Box
        sx={{
          px: { xs: 1.5, md: 2.5 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
          background: 'var(--joy-palette-background-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 8,
            background: 'var(--joy-palette-neutral-900)',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <AdminPanelSettingsIcon />
        </Box>
        <Box sx={{ mr: { xs: 0, md: 2 }, minWidth: 170 }}>
          <Typography level="title-lg" sx={{ fontWeight: 900, lineHeight: 1 }}>
            Admin Command
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {session.user.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flex: 1, flexWrap: 'wrap' }}>
          <NavButton
            icon={<DashboardIcon sx={{ fontSize: 17 }} />}
            label="Overview"
            active={activeView === 'overview'}
            onClick={() => setActiveView('overview')}
          />
          <NavButton
            icon={<GroupIcon sx={{ fontSize: 17 }} />}
            label="People"
            badge={users.length}
            active={activeView === 'people'}
            onClick={() => setActiveView('people')}
          />
          <NavButton
            icon={<CreditScoreIcon sx={{ fontSize: 17 }} />}
            label="Credits"
            badge={accountCounts.attention || undefined}
            active={activeView === 'credits'}
            onClick={() => setActiveView('credits')}
          />
          <NavButton
            icon={<LayersIcon sx={{ fontSize: 17 }} />}
            label="Models"
            active={activeView === 'models'}
            onClick={() => setActiveView('models')}
          />
          <NavButton
            icon={<PersonIcon sx={{ fontSize: 17 }} />}
            label="Personas"
            badge={systemPersonas.length}
            active={activeView === 'personas'}
            onClick={() => setActiveView('personas')}
          />
          <NavButton
            icon={<CampaignIcon sx={{ fontSize: 17 }} />}
            label="Broadcast"
            active={activeView === 'broadcast'}
            onClick={() => setActiveView('broadcast')}
          />
        </Box>
        <Chip color={adminBanner?.enabled ? adminBanner.tone : 'neutral'} variant="soft" startDecorator={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}>
          {adminBanner?.enabled ? 'Banner live' : 'No live banner'}
        </Chip>
        <Tooltip title="Refresh">
          <IconButton size="sm" variant="outlined" onClick={loadAllData} disabled={loading} sx={{ borderRadius: 8 }}>
            <RefreshIcon
              sx={loading ? { animation: 'admin-spin 1s linear infinite', '@keyframes admin-spin': { '100%': { transform: 'rotate(360deg)' } } } : undefined}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 } }}>
        {loading && !globalStats ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 12 }}>
            <CircularProgress size="lg" />
          </Box>
        ) : (
          <>
            {activeView === 'overview' && (
              <Stack spacing={2.5} sx={{ maxWidth: 1480, mx: 'auto' }}>
                <Surface
                  sx={{ p: { xs: 2, md: 3 }, background: 'linear-gradient(135deg, rgba(14,165,164,0.10), rgba(37,99,235,0.08) 52%, rgba(245,158,11,0.08))' }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr auto' }, gap: 2.5, alignItems: 'center' }}>
                    <Box>
                      <Typography level="h1" sx={{ fontWeight: 950, lineHeight: 1.02, fontSize: { xs: 34, md: 46 } }}>
                        Operational cockpit
                      </Typography>
                      <Typography level="body-md" sx={{ color: 'text.secondary', mt: 1, maxWidth: 760 }}>
                        Users, credits, demand, and broadcast status in one place.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(90px, 1fr))', gap: 1 }}>
                      <Surface sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography level="h3" sx={{ fontWeight: 900 }}>
                          {accountCounts.attention}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          Need action
                        </Typography>
                      </Surface>
                      <Surface sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography level="h3" sx={{ fontWeight: 900 }}>
                          {usageOverview?.activeUsers ?? 0}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          Active 14d
                        </Typography>
                      </Surface>
                      <Surface sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography level="h3" sx={{ fontWeight: 900 }}>
                          {fmtNum(globalStats?.today?._count ?? 0)}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                          Requests today
                        </Typography>
                      </Surface>
                    </Box>
                  </Box>
                </Surface>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <MetricTile
                    color="primary"
                    icon={<GroupIcon />}
                    label="Total Users"
                    value={globalStats?.userCount ?? users.length}
                    sub={`${accountCounts.active} active, ${accountCounts.inactive} inactive`}
                  />
                  <MetricTile
                    color="success"
                    icon={<SpeedIcon />}
                    label="Today"
                    value={fmtNum(globalStats?.today?._sum?.totalTokens)}
                    sub={`${fmtNum(globalStats?.today?._count)} requests`}
                  />
                  <MetricTile
                    color="warning"
                    icon={<TokenIcon />}
                    label="This Month"
                    value={fmtNum(globalStats?.thisMonth?._sum?.totalTokens)}
                    sub={fmtCost(globalStats?.thisMonth?._sum?.costCents)}
                  />
                  <MetricTile
                    color="danger"
                    icon={<WarningIcon />}
                    label="Risk Queue"
                    value={accountCounts.attention}
                    sub={`${accountCounts.zeroCredit} zero credit, ${accountCounts.nearCap} near cap`}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.4fr 0.9fr' }, gap: 2.5 }}>
                  <Surface>
                    <SectionHeader
                      icon={<BarChartIcon sx={{ fontSize: 18 }} />}
                      title="Demand, Last 14 Days"
                      right={
                        <Chip variant="soft" color="neutral">
                          {fmtNum(usageOverview?.daily.reduce((sum, day) => sum + day.requests, 0) ?? 0)} requests
                        </Chip>
                      }
                    />
                    <DailyUsageBars overview={usageOverview} />
                  </Surface>

                  <Surface>
                    <SectionHeader
                      icon={<InsightsIcon sx={{ fontSize: 18 }} />}
                      title="Weekly Credit Pressure"
                      right={
                        <Chip color={creditStats.pct >= 90 ? 'danger' : creditStats.pct >= 75 ? 'warning' : 'success'} variant="soft">
                          {creditStats.pct.toFixed(0)}%
                        </Chip>
                      }
                    />
                    <Box sx={{ p: 2.5 }}>
                      <LinearProgress
                        determinate
                        value={creditStats.pct}
                        color={creditStats.pct >= 90 ? 'danger' : creditStats.pct >= 75 ? 'warning' : 'success'}
                        sx={{ height: 10, borderRadius: 8, mb: 1.5 }}
                      />
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            Allocated
                          </Typography>
                          <Typography level="title-md" sx={{ fontWeight: 900 }}>
                            {fmtNum(creditStats.allocated)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            Used
                          </Typography>
                          <Typography level="title-md" sx={{ fontWeight: 900 }}>
                            {fmtNum(creditStats.usedAgainstAllocated)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                            Limited users
                          </Typography>
                          <Typography level="title-md" sx={{ fontWeight: 900 }}>
                            {creditStats.finiteUsers}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Surface>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.05fr' }, gap: 2.5 }}>
                  <Surface>
                    <SectionHeader
                      icon={<WarningIcon sx={{ fontSize: 18 }} />}
                      title="Attention Queue"
                      right={
                        <Button
                          size="sm"
                          variant="soft"
                          color="neutral"
                          onClick={() => {
                            setUserFilter('attention');
                            setActiveView('people');
                          }}
                          sx={{ borderRadius: 8 }}
                        >
                          Open
                        </Button>
                      }
                    />
                    {priorityUsers.length ? (
                      <Stack spacing={0} divider={<Divider />}>
                        {priorityUsers.map((user) => {
                          const health = userHealth(user);
                          return (
                            <Box
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2.5,
                                py: 1.5,
                                cursor: 'pointer',
                                '&:hover': { background: 'var(--joy-palette-neutral-softBg)' },
                              }}
                            >
                              <UserIdentity user={user} />
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip size="sm" color={health.color} variant="soft" startDecorator={health.icon}>
                                  {health.label}
                                </Chip>
                                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                                  {health.detail}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Box sx={{ p: 3, color: 'text.tertiary' }}>
                        <Typography level="body-sm">No account needs attention right now</Typography>
                      </Box>
                    )}
                  </Surface>

                  <Surface>
                    <SectionHeader icon={<BoltIcon sx={{ fontSize: 18 }} />} title="Top Users This Month" />
                    {topUsers.length ? (
                      <Box>
                        {topUsers.map((entry, index) => (
                          <LeaderboardRow key={entry.userId} rank={index + 1} entry={entry} onOpen={() => setSelectedUserId(entry.userId)} />
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ p: 3, color: 'text.tertiary' }}>
                        <Typography level="body-sm">No monthly usage yet</Typography>
                      </Box>
                    )}
                  </Surface>
                </Box>
              </Stack>
            )}

            {activeView === 'people' && (
              <Stack spacing={2} sx={{ maxWidth: 1480, mx: 'auto' }}>
                <Surface>
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      gap: 1.25,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    }}
                  >
                    <Input
                      size="sm"
                      placeholder="Search users"
                      startDecorator={<SearchIcon sx={{ fontSize: 18 }} />}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      sx={{ flex: '1 1 280px', maxWidth: 520, borderRadius: 8 }}
                    />
                    <Select
                      size="sm"
                      value={userFilter}
                      onChange={(_, value) => value && setUserFilter(value as UserFilter)}
                      sx={{ minWidth: 170, borderRadius: 8 }}
                    >
                      <Option value="all">All users</Option>
                      <Option value="attention">Needs action</Option>
                      <Option value="active">Active</Option>
                      <Option value="inactive">Inactive</Option>
                      <Option value="zero">Zero credits</Option>
                      <Option value="near">Near cap</Option>
                      <Option value="unlimited">Plan default</Option>
                      <Option value="premium">Premium plan</Option>
                      <Option value="ultra">Ultra plan</Option>
                    </Select>
                    <Chip variant="soft" color="neutral">
                      {sortedUsers.length === users.length ? `${users.length} users` : `${sortedUsers.length} of ${users.length}`}
                    </Chip>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      <Chip size="sm" color="success" variant="soft">
                        {accountCounts.active} active
                      </Chip>
                      <Chip size="sm" color="danger" variant="soft">
                        {accountCounts.inactive} inactive
                      </Chip>
                      <Chip size="sm" color="warning" variant="soft">
                        {accountCounts.zeroCredit} zero credit
                      </Chip>
                      <Chip size="sm" color={planMeta.PREMIUM.color} variant="soft">
                        {accountCounts.premium} Premium
                      </Chip>
                      <Chip size="sm" color={planMeta.ULTRA.color} variant="soft">
                        {accountCounts.ultra} Ultra
                      </Chip>
                    </Box>
                  </Box>
                  <Sheet variant="plain" sx={{ overflowX: 'auto' }}>
                    <Table
                      size="md"
                      stickyHeader
                      hoverRow
                      sx={{
                        minWidth: 1120,
                        '& th': { py: 1.5, px: 2, fontWeight: 900, color: 'text.tertiary', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' },
                        '& td': { py: 1.35, px: 2, verticalAlign: 'middle' },
                        '& tbody tr': { cursor: 'pointer' },
                      }}
                    >
                      <thead>
                        <tr>
                          <th onClick={() => handleSort('name')}>
                            Member <SortArrow field="name" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th onClick={() => handleSort('status')}>
                            Health <SortArrow field="status" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th onClick={() => handleSort('monthTokens')}>
                            Weekly Usage <SortArrow field="monthTokens" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th onClick={() => handleSort('remaining')} style={{ textAlign: 'right' }}>
                            Remaining <SortArrow field="remaining" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th onClick={() => handleSort('limit')}>
                            Plan / Limit <SortArrow field="limit" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th onClick={() => handleSort('conversations')} style={{ textAlign: 'right' }}>
                            Convos <SortArrow field="conversations" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th onClick={() => handleSort('lastSeen')}>
                            Last Seen <SortArrow field="lastSeen" sortField={sortField} sortDir={sortDir} />
                          </th>
                          <th style={{ textAlign: 'right', cursor: 'default' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map((user) => {
                          const used = getWeekTokens(user);
                          const limit = user.effectiveWeeklyLimit;
                          const health = userHealth(user);
                          const active = isUserActive(user.isActive);
                          const plan = planChip(user.plan);
                          return (
                            <tr key={user.id} onClick={() => setSelectedUserId(user.id)}>
                              <td>
                                <UserIdentity user={user} />
                              </td>
                              <td>
                                <Chip size="sm" color={health.color} variant="soft" startDecorator={health.icon}>
                                  {health.label}
                                </Chip>
                              </td>
                              <td>
                                <UsageProgress used={used} limit={limit} />
                              </td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tokenRemainingLabel(limit, used)}</td>
                              <td>
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Chip size="sm" variant="solid" color={plan.color}>
                                    {plan.label}
                                  </Chip>
                                  <Chip size="sm" variant="outlined" color={limit === 0 ? 'danger' : limit == null ? 'neutral' : 'primary'}>
                                    {tokenLimitLabel(limit)}
                                  </Chip>
                                </Box>
                              </td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{user._count.conversations}</td>
                              <td>{fmtDateTime(getLastSeen(user))}</td>
                              <td style={{ textAlign: 'right' }}>
                                <Button
                                  size="sm"
                                  variant={active ? 'outlined' : 'solid'}
                                  color={active ? 'danger' : 'success'}
                                  loading={statusSavingUserId === user.id}
                                  disabled={isAdminEmail(user.email)}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleToggleUserActive(user.id, active);
                                  }}
                                  sx={{ borderRadius: 8, minWidth: 108 }}
                                >
                                  {active ? 'Set Inactive' : 'Activate'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {!sortedUsers.length && (
                          <tr>
                            <td colSpan={8}>
                              <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                                <Typography level="body-sm">No users match this view</Typography>
                              </Box>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Sheet>
                </Surface>
              </Stack>
            )}

            {activeView === 'credits' && (
              <Stack spacing={2.5} sx={{ maxWidth: 1180, mx: 'auto' }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <MetricTile
                    color="primary"
                    icon={<CreditScoreIcon />}
                    label="Weekly Capacity"
                    value={fmtNum(creditStats.allocated)}
                    sub={`${creditStats.finiteUsers} limited users`}
                  />
                  <MetricTile
                    color="success"
                    icon={<TokenIcon />}
                    label="Used, Last 7 Days"
                    value={fmtNum(creditStats.usedAgainstAllocated)}
                    sub={`${creditStats.pct.toFixed(0)}% of capacity`}
                  />
                  <MetricTile color="danger" icon={<BlockIcon />} label="Zero Credit Users" value={accountCounts.zeroCredit} sub="Cannot chat until funded" />
                  <MetricTile color={planMeta.PREMIUM.color} icon={<CreditScoreIcon />} label="Premium Plan" value={accountCounts.premium} sub="Default weekly allowance" />
                  <MetricTile color={planMeta.ULTRA.color} icon={<BoltIcon />} label="Ultra Plan" value={accountCounts.ultra} sub="Highest weekly allowance" />
                </Box>

                <Surface>
                  <SectionHeader
                    icon={<TuneIcon sx={{ fontSize: 18 }} />}
                    title="Bulk Credit Operations"
                    right={
                      <Chip color="warning" variant="soft">
                        Affects all non-admin users
                      </Chip>
                    }
                  />
                  <Box sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {creditPresets.map((preset) => (
                          <Button
                            key={preset.value}
                            variant="soft"
                            color="neutral"
                            loading={bulkSaving}
                            startDecorator={<TokenIcon />}
                            onClick={() => {
                              if (confirm('Set a custom ' + preset.value.toLocaleString() + ' tokens/week override for every non-admin user?')) handleSetAllLimits(preset.value);
                            }}
                            sx={{ borderRadius: 8 }}
                          >
                            {preset.label} /wk
                          </Button>
                        ))}
                        <Button
                          variant="soft"
                          color="danger"
                          loading={bulkSaving}
                          startDecorator={<BlockIcon />}
                          onClick={() => {
                            if (confirm('Set every non-admin user to 0 credits (blocked)?')) handleSetAllLimits(0);
                          }}
                          sx={{ borderRadius: 8 }}
                        >
                          Zero everyone
                        </Button>
                        <Button
                          variant="soft"
                          color="neutral"
                          loading={bulkSaving}
                          startDecorator={<AllInclusiveIcon />}
                          onClick={() => {
                            if (confirm('Reset every non-admin user to their plan\'s weekly default (Premium/Ultra)?')) handleSetAllLimits(null);
                          }}
                          sx={{ borderRadius: 8 }}
                        >
                          Plan default everyone
                        </Button>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input
                          size="sm"
                          placeholder="Custom token limit"
                          value={bulkLimit}
                          onChange={(event) => setBulkLimit(event.target.value)}
                          sx={{ width: 240, borderRadius: 8 }}
                        />
                        <Button
                          size="sm"
                          loading={bulkSaving}
                          startDecorator={<SaveIcon />}
                          onClick={() => {
                            const value = Number.parseInt(bulkLimit, 10);
                            if (Number.isNaN(value) || value < 0) return alert('Enter 0 or a positive number');
                            if (confirm('Set a custom ' + value.toLocaleString() + ' tokens/week override for every non-admin user?')) handleSetAllLimits(value);
                          }}
                          sx={{ borderRadius: 8 }}
                        >
                          Apply custom
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </Surface>

                <Surface>
                  <SectionHeader icon={<ManageAccountsIcon sx={{ fontSize: 18 }} />} title="Credit Exceptions" />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                      gap: 0,
                      '& > div': { borderRight: { md: '1px solid var(--joy-palette-neutral-outlinedBorder)' } },
                      '& > div:last-child': { borderRight: 0 },
                    }}
                  >
                    {[
                      { title: 'No credits', users: users.filter((user) => user.tokenLimit === 0), color: 'danger' as JoyColor },
                      {
                        title: 'Near weekly cap',
                        users: users.filter((user) => tokenLimitPct(user.effectiveWeeklyLimit, getWeekTokens(user)) >= 75),
                        color: 'warning' as JoyColor,
                      },
                      { title: 'Custom override', users: users.filter((user) => user.tokenLimit != null && user.tokenLimit > 0), color: 'neutral' as JoyColor },
                    ].map((group) => (
                      <Box key={group.title} sx={{ p: 2.5 }}>
                        <Chip color={group.color} variant="soft" sx={{ mb: 1.5 }}>
                          {group.title} - {group.users.length}
                        </Chip>
                        <Stack spacing={1}>
                          {group.users.slice(0, 5).map((user) => (
                            <Box
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, cursor: 'pointer' }}
                            >
                              <Typography level="body-sm" noWrap sx={{ fontWeight: 700 }}>
                                {user.name || user.email}
                              </Typography>
                              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontVariantNumeric: 'tabular-nums' }}>
                                {fmtNum(getWeekTokens(user))}
                              </Typography>
                            </Box>
                          ))}
                          {!group.users.length && (
                            <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                              None
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                </Surface>
              </Stack>
            )}

            {activeView === 'personas' && (
              <Stack spacing={2.5} sx={{ maxWidth: 1480, mx: 'auto' }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <MetricTile
                    color="primary"
                    icon={<PersonIcon />}
                    label="Total Personas"
                    value={systemPersonas.length}
                    sub={`${personaCounts.active} active`}
                  />
                  <MetricTile color="success" icon={<CheckCircleIcon />} label="Active" value={personaCounts.active} sub="Available for selection" />
                  <MetricTile color="warning" icon={<BoltIcon />} label="Highlighted" value={personaCounts.highlighted} sub="Promoted in UI" />
                  <MetricTile color="danger" icon={<BlockIcon />} label="Inactive" value={personaCounts.inactive} sub="Hidden from active catalog" />
                </Box>

                <Surface>
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      gap: 1.25,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    }}
                  >
                    <Input
                      size="sm"
                      placeholder="Search personas"
                      startDecorator={<SearchIcon sx={{ fontSize: 18 }} />}
                      value={personaSearchQuery}
                      onChange={(event) => setPersonaSearchQuery(event.target.value)}
                      sx={{ flex: '1 1 280px', maxWidth: 520, borderRadius: 8 }}
                    />
                    <Chip variant="soft" color="neutral">
                      {filteredPersonas.length === systemPersonas.length
                        ? `${systemPersonas.length} personas`
                        : `${filteredPersonas.length} of ${systemPersonas.length}`}
                    </Chip>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      <Button
                        size="sm"
                        variant="soft"
                        color="neutral"
                        startDecorator={<RefreshIcon />}
                        loading={personaSeeding}
                        onClick={handleSeedPersonas}
                        sx={{ borderRadius: 8 }}
                      >
                        Seed JSON
                      </Button>
                      <Button size="sm" startDecorator={<AddIcon />} onClick={handleOpenCreatePersona} sx={{ borderRadius: 8 }}>
                        Add Persona
                      </Button>
                    </Box>
                  </Box>

                  <Sheet variant="plain" sx={{ overflowX: 'auto' }}>
                    <Table
                      size="md"
                      stickyHeader
                      hoverRow
                      sx={{
                        minWidth: 1120,
                        '& th': { py: 1.5, px: 2, fontWeight: 900, color: 'text.tertiary', whiteSpace: 'nowrap' },
                        '& td': { py: 1.35, px: 2, verticalAlign: 'middle' },
                        '& tbody tr': { cursor: 'pointer' },
                      }}
                    >
                      <thead>
                        <tr>
                          <th>Persona</th>
                          <th>ID</th>
                          <th>Status</th>
                          <th>Prompt</th>
                          <th style={{ textAlign: 'right' }}>Examples</th>
                          <th>Updated</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPersonas.map((persona) => {
                          const examplesCount = Array.isArray(persona.examples) ? persona.examples.length : 0;
                          return (
                            <tr key={persona.id} onClick={() => handleOpenEditPersona(persona)}>
                              <td>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                                  <Avatar size="sm" src={persona.imageUri ?? undefined} sx={{ width: 36, height: 36, fontSize: 20, flexShrink: 0 }}>
                                    {persona.symbol || <PersonIcon sx={{ fontSize: 18 }} />}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography level="body-sm" noWrap sx={{ fontWeight: 900 }}>
                                      {persona.title}
                                    </Typography>
                                    <Typography level="body-xs" noWrap sx={{ color: 'text.tertiary', maxWidth: 320 }}>
                                      {persona.description || 'No description'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </td>
                              <td>
                                <Typography level="body-xs" sx={{ fontFamily: 'var(--joy-fontFamily-code)', color: 'text.secondary' }}>
                                  {persona.id}
                                </Typography>
                              </td>
                              <td>
                                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                                  <Chip
                                    size="sm"
                                    color={persona.isActive ? 'success' : 'danger'}
                                    variant="soft"
                                    startDecorator={persona.isActive ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <BlockIcon sx={{ fontSize: 14 }} />}
                                  >
                                    {persona.isActive ? 'Active' : 'Inactive'}
                                  </Chip>
                                  {persona.highlighted && (
                                    <Chip size="sm" color="warning" variant="soft" startDecorator={<BoltIcon sx={{ fontSize: 14 }} />}>
                                      Highlighted
                                    </Chip>
                                  )}
                                </Stack>
                              </td>
                              <td>
                                <Typography level="body-xs" noWrap sx={{ maxWidth: 360, color: 'text.tertiary' }}>
                                  {persona.systemMessage}
                                </Typography>
                              </td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>{examplesCount}</td>
                              <td>{fmtDateTime(persona.updatedAt)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                                  <Tooltip title="Edit persona">
                                    <IconButton
                                      size="sm"
                                      variant="plain"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleOpenEditPersona(persona);
                                      }}
                                    >
                                      <EditIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete persona">
                                    <IconButton
                                      size="sm"
                                      variant="plain"
                                      color="danger"
                                      disabled={personaDeletingId === persona.id}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeletePersona(persona);
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </td>
                            </tr>
                          );
                        })}
                        {!filteredPersonas.length && (
                          <tr>
                            <td colSpan={7}>
                              <Box sx={{ py: 6, textAlign: 'center', color: 'text.tertiary' }}>
                                <Typography level="body-sm">No personas match this view</Typography>
                              </Box>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Sheet>
                </Surface>
              </Stack>
            )}

            {activeView === 'models' && <ModelsManager />}

            {activeView === 'broadcast' && (
              <Stack spacing={2.5} sx={{ maxWidth: 980, mx: 'auto' }}>
                <Surface>
                  <SectionHeader
                    icon={<NotificationsActiveIcon sx={{ fontSize: 18 }} />}
                    title="Live User Banner"
                    right={
                      <Chip color={bannerDraft.enabled ? bannerDraft.tone : 'neutral'} variant="soft">
                        {bannerDraft.enabled ? 'Live' : 'Off'}
                      </Chip>
                    }
                  />
                  <Box sx={{ p: 2.5 }}>
                    <Stack spacing={2.25}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box>
                          <Typography level="title-md" sx={{ fontWeight: 900 }}>
                            Broadcast state
                          </Typography>
                          <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                            Last updated {fmtDateTime(adminBanner?.updatedAt)}
                          </Typography>
                        </Box>
                        <Switch
                          checked={bannerDraft.enabled}
                          color={bannerDraft.enabled ? bannerDraft.tone : 'neutral'}
                          onChange={(event) => setBannerDraft((draft) => ({ ...draft, enabled: event.target.checked }))}
                        />
                      </Box>

                      <BannerPreview draft={bannerDraft} />

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.2fr' }, gap: 2 }}>
                        <Stack spacing={1.5}>
                          <FormControl>
                            <FormLabel>Tone</FormLabel>
                            <Select
                              value={bannerDraft.tone}
                              onChange={(_, value) => value && setBannerDraft((draft) => ({ ...draft, tone: value as BannerTone }))}
                              sx={{ borderRadius: 8 }}
                            >
                              <Option value="neutral">Neutral</Option>
                              <Option value="primary">Primary</Option>
                              <Option value="success">Success</Option>
                              <Option value="warning">Warning</Option>
                              <Option value="danger">Danger</Option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Expires</FormLabel>
                            <Input
                              type="datetime-local"
                              value={bannerDraft.expiresAt}
                              onChange={(event) => setBannerDraft((draft) => ({ ...draft, expiresAt: event.target.value }))}
                              sx={{ borderRadius: 8 }}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Link label</FormLabel>
                            <Input
                              value={bannerDraft.ctaLabel}
                              onChange={(event) => setBannerDraft((draft) => ({ ...draft, ctaLabel: event.target.value }))}
                              placeholder="Status page"
                              sx={{ borderRadius: 8 }}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Link URL</FormLabel>
                            <Input
                              value={bannerDraft.ctaUrl}
                              onChange={(event) => setBannerDraft((draft) => ({ ...draft, ctaUrl: event.target.value }))}
                              placeholder="/profile or https://..."
                              endDecorator={bannerDraft.ctaUrl ? <OpenInNewIcon sx={{ fontSize: 16 }} /> : undefined}
                              sx={{ borderRadius: 8 }}
                            />
                          </FormControl>
                        </Stack>
                        <Stack spacing={1.5}>
                          <FormControl>
                            <FormLabel>Title</FormLabel>
                            <Input
                              value={bannerDraft.title}
                              onChange={(event) => setBannerDraft((draft) => ({ ...draft, title: event.target.value }))}
                              placeholder="Maintenance tonight"
                              sx={{ borderRadius: 8 }}
                            />
                          </FormControl>
                          <FormControl sx={{ flex: 1 }}>
                            <FormLabel>Message</FormLabel>
                            <Textarea
                              minRows={7}
                              maxRows={9}
                              value={bannerDraft.message}
                              onChange={(event) => setBannerDraft((draft) => ({ ...draft, message: event.target.value }))}
                              placeholder="We are performing maintenance at 10 PM ET. Chat may be briefly unavailable."
                              sx={{ borderRadius: 8 }}
                            />
                          </FormControl>
                        </Stack>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          variant="soft"
                          color="neutral"
                          startDecorator={<CloseIcon />}
                          disabled={bannerSaving}
                          onClick={() => setBannerDraft(bannerToDraft(adminBanner))}
                          sx={{ borderRadius: 8 }}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="outlined"
                          color="danger"
                          startDecorator={<BlockIcon />}
                          loading={bannerSaving}
                          onClick={() => handlePublishBanner(false)}
                          sx={{ borderRadius: 8 }}
                        >
                          Disable
                        </Button>
                        <Button
                          color={bannerDraft.tone}
                          startDecorator={<CampaignIcon />}
                          loading={bannerSaving}
                          onClick={() => handlePublishBanner(true)}
                          sx={{ borderRadius: 8 }}
                        >
                          Publish live
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </Surface>

                <Surface>
                  <SectionHeader icon={<EventAvailableIcon sx={{ fontSize: 18 }} />} title="Current Banner Record" />
                  <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                    <Box>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        State
                      </Typography>
                      <Typography level="title-md" sx={{ fontWeight: 900 }}>
                        {adminBanner?.enabled ? 'Live' : 'Off'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        Expires
                      </Typography>
                      <Typography level="title-md" sx={{ fontWeight: 900 }}>
                        {fmtDateTime(adminBanner?.expiresAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                        Tone
                      </Typography>
                      <Typography level="title-md" sx={{ fontWeight: 900 }}>
                        {adminBanner?.tone ?? 'warning'}
                      </Typography>
                    </Box>
                  </Box>
                </Surface>
              </Stack>
            )}
          </>
        )}
      </Box>

      {selectedUserId && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onRefresh={loadAllData} />}
      {personaEditorMode && (
        <PersonaEditorModal
          mode={personaEditorMode}
          draft={personaDraft}
          saving={personaSaving}
          onClose={() => setPersonaEditorMode(null)}
          onDraftChange={setPersonaDraft}
          onSave={handleSavePersona}
        />
      )}
    </Box>
  );
}
