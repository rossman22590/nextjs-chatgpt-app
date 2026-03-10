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
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { apiAsyncNode } from '~/common/util/trpc.client';


// --- Palette ---

const P = {
  primary: '#7c5cfc',
  primaryLight: '#a78bfa',
  primaryPale: '#ede9fe',
  primaryGhost: '#f5f3ff',
  emerald: '#10b981',
  emeraldPale: '#d1fae5',
  amber: '#f59e0b',
  amberPale: '#fef3c7',
  rose: '#f43f5e',
  rosePale: '#ffe4e6',
  sky: '#0ea5e9',
  skyPale: '#e0f2fe',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  white: '#ffffff',
  cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  cardShadowHover: '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
  cardShadowLg: '0 20px 50px -12px rgba(0,0,0,0.12)',
} as const;


// --- Format helpers ---

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}


// --- Stat Card ---

function StatCard(props: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: string; bgColor: string;
}) {
  return (
    <Box sx={{
      flex: '1 1 220px', minWidth: 180, p: 2.5, borderRadius: 16,
      background: P.white, boxShadow: P.cardShadow,
      border: `1px solid ${P.slate200}`,
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: P.cardShadowHover, transform: 'translateY(-2px)' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{
          width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center',
          background: props.bgColor, color: props.color, flexShrink: 0,
        }}>
          {props.icon}
        </Box>
      </Box>
      <Typography sx={{
        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: P.slate400, mb: 0.25,
      }}>
        {props.label}
      </Typography>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: P.slate800, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
        {props.value}
      </Typography>
      {props.sub && (
        <Typography sx={{ fontSize: '0.75rem', color: P.slate400, mt: 0.25 }}>{props.sub}</Typography>
      )}
    </Box>
  );
}


// --- Nav Tab ---

function NavTab(props: { icon: React.ReactNode; label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <Box
      onClick={props.onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.75, px: 2, py: 1,
        borderRadius: 12, cursor: 'pointer', userSelect: 'none',
        fontWeight: 600, fontSize: '0.85rem',
        transition: 'all 0.15s ease',
        ...(props.active ? {
          background: P.primary, color: '#fff',
          boxShadow: '0 4px 14px rgba(124,92,252,0.4)',
        } : {
          color: P.slate500,
          '&:hover': { background: P.slate100, color: P.slate700 },
        }),
      }}
    >
      {props.icon}
      {props.label}
      {props.count != null && (
        <Box sx={{
          ml: 0.5, px: 0.75, py: 0.1, borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
          ...(props.active
            ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
            : { background: P.slate200, color: P.slate500 }),
        }}>
          {props.count}
        </Box>
      )}
    </Box>
  );
}


// --- Leaderboard Row ---

function LeaderboardRow(props: { rank: number; name: string; email: string; image?: string; tokens: string; cost: string; requests: number; onClick: () => void }) {
  const medal = props.rank === 1 ? '\u{1F947}' : props.rank === 2 ? '\u{1F948}' : props.rank === 3 ? '\u{1F949}' : null;
  const barWidth = props.rank === 1 ? '100%' : props.rank === 2 ? '75%' : props.rank === 3 ? '55%' : `${Math.max(15, 50 - (props.rank - 3) * 10)}%`;

  return (
    <Box
      onClick={props.onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.75,
        cursor: 'pointer', transition: 'all 0.12s ease', position: 'relative',
        '&:hover': { background: P.primaryGhost },
        '&:not(:last-child)': { borderBottom: `1px solid ${P.slate100}` },
      }}
    >
      <Typography sx={{
        width: 32, textAlign: 'center', fontWeight: 800,
        fontSize: medal ? '1.25rem' : '0.85rem', color: medal ? undefined : P.slate400,
      }}>
        {medal || `#${props.rank}`}
      </Typography>
      <Avatar size='sm' src={props.image} sx={{
        width: 36, height: 36, fontSize: 14, fontWeight: 600,
        border: `2px solid ${P.primaryPale}`,
      }}>
        {(props.name || '?')[0]}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.9rem', color: P.slate800 }}>{props.name || 'Unknown'}</Typography>
          <Typography noWrap sx={{ fontSize: '0.75rem', color: P.slate400 }}>{props.email}</Typography>
        </Box>
        <Box sx={{ height: 4, borderRadius: 99, background: P.slate100, overflow: 'hidden', maxWidth: 240 }}>
          <Box sx={{ height: '100%', width: barWidth, borderRadius: 99, background: `linear-gradient(90deg, ${P.primary}, ${P.primaryLight})`, transition: 'width 0.4s ease' }} />
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', color: P.slate800 }}>
          {props.tokens}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: P.slate400 }}>{props.cost}</Typography>
      </Box>
      <Chip size='sm' variant='outlined' sx={{
        borderRadius: 8, fontVariantNumeric: 'tabular-nums',
        borderColor: P.slate200, color: P.slate500, fontSize: '0.72rem',
      }}>
        {props.requests} req
      </Chip>
    </Box>
  );
}


// --- Section Card ---

function SectionCard(props: { children: React.ReactNode; title?: string; icon?: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <Box sx={{
      borderRadius: 16, background: P.white, boxShadow: P.cardShadow,
      border: `1px solid ${P.slate200}`, overflow: 'hidden',
    }}>
      {props.title && (
        <Box sx={{
          px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 1,
          borderBottom: `1px solid ${P.slate100}`,
        }}>
          {props.icon && <Box sx={{ color: P.slate400, display: 'flex' }}>{props.icon}</Box>}
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: P.slate700 }}>{props.title}</Typography>
          {props.trailing && <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>{props.trailing}</Box>}
        </Box>
      )}
      {props.children}
    </Box>
  );
}


// --- User Detail Modal ---

function UserDetailModal(props: { userId: string; onClose: () => void; onRefresh: () => void }) {
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
        borderRadius: 20, boxShadow: P.cardShadowLg,
        border: `1px solid ${P.slate200}`, background: P.slate50,
      }}>
        <ModalClose sx={{ zIndex: 2, color: '#fff', background: 'rgba(0,0,0,0.2)', borderRadius: 10, '&:hover': { background: 'rgba(0,0,0,0.35)' } }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress sx={{ '--CircularProgress-trackColor': P.primaryPale, '--CircularProgress-progressColor': P.primary }} />
          </Box>
        ) : !user ? (
          <Box sx={{ p: 4 }}><Typography color='danger'>User not found</Typography></Box>
        ) : (
          <>
            {/* Hero banner */}
            <Box sx={{
              background: `linear-gradient(135deg, ${P.primary} 0%, #9f7aea 50%, #c084fc 100%)`,
              px: 4, pt: 4, pb: 6, position: 'relative', overflow: 'hidden',
            }}>
              <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -40 }} />
              <Box sx={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -30, left: '40%' }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, position: 'relative', zIndex: 1 }}>
                <Avatar src={user.image} sx={{
                  width: 72, height: 72, border: '3px solid rgba(255,255,255,0.3)',
                  fontSize: 26, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}>{(user.name || '?')[0]}</Avatar>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>{user.name || 'Unnamed'}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{user.email}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Content overlay */}
            <Box sx={{ px: 3.5, pb: 3.5, mt: -3, position: 'relative', zIndex: 1 }}>

              {/* Token Limit Card */}
              <Box sx={{
                background: P.white, borderRadius: 16, p: 2.5, mb: 3,
                boxShadow: P.cardShadow, border: `1px solid ${P.slate200}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center',
                    background: P.primaryPale, color: P.primary,
                  }}>
                    <TuneIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: P.slate700 }}>Token Limit</Typography>
                  {editingLimit ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                      <Input size='sm' placeholder='Empty = Unlimited' value={limitValue}
                        onChange={e => setLimitValue(e.target.value)}
                        sx={{ width: 160, borderRadius: 10, '--Input-focusedHighlight': P.primary }} />
                      <Button size='sm' onClick={handleSetLimit} loading={saving}
                        sx={{ borderRadius: 10, background: P.primary, '&:hover': { background: P.primaryLight } }}>Save</Button>
                      <Button size='sm' variant='plain' color='neutral' onClick={() => setEditingLimit(false)}>Cancel</Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                      <Chip size='sm' variant='soft'
                        color={user.tokenLimit ? (pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary') : 'success'}
                        startDecorator={user.tokenLimit ? <TokenIcon sx={{ fontSize: 14 }} /> : <AllInclusiveIcon sx={{ fontSize: 14 }} />}
                        sx={{ borderRadius: 8 }}
                      >
                        {user.tokenLimit ? fmtNum(user.tokenLimit) + ' /mo' : 'Unlimited'}
                      </Chip>
                      <IconButton size='sm' variant='plain' onClick={() => {
                        setLimitValue(user.tokenLimit?.toString() || '');
                        setEditingLimit(true);
                      }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                    </Box>
                  )}
                </Box>
                {user.tokenLimit && (
                  <Box>
                    <LinearProgress determinate value={pct}
                      sx={{
                        height: 8, borderRadius: 99,
                        '--LinearProgress-progressColor': pct > 90 ? P.rose : pct > 70 ? P.amber : P.primary,
                        '--LinearProgress-bgcolor': pct > 90 ? P.rosePale : pct > 70 ? P.amberPale : P.primaryPale,
                      }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: P.slate400 }}>{pct.toFixed(0)}% used</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: P.slate400 }}>{fmtNum(usage?.thisMonth?._sum?.totalTokens)} of {fmtNum(user.tokenLimit)}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Stats Grid */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <StatCard icon={<TokenIcon sx={{ fontSize: 20 }} />} label='Month Tokens'
                  value={fmtNum(usage.thisMonth._sum.totalTokens)} sub={`${fmtNum(usage.thisMonth._count)} requests`}
                  color={P.primary} bgColor={P.primaryPale} />
                <StatCard icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />} label='Month Cost'
                  value={fmtCost(usage.thisMonth._sum.costCents)}
                  color={P.amber} bgColor={P.amberPale} />
                <StatCard icon={<SpeedIcon sx={{ fontSize: 20 }} />} label='All Time Tokens'
                  value={fmtNum(usage.allTime._sum.totalTokens)} sub={`${fmtNum(usage.allTime._count)} total requests`}
                  color={P.emerald} bgColor={P.emeraldPale} />
                <StatCard icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />} label='All Time Cost'
                  value={fmtCost(usage.allTime._sum.costCents)}
                  color={P.rose} bgColor={P.rosePale} />
              </Box>

              {/* Activity Log */}
              <SectionCard
                title='Recent Activity'
                icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                trailing={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: P.slate400 }}>{logs.length} entries</Typography>
                    <IconButton size='sm' variant='plain' onClick={loadData} sx={{ color: P.slate400 }}>
                      <RefreshIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                }
              >
                {logs.length > 0 ? (
                  <Sheet sx={{ overflow: 'auto', maxHeight: 320 }}>
                    <Table size='sm' stickyHeader sx={{
                      '--TableCell-headBackground': P.slate50,
                      '& th': { py: 1.25, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: P.slate400, borderBottom: `1px solid ${P.slate100}` },
                      '& td': { py: 1, fontSize: '0.78rem', borderBottom: `1px solid ${P.slate50}` },
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
                            <td><Typography level='body-xs' sx={{ color: P.slate500 }}>{new Date(log.createdAt).toLocaleString()}</Typography></td>
                            <td><Typography level='body-xs' noWrap sx={{ maxWidth: 180, color: P.slate600, fontWeight: 500 }}>{log.modelId}</Typography></td>
                            <td style={{ textAlign: 'right' }}><Typography level='body-xs' sx={{ fontVariantNumeric: 'tabular-nums', color: P.slate500 }}>{fmtNum(log.inputTokens)}</Typography></td>
                            <td style={{ textAlign: 'right' }}><Typography level='body-xs' sx={{ fontVariantNumeric: 'tabular-nums', color: P.slate500 }}>{fmtNum(log.outputTokens)}</Typography></td>
                            <td style={{ textAlign: 'right' }}><Typography level='body-xs' sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: P.slate700 }}>{fmtNum(log.totalTokens)}</Typography></td>
                            <td style={{ textAlign: 'right' }}><Typography level='body-xs' sx={{ fontVariantNumeric: 'tabular-nums', color: P.slate500 }}>{fmtCost(log.costCents)}</Typography></td>
                            <td>
                              <Box sx={{ px: 0.75, py: 0.2, borderRadius: 6, background: P.primaryPale, color: P.primary, fontSize: '0.63rem', fontWeight: 600, display: 'inline-block' }}>
                                {log.operation}
                              </Box>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: P.slate400, fontSize: '0.85rem' }}>No usage logs recorded yet</Typography>
                  </Box>
                )}
              </SectionCard>
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
  const [activeView, setActiveView] = React.useState<'overview' | 'users' | 'settings'>('overview');
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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: P.slate50, gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: P.primaryPale, color: P.primary }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: P.slate700, fontSize: '1.1rem' }}>Sign in required</Typography>
        <Typography sx={{ color: P.slate400, fontSize: '0.85rem' }}>Please sign in to access the admin panel</Typography>
      </Box>
    );

  if (checkingAdmin)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: P.slate50, gap: 3 }}>
        <CircularProgress size='lg' sx={{ '--CircularProgress-trackColor': P.primaryPale, '--CircularProgress-progressColor': P.primary }} />
        <Typography sx={{ color: P.slate400, fontSize: '0.85rem' }}>Verifying access...</Typography>
      </Box>
    );

  if (!isAdmin)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2, background: P.slate50 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: P.rosePale, color: P.rose }}>
          <BlockIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: P.slate700, fontSize: '1.1rem' }}>Access Denied</Typography>
        <Typography sx={{ color: P.slate400, fontSize: '0.85rem' }}>Admin privileges required</Typography>
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
      ? <ArrowUpwardIcon sx={{ fontSize: 13, ml: 0.3, verticalAlign: 'middle', color: P.primary }} />
      : <ArrowDownwardIcon sx={{ fontSize: 13, ml: 0.3, verticalAlign: 'middle', color: P.primary }} />;
  };

  const firstName = session.user?.name?.split(' ')[0] || 'Admin';

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: P.slate50,
    }}>

      {/* === Header === */}
      <Box sx={{
        px: { xs: 2.5, md: 4 }, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
        borderBottom: `1px solid ${P.slate200}`, background: P.white,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
          background: `linear-gradient(135deg, ${P.primary} 0%, #9f7aea 100%)`,
          color: '#fff', flexShrink: 0, boxShadow: '0 4px 14px rgba(124,92,252,0.3)',
        }}>
          <DashboardIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: P.slate800, lineHeight: 1.2 }}>
            {getGreeting()}, {firstName}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: P.slate400, lineHeight: 1 }}>
            Admin Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, ml: 4, flex: 1 }}>
          <NavTab icon={<DashboardIcon sx={{ fontSize: 16 }} />} label='Overview'
            active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
          <NavTab icon={<GroupIcon sx={{ fontSize: 16 }} />} label='Users'
            active={activeView === 'users'} count={users.length} onClick={() => setActiveView('users')} />
          <NavTab icon={<SettingsIcon sx={{ fontSize: 16 }} />} label='Settings'
            active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </Box>

        <Typography sx={{ fontSize: '0.75rem', color: P.slate400, display: { xs: 'none', md: 'block' } }}>
          {session.user?.email}
        </Typography>
        <Tooltip title='Refresh all data'>
          <IconButton
            size='sm' onClick={loadAllData} disabled={loading}
            sx={{
              borderRadius: 10, border: `1px solid ${P.slate200}`, background: P.white,
              color: P.slate500, '&:hover': { background: P.slate50, borderColor: P.primary, color: P.primary },
            }}
          >
            <RefreshIcon sx={{
              fontSize: 18,
              ...(loading ? { animation: 'spin 1s linear infinite', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } } : {}),
            }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* === Content === */}
      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2.5, md: 4 }, py: 3 }}>

        {loading && !globalStats ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 16, gap: 2 }}>
            <CircularProgress size='lg' sx={{ '--CircularProgress-trackColor': P.primaryPale, '--CircularProgress-progressColor': P.primary }} />
            <Typography sx={{ color: P.slate400, fontSize: '0.85rem' }}>Loading dashboard...</Typography>
          </Box>
        ) : (
          <>
            {/* ====== OVERVIEW ====== */}
            {activeView === 'overview' && (
              <Stack spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>

                {globalStats && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <StatCard icon={<PeopleAltIcon sx={{ fontSize: 20 }} />}
                      label='Total Users' value={globalStats.userCount}
                      color={P.primary} bgColor={P.primaryPale} />
                    <StatCard icon={<SpeedIcon sx={{ fontSize: 20 }} />}
                      label='Today' value={fmtNum(globalStats.today._sum.totalTokens)}
                      sub={`${fmtNum(globalStats.today._count)} requests`}
                      color={P.sky} bgColor={P.skyPale} />
                    <StatCard icon={<ShowChartIcon sx={{ fontSize: 20 }} />}
                      label='This Month' value={fmtNum(globalStats.thisMonth._sum.totalTokens)}
                      sub={fmtCost(globalStats.thisMonth._sum.costCents)}
                      color={P.amber} bgColor={P.amberPale} />
                    <StatCard icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />}
                      label='All Time' value={fmtNum(globalStats.allTime._sum.totalTokens)}
                      sub={fmtCost(globalStats.allTime._sum.costCents)}
                      color={P.emerald} bgColor={P.emeraldPale} />
                  </Box>
                )}

                {topUsers.length > 0 && (
                  <SectionCard
                    title='Top Users This Month'
                    icon={<EmojiEventsIcon sx={{ fontSize: 18, color: P.amber }} />}
                    trailing={<Typography sx={{ fontSize: '0.72rem', color: P.slate400 }}>Click to view details</Typography>}
                  >
                    <Box>
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
                  </SectionCard>
                )}
              </Stack>
            )}

            {/* ====== USERS ====== */}
            {activeView === 'users' && (
              <Stack spacing={2.5} sx={{ maxWidth: 1400, mx: 'auto' }}>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Input size='sm' placeholder='Search by name or email...'
                    startDecorator={<SearchIcon sx={{ fontSize: 18, color: P.slate400 }} />}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    sx={{
                      flex: 1, maxWidth: 400, borderRadius: 12,
                      '--Input-focusedHighlight': P.primary,
                      border: `1px solid ${P.slate200}`, background: P.white,
                      boxShadow: 'none',
                      '&:focus-within': { borderColor: P.primary, boxShadow: `0 0 0 3px ${P.primaryPale}` },
                    }} />
                  <Box sx={{
                    px: 1.5, py: 0.5, borderRadius: 8, background: P.primaryPale, color: P.primary,
                    fontSize: '0.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {sorted.length === users.length ? `${users.length} users` : `${sorted.length} of ${users.length}`}
                  </Box>
                </Box>

                <Box sx={{ borderRadius: 16, overflow: 'hidden', background: P.white, boxShadow: P.cardShadow, border: `1px solid ${P.slate200}` }}>
                  <Box sx={{ overflow: 'auto' }}>
                    <Table size='sm' stickyHeader hoverRow sx={{
                      '--TableCell-headBackground': P.slate50,
                      '& th': {
                        py: 1.5, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                        fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase',
                        letterSpacing: '0.04em', color: P.slate400,
                        borderBottom: `2px solid ${P.slate100}`,
                      },
                      '& td': { py: 1.25, verticalAlign: 'middle', borderBottom: `1px solid ${P.slate50}` },
                      '& tbody tr': { cursor: 'pointer', transition: 'background 0.08s' },
                      '& tbody tr:hover': { background: P.primaryGhost },
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
                                    width: 32, height: 32, fontSize: 13, fontWeight: 600, flexShrink: 0,
                                    border: `2px solid ${P.primaryPale}`,
                                  }}>
                                    {(user.name || '?')[0]}
                                  </Avatar>
                                  <Typography noWrap sx={{ maxWidth: 150, fontWeight: 600, fontSize: '0.85rem', color: P.slate700 }}>
                                    {user.name || 'Unnamed'}
                                  </Typography>
                                </Box>
                              </td>
                              <td><Typography noWrap sx={{ maxWidth: 200, fontSize: '0.8rem', color: P.slate400 }}>{user.email}</Typography></td>
                              <td style={{ textAlign: 'right' }}>
                                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: P.slate600 }}>{user._count.conversations}</Typography>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: P.slate600 }}>{user._count.messages}</Typography>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <Tooltip title={`${mReqs} requests this month`}>
                                  <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: P.slate800 }}>{fmtNum(mTokens)}</Typography>
                                </Tooltip>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: P.slate600 }}>{fmtCost(mCost)}</Typography>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: P.slate400 }}>{user._count.usageLogs}</Typography>
                              </td>
                              <td>
                                <Chip size='sm' variant='soft' color={user.tokenLimit ? limitColor : 'neutral'}
                                  startDecorator={user.tokenLimit
                                    ? (limitPct > 90 ? <WarningIcon sx={{ fontSize: 12 }} /> : <CheckCircleIcon sx={{ fontSize: 12 }} />)
                                    : <AllInclusiveIcon sx={{ fontSize: 12 }} />
                                  }
                                  sx={{ fontVariantNumeric: 'tabular-nums', borderRadius: 8 }}>
                                  {user.tokenLimit ? fmtNum(user.tokenLimit) : 'Unlimited'}
                                </Chip>
                              </td>
                            </tr>
                          );
                        })}
                        {sorted.length === 0 && (
                          <tr>
                            <td colSpan={8}>
                              <Box sx={{ py: 6, textAlign: 'center' }}>
                                <SearchIcon sx={{ fontSize: 32, color: P.slate300, mb: 1 }} />
                                <Typography sx={{ color: P.slate400, fontSize: '0.9rem' }}>No users match your search</Typography>
                              </Box>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Box>
                </Box>
              </Stack>
            )}

            {/* ====== SETTINGS ====== */}
            {activeView === 'settings' && (
              <Stack spacing={3} sx={{ maxWidth: 640, mx: 'auto' }}>

                <SectionCard title='Bulk Token Limits' icon={<TuneIcon sx={{ fontSize: 18 }} />}>
                  <Box sx={{ p: 3 }}>
                    <Typography sx={{ mb: 2.5, fontSize: '0.85rem', color: P.slate500, lineHeight: 1.6 }}>
                      Set a monthly token limit for every user at once. Leave empty or 0 for unlimited.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Input size='sm' placeholder='e.g. 2000000' value={bulkLimit}
                        onChange={e => setBulkLimit(e.target.value)}
                        sx={{ width: 200, borderRadius: 10, border: `1px solid ${P.slate200}`, '--Input-focusedHighlight': P.primary }} />
                      <Button size='sm' loading={bulkSaving}
                        sx={{
                          borderRadius: 10, background: P.primary, fontWeight: 700,
                          boxShadow: '0 4px 14px rgba(124,92,252,0.3)',
                          '&:hover': { background: P.primaryLight },
                        }}
                        onClick={() => {
                          const val = parseInt(bulkLimit, 10);
                          if (!val || val <= 0) return alert('Enter a valid number');
                          if (confirm('Set ' + val.toLocaleString() + ' tokens/month for ALL users?'))
                            handleSetAllLimits(val);
                        }}>
                        Apply to All
                      </Button>
                      <Button size='sm' variant='outlined' loading={bulkSaving}
                        sx={{ borderRadius: 10, borderColor: P.slate300, color: P.slate600, '&:hover': { borderColor: P.primary, color: P.primary, background: P.primaryGhost } }}
                        onClick={() => {
                          if (confirm('Remove token limit for ALL users (unlimited)?'))
                            handleSetAllLimits(null);
                        }}>
                        Set All Unlimited
                      </Button>
                    </Box>
                  </Box>
                </SectionCard>

                <SectionCard title='System Info' icon={<AdminPanelSettingsIcon sx={{ fontSize: 18 }} />}>
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: P.slate500 }}>Admin Email</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: P.slate700 }}>rcohen@mytsi.org</Typography>
                      </Box>
                      <Divider sx={{ borderColor: P.slate100 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: P.slate500 }}>Admin Token Limit</Typography>
                        <Box sx={{
                          px: 1.25, py: 0.4, borderRadius: 8, background: P.emeraldPale, color: P.emerald,
                          fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5,
                        }}>
                          <AllInclusiveIcon sx={{ fontSize: 14 }} /> Always Unlimited
                        </Box>
                      </Box>
                      <Divider sx={{ borderColor: P.slate100 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem', color: P.slate500 }}>Monthly Reset</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: P.slate700 }}>
                          <CalendarTodayIcon sx={{ fontSize: 14, color: P.slate400 }} />
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>1st of each month</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </SectionCard>
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onRefresh={loadAllData} />
      )}
    </Box>
  );
}
