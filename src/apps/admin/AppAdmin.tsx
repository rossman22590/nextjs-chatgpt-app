import * as React from 'react';

import { useSession } from 'next-auth/react';

import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Input,
  LinearProgress,
  Modal,
  ModalClose,
  ModalDialog,
  Sheet,
  Stack,
  Table,
  Tooltip,
  Typography,
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { apiAsyncNode } from '~/common/util/trpc.client';

// --- Tokens / Cost format ---

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtCost(cents: number | null | undefined): string {
  if (!cents) return '$0.00';
  const d = cents / 100;
  return d < 0.01 ? '$' + d.toFixed(4) : '$' + d.toFixed(2);
}

function isUserActive(isActive: boolean | null | undefined): boolean {
  return isActive !== false;
}

function tokenLimitPct(tokenLimit: number | null | undefined, usedTokens: number): number {
  if (tokenLimit == null || tokenLimit <= 0) return 0;
  return Math.min(100, (usedTokens / tokenLimit) * 100);
}

function tokenLimitLabel(tokenLimit: number | null | undefined): string {
  if (tokenLimit == null) return 'Unlimited';
  if (tokenLimit === 0) return '0 /mo';
  return fmtNum(tokenLimit) + ' /mo';
}

function tokenRemainingLabel(tokenLimit: number | null | undefined, usedTokens: number): string {
  if (tokenLimit == null) return 'Unlimited';
  return fmtNum(Math.max(0, tokenLimit - usedTokens));
}

function tokenLimitChipProps(tokenLimit: number | null | undefined, usedTokens: number, iconSize: number = 14) {
  if (tokenLimit == null) {
    return {
      color: 'neutral' as const,
      icon: <AllInclusiveIcon sx={{ fontSize: iconSize }} />,
      label: 'Unlimited',
    };
  }

  if (tokenLimit === 0) {
    return {
      color: 'danger' as const,
      icon: <BlockIcon sx={{ fontSize: iconSize }} />,
      label: '0 /mo',
    };
  }

  const pct = tokenLimitPct(tokenLimit, usedTokens);
  const color: 'danger' | 'warning' | 'primary' = pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary';
  return {
    color,
    icon: pct > 90 ? <WarningIcon sx={{ fontSize: iconSize }} /> : <CheckCircleIcon sx={{ fontSize: iconSize }} />,
    label: tokenLimitLabel(tokenLimit),
  };
}

// --- Glassmorphic metric tile ---

const ACCENT = {
  blue: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glow: 'rgba(102,126,234,0.25)' },
  green: { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', glow: 'rgba(17,153,142,0.25)' },
  orange: { bg: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)', glow: 'rgba(242,153,74,0.20)' },
  red: { bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', glow: 'rgba(235,51,73,0.20)' },
  purple: { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', glow: 'rgba(161,140,209,0.20)' },
  cyan: { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', glow: 'rgba(56,249,215,0.20)' },
} as const;
type AccentKey = keyof typeof ACCENT;

function MetricTile(props: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: AccentKey }) {
  const a = ACCENT[props.accent];
  return (
    <Box
      sx={{
        flex: '1 1 200px',
        minWidth: 170,
        position: 'relative',
        p: 2.5,
        borderRadius: 'xl',
        background: 'var(--joy-palette-background-surface)',
        boxShadow: `0 0 0 1px var(--joy-palette-neutral-outlinedBorder), 0 8px 24px -4px ${a.glow}`,
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 0 0 1px var(--joy-palette-neutral-outlinedBorder), 0 12px 32px -4px ${a.glow}` },
      }}
    >
      {/* gradient bar */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: a.bg }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 'lg',
            display: 'grid',
            placeItems: 'center',
            background: a.bg,
            color: '#fff',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {props.icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography level="body-xs" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, opacity: 0.55 }}>
            {props.label}
          </Typography>
          <Typography level="h3" sx={{ fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {props.value}
          </Typography>
          {props.sub && (
            <Typography level="body-xs" sx={{ mt: 0.25, opacity: 0.6 }}>
              {props.sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// --- Nav pill ---

function NavPill(props: { icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <Button
      variant={props.active ? 'solid' : 'plain'}
      color={props.active ? 'primary' : 'neutral'}
      size="sm"
      onClick={props.onClick}
      startDecorator={props.icon}
      endDecorator={
        props.badge != null ? (
          <Chip size="sm" variant="soft" color={props.active ? 'primary' : 'neutral'} sx={{ ml: 0.5, minWidth: 22, fontWeight: 700 }}>
            {props.badge}
          </Chip>
        ) : undefined
      }
      sx={{
        borderRadius: 'xl',
        px: 2,
        py: 0.75,
        fontWeight: 600,
        ...(props.active
          ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 14px rgba(102,126,234,0.35)',
            }
          : {
              '&:hover': { background: 'var(--joy-palette-neutral-softBg)' },
            }),
      }}
    >
      {props.label}
    </Button>
  );
}

// --- Leaderboard row ---

function LeaderboardRow(props: {
  rank: number;
  name: string;
  email: string;
  image?: string;
  tokens: string;
  cost: string;
  requests: number;
  onClick: () => void;
}) {
  const medal = props.rank === 1 ? '🥇' : props.rank === 2 ? '🥈' : props.rank === 3 ? '🥉' : null;
  return (
    <Box
      onClick={props.onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2.5,
        py: 1.5,
        cursor: 'pointer',
        borderRadius: 'lg',
        transition: 'background 0.1s',
        '&:hover': { background: 'var(--joy-palette-neutral-softBg)' },
      }}
    >
      <Typography level="body-sm" sx={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: medal ? 18 : 14 }}>
        {medal || props.rank}
      </Typography>
      <Avatar size="sm" src={props.image} sx={{ width: 32, height: 32, fontSize: 13 }}>
        {(props.name || '?')[0]}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography level="body-sm" noWrap sx={{ fontWeight: 600 }}>
          {props.name || 'Unknown'}
        </Typography>
        <Typography level="body-xs" noWrap sx={{ opacity: 0.5 }}>
          {props.email}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography level="body-sm" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {props.tokens}
        </Typography>
        <Typography level="body-xs" sx={{ opacity: 0.55 }}>
          {props.cost}
        </Typography>
      </Box>
      <Chip size="sm" variant="outlined" sx={{ minWidth: 46, fontVariantNumeric: 'tabular-nums' }}>
        {props.requests}
      </Chip>
    </Box>
  );
}

// --- User detail modal (premium) ---

function UserDetailModal(props: { userId: string; onClose: () => void; onRefresh: () => void }) {
  const [usage, setUsage] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingLimit, setEditingLimit] = React.useState(false);
  const [limitValue, setLimitValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [statusSaving, setStatusSaving] = React.useState(false);

  const loadData = React.useCallback(() => {
    setIsLoading(true);
    Promise.all([apiAsyncNode.admin.getUserUsage.query({ userId: props.userId }), apiAsyncNode.admin.getUserLogs.query({ userId: props.userId, limit: 50 })])
      .then(([u, l]) => {
        setUsage(u);
        setLogs(l);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [props.userId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSetLimit = () => {
    const val = limitValue.trim();
    const parsed = val === '' ? null : Number.parseInt(val, 10);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      alert('Enter 0 or a positive number. Leave blank for unlimited.');
      return;
    }

    setSaving(true);
    apiAsyncNode.admin.setTokenLimit
      .mutate({
        userId: props.userId,
        tokenLimit: parsed,
      })
      .then(() => {
        setEditingLimit(false);
        loadData();
        props.onRefresh();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleToggleActive = () => {
    const nextIsActive = !isUserActive(usage?.user?.isActive);
    setStatusSaving(true);
    apiAsyncNode.admin.setUserActive
      .mutate({
        userId: props.userId,
        isActive: nextIsActive,
      })
      .then(() => {
        loadData();
        props.onRefresh();
      })
      .catch(() => {})
      .finally(() => setStatusSaving(false));
  };

  const user = usage?.user;
  const monthTokens = usage?.thisMonth?._sum?.totalTokens ?? 0;
  const pct = tokenLimitPct(user?.tokenLimit, monthTokens);
  const userActive = isUserActive(user?.isActive);
  const limitChip = tokenLimitChipProps(user?.tokenLimit, monthTokens);

  return (
    <Modal open onClose={props.onClose}>
      <ModalDialog
        sx={{
          width: '94vw',
          maxWidth: 880,
          maxHeight: '92vh',
          overflow: 'auto',
          p: 0,
          borderRadius: 'xl',
          boxShadow: '0 24px 80px -12px rgba(0,0,0,0.45)',
          border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
        }}
      >
        <ModalClose sx={{ zIndex: 2 }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : !user ? (
          <Box sx={{ p: 4 }}>
            <Typography color="danger">User not found</Typography>
          </Box>
        ) : (
          <>
            {/* Banner */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 4,
                pt: 4,
                pb: 5,
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar
                  src={user.image}
                  sx={{
                    width: 64,
                    height: 64,
                    border: '3px solid rgba(255,255,255,0.3)',
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  {(user.name || '?')[0]}
                </Avatar>
                <Box>
                  <Typography level="h3" sx={{ color: '#fff', fontWeight: 800 }}>
                    {user.name || 'Unnamed'}
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {user.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.25, flexWrap: 'wrap' }}>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={userActive ? 'success' : 'danger'}
                      startDecorator={userActive ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <BlockIcon sx={{ fontSize: 14 }} />}
                    >
                      {userActive ? 'Active' : 'Inactive'}
                    </Chip>
                    <Button size="sm" variant="soft" color={userActive ? 'danger' : 'success'} loading={statusSaving} onClick={handleToggleActive}>
                      {userActive ? 'Set Inactive' : 'Activate'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ px: 3.5, py: 3, mt: -2.5 }}>
              {/* Token Limit Card */}
              <Box
                sx={{
                  background: 'var(--joy-palette-background-surface)',
                  border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                  borderRadius: 'xl',
                  p: 2.5,
                  mb: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TuneIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                  <Typography level="title-sm" sx={{ fontWeight: 700 }}>
                    Token Limit
                  </Typography>
                  {editingLimit ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                      <Input
                        size="sm"
                        placeholder="Blank = Unlimited, 0 = None"
                        value={limitValue}
                        onChange={(e) => setLimitValue(e.target.value)}
                        sx={{ width: 160 }}
                      />
                      <Button size="sm" onClick={handleSetLimit} loading={saving} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        Save
                      </Button>
                      <Button size="sm" variant="plain" color="neutral" onClick={() => setEditingLimit(false)}>
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                      <Chip size="sm" variant="soft" color={limitChip.color} startDecorator={limitChip.icon}>
                        {limitChip.label}
                      </Chip>
                      <IconButton
                        size="sm"
                        variant="plain"
                        onClick={() => {
                          setLimitValue(user.tokenLimit == null ? '' : user.tokenLimit.toString());
                          setEditingLimit(true);
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                {user.tokenLimit != null && user.tokenLimit > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      determinate
                      value={pct}
                      color={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 99 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography level="body-xs" sx={{ opacity: 0.5 }}>
                        {pct.toFixed(0)}% used
                      </Typography>
                      <Typography level="body-xs" sx={{ opacity: 0.5 }}>
                        {fmtNum(monthTokens)} of {fmtNum(user.tokenLimit)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {user.tokenLimit === 0 && (
                  <Typography level="body-xs" sx={{ mt: 1, opacity: 0.6 }}>
                    This user has no monthly credits. Activate the account and assign credits to enable chat access.
                  </Typography>
                )}
              </Box>

              {/* Stats Grid */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <MetricTile
                  accent="blue"
                  icon={<TokenIcon sx={{ fontSize: 20 }} />}
                  label="Month Tokens"
                  value={fmtNum(usage.thisMonth._sum.totalTokens)}
                  sub={`${fmtNum(usage.thisMonth._count)} requests`}
                />
                <MetricTile
                  accent="orange"
                  icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                  label="Month Cost"
                  value={fmtCost(usage.thisMonth._sum.costCents)}
                />
                <MetricTile
                  accent="green"
                  icon={<SpeedIcon sx={{ fontSize: 20 }} />}
                  label="All Time Tokens"
                  value={fmtNum(usage.allTime._sum.totalTokens)}
                  sub={`${fmtNum(usage.allTime._count)} total requests`}
                />
                <MetricTile accent="red" icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />} label="All Time Cost" value={fmtCost(usage.allTime._sum.costCents)} />
              </Box>

              {/* Logs */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AccessTimeIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                <Typography level="title-sm" sx={{ fontWeight: 700 }}>
                  Recent Activity
                </Typography>
                <Typography level="body-xs" sx={{ ml: 'auto', opacity: 0.5 }}>
                  {logs.length} entries
                </Typography>
                <IconButton size="sm" variant="plain" onClick={loadData}>
                  <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {logs.length > 0 ? (
                <Sheet variant="outlined" sx={{ borderRadius: 'lg', overflow: 'auto', maxHeight: 320 }}>
                  <Table
                    size="sm"
                    stickyHeader
                    sx={{
                      '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                      '& th': { py: 1.25, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 },
                      '& td': { py: 1, fontSize: '0.78rem' },
                    }}
                  >
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
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <Typography level="body-xs">{new Date(log.createdAt).toLocaleString()}</Typography>
                          </td>
                          <td>
                            <Typography level="body-xs" noWrap sx={{ maxWidth: 180 }}>
                              {log.modelId}
                            </Typography>
                          </td>
                          <td style={{ textAlign: 'right' }}>{fmtNum(log.inputTokens)}</td>
                          <td style={{ textAlign: 'right' }}>{fmtNum(log.outputTokens)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <strong>{fmtNum(log.totalTokens)}</strong>
                          </td>
                          <td style={{ textAlign: 'right' }}>{fmtCost(log.costCents)}</td>
                          <td>
                            <Chip size="sm" variant="soft" sx={{ fontSize: '0.6rem', height: 20 }}>
                              {log.operation}
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Sheet>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center', opacity: 0.4 }}>
                  <Typography level="body-sm">No usage logs recorded yet</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </ModalDialog>
    </Modal>
  );
}

// --- Main Admin Panel ---

export function AppAdmin() {
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
  const [statusSavingUserId, setStatusSavingUserId] = React.useState<string | null>(null);
  const [activeView, setActiveView] = React.useState<'overview' | 'users' | 'settings'>('overview');
  const [sortField, setSortField] = React.useState<string>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const loadAllData = React.useCallback(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([apiAsyncNode.admin.globalStats.query(), apiAsyncNode.admin.listUsers.query(), apiAsyncNode.admin.topUsers.query()])
      .then(([stats, userList, top]) => {
        setGlobalStats(stats);
        setUsers(userList);
        setTopUsers(top);
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

  const handleSetAllLimits = (tokenLimit: number | null) => {
    setBulkSaving(true);
    apiAsyncNode.admin.setAllTokenLimits
      .mutate({ tokenLimit })
      .then((data) => {
        setBulkLimit('');
        alert('Updated ' + data.updated + ' users');
        loadAllData();
      })
      .catch(() => alert('Failed to update limits'))
      .finally(() => setBulkSaving(false));
  };

  const handleToggleUserActive = (userId: string, currentIsActive: boolean) => {
    setStatusSavingUserId(userId);
    apiAsyncNode.admin.setUserActive
      .mutate({
        userId,
        isActive: !currentIsActive,
      })
      .then(() => loadAllData())
      .catch(() => alert('Failed to update account status'))
      .finally(() => setStatusSavingUserId(null));
  };

  // Auth gates
  if (!session?.user)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--joy-palette-background-body)' }}>
        <Typography level="h4" sx={{ opacity: 0.6 }}>
          Sign in required
        </Typography>
      </Box>
    );

  if (checkingAdmin)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--joy-palette-background-body)' }}>
        <CircularProgress size="lg" />
      </Box>
    );

  if (!isAdmin)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
          background: 'var(--joy-palette-background-body)',
        }}
      >
        <BlockIcon sx={{ fontSize: 48, opacity: 0.3 }} />
        <Typography level="h4" sx={{ opacity: 0.6 }}>
          Access Denied
        </Typography>
        <Typography level="body-sm" sx={{ opacity: 0.4 }}>
          Admin privileges required
        </Typography>
      </Box>
    );

  // Filtering + sorting
  const filtered = users.filter(
    (u: any) => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sorted = [...filtered].sort((a: any, b: any) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'name':
        av = (a.name || '').toLowerCase();
        bv = (b.name || '').toLowerCase();
        break;
      case 'email':
        av = (a.email || '').toLowerCase();
        bv = (b.email || '').toLowerCase();
        break;
      case 'status':
        av = isUserActive(a.isActive) ? 1 : 0;
        bv = isUserActive(b.isActive) ? 1 : 0;
        break;
      case 'conversations':
        av = a._count.conversations;
        bv = b._count.conversations;
        break;
      case 'messages':
        av = a._count.messages;
        bv = b._count.messages;
        break;
      case 'usageLogs':
        av = a._count.usageLogs;
        bv = b._count.usageLogs;
        break;
      case 'monthTokens':
        av = a.monthUsage?._sum?.totalTokens ?? 0;
        bv = b.monthUsage?._sum?.totalTokens ?? 0;
        break;
      case 'monthCost':
        av = a.monthUsage?._sum?.costCents ?? 0;
        bv = b.monthUsage?._sum?.costCents ?? 0;
        break;
      default:
        av = a.name || '';
        bv = b.name || '';
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortArrow = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ArrowUpwardIcon sx={{ fontSize: 14, ml: 0.3, verticalAlign: 'middle' }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: 14, ml: 0.3, verticalAlign: 'middle' }} />
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--joy-palette-background-body)' }}>
      {/* === Top Bar === */}
      <Box
        sx={{
          px: 3,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
          borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
          background: 'var(--joy-palette-background-surface)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Brand */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 'lg',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <DashboardIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ mr: 2 }}>
          <Typography level="title-md" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Admin
          </Typography>
          <Typography level="body-xs" sx={{ opacity: 0.45, lineHeight: 1 }}>
            Control Panel
          </Typography>
        </Box>

        {/* Nav pills */}
        <Box sx={{ display: 'flex', gap: 0.75, flex: 1 }}>
          <NavPill
            icon={<DashboardIcon sx={{ fontSize: 16 }} />}
            label="Overview"
            active={activeView === 'overview'}
            onClick={() => setActiveView('overview')}
          />
          <NavPill
            icon={<GroupIcon sx={{ fontSize: 16 }} />}
            label="Users"
            active={activeView === 'users'}
            badge={users.length}
            onClick={() => setActiveView('users')}
          />
          <NavPill
            icon={<SettingsIcon sx={{ fontSize: 16 }} />}
            label="Settings"
            active={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
          />
        </Box>

        {/* Right side */}
        <Typography level="body-xs" sx={{ opacity: 0.4, display: { xs: 'none', md: 'block' } }}>
          {session.user?.email}
        </Typography>
        <Tooltip title="Refresh all data">
          <IconButton variant="outlined" size="sm" onClick={loadAllData} disabled={loading} sx={{ borderRadius: 'lg' }}>
            <RefreshIcon
              sx={{
                fontSize: 18,
                ...(loading ? { animation: 'spin 1s linear infinite', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } } : {}),
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* === Content === */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3 }}>
        {loading && !globalStats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size="lg" />
          </Box>
        ) : (
          <>
            {/* ====== OVERVIEW ====== */}
            {activeView === 'overview' && (
              <Stack spacing={3.5} sx={{ maxWidth: 1200, mx: 'auto' }}>
                {/* Metric tiles */}
                {globalStats && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <MetricTile accent="blue" icon={<PeopleAltIcon sx={{ fontSize: 20 }} />} label="Total Users" value={globalStats.userCount} />
                    <MetricTile
                      accent="cyan"
                      icon={<SpeedIcon sx={{ fontSize: 20 }} />}
                      label="Today"
                      value={fmtNum(globalStats.today._sum.totalTokens)}
                      sub={`${fmtNum(globalStats.today._count)} requests`}
                    />
                    <MetricTile
                      accent="orange"
                      icon={<TokenIcon sx={{ fontSize: 20 }} />}
                      label="This Month"
                      value={fmtNum(globalStats.thisMonth._sum.totalTokens)}
                      sub={fmtCost(globalStats.thisMonth._sum.costCents)}
                    />
                    <MetricTile
                      accent="green"
                      icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                      label="All Time"
                      value={fmtNum(globalStats.allTime._sum.totalTokens)}
                      sub={fmtCost(globalStats.allTime._sum.costCents)}
                    />
                  </Box>
                )}

                {/* Leaderboard */}
                {topUsers.length > 0 && (
                  <Box
                    sx={{
                      border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      borderRadius: 'xl',
                      overflow: 'hidden',
                      background: 'var(--joy-palette-background-surface)',
                    }}
                  >
                    <Box
                      sx={{
                        px: 2.5,
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      }}
                    >
                      <EmojiEventsIcon sx={{ fontSize: 20, color: '#f2994a' }} />
                      <Typography level="title-md" sx={{ fontWeight: 700 }}>
                        Top Users This Month
                      </Typography>
                      <Typography level="body-xs" sx={{ ml: 'auto', opacity: 0.4 }}>
                        Click to view details
                      </Typography>
                    </Box>
                    <Box sx={{ py: 0.5 }}>
                      {topUsers.map((entry, i) => (
                        <LeaderboardRow
                          key={entry.userId}
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
                  </Box>
                )}
              </Stack>
            )}

            {/* ====== USERS ====== */}
            {activeView === 'users' && (
              <Stack spacing={2} sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* Search bar */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Input
                    size="sm"
                    placeholder="Search by name or email..."
                    startDecorator={<SearchIcon sx={{ fontSize: 18 }} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flex: 1, maxWidth: 380, borderRadius: 'xl', '--Input-focusedThickness': '2px' }}
                  />
                  <Chip variant="soft" color="neutral" size="sm" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {sorted.length === users.length ? `${users.length} users` : `${sorted.length} of ${users.length}`}
                  </Chip>
                </Box>

                {/* Table */}
                <Sheet variant="outlined" sx={{ borderRadius: 'xl', overflow: 'auto' }}>
                  <Table
                    size="sm"
                    stickyHeader
                    hoverRow
                    sx={{
                      '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                      '& th': {
                        py: 1.5,
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      },
                      '& td': { py: 1.25, verticalAlign: 'middle' },
                      '& tbody tr': { cursor: 'pointer', transition: 'background 0.08s' },
                    }}
                  >
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('name')}>
                          User <SortArrow field="name" />
                        </th>
                        <th onClick={() => handleSort('email')}>
                          Email <SortArrow field="email" />
                        </th>
                        <th onClick={() => handleSort('status')}>
                          Status <SortArrow field="status" />
                        </th>
                        <th onClick={() => handleSort('conversations')} style={{ textAlign: 'right' }}>
                          Convos <SortArrow field="conversations" />
                        </th>
                        <th onClick={() => handleSort('messages')} style={{ textAlign: 'right' }}>
                          Messages <SortArrow field="messages" />
                        </th>
                        <th onClick={() => handleSort('monthTokens')} style={{ textAlign: 'right' }}>
                          Month Tokens <SortArrow field="monthTokens" />
                        </th>
                        <th style={{ textAlign: 'right' }}>Remaining</th>
                        <th onClick={() => handleSort('monthCost')} style={{ textAlign: 'right' }}>
                          Month Cost <SortArrow field="monthCost" />
                        </th>
                        <th onClick={() => handleSort('usageLogs')} style={{ textAlign: 'right' }}>
                          Logs <SortArrow field="usageLogs" />
                        </th>
                        <th>Limit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((user: any) => {
                        const mTokens = user.monthUsage?._sum?.totalTokens ?? 0;
                        const mCost = user.monthUsage?._sum?.costCents ?? 0;
                        const mReqs = user.monthUsage?._count ?? 0;
                        const userActive = isUserActive(user.isActive);
                        const limitChip = tokenLimitChipProps(user.tokenLimit, mTokens, 12);
                        return (
                          <tr key={user.id} onClick={() => setSelectedUserId(user.id)}>
                            <td>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar size="sm" src={user.image} sx={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
                                  {(user.name || '?')[0]}
                                </Avatar>
                                <Typography level="body-sm" noWrap sx={{ maxWidth: 150, fontWeight: 600 }}>
                                  {user.name || 'Unnamed'}
                                </Typography>
                              </Box>
                            </td>
                            <td>
                              <Typography level="body-xs" noWrap sx={{ maxWidth: 200, opacity: 0.7 }}>
                                {user.email}
                              </Typography>
                            </td>
                            <td>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={userActive ? 'success' : 'danger'}
                                startDecorator={userActive ? <CheckCircleIcon sx={{ fontSize: 12 }} /> : <BlockIcon sx={{ fontSize: 12 }} />}
                              >
                                {userActive ? 'Active' : 'Inactive'}
                              </Chip>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography level="body-sm" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {user._count.conversations}
                              </Typography>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography level="body-sm" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {user._count.messages}
                              </Typography>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Tooltip title={`${mReqs} requests this month`}>
                                <Typography level="body-sm" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                  {fmtNum(mTokens)}
                                </Typography>
                              </Tooltip>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography level="body-sm" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {tokenRemainingLabel(user.tokenLimit, mTokens)}
                              </Typography>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography level="body-sm" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {fmtCost(mCost)}
                              </Typography>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography level="body-sm" sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.6 }}>
                                {user._count.usageLogs}
                              </Typography>
                            </td>
                            <td>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={limitChip.color}
                                startDecorator={limitChip.icon}
                                sx={{ fontVariantNumeric: 'tabular-nums' }}
                              >
                                {limitChip.label}
                              </Chip>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="soft"
                                color={userActive ? 'danger' : 'success'}
                                loading={statusSavingUserId === user.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleUserActive(user.id, userActive);
                                }}
                              >
                                {userActive ? 'Set Inactive' : 'Activate'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {sorted.length === 0 && (
                        <tr>
                          <td colSpan={11}>
                            <Box sx={{ py: 4, textAlign: 'center', opacity: 0.4 }}>
                              <Typography level="body-sm">No users match your search</Typography>
                            </Box>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Sheet>
              </Stack>
            )}

            {/* ====== SETTINGS ====== */}
            {activeView === 'settings' && (
              <Stack spacing={3} sx={{ maxWidth: 640, mx: 'auto' }}>
                {/* Bulk Limits */}
                <Box
                  sx={{
                    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    borderRadius: 'xl',
                    overflow: 'hidden',
                    background: 'var(--joy-palette-background-surface)',
                  }}
                >
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      background: 'var(--joy-palette-background-level1)',
                    }}
                  >
                    <TuneIcon sx={{ fontSize: 18 }} />
                    <Typography level="title-md" sx={{ fontWeight: 700 }}>
                      Bulk Token Limits
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Typography level="body-sm" sx={{ mb: 2.5, opacity: 0.7 }}>
                      Set a monthly token limit for every user at once. Use `0` for no credits. Leave blank only when setting all users to unlimited.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Input
                        size="sm"
                        placeholder="e.g. 2000000"
                        value={bulkLimit}
                        onChange={(e) => setBulkLimit(e.target.value)}
                        sx={{ width: 200, borderRadius: 'lg' }}
                      />
                      <Button
                        size="sm"
                        loading={bulkSaving}
                        sx={{ borderRadius: 'lg', background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)', color: '#000', fontWeight: 700 }}
                        onClick={() => {
                          const val = parseInt(bulkLimit, 10);
                          if (Number.isNaN(val) || val < 0) return alert('Enter 0 or a positive number');
                          if (confirm('Set ' + val.toLocaleString() + ' tokens/month for ALL users?')) handleSetAllLimits(val);
                        }}
                      >
                        Apply to All
                      </Button>
                      <Button
                        size="sm"
                        variant="outlined"
                        color="neutral"
                        loading={bulkSaving}
                        sx={{ borderRadius: 'lg' }}
                        onClick={() => {
                          if (confirm('Remove token limit for ALL users (unlimited)?')) handleSetAllLimits(null);
                        }}
                      >
                        Set All Unlimited
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Admin Info */}
                <Box
                  sx={{
                    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    borderRadius: 'xl',
                    overflow: 'hidden',
                    background: 'var(--joy-palette-background-surface)',
                  }}
                >
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderBottom: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                      background: 'var(--joy-palette-background-level1)',
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 18 }} />
                    <Typography level="title-md" sx={{ fontWeight: 700 }}>
                      System Info
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography level="body-sm" sx={{ opacity: 0.6 }}>
                          Admin Email
                        </Typography>
                        <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                          rcohen@mytsi.org
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography level="body-sm" sx={{ opacity: 0.6 }}>
                          Admin Token Limit
                        </Typography>
                        <Chip size="sm" variant="soft" color="success" startDecorator={<AllInclusiveIcon sx={{ fontSize: 12 }} />}>
                          Always Unlimited
                        </Chip>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography level="body-sm" sx={{ opacity: 0.6 }}>
                          Monthly Reset
                        </Typography>
                        <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                          1st of each month
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* User Detail Modal */}
      {selectedUserId && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onRefresh={loadAllData} />}
    </Box>
  );
}
