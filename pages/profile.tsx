import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Stack,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemDecorator,
  Chip,
  Sheet,
  Table,
  LinearProgress,
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import HistoryIcon from '@mui/icons-material/History';

import Image from 'next/image';
import { Brand } from '~/common/app.config';
import { AuthButton } from '~/common/components/auth/AuthButton';
import { UserAnalytics } from '~/common/components/analytics/UserAnalytics';
import { apiAsyncNode } from '~/common/util/trpc.client';

type MyUsageData = Awaited<ReturnType<typeof apiAsyncNode.usage.myUsage.query>>;
type CheckLimitData = Awaited<ReturnType<typeof apiAsyncNode.usage.checkLimit.query>>;
type MonthlyHistoryData = Awaited<ReturnType<typeof apiAsyncNode.usage.myMonthlyHistory.query>>;
type MyLogsData = Awaited<ReturnType<typeof apiAsyncNode.usage.myLogs.query>>;

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState(0);
  const [myUsage, setMyUsage] = React.useState<MyUsageData | null>(null);
  const [limitInfo, setLimitInfo] = React.useState<CheckLimitData | null>(null);
  const [monthlyHistory, setMonthlyHistory] = React.useState<MonthlyHistoryData | null>(null);
  const [myLogs, setMyLogs] = React.useState<MyLogsData | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const refreshUsageData = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [usage, limit, history, logs] = await Promise.all([
        apiAsyncNode.usage.myUsage.query(),
        apiAsyncNode.usage.checkLimit.query(),
        apiAsyncNode.usage.myMonthlyHistory.query({ months: 6 }),
        apiAsyncNode.usage.myLogs.query({ limit: 10 }),
      ]);
      setMyUsage(usage);
      setLimitInfo(limit);
      setMonthlyHistory(history);
      setMyLogs(logs);
    } catch {
      /* ignore */
    }
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    if (status === 'authenticated') {
      refreshUsageData();
    }
  }, [status, refreshUsageData]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading spinner if checking authentication
  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.body',
        }}
      >
        <CircularProgress size="lg" />
      </Box>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        py: { xs: 2, md: 3 },
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: { xs: '100%', sm: 720, md: 880, lg: 1040 }, margin: '0 auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="plain"
            color="neutral"
            size="sm"
            startDecorator={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{ '--Icon-fontSize': '1.25rem' }}
          >
            Back
          </Button>
          <Image src="/apple-touch-icon.png" alt={Brand.Title.Base} width={28} height={28} />
          <Typography level="h4" fontWeight="lg">
            Profile
          </Typography>
        </Box>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 'lg',
            borderColor: 'divider',
            boxShadow: 'sm',
            bgcolor: 'background.surface',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Profile hero */}
            <Box
              sx={{
                p: 3,
                bgcolor: 'background.level1',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {session?.user?.image ? (
                  <Avatar
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    sx={{ width: 56, height: 56 }}
                  />
                ) : (
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.softBg' }}>
                    <PersonIcon sx={{ color: 'primary.plainColor', fontSize: 28 }} />
                  </Avatar>
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography level="title-lg" fontWeight="lg">
                    {session?.user?.name || 'User'}
                  </Typography>
                  <Typography level="body-sm" color="neutral" noWrap>
                    {session?.user?.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip variant="soft" color={limitInfo?.isActive === false ? 'danger' : 'success'} size="sm">
                      {limitInfo?.isActive === false ? 'Inactive Account' : 'Active Account'}
                    </Chip>
                    {!!limitInfo?.planLabel && (
                      <Chip variant="soft" color={limitInfo.plan === 'ULTRA' ? 'warning' : 'primary'} size="sm">
                        {limitInfo.planLabel} Plan
                      </Chip>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ px: 2, pt: 1 }}>
              <Stack direction="row" spacing={0.5} sx={{ '--List-padding': 0, '--ListItem-minHeight': '2.5rem' }}>
                <Button
                  variant={activeTab === 0 ? 'soft' : 'plain'}
                  color="neutral"
                  size="sm"
                  onClick={() => setActiveTab(0)}
                  startDecorator={<AccountCircleIcon sx={{ fontSize: '1.1rem' }} />}
                  sx={{
                    borderRadius: 'md',
                    fontWeight: activeTab === 0 ? 600 : 400,
                  }}
                >
                  Account
                </Button>
                <Button
                  variant={activeTab === 1 ? 'soft' : 'plain'}
                  color="neutral"
                  size="sm"
                  onClick={() => setActiveTab(1)}
                  startDecorator={<AnalyticsIcon sx={{ fontSize: '1.1rem' }} />}
                  sx={{
                    borderRadius: 'md',
                    fontWeight: activeTab === 1 ? 600 : 400,
                  }}
                >
                  Analytics
                </Button>
              </Stack>
            </Box>

            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography level="title-md" fontWeight="lg" sx={{ mb: 2 }}>
                  Profile
                </Typography>
                <List size="sm" sx={{ '--ListItem-paddingY': 0.75, '--ListItemDecorator-size': '2rem' }}>
                  <ListItem>
                    <ListItemDecorator>
                      <PersonIcon sx={{ fontSize: '1.1rem', color: 'text.tertiary' }} />
                    </ListItemDecorator>
                    <Box>
                      <Typography level="body-xs" color="neutral">Name</Typography>
                      <Typography level="body-sm" fontWeight="md">{session?.user?.name || 'Not provided'}</Typography>
                    </Box>
                  </ListItem>
                  <ListItem>
                    <ListItemDecorator>
                      <EmailIcon sx={{ fontSize: '1.1rem', color: 'text.tertiary' }} />
                    </ListItemDecorator>
                    <Box>
                      <Typography level="body-xs" color="neutral">Email</Typography>
                      <Typography level="body-sm" fontWeight="md">{session?.user?.email || 'Not provided'}</Typography>
                    </Box>
                  </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography level="title-md" fontWeight="lg">Weekly Usage</Typography>
                  <Button variant="plain" color="neutral" size="sm" startDecorator={<RefreshIcon />} loading={refreshing} onClick={refreshUsageData}>
                    Refresh
                  </Button>
                </Box>
                {myUsage ? (
                  (() => {
                    const isUnlimited = myUsage.weeklyLimit == null;
                    // unlimited (admin) accounts: draw the bar against the plan default, purely as a reference
                    const limit = myUsage.weeklyLimit ?? myUsage.planWeeklyDefault;
                    const used = myUsage.weeklyUsed;
                    const isActive = myUsage.isActive;
                    const remaining = myUsage.weeklyRemaining;
                    const noCredits = myUsage.reason === 'no_credits';
                    const pct = limit != null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                    const cardColor = !isActive ? 'danger' : noCredits ? 'warning' : isUnlimited ? 'neutral' : pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success';
                    return (
                      <Card variant="soft" color={cardColor} sx={{ borderRadius: 'md', mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <DataUsageIcon sx={{ fontSize: '1.1rem' }} />
                            <Typography level="title-sm">
                              {!isActive ? 'Account inactive' : noCredits ? 'No credits yet' : isUnlimited ? used.toLocaleString() + ' tokens used this week - Unlimited' : (remaining ?? 0).toLocaleString() + ' tokens remaining this week'}
                            </Typography>
                            <Chip variant="outlined" color={myUsage.plan === 'ULTRA' ? 'warning' : 'primary'} size="sm" sx={{ ml: 'auto' }}>
                              {myUsage.planLabel}
                            </Chip>
                            {isUnlimited && (
                              <Chip variant="outlined" color="neutral" size="sm">
                                Unlimited
                              </Chip>
                            )}
                          </Box>
                          {!isActive ? (
                            <Typography level="body-sm" color="neutral">Your account is inactive. Contact your admin to activate access. If you have an active AI Tutor Ultra account, please reach out to support to get activated.</Typography>
                          ) : noCredits ? (
                            <Typography level="body-sm" color="neutral">Your account has no credits yet. Contact your admin to enable your plan allowance.</Typography>
                          ) : limit != null && limit > 0 ? (
                            <>
                              <LinearProgress
                                determinate
                                value={pct}
                                color={isUnlimited ? 'neutral' : pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success'}
                                size="sm"
                                sx={{ borderRadius: 'xl', my: 1 }}
                              />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-xs" color="neutral">{used.toLocaleString()} used</Typography>
                                <Typography level="body-xs" color="neutral">{isUnlimited ? limit.toLocaleString() + ' plan reference - no cap' : limit.toLocaleString() + ' limit / week'}</Typography>
                              </Box>
                            </>
                          ) : null}
                          <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>
                            {myUsage.thisWeek._count} requests in the last 7 days - usage frees up as it ages past 7 days
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  })()
                ) : (
                  <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size="sm" />
                  </Box>
                )}

                {monthlyHistory && monthlyHistory.length > 0 && (
                  <>
                    <Typography level="title-sm" fontWeight="lg" sx={{ mt: 3, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon sx={{ fontSize: '1rem' }} /> Monthly Usage History
                    </Typography>
                    <Sheet variant="outlined" sx={{ borderRadius: 'md', borderColor: 'divider', overflow: 'auto', mb: 2 }}>
                      <Table size="sm" stickyHeader>
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th style={{ textAlign: 'right' }}>Tokens</th>
                            <th style={{ textAlign: 'right' }}>Cost</th>
                            <th style={{ textAlign: 'right' }}>Requests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyHistory.map((m, i) => (
                            <tr key={m.month} style={i === 0 ? { fontWeight: 'bold' } : undefined}>
                              <td>
                                {m.month}
                                {i === 0 ? ' (current)' : ''}
                              </td>
                              <td style={{ textAlign: 'right' }}>{m.totalTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>
                                {'$' + (m.costCents / 100 < 0.01 && m.costCents > 0 ? (m.costCents / 100).toFixed(4) : (m.costCents / 100).toFixed(2))}
                              </td>
                              <td style={{ textAlign: 'right' }}>{m.requests}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Sheet>
                  </>
                )}

                {myLogs && myLogs.length > 0 && (
                  <>
                    <Typography level="title-sm" fontWeight="lg" sx={{ mt: 3, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DataUsageIcon sx={{ fontSize: '1rem' }} /> Recent Token Deductions
                    </Typography>
                    <Sheet variant="outlined" sx={{ borderRadius: 'md', borderColor: 'divider', overflow: 'auto', maxHeight: 350, mb: 2 }}>
                      <Table size="sm" stickyHeader>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Model</th>
                            <th style={{ textAlign: 'right' }}>Tokens</th>
                            <th style={{ textAlign: 'right' }}>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myLogs.map((log) => (
                            <tr key={log.id}>
                              <td>{new Date(log.createdAt).toLocaleString()}</td>
                              <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.modelId}</td>
                              <td style={{ textAlign: 'right' }}>{log.totalTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>${(log.costCents / 100).toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Sheet>
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography level="title-sm" fontWeight="lg" sx={{ mb: 2 }}>
                  Actions
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    color="neutral"
                    size="sm"
                    startDecorator={<SecurityIcon />}
                    onClick={() => router.push('/auth/signin?forgot=true')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Reset Password
                  </Button>
                  <AuthButton
                    variant="text"
                    size="sm"
                    sx={{
                      justifyContent: 'flex-start',
                      flexDirection: 'row',
                      gap: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 'md',
                      bgcolor: 'background.body',
                      '&:hover': { bgcolor: 'background.level1' },
                    }}
                  />
                </Stack>

                <Typography level="body-xs" color="neutral" sx={{ mt: 4, textAlign: 'center' }}>
                  {Brand.Title.Base}
                </Typography>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <UserAnalytics userId={session?.user?.id} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
