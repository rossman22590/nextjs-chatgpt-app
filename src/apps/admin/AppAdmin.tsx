import * as React from 'react';

import { useSession } from 'next-auth/react';

import { Box, Button, Card, Chip, CircularProgress, Divider, IconButton, Input, Modal, ModalClose, ModalDialog, Sheet, Stack, Table, Typography } from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import TokenIcon from '@mui/icons-material/DataUsage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EditIcon from '@mui/icons-material/Edit';

import { apiQueryCloud } from '~/common/util/trpc.client';


// Stat card component
function StatCard(props: { title: string; value: string | number; subtitle?: string; color?: 'primary' | 'success' | 'warning' | 'danger' }) {
  return (
    <Card variant='soft' color={props.color || 'primary'} sx={{ minWidth: 180, flex: 1 }}>
      <Typography level='body-sm'>{props.title}</Typography>
      <Typography level='h3'>{props.value}</Typography>
      {props.subtitle && <Typography level='body-xs'>{props.subtitle}</Typography>}
    </Card>
  );
}


// Format large numbers
function fmtNum(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtCost(cents: number | null | undefined): string {
  if (cents == null) return '$0.00';
  return '$' + (cents / 100).toFixed(2);
}


// User detail modal
function UserDetailModal(props: { userId: string; onClose: () => void }) {
  const { data: usage, isLoading } = apiQueryCloud.admin.getUserUsage.useQuery({ userId: props.userId });
  const { data: logs } = apiQueryCloud.admin.getUserLogs.useQuery({ userId: props.userId, limit: 20 });
  const utils = apiQueryCloud.useUtils();

  const [editingLimit, setEditingLimit] = React.useState(false);
  const [limitValue, setLimitValue] = React.useState('');

  const setLimit = apiQueryCloud.admin.setTokenLimit.useMutation({
    onSuccess: () => {
      utils.admin.getUserUsage.invalidate({ userId: props.userId });
      utils.admin.listUsers.invalidate();
      setEditingLimit(false);
    },
  });

  const handleSetLimit = () => {
    const val = limitValue.trim();
    setLimit.mutate({
      userId: props.userId,
      tokenLimit: val === '' || val === '0' ? null : parseInt(val, 10) || null,
    });
  };

  return (
    <Modal open onClose={props.onClose}>
      <ModalDialog sx={{ width: 700, maxHeight: '80vh', overflow: 'auto' }}>
        <ModalClose />
        <Typography level='h4'>User Usage Details</Typography>

        {isLoading ? <CircularProgress /> : usage?.user && (
          <Stack spacing={2}>
            <Box>
              <Typography level='title-md'>{usage.user.name || 'Unnamed'}</Typography>
              <Typography level='body-sm'>{usage.user.email}</Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography level='body-sm'>Token limit:</Typography>
                {editingLimit ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Input
                      size='sm'
                      placeholder='Unlimited'
                      value={limitValue}
                      onChange={e => setLimitValue(e.target.value)}
                      sx={{ width: 150 }}
                    />
                    <Button size='sm' onClick={handleSetLimit} loading={setLimit.isPending}>Save</Button>
                    <Button size='sm' variant='plain' onClick={() => setEditingLimit(false)}>Cancel</Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size='sm' color={usage.user.tokenLimit ? 'warning' : 'success'}>
                      {usage.user.tokenLimit ? fmtNum(usage.user.tokenLimit) + ' /mo' : 'Unlimited'}
                    </Chip>
                    <IconButton size='sm' variant='plain' onClick={() => {
                      setLimitValue(usage.user?.tokenLimit?.toString() || '');
                      setEditingLimit(true);
                    }}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <StatCard title='This Month Tokens' value={fmtNum(usage.thisMonth._sum.totalTokens)} subtitle={`${fmtNum(usage.thisMonth._count)} requests`} />
              <StatCard title='This Month Cost' value={fmtCost(usage.thisMonth._sum.costCents)} color='warning' />
              <StatCard title='All Time Tokens' value={fmtNum(usage.allTime._sum.totalTokens)} subtitle={`${fmtNum(usage.allTime._count)} requests`} color='success' />
              <StatCard title='All Time Cost' value={fmtCost(usage.allTime._sum.costCents)} color='danger' />
            </Box>

            <Divider />

            <Typography level='title-sm'>Recent Usage Logs</Typography>
            {logs && logs.length > 0 ? (
              <Sheet variant='outlined' sx={{ borderRadius: 'sm', overflow: 'auto', maxHeight: 300 }}>
                <Table size='sm' stickyHeader>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Model</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Total</th>
                      <th>Cost</th>
                      <th>Op</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                        <td><Typography level='body-xs' noWrap sx={{ maxWidth: 150 }}>{log.modelId}</Typography></td>
                        <td>{fmtNum(log.inputTokens)}</td>
                        <td>{fmtNum(log.outputTokens)}</td>
                        <td>{fmtNum(log.totalTokens)}</td>
                        <td>{fmtCost(log.costCents)}</td>
                        <td><Chip size='sm' variant='soft'>{log.operation}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            ) : (
              <Typography level='body-sm'>No usage logs yet</Typography>
            )}
          </Stack>
        )}
      </ModalDialog>
    </Modal>
  );
}


export function AppAdmin() {
  const { data: session } = useSession();
  const { data: isAdminData, isLoading: checkingAdmin } = apiQueryCloud.admin.isAdmin.useQuery(
    undefined, { enabled: !!session?.user },
  );
  const { data: globalStats } = apiQueryCloud.admin.globalStats.useQuery(
    undefined, { enabled: !!isAdminData?.isAdmin },
  );
  const { data: usersData } = apiQueryCloud.admin.listUsers.useQuery(
    undefined, { enabled: !!isAdminData?.isAdmin },
  );
  const { data: topUsers } = apiQueryCloud.admin.topUsers.useQuery(
    undefined, { enabled: !!isAdminData?.isAdmin },
  );

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [bulkLimit, setBulkLimit] = React.useState('');

  const utils = apiQueryCloud.useUtils();
  const setAllLimits = apiQueryCloud.admin.setAllTokenLimits.useMutation({
    onSuccess: (data) => {
      utils.admin.listUsers.invalidate();
      utils.admin.globalStats.invalidate();
      setBulkLimit('');
      alert('Updated ' + data.updated + ' users');
    },
  });

  // Auth gate
  if (!session?.user)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography level='h4'>Please sign in to access admin panel</Typography>
      </Box>
    );

  if (checkingAdmin)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );

  if (!isAdminData?.isAdmin)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography level='h4' color='danger'>Access denied. Admin privileges required.</Typography>
      </Box>
    );

  const filteredUsers = usersData?.users.filter(u =>
    !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography level='h3' sx={{ mb: 3 }}>Admin Panel - Usage Tracking</Typography>

      {/* Global Stats */}
      {globalStats && (
        <>
          <Typography level='title-md' sx={{ mb: 1 }}>Global Stats</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <StatCard title='Total Users' value={globalStats.userCount} color='primary' />
            <StatCard title='Today Tokens' value={fmtNum(globalStats.today._sum.totalTokens)} subtitle={`${fmtNum(globalStats.today._count)} requests`} />
            <StatCard title='This Month Tokens' value={fmtNum(globalStats.thisMonth._sum.totalTokens)} subtitle={fmtCost(globalStats.thisMonth._sum.costCents)} color='warning' />
            <StatCard title='All Time Tokens' value={fmtNum(globalStats.allTime._sum.totalTokens)} subtitle={fmtCost(globalStats.allTime._sum.costCents)} color='success' />
          </Box>
        </>
      )}

      {/* Top Users This Month */}
      {topUsers && topUsers.length > 0 && (
        <>
          <Typography level='title-md' startDecorator={<TrendingUpIcon />} sx={{ mb: 1 }}>Top Users This Month</Typography>
          <Sheet variant='outlined' sx={{ borderRadius: 'sm', mb: 3, overflow: 'auto' }}>
            <Table size='sm'>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((entry, i) => (
                  <tr key={entry.userId} style={{ cursor: 'pointer' }} onClick={() => setSelectedUserId(entry.userId)}>
                    <td>
                      <Typography level='body-sm'>
                        {i + 1}. {entry.user?.name || entry.user?.email || entry.userId.slice(0, 8)}
                      </Typography>
                    </td>
                    <td>{fmtNum(entry._sum.totalTokens)}</td>
                    <td>{fmtCost(entry._sum.costCents)}</td>
                    <td>{entry._count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>
        </>
      )}

      {/* Bulk Token Limit */}
      <Card variant='outlined' sx={{ mb: 3, p: 2 }}>
        <Typography level='title-md' sx={{ mb: 1 }}>Set Token Limit for ALL Users</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            size='sm'
            placeholder='e.g. 10000000'
            value={bulkLimit}
            onChange={e => setBulkLimit(e.target.value)}
            sx={{ width: 200 }}
          />
          <Button
            size='sm'
            color='warning'
            loading={setAllLimits.isPending}
            onClick={() => {
              const val = parseInt(bulkLimit, 10);
              if (!val || val <= 0) return alert('Enter a valid number');
              if (confirm('Set ' + val.toLocaleString() + ' tokens/month for ALL users?'))
                setAllLimits.mutate({ tokenLimit: val });
            }}
          >
            Apply to All Users
          </Button>
          <Button
            size='sm'
            variant='soft'
            color='success'
            loading={setAllLimits.isPending}
            onClick={() => {
              if (confirm('Remove token limit for ALL users (unlimited)?'))
                setAllLimits.mutate({ tokenLimit: null });
            }}
          >
            Set All Unlimited
          </Button>
        </Box>
      </Card>

      {/* User List */}
      <Typography level='title-md' startDecorator={<PersonIcon />} sx={{ mb: 1 }}>All Users</Typography>
      <Input
        size='sm'
        placeholder='Search users...'
        startDecorator={<SearchIcon />}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        sx={{ mb: 2, maxWidth: 300 }}
      />

      <Sheet variant='outlined' sx={{ borderRadius: 'sm', overflow: 'auto' }}>
        <Table size='sm' stickyHeader>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Conversations</th>
              <th>Messages</th>
              <th>Usage Logs</th>
              <th>Token Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map(user => (
              <tr key={user.id}>
                <td><Typography level='body-sm'>{user.name || 'Unnamed'}</Typography></td>
                <td><Typography level='body-xs'>{user.email}</Typography></td>
                <td>{user._count.conversations}</td>
                <td>{user._count.messages}</td>
                <td>{user._count.usageLogs}</td>
                <td>
                  <Chip size='sm' variant='soft' color={user.tokenLimit ? 'warning' : 'success'}>
                    {user.tokenLimit ? fmtNum(user.tokenLimit) + ' /mo' : 'Unlimited'}
                  </Chip>
                </td>
                <td>
                  <Button size='sm' variant='soft' onClick={() => setSelectedUserId(user.id)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </Box>
  );
}
