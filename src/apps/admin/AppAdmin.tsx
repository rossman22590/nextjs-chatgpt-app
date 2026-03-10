import * as React from 'react';

import { useSession } from 'next-auth/react';

import {
  Avatar, Box, Button, Chip, CircularProgress, Divider, IconButton,
  Input, LinearProgress, Modal, ModalClose, ModalDialog, Sheet, Stack,
  Table, Tooltip, Typography,
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TokenIcon from '@mui/icons-material/Token';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import TuneIcon from '@mui/icons-material/Tune';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';

import { apiAsyncNode } from '~/common/util/trpc.client';


// --- Tokens / Cost format ---

const fmtNum = (n: number | null | undefined): string => {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const fmtCost = (cents: number | null | undefined): string => {
  if (!cents) return '$0.00';
  const d = cents / 100;
  return d < 0.01 ? '$' + d.toFixed(4) : '$' + d.toFixed(2);
};


// --- Design tokens ---

const SIDEBAR_WIDTH = 240;

const GRADIENT = {
  brand: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
  brandSubtle: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)',
  brandGlow: 'rgba(99,102,241,0.15)',
  surface: 'var(--joy-palette-background-surface)',
} as const;

const ACCENT = {
  indigo: { bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', glow: 'rgba(99,102,241,0.18)', text: '#6366f1' },
  emerald: { bg: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', glow: 'rgba(5,150,105,0.18)', text: '#059669' },
  amber: { bg: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', glow: 'rgba(217,119,6,0.18)', text: '#d97706' },
  rose: { bg: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)', glow: 'rgba(225,29,72,0.18)', text: '#e11d48' },
  sky: { bg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', glow: 'rgba(2,132,199,0.18)', text: '#0284c7' },
  violet: { bg: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)', glow: 'rgba(124,58,237,0.18)', text: '#7c3aed' },
} as const;
type AccentKey = keyof typeof ACCENT;


// --- Shared animation keyframes ---

const pulseKeyframes = {
  '@keyframes pulse-ring': {
    '0%': { transform: 'scale(0.95)', opacity: 1 },
    '100%': { transform: 'scale(1.05)', opacity: 0 },
  },
  '@keyframes spin': {
    '100%': { transform: 'rotate(360deg)' },
  },
  '@keyframes fadeInUp': {
    '0%': { opacity: 0, transform: 'translateY(8px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
};


// --- Glassmorphic Metric Card ---

const MetricCard = (props: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: AccentKey;
  trend?: 'up' | 'down';
}) => {
  const a = ACCENT[props.accent];
  return (
    <Box sx={{
      flex: '1 1 220px', minWidth: 200, position: 'relative', p: 2.5, borderRadius: '16px',
      background: 'var(--joy-palette-background-surface)',
      border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
      boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px ${a.glow}`,
      overflow: 'hidden',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 16px 40px -8px ${a.glow}`,
        borderColor: a.text,
      },
      ...pulseKeyframes,
      animation: 'fadeInUp 0.4s ease-out both',
    }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: a.bg, opacity: 0.8 }} />

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
          <Typography level='body-xs' sx={{
            textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em',
            opacity: 0.5, fontSize: '0.65rem',
          }}>
            {props.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography level='h3' sx={{
              fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              fontSize: '1.75rem', letterSpacing: '-0.02em',
            }}>
              {props.value}
            </Typography>
            {props.trend && (
              <Chip size='sm' variant='soft' color={props.trend === 'up' ? 'success' : 'danger'} sx={{ fontSize: '0.6rem', height: 18 }}>
                {props.trend === 'up' ? '↑' : '↓'}
              </Chip>
            )}
          </Box>
          {props.sub && (
            <Typography level='body-xs' sx={{ opacity: 0.45, mt: -0.5, fontSize: '0.7rem' }}>{props.sub}</Typography>
          )}
        </Box>
        <Box sx={{
          width: 42, height: 42, borderRadius: '12px', display: 'grid', placeItems: 'center',
          background: a.bg, color: '#fff', fontSize: 20, flexShrink: 0,
          boxShadow: `0 4px 12px -2px ${a.glow}`,
        }}>
          {props.icon}
        </Box>
      </Box>
    </Box>
  );
};


// --- Sidebar Navigation Item ---

type ViewId = 'overview' | 'users' | 'settings';

const SidebarItem = (props: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) => (
  <Button
    variant='plain'
    color='neutral'
    size='sm'
    onClick={props.onClick}
    startDecorator={props.icon}
    endDecorator={props.badge != null ? (
      <Chip size='sm' variant='soft' color={props.active ? 'primary' : 'neutral'}
        sx={{ ml: 'auto', minWidth: 24, fontWeight: 700, fontSize: '0.65rem', height: 20 }}>
        {props.badge}
      </Chip>
    ) : undefined}
    aria-label={props.label}
    tabIndex={0}
    sx={{
      justifyContent: 'flex-start', width: '100%', borderRadius: '10px',
      px: 1.75, py: 1, fontWeight: 600, fontSize: '0.82rem',
      transition: 'all 0.15s ease',
      ...(props.active ? {
        background: GRADIENT.brandSubtle,
        color: 'var(--joy-palette-primary-600)',
        '&::before': {
          content: '""', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 20, borderRadius: 99, background: GRADIENT.brand,
        },
      } : {
        color: 'var(--joy-palette-text-secondary)',
        '&:hover': {
          background: 'var(--joy-palette-neutral-softBg)',
        },
      }),
    }}
  >
    {props.label}
  </Button>
);


// --- Leaderboard Row ---

const LeaderboardRow = (props: {
  rank: number;
  name: string;
  email: string;
  image?: string;
  tokens: string;
  cost: string;
  requests: number;
  onClick: () => void;
}) => {
  const medal = props.rank === 1 ? '🥇' : props.rank === 2 ? '🥈' : props.rank === 3 ? '🥉' : null;
  return (
    <Box
      onClick={props.onClick}
      tabIndex={0}
      role='button'
      aria-label={`View details for ${props.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') props.onClick(); }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5, cursor: 'pointer',
        borderRadius: '12px', transition: 'all 0.15s ease', position: 'relative',
        '&:hover': {
          background: GRADIENT.brandSubtle,
          transform: 'translateX(4px)',
        },
        ...(props.rank <= 3 && {
          '&::after': {
            content: '""', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 2, height: '60%', borderRadius: 99,
            background: props.rank === 1 ? '#fbbf24' : props.rank === 2 ? '#94a3b8' : '#d97706',
            opacity: 0.6,
          },
        }),
      }}
    >
      <Typography level='body-sm' sx={{
        width: 32, textAlign: 'center', fontWeight: 800,
        fontSize: medal ? 20 : 13, opacity: medal ? 1 : 0.4,
      }}>
        {medal || `#${props.rank}`}
      </Typography>
      <Avatar size='sm' src={props.image} sx={{
        width: 36, height: 36, fontSize: 13, fontWeight: 700,
        border: props.rank <= 3 ? '2px solid var(--joy-palette-neutral-outlinedBorder)' : undefined,
      }}>
        {(props.name || '?')[0]}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography level='body-sm' noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>{props.name || 'Unknown'}</Typography>
        <Typography level='body-xs' noWrap sx={{ opacity: 0.4, fontSize: '0.68rem' }}>{props.email}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right', minWidth: 80 }}>
        <Typography level='body-sm' sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{props.tokens}</Typography>
        <Typography level='body-xs' sx={{ opacity: 0.4, fontSize: '0.68rem' }}>{props.cost}</Typography>
      </Box>
      <Chip size='sm' variant='outlined' sx={{
        minWidth: 50, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.68rem',
        borderColor: 'var(--joy-palette-neutral-outlinedBorder)',
      }}>
        {props.requests} req
      </Chip>
    </Box>
  );
};


// --- Section Header ---

const SectionHeader = (props: { icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Box sx={{
      width: 32, height: 32, borderRadius: '8px', display: 'grid', placeItems: 'center',
      background: GRADIENT.brandSubtle, color: 'var(--joy-palette-primary-600)', fontSize: 16,
    }}>
      {props.icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography level='title-md' sx={{ fontWeight: 700, lineHeight: 1.2 }}>{props.title}</Typography>
      {props.subtitle && (
        <Typography level='body-xs' sx={{ opacity: 0.45, mt: 0.25 }}>{props.subtitle}</Typography>
      )}
    </Box>
    {props.action}
  </Box>
);


// --- Premium Card Wrapper ---

const PanelCard = (props: { children: React.ReactNode; sx?: object }) => (
  <Box sx={{
    background: 'var(--joy-palette-background-surface)',
    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
    borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s ease',
    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    ...props.sx,
  }}>
    {props.children}
  </Box>
);


// --- User Detail Modal ---

const UserDetailModal = (props: { userId: string; onClose: () => void; onRefresh: () => void }) => {
  const [usage, setUsage] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingLimit, setEditingLimit] = React.useState(false);
  const [limitValue, setLimitValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(() => {
    setIsLoading(true);
    Promise.all([
      apiAsyncNode.admin.getUserUsage.query({ userId: props.userId }),
      apiAsyncNode.admin.getUserLogs.query({ userId: props.userId, limit: 50 }),
    ]).then(([u, l]) => { setUsage(u); setLogs(l); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [props.userId]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleSetLimit = () => {
    const val = limitValue.trim();
    setSaving(true);
    apiAsyncNode.admin.setTokenLimit.mutate({
      userId: props.userId,
      tokenLimit: val === '' || val === '0' ? null : parseInt(val, 10) || null,
    }).then(() => { setEditingLimit(false); loadData(); props.onRefresh(); })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const user = usage?.user;
  const pct = user?.tokenLimit ? Math.min(100, ((usage?.thisMonth?._sum?.totalTokens ?? 0) / user.tokenLimit) * 100) : 0;

  return (
    <Modal open onClose={props.onClose}>
      <ModalDialog sx={{
        width: '94vw', maxWidth: 920, maxHeight: '92vh', overflow: 'auto', p: 0,
        borderRadius: '20px',
        boxShadow: '0 0 0 1px var(--joy-palette-neutral-outlinedBorder), 0 24px 80px -12px rgba(0,0,0,0.35)',
        border: 'none',
      }}>
        <ModalClose sx={{ zIndex: 2, color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.15)' } }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>
        ) : !user ? (
          <Box sx={{ p: 4 }}><Typography color='danger'>User not found</Typography></Box>
        ) : (
          <>
            {/* Gradient Banner */}
            <Box sx={{
              background: GRADIENT.brand, px: 4, pt: 4.5, pb: 6, position: 'relative',
              '&::after': {
                content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                background: 'linear-gradient(to top, var(--joy-palette-background-surface), transparent)',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, position: 'relative', zIndex: 1 }}>
                <Avatar src={user.image} sx={{
                  width: 72, height: 72,
                  border: '3px solid rgba(255,255,255,0.25)',
                  fontSize: 26, fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}>{(user.name || '?')[0]}</Avatar>
                <Box>
                  <Typography level='h3' sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    {user.name || 'Unnamed'}
                  </Typography>
                  <Typography level='body-sm' sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.25 }}>{user.email}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ px: 3.5, py: 3, mt: -3 }}>

              {/* Token Limit */}
              <PanelCard sx={{ mb: 3 }}>
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <TuneIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                    <Typography level='title-sm' sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Token Limit</Typography>
                    {editingLimit ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                        <Input size='sm' placeholder='Empty = Unlimited' value={limitValue}
                          onChange={e => setLimitValue(e.target.value)}
                          sx={{ width: 160, borderRadius: '10px' }} />
                        <Button size='sm' onClick={handleSetLimit} loading={saving}
                          sx={{ borderRadius: '10px', background: GRADIENT.brand, fontWeight: 700 }}>Save</Button>
                        <Button size='sm' variant='plain' color='neutral' onClick={() => setEditingLimit(false)}>Cancel</Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                        <Chip size='sm' variant='soft'
                          color={user.tokenLimit ? (pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary') : 'success'}
                          startDecorator={user.tokenLimit ? <TokenIcon sx={{ fontSize: 13 }} /> : <AllInclusiveIcon sx={{ fontSize: 13 }} />}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        >
                          {user.tokenLimit ? fmtNum(user.tokenLimit) + ' /mo' : 'Unlimited'}
                        </Chip>
                        <IconButton size='sm' variant='plain' onClick={() => {
                          setLimitValue(user.tokenLimit?.toString() || '');
                          setEditingLimit(true);
                        }}><EditIcon sx={{ fontSize: 15 }} /></IconButton>
                      </Box>
                    )}
                  </Box>
                  {user.tokenLimit && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress determinate value={pct}
                        color={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary'}
                        sx={{ height: 6, borderRadius: 99, '--LinearProgress-radius': '99px' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                        <Typography level='body-xs' sx={{ opacity: 0.4, fontSize: '0.65rem' }}>{pct.toFixed(0)}% used</Typography>
                        <Typography level='body-xs' sx={{ opacity: 0.4, fontSize: '0.65rem' }}>
                          {fmtNum(usage?.thisMonth?._sum?.totalTokens)} of {fmtNum(user.tokenLimit)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </PanelCard>

              {/* Stats Grid */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <MetricCard accent='indigo' icon={<TokenIcon sx={{ fontSize: 20 }} />}
                  label='Month Tokens' value={fmtNum(usage.thisMonth._sum.totalTokens)}
                  sub={`${fmtNum(usage.thisMonth._count)} requests`} />
                <MetricCard accent='amber' icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                  label='Month Cost' value={fmtCost(usage.thisMonth._sum.costCents)} />
                <MetricCard accent='emerald' icon={<SpeedIcon sx={{ fontSize: 20 }} />}
                  label='All Time Tokens' value={fmtNum(usage.allTime._sum.totalTokens)}
                  sub={`${fmtNum(usage.allTime._count)} total requests`} />
                <MetricCard accent='rose' icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                  label='All Time Cost' value={fmtCost(usage.allTime._sum.costCents)} />
              </Box>

              {/* Activity Logs */}
              <SectionHeader
                icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                title='Recent Activity'
                subtitle={`${logs.length} entries`}
                action={
                  <IconButton size='sm' variant='plain' onClick={loadData} aria-label='Refresh logs'>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              />

              {logs.length > 0 ? (
                <Sheet variant='outlined' sx={{ borderRadius: '14px', overflow: 'auto', maxHeight: 320 }}>
                  <Table size='sm' stickyHeader sx={{
                    '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                    '& th': {
                      py: 1.25, fontWeight: 700, fontSize: '0.65rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.6,
                    },
                    '& td': { py: 1, fontSize: '0.76rem' },
                    '& tbody tr': { transition: 'background 0.1s' },
                    '& tbody tr:hover': { background: 'var(--joy-palette-neutral-softBg)' },
                  }}>
                    <thead>
                      <tr>
                        <th style={{ width: 140 }}>Time</th>
                        <th>Model</th>
                        <th style={{ textAlign: 'right' }}>In</th>
                        <th style={{ textAlign: 'right' }}>Out</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th style={{ textAlign: 'right' }}>Cost</th>
                        <th style={{ width: 55 }}>Op</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td><Typography level='body-xs'>{new Date(log.createdAt).toLocaleString()}</Typography></td>
                          <td><Typography level='body-xs' noWrap sx={{ maxWidth: 180 }}>{log.modelId}</Typography></td>
                          <td style={{ textAlign: 'right' }}>{fmtNum(log.inputTokens)}</td>
                          <td style={{ textAlign: 'right' }}>{fmtNum(log.outputTokens)}</td>
                          <td style={{ textAlign: 'right' }}><strong>{fmtNum(log.totalTokens)}</strong></td>
                          <td style={{ textAlign: 'right' }}>{fmtCost(log.costCents)}</td>
                          <td>
                            <Chip size='sm' variant='soft' sx={{ fontSize: '0.58rem', height: 18, fontWeight: 600 }}>
                              {log.operation}
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Sheet>
              ) : (
                <Box sx={{
                  py: 5, textAlign: 'center', borderRadius: '14px',
                  border: '1px dashed var(--joy-palette-neutral-outlinedBorder)',
                }}>
                  <AccessTimeIcon sx={{ fontSize: 32, opacity: 0.15, mb: 1 }} />
                  <Typography level='body-sm' sx={{ opacity: 0.35 }}>No usage logs recorded yet</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </ModalDialog>
    </Modal>
  );
};


// --- Main Admin Panel ---

export const AppAdmin = () => {
  const { data: session } = useSession();

  const [checkingAdmin, setCheckingAdmin] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [globalStats, setGlobalStats] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [topUsers, setTopUsers] = React.useState<any[]>([]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [bulkLimit, setBulkLimit] = React.useState('');
  const [bulkSaving, setBulkSaving] = React.useState(false);
  const [activeView, setActiveView] = React.useState<ViewId>('overview');
  const [sortField, setSortField] = React.useState<string>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const loadAllData = React.useCallback(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      apiAsyncNode.admin.globalStats.query(),
      apiAsyncNode.admin.listUsers.query(),
      apiAsyncNode.admin.topUsers.query(),
    ]).then(([stats, userList, top]) => { setGlobalStats(stats); setUsers(userList); setTopUsers(top); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  React.useEffect(() => {
    if (!session?.user) { setCheckingAdmin(false); return; }
    setCheckingAdmin(true);
    apiAsyncNode.admin.isAdmin.query()
      .then(res => setIsAdmin(res.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingAdmin(false));
  }, [session?.user]);

  React.useEffect(() => { loadAllData(); }, [loadAllData]);

  const handleSetAllLimits = (tokenLimit: number | null) => {
    setBulkSaving(true);
    apiAsyncNode.admin.setAllTokenLimits.mutate({ tokenLimit })
      .then(data => { setBulkLimit(''); alert('Updated ' + data.updated + ' users'); loadAllData(); })
      .catch(() => alert('Failed to update limits'))
      .finally(() => setBulkSaving(false));
  };

  // Auth gates
  if (!session?.user)
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', gap: 2, background: 'var(--joy-palette-background-body)',
      }}>
        <ShieldIcon sx={{ fontSize: 48, opacity: 0.15 }} />
        <Typography level='h4' sx={{ fontWeight: 700, opacity: 0.5 }}>Sign in required</Typography>
        <Typography level='body-sm' sx={{ opacity: 0.3 }}>Authenticate to access the admin panel</Typography>
      </Box>
    );

  if (checkingAdmin)
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', gap: 2, background: 'var(--joy-palette-background-body)',
      }}>
        <CircularProgress size='lg' sx={{ '--CircularProgress-trackColor': 'transparent' }} />
        <Typography level='body-sm' sx={{ opacity: 0.4, mt: 1 }}>Verifying access...</Typography>
      </Box>
    );

  if (!isAdmin)
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', gap: 2, background: 'var(--joy-palette-background-body)',
      }}>
        <BlockIcon sx={{ fontSize: 48, opacity: 0.15 }} />
        <Typography level='h4' sx={{ fontWeight: 700, opacity: 0.5 }}>Access Denied</Typography>
        <Typography level='body-sm' sx={{ opacity: 0.3 }}>Admin privileges required</Typography>
      </Box>
    );

  // Filtering + sorting
  const filtered = users.filter((u: any) =>
    !searchQuery
    || u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    || u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sorted = [...filtered].sort((a: any, b: any) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'name': av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); break;
      case 'email': av = (a.email || '').toLowerCase(); bv = (b.email || '').toLowerCase(); break;
      case 'conversations': av = a._count.conversations; bv = b._count.conversations; break;
      case 'messages': av = a._count.messages; bv = b._count.messages; break;
      case 'usageLogs': av = a._count.usageLogs; bv = b._count.usageLogs; break;
      case 'monthTokens': av = a.monthUsage?._sum?.totalTokens ?? 0; bv = b.monthUsage?._sum?.totalTokens ?? 0; break;
      case 'monthCost': av = a.monthUsage?._sum?.costCents ?? 0; bv = b.monthUsage?._sum?.costCents ?? 0; break;
      default: av = a.name || ''; bv = b.name || '';
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortArrow = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ArrowUpwardIcon sx={{ fontSize: 12, ml: 0.3, verticalAlign: 'middle', opacity: 0.6 }} />
      : <ArrowDownwardIcon sx={{ fontSize: 12, ml: 0.3, verticalAlign: 'middle', opacity: 0.6 }} />;
  };

  return (
    <Box sx={{
      height: '100%', display: 'flex', overflow: 'hidden',
      background: 'var(--joy-palette-background-body)',
      ...pulseKeyframes,
    }}>

      {/* === Sidebar === */}
      <Box sx={{
        width: SIDEBAR_WIDTH, flexShrink: 0, display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', borderRight: '1px solid var(--joy-palette-neutral-outlinedBorder)',
        background: 'var(--joy-palette-background-surface)',
      }}>
        {/* Brand */}
        <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', display: 'grid', placeItems: 'center',
            background: GRADIENT.brand, color: '#fff', flexShrink: 0,
            boxShadow: `0 4px 12px ${GRADIENT.brandGlow}`,
          }}>
            <BoltIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography level='title-sm' sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Admin
            </Typography>
            <Typography level='body-xs' sx={{ opacity: 0.35, fontSize: '0.65rem', lineHeight: 1 }}>
              Control Panel
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mx: 2, opacity: 0.5 }} />

        {/* Nav Items */}
        <Box sx={{ px: 1.5, py: 2, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
          <Typography level='body-xs' sx={{
            px: 1, mb: 0.5, textTransform: 'uppercase', fontWeight: 700,
            letterSpacing: '0.08em', fontSize: '0.6rem', opacity: 0.35,
          }}>
            Navigation
          </Typography>
          <SidebarItem icon={<DashboardIcon sx={{ fontSize: 18 }} />} label='Overview'
            active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
          <SidebarItem icon={<GroupIcon sx={{ fontSize: 18 }} />} label='Users'
            active={activeView === 'users'} badge={users.length} onClick={() => setActiveView('users')} />
          <SidebarItem icon={<SettingsIcon sx={{ fontSize: 18 }} />} label='Settings'
            active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </Box>

        {/* Sidebar Footer */}
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid var(--joy-palette-neutral-outlinedBorder)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar size='sm' src={session.user?.image ?? undefined} sx={{ width: 30, height: 30, fontSize: 11 }}>
              {(session.user?.name || '?')[0]}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography level='body-xs' noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {session.user?.name || 'Admin'}
              </Typography>
              <Typography level='body-xs' noWrap sx={{ opacity: 0.35, fontSize: '0.6rem' }}>
                {session.user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* === Main Content === */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Bar */}
        <Box sx={{
          px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
          borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
          background: 'var(--joy-palette-background-surface)',
        }}>
          {/* Mobile brand */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '8px', display: 'grid', placeItems: 'center',
              background: GRADIENT.brand, color: '#fff',
            }}>
              <BoltIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>

          {/* Mobile nav pills */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.5 }}>
            {(['overview', 'users', 'settings'] as ViewId[]).map(v => (
              <Button key={v} size='sm' variant={activeView === v ? 'soft' : 'plain'} color={activeView === v ? 'primary' : 'neutral'}
                onClick={() => setActiveView(v)} sx={{ borderRadius: '10px', px: 1.5, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {v}
              </Button>
            ))}
          </Box>

          {/* Page title (desktop) */}
          <Typography level='title-md' sx={{ fontWeight: 700, display: { xs: 'none', md: 'block' }, textTransform: 'capitalize' }}>
            {activeView}
          </Typography>

          <Box sx={{ flex: 1 }} />

          {/* Refresh */}
          <Tooltip title='Refresh all data' arrow>
            <IconButton variant='outlined' size='sm' onClick={loadAllData} disabled={loading}
              aria-label='Refresh all data'
              sx={{
                borderRadius: '10px', borderColor: 'var(--joy-palette-neutral-outlinedBorder)',
                '&:hover': { borderColor: 'var(--joy-palette-primary-400)' },
              }}>
              <RefreshIcon sx={{
                fontSize: 16,
                ...(loading ? { animation: 'spin 1s linear infinite' } : {}),
              }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, md: 3.5 }, py: 3 }}>

          {loading && !globalStats ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 16, gap: 2 }}>
              <CircularProgress size='lg' sx={{ '--CircularProgress-trackColor': 'transparent' }} />
              <Typography level='body-sm' sx={{ opacity: 0.35 }}>Loading dashboard...</Typography>
            </Box>
          ) : (
            <>
              {/* ====== OVERVIEW ====== */}
              {activeView === 'overview' && (
                <Stack spacing={4} sx={{ maxWidth: 1200, mx: 'auto' }}>

                  {/* Metric Cards */}
                  {globalStats && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                      <MetricCard accent='indigo' icon={<PeopleAltIcon sx={{ fontSize: 20 }} />}
                        label='Total Users' value={globalStats.userCount} />
                      <MetricCard accent='sky' icon={<BoltIcon sx={{ fontSize: 20 }} />}
                        label='Today' value={fmtNum(globalStats.today._sum.totalTokens)}
                        sub={`${fmtNum(globalStats.today._count)} requests`} />
                      <MetricCard accent='amber' icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
                        label='This Month' value={fmtNum(globalStats.thisMonth._sum.totalTokens)}
                        sub={fmtCost(globalStats.thisMonth._sum.costCents)} />
                      <MetricCard accent='emerald' icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                        label='All Time' value={fmtNum(globalStats.allTime._sum.totalTokens)}
                        sub={fmtCost(globalStats.allTime._sum.costCents)} />
                    </Box>
                  )}

                  {/* Leaderboard */}
                  {topUsers.length > 0 && (
                    <PanelCard>
                      <Box sx={{
                        px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                        borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '8px', display: 'grid', placeItems: 'center',
                          background: ACCENT.amber.bg, color: '#fff',
                        }}>
                          <EmojiEventsIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Typography level='title-sm' sx={{ fontWeight: 700 }}>Top Users This Month</Typography>
                        <Typography level='body-xs' sx={{ ml: 'auto', opacity: 0.35, fontSize: '0.65rem' }}>
                          Click to view details
                        </Typography>
                      </Box>
                      <Box sx={{ py: 0.75 }}>
                        {topUsers.map((entry, i) => (
                          <LeaderboardRow key={entry.userId}
                            rank={i + 1}
                            name={entry.user?.name || 'Unknown'}
                            email={entry.user?.email || ''}
                            image={entry.user?.image}
                            tokens={fmtNum(entry._sum.totalTokens)}
                            cost={fmtCost(entry._sum.costCents)}
                            requests={entry._count}
                            onClick={() => setSelectedUserId(entry.userId)}
                          />
                        ))}
                      </Box>
                    </PanelCard>
                  )}
                </Stack>
              )}

              {/* ====== USERS ====== */}
              {activeView === 'users' && (
                <Stack spacing={2.5} sx={{ maxWidth: 1400, mx: 'auto' }}>

                  {/* Search + Count */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Input size='sm' placeholder='Search users...'
                      startDecorator={<SearchIcon sx={{ fontSize: 16, opacity: 0.4 }} />}
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      aria-label='Search users'
                      sx={{
                        flex: 1, maxWidth: 360, borderRadius: '12px',
                        '--Input-focusedThickness': '2px',
                        '--Input-focusedHighlight': 'var(--joy-palette-primary-400)',
                      }} />
                    <Chip variant='soft' color='neutral' size='sm' sx={{
                      fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.7rem',
                    }}>
                      {sorted.length === users.length ? `${users.length} users` : `${sorted.length} of ${users.length}`}
                    </Chip>
                  </Box>

                  {/* Users Table */}
                  <PanelCard>
                    <Sheet sx={{ borderRadius: '16px', overflow: 'auto' }}>
                      <Table size='sm' stickyHeader hoverRow sx={{
                        '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                        '& th': {
                          py: 1.5, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                          fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase',
                          letterSpacing: '0.06em', opacity: 0.55,
                          transition: 'opacity 0.1s',
                          '&:hover': { opacity: 0.8 },
                        },
                        '& td': { py: 1.25, verticalAlign: 'middle' },
                        '& tbody tr': {
                          cursor: 'pointer', transition: 'background 0.1s',
                          '&:hover': { background: GRADIENT.brandSubtle },
                        },
                      }}>
                        <thead>
                          <tr>
                            <th onClick={() => handleSort('name')}>User <SortArrow field='name' /></th>
                            <th onClick={() => handleSort('email')}>Email <SortArrow field='email' /></th>
                            <th onClick={() => handleSort('conversations')} style={{ textAlign: 'right' }}>Convos <SortArrow field='conversations' /></th>
                            <th onClick={() => handleSort('messages')} style={{ textAlign: 'right' }}>Messages <SortArrow field='messages' /></th>
                            <th onClick={() => handleSort('monthTokens')} style={{ textAlign: 'right' }}>Month Tokens <SortArrow field='monthTokens' /></th>
                            <th onClick={() => handleSort('monthCost')} style={{ textAlign: 'right' }}>Month Cost <SortArrow field='monthCost' /></th>
                            <th onClick={() => handleSort('usageLogs')} style={{ textAlign: 'right' }}>Logs <SortArrow field='usageLogs' /></th>
                            <th>Limit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((user: any) => {
                            const mTokens = user.monthUsage?._sum?.totalTokens ?? 0;
                            const mCost = user.monthUsage?._sum?.costCents ?? 0;
                            const mReqs = user.monthUsage?._count ?? 0;
                            const limitPct = user.tokenLimit ? Math.min(100, (mTokens / user.tokenLimit) * 100) : 0;
                            const limitColor = limitPct > 90 ? 'danger' as const : limitPct > 70 ? 'warning' as const : 'success' as const;
                            return (
                              <tr key={user.id} onClick={() => setSelectedUserId(user.id)}>
                                <td>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar size='sm' src={user.image} sx={{
                                      width: 30, height: 30, fontSize: 11, flexShrink: 0, fontWeight: 700,
                                    }}>
                                      {(user.name || '?')[0]}
                                    </Avatar>
                                    <Typography level='body-sm' noWrap sx={{ maxWidth: 150, fontWeight: 600 }}>
                                      {user.name || 'Unnamed'}
                                    </Typography>
                                  </Box>
                                </td>
                                <td>
                                  <Typography level='body-xs' noWrap sx={{ maxWidth: 200, opacity: 0.55 }}>
                                    {user.email}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Typography level='body-sm' sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
                                    {user._count.conversations}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Typography level='body-sm' sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
                                    {user._count.messages}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Tooltip title={`${mReqs} requests this month`}>
                                    <Typography level='body-sm' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                      {fmtNum(mTokens)}
                                    </Typography>
                                  </Tooltip>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Typography level='body-sm' sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
                                    {fmtCost(mCost)}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Typography level='body-sm' sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.45 }}>
                                    {user._count.usageLogs}
                                  </Typography>
                                </td>
                                <td>
                                  <Chip size='sm' variant='soft' color={user.tokenLimit ? limitColor : 'neutral'}
                                    startDecorator={user.tokenLimit
                                      ? (limitPct > 90 ? <WarningIcon sx={{ fontSize: 11 }} /> : <CheckCircleIcon sx={{ fontSize: 11 }} />)
                                      : <AllInclusiveIcon sx={{ fontSize: 11 }} />
                                    }
                                    sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.65rem', height: 22 }}>
                                    {user.tokenLimit ? fmtNum(user.tokenLimit) : 'Unlimited'}
                                  </Chip>
                                </td>
                              </tr>
                            );
                          })}
                          {sorted.length === 0 && (
                            <tr>
                              <td colSpan={8}>
                                <Box sx={{
                                  py: 6, textAlign: 'center',
                                }}>
                                  <SearchIcon sx={{ fontSize: 32, opacity: 0.12, mb: 1 }} />
                                  <Typography level='body-sm' sx={{ opacity: 0.35 }}>No users match your search</Typography>
                                </Box>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Sheet>
                  </PanelCard>
                </Stack>
              )}

              {/* ====== SETTINGS ====== */}
              {activeView === 'settings' && (
                <Stack spacing={3} sx={{ maxWidth: 680, mx: 'auto' }}>

                  {/* Bulk Token Limits */}
                  <PanelCard>
                    <Box sx={{
                      px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                      borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      background: 'var(--joy-palette-background-level1)',
                    }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '8px', display: 'grid', placeItems: 'center',
                        background: ACCENT.amber.bg, color: '#fff',
                      }}>
                        <TuneIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography level='title-sm' sx={{ fontWeight: 700 }}>Bulk Token Limits</Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <Typography level='body-sm' sx={{ mb: 2.5, opacity: 0.55, lineHeight: 1.6 }}>
                        Set a monthly token limit for every user at once. Leave empty or 0 for unlimited.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input size='sm' placeholder='e.g. 2000000' value={bulkLimit}
                          onChange={e => setBulkLimit(e.target.value)}
                          aria-label='Bulk token limit value'
                          sx={{ width: 200, borderRadius: '10px' }} />
                        <Button size='sm' loading={bulkSaving}
                          sx={{
                            borderRadius: '10px', fontWeight: 700,
                            background: GRADIENT.brand,
                            '&:hover': { background: GRADIENT.brand, filter: 'brightness(1.1)' },
                          }}
                          onClick={() => {
                            const val = parseInt(bulkLimit, 10);
                            if (!val || val <= 0) return alert('Enter a valid number');
                            if (confirm('Set ' + val.toLocaleString() + ' tokens/month for ALL users?'))
                              handleSetAllLimits(val);
                          }}>
                          Apply to All
                        </Button>
                        <Button size='sm' variant='outlined' color='neutral' loading={bulkSaving}
                          sx={{ borderRadius: '10px', fontWeight: 600 }}
                          onClick={() => {
                            if (confirm('Remove token limit for ALL users (unlimited)?'))
                              handleSetAllLimits(null);
                          }}>
                          Set All Unlimited
                        </Button>
                      </Box>
                    </Box>
                  </PanelCard>

                  {/* System Info */}
                  <PanelCard>
                    <Box sx={{
                      px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                      borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      background: 'var(--joy-palette-background-level1)',
                    }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '8px', display: 'grid', placeItems: 'center',
                        background: ACCENT.indigo.bg, color: '#fff',
                      }}>
                        <ShieldIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography level='title-sm' sx={{ fontWeight: 700 }}>System Info</Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography level='body-sm' sx={{ opacity: 0.5 }}>Admin Email</Typography>
                          <Typography level='body-sm' sx={{ fontWeight: 700, fontFamily: 'code' }}>rcohen@mytsi.org</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography level='body-sm' sx={{ opacity: 0.5 }}>Admin Token Limit</Typography>
                          <Chip size='sm' variant='soft' color='success'
                            startDecorator={<AllInclusiveIcon sx={{ fontSize: 12 }} />}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                            Always Unlimited
                          </Chip>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography level='body-sm' sx={{ opacity: 0.5 }}>Monthly Reset</Typography>
                          <Typography level='body-sm' sx={{ fontWeight: 700 }}>1st of each month</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography level='body-sm' sx={{ opacity: 0.5 }}>Total Users</Typography>
                          <Typography level='body-sm' sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {globalStats?.userCount ?? '-'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </PanelCard>
                </Stack>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onRefresh={loadAllData} />
      )}
    </Box>
  );
};
