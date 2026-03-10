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
  Tabs,
  TabList,
  Tab,
  TabPanel
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { Brand } from '~/common/app.config';
import { AuthButton } from '~/common/components/auth/AuthButton';
import { UserAnalytics } from '~/common/components/analytics/UserAnalytics';
import { apiAsyncNode } from '~/common/util/trpc.client';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import HistoryIcon from '@mui/icons-material/History';
import LinearProgress from '@mui/joy/LinearProgress';
import { Sheet, Table } from '@mui/joy';

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

  React.useEffect(() => {
    if (status === 'authenticated') {
      apiAsyncNode.usage.myUsage.query().then(setMyUsage).catch(() => {});
      apiAsyncNode.usage.checkLimit.query().then(setLimitInfo).catch(() => {});
      apiAsyncNode.usage.myMonthlyHistory.query({ months: 6 }).then(setMonthlyHistory).catch(() => {});
      apiAsyncNode.usage.myLogs.query({ limit: 10 }).then(setMyLogs).catch(() => {});
    }
  }, [status]);

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          margin: '0 auto',
          pt: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            variant="plain"
            color="neutral"
            startDecorator={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{ mr: 2, color: 'white' }}
          >
            Back
          </Button>
          <Typography level="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
            Profile
          </Typography>
        </Box>

        {/* Profile Card with Tabs */}
        <Card
          sx={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Profile Header */}
            <Box sx={{ p: 4, pb: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {session?.user?.image ? (
                  <Avatar
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    sx={{ width: 80, height: 80, mr: 3 }}
                  />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, mr: 3 }}>
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                )}
                <Box>
                  <Typography level="h2" fontWeight="bold">
                    {session?.user?.name || 'User'}
                  </Typography>
                  <Typography level="body-md" color="neutral">
                    {session?.user?.email}
                  </Typography>
                  <Chip
                    variant="soft"
                    color="success"
                    size="sm"
                    sx={{ mt: 1 }}
                  >
                    Active Account
                  </Chip>
                </Box>
              </Box>
            </Box>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue as number)}>
              <TabList sx={{ px: 4 }}>
                <Tab>
                  <AccountCircleIcon sx={{ mr: 1 }} />
                  Account Info
                </Tab>
                <Tab>
                  <AnalyticsIcon sx={{ mr: 1 }} />
                  Analytics & Usage
                </Tab>
              </TabList>

              {/* Account Information Tab */}
              <TabPanel value={0} sx={{ p: 4 }}>
                <Typography level="h3" sx={{ mb: 3 }}>
                  Account Information
                </Typography>

                <List>
                  <ListItem>
                    <ListItemDecorator>
                      <PersonIcon />
                    </ListItemDecorator>
                    <Box>
                      <Typography level="body-sm" color="neutral">
                        Name
                      </Typography>
                      <Typography level="body-md">
                        {session?.user?.name || 'Not provided'}
                      </Typography>
                    </Box>
                  </ListItem>

                  <ListItem>
                    <ListItemDecorator>
                      <EmailIcon />
                    </ListItemDecorator>
                    <Box>
                      <Typography level="body-sm" color="neutral">
                        Email
                      </Typography>
                      <Typography level="body-md">
                        {session?.user?.email || 'Not provided'}
                      </Typography>
                    </Box>
                  </ListItem>

                  {/* <ListItem>
                    <ListItemDecorator>
                      <CalendarTodayIcon />
                    </ListItemDecorator>
                    <Box>
                      <Typography level="body-sm" color="neutral">
                        Member Since
                      </Typography>
                      <Typography level="body-md">
                        {formatDate(session?.user?.id)}
                      </Typography>
                    </Box>
                  </ListItem> */}
                </List>

                <Divider sx={{ my: 3 }} />

                {/* Token Credits */}
                <Typography level="h3" sx={{ mb: 2 }}>
                  Token Credits
                </Typography>
                {myUsage ? (() => {
                  const limit = myUsage.tokenLimit;
                  const used = myUsage.thisMonth._sum.totalTokens ?? 0;
                  const remaining = limit ? Math.max(0, limit - used) : null;
                  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
                  return (
                    <Card variant='soft' color={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <DataUsageIcon />
                          <Typography level='title-md'>
                            {remaining != null ? remaining.toLocaleString() + ' tokens remaining' : 'Unlimited tokens'}
                          </Typography>
                        </Box>
                        {limit ? (
                          <>
                            <LinearProgress
                              determinate
                              value={pct}
                              color={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success'}
                              sx={{ my: 1, height: 10, borderRadius: 5 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography level='body-xs'>{used.toLocaleString()} used</Typography>
                              <Typography level='body-xs'>{limit.toLocaleString()} limit / month</Typography>
                            </Box>
                          </>
                        ) : (
                          <Typography level='body-sm'>No monthly token limit set on your account.</Typography>
                        )}
                        <Typography level='body-xs' sx={{ mt: 1 }}>
                          {myUsage.thisMonth._count} requests this month - resets on the 1st of each month
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })() : (
                  <CircularProgress size='sm' />
                )}

                {/* Monthly History */}
                {monthlyHistory && monthlyHistory.length > 0 && (
                  <>
                    <Typography level='h4' sx={{ mt: 3, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon /> Monthly Usage History
                    </Typography>
                    <Sheet variant='outlined' sx={{ borderRadius: 'sm', overflow: 'auto', mb: 2 }}>
                      <Table size='sm' stickyHeader>
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th style={{ textAlign: 'right' }}>Tokens Used</th>
                            <th style={{ textAlign: 'right' }}>Input</th>
                            <th style={{ textAlign: 'right' }}>Output</th>
                            <th style={{ textAlign: 'right' }}>Cost</th>
                            <th style={{ textAlign: 'right' }}>Requests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyHistory.map((m, i) => (
                            <tr key={m.month} style={i === 0 ? { fontWeight: 'bold' } : undefined}>
                              <td>{m.month}{i === 0 ? ' (current)' : ''}</td>
                              <td style={{ textAlign: 'right' }}>{m.totalTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>{m.inputTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>{m.outputTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>{'$' + (m.costCents / 100 < 0.01 && m.costCents > 0 ? (m.costCents / 100).toFixed(4) : (m.costCents / 100).toFixed(2))}</td>
                              <td style={{ textAlign: 'right' }}>{m.requests}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Sheet>
                  </>
                )}

                {/* Recent Deductions */}
                {myLogs && myLogs.length > 0 && (
                  <>
                    <Typography level='h4' sx={{ mt: 3, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DataUsageIcon /> Recent Token Deductions
                    </Typography>
                    <Sheet variant='outlined' sx={{ borderRadius: 'sm', overflow: 'auto', maxHeight: 350, mb: 2 }}>
                      <Table size='sm' stickyHeader>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Model</th>
                            <th style={{ textAlign: 'right' }}>Input</th>
                            <th style={{ textAlign: 'right' }}>Output</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'right' }}>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myLogs.map(log => (
                            <tr key={log.id}>
                              <td>{new Date(log.createdAt).toLocaleString()}</td>
                              <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.modelId}</td>
                              <td style={{ textAlign: 'right' }}>{log.inputTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>{log.outputTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>{log.totalTokens.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>{'$' + (log.costCents / 100).toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Sheet>
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Actions */}
                <Typography level="h3" sx={{ mb: 2 }}>
                  Account Actions
                </Typography>

                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    color="neutral"
                    startDecorator={<SecurityIcon />}
                    onClick={() => router.push('/auth/signin?forgot=true')}
                  >
                    Reset Password
                  </Button>

                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <AuthButton variant="text" size="lg" />
                  </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* App Information */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography level="body-sm" color="neutral">
                    You&apos;re using {Brand.Title.Base}
                  </Typography>
                  <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>
                    Enjoy your AI-powered conversations!
                  </Typography>
                </Box>
              </TabPanel>

              {/* Analytics Tab */}
              <TabPanel value={1} sx={{ p: 4 }}>
                <UserAnalytics userId={session?.user?.id} />
              </TabPanel>
            </Tabs>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 