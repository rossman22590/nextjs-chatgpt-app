import * as React from 'react';

import { useSession } from 'next-auth/react';

import {
  Avatar, Box, Button, Card, Chip, CircularProgress, Divider, IconButton,
  Input, LinearProgress, Modal, ModalClose, ModalDialog, Sheet, Stack,
  Table, Tabs, Tab, TabList, TabPanel, Tooltip, Typography,
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';

import { apiAsyncNode } from '~/common/util/trpc.client';


// --- Helpers ---

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


// --- Stat Card ---

function StatCard(props: { title: string; value: string | number; subtitle?: string; color?: 'primary' | 'success' | 'warning' | 'danger' }) {
  return (
    <Card variant='soft' color={props.color || 'primary'} sx={{ flex: '1 1 160px', minWidth: 160 }}>
      <Typography level='body-xs' sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{props.title}</Typography>
      <Typography level='h3' sx={{ my: 0.5 }}>{props.value}</Typography>
      {props.subtitle && <Typography level='body-xs' sx={{ opacity: 0.8 }}>{props.subtitle}</Typography>}
    </Card>
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
    ]).then(([u, l]) => {
      setUsage(u);
      setLogs(l);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, [props.userId]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleSetLimit = () => {
    const val = limitValue.trim();
    setSaving(true);
    apiAsyncNode.admin.setTokenLimit.mutate({
      userId: props.userId,
      tokenLimit: val === '' || val === '0' ? null : parseInt(val, 10) || null,
    }).then(() => {
      setEditingLimit(false);
      loadData();
      props.onRefresh();
    }).catch(() => {}).finally(() => setSaving(false));
  };

  const user = usage?.user;
  const pct = user?.tokenLimit ? Math.min(100, ((usage?.thisMonth?._sum?.totalTokens ?? 0) / user.tokenLimit) * 100) : 0;

  return (
    <Modal open onClose={props.onClose}>
      <ModalDialog sx={{ width: '90vw', maxWidth: 800, maxHeight: '90vh', overflow: 'auto', p: 3 }}>
        <ModalClose />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : !user ? (
          <Typography color='danger'>User not found</Typography>
        ) : (
          <Stack spacing={2.5}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={user.image} sx={{ width: 56, height: 56 }}>{(user.name || '?')[0]}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography level='h4'>{user.name || 'Unnamed'}</Typography>
                <Typography level='body-sm' sx={{ color: 'text.secondary' }}>{user.email}</Typography>
              </Box>
              <IconButton variant='outlined' size='sm' onClick={loadData}><RefreshIcon /></IconButton>
            </Box>

            {/* Token Limit */}
            <Card variant='outlined' sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography level='title-sm'>Token Limit</Typography>
                {editingLimit ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                    <Input size='sm' placeholder='Empty = Unlimited' value={limitValue}
                      onChange={e => setLimitValue(e.target.value)} sx={{ width: 160 }} />
                    <Button size='sm' onClick={handleSetLimit} loading={saving}>Save</Button>
                    <Button size='sm' variant='plain' onClick={() => setEditingLimit(false)}>Cancel</Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                    <Chip size='sm' color={user.tokenLimit ? (pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary') : 'success'}>
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
                <LinearProgress determinate value={pct} color={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }} />
              )}
            </Card>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <StatCard title='Month Tokens' value={fmtNum(usage.thisMonth._sum.totalTokens)}
                subtitle={`${fmtNum(usage.thisMonth._count)} requests`} />
              <StatCard title='Month Cost' value={fmtCost(usage.thisMonth._sum.costCents)} color='warning' />
              <StatCard title='All Time Tokens' value={fmtNum(usage.allTime._sum.totalTokens)}
                subtitle={`${fmtNum(usage.allTime._count)} requests`} color='success' />
              <StatCard title='All Time Cost' value={fmtCost(usage.allTime._sum.costCents)} color='danger' />
            </Box>

            {/* Logs */}
            <Typography level='title-sm'>Recent Usage ({logs.length} entries)</Typography>
            {logs.length > 0 ? (
              <Sheet variant='outlined' sx={{ borderRadius: 'sm', overflow: 'auto', maxHeight: 350 }}>
                <Table size='sm' stickyHeader sx={{ '& th': { py: 1 }, '& td': { py: 0.75 } }}>
                  <thead>
                    <tr>
                      <th style={{ width: 150 }}>Time</th>
                      <th>Model</th>
                      <th style={{ textAlign: 'right' }}>In</th>
                      <th style={{ textAlign: 'right' }}>Out</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Cost</th>
                      <th style={{ width: 60 }}>Op</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td><Typography level='body-xs'>{new Date(log.createdAt).toLocaleString()}</Typography></td>
                        <td><Typography level='body-xs' noWrap sx={{ maxWidth: 200 }}>{log.modelId}</Typography></td>
                        <td style={{ textAlign: 'right' }}><Typography level='body-xs'>{fmtNum(log.inputTokens)}</Typography></td>
                        <td style={{ textAlign: 'right' }}><Typography level='body-xs'>{fmtNum(log.outputTokens)}</Typography></td>
                        <td style={{ textAlign: 'right' }}><Typography level='body-xs'>{fmtNum(log.totalTokens)}</Typography></td>
                        <td style={{ textAlign: 'right' }}><Typography level='body-xs'>{fmtCost(log.costCents)}</Typography></td>
                        <td><Chip size='sm' variant='soft' sx={{ fontSize: '0.65rem' }}>{log.operation}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            ) : (
              <Typography level='body-sm' sx={{ color: 'text.tertiary', fontStyle: 'italic' }}>No usage logs recorded yet</Typography>
            )}
          </Stack>
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
  const [activeTab, setActiveTab] = React.useState(0);
  const [sortField, setSortField] = React.useState<string>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  // Load all admin data
  const loadAllData = React.useCallback(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      apiAsyncNode.admin.globalStats.query(),
      apiAsyncNode.admin.listUsers.query(),
      apiAsyncNode.admin.topUsers.query(),
    ]).then(([stats, userList, top]) => {
      setGlobalStats(stats);
      setUsers(userList);
      setTopUsers(top);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin]);

  // Check admin on mount
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
      .then(data => {
        setBulkLimit('');
        alert('Updated ' + data.updated + ' users');
        loadAllData();
      })
      .catch(() => alert('Failed to update limits'))
      .finally(() => setBulkSaving(false));
  };

  // Auth gates
  if (!session?.user)
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Typography level='h4'>Please sign in to access admin panel</Typography>
    </Box>;

  if (checkingAdmin)
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>;

  if (!isAdmin)
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Typography level='h4' color='danger'>Access denied. Admin privileges required.</Typography>
    </Box>;

  // Filtering
  const filtered = users.filter((u: any) =>
    !searchQuery
    || u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    || u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sorting
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

  const sortIcon = (field: string) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header Bar */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
        <Typography level='h4' sx={{ flex: 1 }}>Admin Panel</Typography>
        <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>{session.user?.email}</Typography>
        <Tooltip title='Refresh data'>
          <IconButton variant='outlined' size='sm' onClick={loadAllData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v as number)}
        sx={{ flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TabList sx={{ px: 3 }}>
          <Tab><BarChartIcon sx={{ mr: 0.5, fontSize: 18 }} /> Overview</Tab>
          <Tab><GroupIcon sx={{ mr: 0.5, fontSize: 18 }} /> Users ({users.length})</Tab>
          <Tab><SettingsIcon sx={{ mr: 0.5, fontSize: 18 }} /> Settings</Tab>
        </TabList>
      </Tabs>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>

        {loading && !globalStats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Tab 0: Overview */}
            {activeTab === 0 && (
              <Stack spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>

                {/* Global Stats */}
                {globalStats && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <StatCard title='Total Users' value={globalStats.userCount} color='primary' />
                    <StatCard title='Today Tokens' value={fmtNum(globalStats.today._sum.totalTokens)}
                      subtitle={`${fmtNum(globalStats.today._count)} requests`} />
                    <StatCard title='This Month' value={fmtNum(globalStats.thisMonth._sum.totalTokens)}
                      subtitle={fmtCost(globalStats.thisMonth._sum.costCents)} color='warning' />
                    <StatCard title='All Time' value={fmtNum(globalStats.allTime._sum.totalTokens)}
                      subtitle={fmtCost(globalStats.allTime._sum.costCents)} color='success' />
                  </Box>
                )}

                {/* Top Users */}
                {topUsers.length > 0 && (
                  <Card variant='outlined'>
                    <Typography level='title-md' startDecorator={<TrendingUpIcon />} sx={{ p: 2, pb: 0 }}>
                      Top Users This Month
                    </Typography>
                    <Box sx={{ overflow: 'auto' }}>
                      <Table size='sm' sx={{ '& th': { py: 1.5 }, '& td': { py: 1 } }}>
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>User</th>
                            <th style={{ textAlign: 'right' }}>Tokens</th>
                            <th style={{ textAlign: 'right' }}>Cost</th>
                            <th style={{ textAlign: 'right' }}>Requests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topUsers.map((entry, i) => (
                            <tr key={entry.userId} style={{ cursor: 'pointer' }}
                              onClick={() => { setSelectedUserId(entry.userId); }}>
                              <td><Typography level='body-sm' sx={{ fontWeight: 700 }}>{i + 1}</Typography></td>
                              <td>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar size='sm' sx={{ width: 24, height: 24, fontSize: 12 }}>
                                    {(entry.user?.name || '?')[0]}
                                  </Avatar>
                                  <Box>
                                    <Typography level='body-sm'>{entry.user?.name || 'Unknown'}</Typography>
                                    <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>{entry.user?.email}</Typography>
                                  </Box>
                                </Box>
                              </td>
                              <td style={{ textAlign: 'right' }}><Typography level='body-sm'>{fmtNum(entry._sum.totalTokens)}</Typography></td>
                              <td style={{ textAlign: 'right' }}><Typography level='body-sm'>{fmtCost(entry._sum.costCents)}</Typography></td>
                              <td style={{ textAlign: 'right' }}><Typography level='body-sm'>{entry._count}</Typography></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Box>
                  </Card>
                )}
              </Stack>
            )}

            {/* Tab 1: Users */}
            {activeTab === 1 && (
              <Stack spacing={2} sx={{ maxWidth: 1400, mx: 'auto' }}>

                {/* Search */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Input size='sm' placeholder='Search users...' startDecorator={<SearchIcon />}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    sx={{ flex: 1, maxWidth: 350 }} />
                  <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
                    {sorted.length} of {users.length} users
                  </Typography>
                </Box>

                {/* Users Table */}
                <Sheet variant='outlined' sx={{ borderRadius: 'md', overflow: 'auto' }}>
                  <Table size='sm' stickyHeader hoverRow
                    sx={{
                      '& th': { py: 1.5, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' },
                      '& td': { py: 1, verticalAlign: 'middle' },
                      '& tr': { cursor: 'pointer' },
                    }}>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('name')}>User{sortIcon('name')}</th>
                        <th onClick={() => handleSort('email')}>Email{sortIcon('email')}</th>
                        <th onClick={() => handleSort('conversations')} style={{ textAlign: 'right' }}>Convos{sortIcon('conversations')}</th>
                        <th onClick={() => handleSort('messages')} style={{ textAlign: 'right' }}>Msgs{sortIcon('messages')}</th>
                        <th onClick={() => handleSort('monthTokens')} style={{ textAlign: 'right' }}>Month Tokens{sortIcon('monthTokens')}</th>
                        <th onClick={() => handleSort('monthCost')} style={{ textAlign: 'right' }}>Month Cost{sortIcon('monthCost')}</th>
                        <th onClick={() => handleSort('usageLogs')} style={{ textAlign: 'right' }}>Logs{sortIcon('usageLogs')}</th>
                        <th>Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((user: any) => {
                        const mTokens = user.monthUsage?._sum?.totalTokens ?? 0;
                        const mCost = user.monthUsage?._sum?.costCents ?? 0;
                        const mReqs = user.monthUsage?._count ?? 0;
                        return (
                          <tr key={user.id} onClick={() => setSelectedUserId(user.id)}>
                            <td>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar size='sm' src={user.image} sx={{ width: 28, height: 28, fontSize: 12 }}>
                                  {(user.name || '?')[0]}
                                </Avatar>
                                <Typography level='body-sm' noWrap sx={{ maxWidth: 160 }}>
                                  {user.name || 'Unnamed'}
                                </Typography>
                              </Box>
                            </td>
                            <td><Typography level='body-xs' noWrap sx={{ maxWidth: 200 }}>{user.email}</Typography></td>
                            <td style={{ textAlign: 'right' }}>{user._count.conversations}</td>
                            <td style={{ textAlign: 'right' }}>{user._count.messages}</td>
                            <td style={{ textAlign: 'right' }}>
                              <Tooltip title={`${mReqs} requests this month`}>
                                <Typography level='body-sm'>{fmtNum(mTokens)}</Typography>
                              </Tooltip>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Typography level='body-sm'>{fmtCost(mCost)}</Typography>
                            </td>
                            <td style={{ textAlign: 'right' }}>{user._count.usageLogs}</td>
                            <td>
                              <Chip size='sm' variant='soft'
                                color={user.tokenLimit ? 'warning' : 'success'}>
                                {user.tokenLimit ? fmtNum(user.tokenLimit) : 'Unlimited'}
                              </Chip>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Sheet>
              </Stack>
            )}

            {/* Tab 2: Settings */}
            {activeTab === 2 && (
              <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
                <Card variant='outlined' sx={{ p: 3 }}>
                  <Typography level='title-lg' sx={{ mb: 2 }}>Bulk Token Limits</Typography>
                  <Typography level='body-sm' sx={{ mb: 2, color: 'text.secondary' }}>
                    Set a monthly token limit for all users at once. Empty or 0 = unlimited.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input size='sm' placeholder='e.g. 2000000' value={bulkLimit}
                      onChange={e => setBulkLimit(e.target.value)} sx={{ width: 200 }} />
                    <Button size='sm' color='warning' loading={bulkSaving}
                      onClick={() => {
                        const val = parseInt(bulkLimit, 10);
                        if (!val || val <= 0) return alert('Enter a valid number');
                        if (confirm('Set ' + val.toLocaleString() + ' tokens/month for ALL users?'))
                          handleSetAllLimits(val);
                      }}>
                      Apply to All
                    </Button>
                    <Button size='sm' variant='soft' color='success' loading={bulkSaving}
                      onClick={() => {
                        if (confirm('Remove token limit for ALL users (unlimited)?'))
                          handleSetAllLimits(null);
                      }}>
                      Set All Unlimited
                    </Button>
                  </Box>
                </Card>

                <Card variant='outlined' sx={{ p: 3 }}>
                  <Typography level='title-lg' sx={{ mb: 1 }}>Admin Info</Typography>
                  <Typography level='body-sm'>Admin email: <strong>rcohen@mytsi.org</strong></Typography>
                  <Typography level='body-sm'>Admin always has unlimited tokens regardless of settings.</Typography>
                </Card>
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
