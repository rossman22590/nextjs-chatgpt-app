import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemDecorator,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/joy';
import ChatIcon from '@mui/icons-material/Chat';
import TokenIcon from '@mui/icons-material/Token';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MessageIcon from '@mui/icons-material/Message';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import { apiAsyncNode } from '~/common/util/trpc.client';
import { prettyShortChatModelName } from '~/common/util/dMessageUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

interface UserAnalyticsProps {
  userId?: string;
}

interface AnalyticsData {
  totals: {
    conversations: number;
    messages: number;
    actualCost: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    cacheRead: number;
    cacheSavings: number;
    userMessages: number;
    assistantMessages: number;
  };
  insights: {
    modelUsage: Array<{
      model: string;
      prettyName: string;
      count: number;
      cost: number;
      tokens: number;
    }>;
    topConversations: Array<{
      id: string;
      title: string;
      messageCount: number;
      userMessages: number;
      assistantMessages: number;
      cost: number;
      tokens: number;
      created: Date;
      updated: Date;
    }>;
    hourlyActivity: Array<{
      hour: number;
      conversations: number;
      cost: number;
    }>;
    weeklyActivity: Array<{
      day: string;
      conversations: number;
      cost: number;
      tokens: number;
    }>;
    modelEfficiency: Array<{
      model: string;
      prettyName: string;
      costPerToken: number;
      tokensPerUse: number;
      count: number;
      cost: number;
      tokens: number;
    }>;
    usagePatterns: {
      shortConversations: number;
      mediumConversations: number;
      longConversations: number;
    };
    costDistribution: {
      free: number;
      cheap: number;
      moderate: number;
      expensive: number;
    };
    averages: {
      messagesPerConv: number;
      tokensPerMessage: number;
      costPerConv: number;
    };
    monthlyTrends: Array<{
      month: string;
      conversations: number;
      cost: number;
      tokens: number;
    }>;
  };
  activity: {
    recent: Array<{
      date: string;
      conversations: number;
      messages: number;
      tokens: number;
      cost: number;
    }>;
    recent7Days: number;
    recent30Days: number;
  };
}

export const UserAnalytics: React.FC<UserAnalyticsProps> = ({ userId }) => {
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
      try {
        setLoading(true);
        const conversations = await apiAsyncNode.trade.getUserConversations.query({});
        
        if (!conversations || conversations.length === 0) {
          setAnalytics({
            totals: { 
              conversations: 0, 
              messages: 0, 
              actualCost: 0, 
              tokens: 0,
              inputTokens: 0,
              outputTokens: 0,
              cacheRead: 0,
              cacheSavings: 0,
              userMessages: 0,
              assistantMessages: 0
            },
            insights: { 
              modelUsage: [],
              topConversations: [],
              hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({ hour, conversations: 0, cost: 0 })),
              weeklyActivity: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({ day, conversations: 0, cost: 0, tokens: 0 })),
              modelEfficiency: [],
              usagePatterns: { shortConversations: 0, mediumConversations: 0, longConversations: 0 },
              costDistribution: { free: 0, cheap: 0, moderate: 0, expensive: 0 },
              averages: { messagesPerConv: 0, tokensPerMessage: 0, costPerConv: 0 },
              monthlyTrends: []
            },
            activity: {
              recent: Array.from({ length: 7 }, (_, i) => {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                return {
                  date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                  conversations: 0,
                  messages: 0,
                  tokens: 0,
                  cost: 0
                };
              }).reverse(),
              recent7Days: 0,
              recent30Days: 0
            }
          });
          return;
        }

        // Calculate comprehensive analytics from database data
        let totalCost = 0;
        let totalMessages = 0;
        let totalTokens = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCacheRead = 0;
        let totalCacheSavings = 0;
        let userMessages = 0;
        let assistantMessages = 0;
        
        const modelUsage: { [key: string]: { count: number; cost: number; tokens: number } } = {};
        const conversationAnalytics: any[] = [];
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        conversations.forEach((conv: any) => {
          let convCost = 0;
          let convTokens = 0;
          const convUserMessages = conv.messages.filter((msg: any) => msg.role === 'USER').length;
          const convAssistantMessages = conv.messages.filter((msg: any) => msg.role === 'ASSISTANT').length;
          
          totalMessages += conv.messages.length;
          userMessages += convUserMessages;
          assistantMessages += convAssistantMessages;
          
          conv.messages.forEach((msg: any) => {
            if (msg.role === 'ASSISTANT' && msg.generator) {
              // Extract real cost data - include both computed ($c) and provider-reported ($cReported) costs
              const m = msg.generator.metrics;
              const computedCostCents = m?.$c || 0;
              const reportedCostCents = m?.$cReported || 0;
              // Use the higher of computed vs reported, don't double-count
              const cost = Math.max(computedCostCents, reportedCostCents) / 100;
              totalCost += cost;
              convCost += cost;
              
              // Extract detailed token data
              const inputTokens = (m?.TIn || 0) + 
                                (m?.TCacheRead || 0) + 
                                (m?.TCacheWrite || 0);
              const outputTokens = m?.TOut || 0;
              const cacheRead = m?.TCacheRead || 0;
              const cacheSavings = m?.$cdCache ? m.$cdCache / 100 : 0;
              
              totalInputTokens += inputTokens;
              totalOutputTokens += outputTokens;
              totalCacheRead += cacheRead;
              totalCacheSavings += cacheSavings;
              
              const messageTokens = inputTokens + outputTokens;
              totalTokens += messageTokens;
              convTokens += messageTokens;
              
              // Extract model name
              const modelName = msg.generator.name || 'Unknown';
              if (!modelUsage[modelName]) {
                modelUsage[modelName] = { count: 0, cost: 0, tokens: 0 };
              }
              modelUsage[modelName].count += 1;
              modelUsage[modelName].cost += cost;
              modelUsage[modelName].tokens += messageTokens;
            }
          });

          // Store conversation analytics
          conversationAnalytics.push({
            id: conv.id,
            title: conv.title || conv.autoTitle || 'Untitled Chat',
            messageCount: conv.messages.length,
            userMessages: convUserMessages,
            assistantMessages: convAssistantMessages,
            cost: convCost,
            tokens: convTokens,
            created: new Date(conv.created),
            updated: new Date(conv.updated)
          });
        });

        // Convert model usage to sorted array
        const topModels = Object.entries(modelUsage)
          .map(([model, data]) => ({
            model,
            prettyName: prettyShortChatModelName(model),
            ...data
          }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 5);

        // Top conversations by activity
        const topConversations = conversationAnalytics
          .sort((a, b) => b.messageCount - a.messageCount)
          .slice(0, 5);

        // Recent activity (last 7 days)
        const recentActivity = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dayConversations = conversationAnalytics.filter(conv => 
            conv.updated.toDateString() === date.toDateString()
          );

          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            conversations: dayConversations.length,
            messages: dayConversations.reduce((sum, conv) => sum + conv.messageCount, 0),
            tokens: dayConversations.reduce((sum, conv) => sum + conv.tokens, 0),
            cost: dayConversations.reduce((sum, conv) => sum + conv.cost, 0),
          };
        }).reverse();

        // Calculate averages
        const avgMessagesPerConv = conversations.length > 0 ? totalMessages / conversations.length : 0;
        const avgTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0;
        const avgCostPerConv = conversations.length > 0 ? totalCost / conversations.length : 0;

        // Recent activity stats
        const recentConversations = conversationAnalytics.filter(conv => conv.updated > sevenDaysAgo);
        const monthlyConversations = conversationAnalytics.filter(conv => conv.updated > thirtyDaysAgo);

        // Advanced analytics
        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
          const hourConversations = conversationAnalytics.filter(conv => 
            conv.updated.getHours() === hour
          );
          return {
            hour,
            conversations: hourConversations.length,
            cost: hourConversations.reduce((sum, conv) => sum + conv.cost, 0),
          };
        });

        // Day of week activity
        const weeklyActivity = Array.from({ length: 7 }, (_, day) => {
          const dayConversations = conversationAnalytics.filter(conv => 
            conv.updated.getDay() === day
          );
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return {
            day: dayNames[day],
            conversations: dayConversations.length,
            cost: dayConversations.reduce((sum, conv) => sum + conv.cost, 0),
            tokens: dayConversations.reduce((sum, conv) => sum + conv.tokens, 0),
          };
        });

        // Model efficiency metrics
        const modelEfficiency = Object.entries(modelUsage).map(([model, data]) => ({
          model,
          prettyName: prettyShortChatModelName(model),
          costPerToken: data.tokens > 0 ? data.cost / data.tokens : 0,
          tokensPerUse: data.count > 0 ? data.tokens / data.count : 0,
          ...data
        })).sort((a, b) => a.costPerToken - b.costPerToken);

        // Usage patterns
        const shortConversations = conversationAnalytics.filter(conv => conv.messageCount <= 5).length;
        const mediumConversations = conversationAnalytics.filter(conv => conv.messageCount > 5 && conv.messageCount <= 20).length;
        const longConversations = conversationAnalytics.filter(conv => conv.messageCount > 20).length;

        // Cost distribution
        const freeConversations = conversationAnalytics.filter(conv => conv.cost === 0).length;
        const cheapConversations = conversationAnalytics.filter(conv => conv.cost > 0 && conv.cost <= 0.10).length;
        const moderateConversations = conversationAnalytics.filter(conv => conv.cost > 0.10 && conv.cost <= 1.00).length;
        const expensiveConversations = conversationAnalytics.filter(conv => conv.cost > 1.00).length;

        // Monthly trends (last 6 months)
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthConversations = conversationAnalytics.filter(conv => 
            conv.updated.getMonth() === date.getMonth() && 
            conv.updated.getFullYear() === date.getFullYear()
          );
          
          return {
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            conversations: monthConversations.length,
            cost: monthConversations.reduce((sum, conv) => sum + conv.cost, 0),
            tokens: monthConversations.reduce((sum, conv) => sum + conv.tokens, 0),
          };
        }).reverse();

        const analyticsData: AnalyticsData = {
          totals: {
            conversations: conversations.length,
            messages: totalMessages,
            actualCost: totalCost,
            tokens: totalTokens,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            cacheRead: totalCacheRead,
            cacheSavings: totalCacheSavings,
            userMessages,
            assistantMessages
          },
          insights: {
            modelUsage: topModels,
            topConversations,
            hourlyActivity,
            weeklyActivity,
            modelEfficiency,
            usagePatterns: {
              shortConversations,
              mediumConversations,
              longConversations
            },
            costDistribution: {
              free: freeConversations,
              cheap: cheapConversations,
              moderate: moderateConversations,
              expensive: expensiveConversations
            },
            averages: {
              messagesPerConv: avgMessagesPerConv,
              tokensPerMessage: avgTokensPerMessage,
              costPerConv: avgCostPerConv
            },
            monthlyTrends
          },
          activity: {
            recent: recentActivity,
            recent7Days: recentConversations.length,
            recent30Days: monthlyConversations.length
          }
        };

        setAnalytics(analyticsData);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
  }, [userId]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = React.useCallback(() => {
    setError(null);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert color="danger" sx={{ mb: 2 }}>
        <Typography level="body-sm">
          Error loading analytics: {error}
        </Typography>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert color="neutral" sx={{ mb: 2 }}>
        <Typography level="body-sm">
          No analytics data available
        </Typography>
      </Alert>
    );
  }

  const theme = useTheme();
  const p = theme.palette as { primary?: { [k: string]: string }; success?: { [k: string]: string }; danger?: { [k: string]: string } };
  const chartPrimary = p.primary?.[500] ?? p.primary?.solidBg ?? '#a020f0';
  const chartSuccess = p.success?.[500] ?? (p.success as { solidBg?: string })?.solidBg ?? '#22c55e';
  const chartDanger = p.danger?.[500] ?? (p.danger as { solidBg?: string })?.solidBg ?? '#ef4444';
  const toRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Chart.js configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          color: toRgba(chartPrimary, 0.12),
        },
        title: {
          display: true,
          text: 'Conversations',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: toRgba(chartPrimary, 0.12),
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Chart data (theme-aligned)
  const activityChartData = {
    labels: analytics.activity.recent.map(day => day.date),
    datasets: [
      {
        label: 'Conversations',
        data: analytics.activity.recent.map(day => day.conversations),
        borderColor: chartPrimary,
        backgroundColor: toRgba(chartPrimary, 0.2),
        fill: true,
      },
      {
        label: 'Cost ($)',
        data: analytics.activity.recent.map(day => day.cost),
        borderColor: chartDanger,
        backgroundColor: toRgba(chartDanger, 0.2),
        yAxisID: 'y1',
      },
    ],
  };

  const modelUsagePalette = [
    '#a020f0', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
    '#eab308', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#0ea5e9',
    '#14b8a6', '#22c55e', '#a3e635', '#f59e0b',
  ];
  const modelUsageColors = analytics.insights.modelUsage.map((_, i) => modelUsagePalette[i % modelUsagePalette.length]);
  const modelUsageChartData = {
    labels: analytics.insights.modelUsage.map(model => model.prettyName),
    datasets: [
      {
        data: analytics.insights.modelUsage.map(model => model.cost),
        backgroundColor: modelUsageColors.map(c => toRgba(c, 0.85)),
        borderColor: modelUsageColors,
        borderWidth: 1,
      },
    ],
  };

  const weeklyActivityChartData = {
    labels: analytics.insights.weeklyActivity.map(day => day.day),
    datasets: [
      {
        label: 'Conversations',
        data: analytics.insights.weeklyActivity.map(day => day.conversations),
        backgroundColor: toRgba(chartPrimary, 0.8),
        borderColor: chartPrimary,
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header with refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="body-xs" color="neutral">
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
        </Typography>
        <Button
          variant="outlined"
          color="neutral"
          size="sm"
          startDecorator={<RefreshIcon />}
          loading={loading}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography level="h3" color="primary">
                {analytics.totals.conversations}
              </Typography>
              <Typography level="body-sm" color="neutral">
                Total Conversations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography level="h3" color="success">
                {analytics.totals.messages}
              </Typography>
              <Typography level="body-sm" color="neutral">
                Total Messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TokenIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography level="h3" color="warning">
                {formatNumber(analytics.totals.tokens)}
              </Typography>
              <Typography level="body-sm" color="neutral">
                Total Tokens
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoneyIcon sx={{ fontSize: 32, color: 'danger.main', mb: 1 }} />
              <Typography level="h3" color="danger">
                {formatCost(analytics.totals.actualCost)}
              </Typography>
              <Typography level="body-sm" color="neutral">
                Total Cost (Real Data)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Token Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TokenIcon />
            Token Usage Breakdown (Real Data)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Input Tokens</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {formatNumber(analytics.totals.inputTokens)} ({analytics.totals.tokens > 0 ? ((analytics.totals.inputTokens / analytics.totals.tokens) * 100).toFixed(1) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={analytics.totals.tokens > 0 ? (analytics.totals.inputTokens / analytics.totals.tokens) * 100 : 0}
                    color="primary"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Output Tokens</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {formatNumber(analytics.totals.outputTokens)} ({analytics.totals.tokens > 0 ? ((analytics.totals.outputTokens / analytics.totals.tokens) * 100).toFixed(1) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={analytics.totals.tokens > 0 ? (analytics.totals.outputTokens / analytics.totals.tokens) * 100 : 0}
                    color="success"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Cache Read Tokens</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {formatNumber(analytics.totals.cacheRead)} ({analytics.totals.tokens > 0 ? ((analytics.totals.cacheRead / analytics.totals.tokens) * 100).toFixed(1) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={analytics.totals.tokens > 0 ? (analytics.totals.cacheRead / analytics.totals.tokens) * 100 : 0}
                    color="warning"
                    size="sm"
                  />
                </Box>
              </Stack>
            </Grid>

            <Grid xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'background.level2', 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography level="title-lg" color="success">
                  Cache Savings
                </Typography>
                <Typography level="h2" color="success" sx={{ my: 1 }}>
                  {formatCost(analytics.totals.cacheSavings)}
                </Typography>
                <Typography level="body-sm" color="neutral">
                  Money saved through caching
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 7-Day Activity Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon />
            7-Day Activity Breakdown (Real Data)
          </Typography>
          
          <Box sx={{ height: 300 }}>
            <Line data={activityChartData} options={lineChartOptions} />
          </Box>
          
          {/* Summary Stats */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around',
            p: 2,
            backgroundColor: 'background.level1',
            borderRadius: 2,
            gap: 2,
            mt: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="h4" color="primary">
                {analytics.activity.recent.reduce((sum, day) => sum + day.conversations, 0)}
              </Typography>
              <Typography level="body-xs" color="neutral">
                Total Chats
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="h4" color="success">
                {analytics.activity.recent.reduce((sum, day) => sum + day.messages, 0)}
              </Typography>
              <Typography level="body-xs" color="neutral">
                Total Messages
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="h4" color="warning">
                {formatNumber(analytics.activity.recent.reduce((sum, day) => sum + day.tokens, 0))}
              </Typography>
              <Typography level="body-xs" color="neutral">
                Total Tokens
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="h4" color="danger">
                {formatCost(analytics.activity.recent.reduce((sum, day) => sum + day.cost, 0))}
              </Typography>
              <Typography level="body-xs" color="neutral">
                Total Cost
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon />
                Model Usage by Cost
              </Typography>
              
              <Box sx={{ height: 300 }}>
                {analytics.insights.modelUsage.length > 0 ? (
                  <Doughnut data={modelUsageChartData} options={doughnutOptions} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography level="body-sm" color="neutral">
                      No model usage data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Weekly Activity Pattern
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <Bar data={weeklyActivityChartData} options={barChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Conversations */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            Most Active Conversations (Real Data)
          </Typography>
          
          <List size="sm">
            {analytics.insights.topConversations.map((conv, index) => (
              <ListItem key={conv.id}>
                <ListItemDecorator>
                  <Chip size="sm" variant="soft" color="success">
                    #{index + 1}
                  </Chip>
                </ListItemDecorator>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography level="body-sm" fontWeight="md" noWrap>
                    {conv.title}
                  </Typography>
                  <Typography level="body-xs" color="neutral">
                    {conv.messageCount} messages • {formatNumber(conv.tokens)} tokens • {formatCost(conv.cost)} cost
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>

          {analytics.insights.topConversations.length === 0 && (
            <Typography level="body-sm" color="neutral" sx={{ textAlign: 'center', py: 2 }}>
              No conversation data available yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Hourly Activity Heatmap */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon />
            24-Hour Activity Heatmap (Real Data)
          </Typography>
          
          <Grid container spacing={0.5}>
            {analytics.insights.hourlyActivity.map((hour, index) => {
              const maxActivity = Math.max(...analytics.insights.hourlyActivity.map(h => h.conversations));
              const intensity = maxActivity > 0 ? hour.conversations / maxActivity : 0;
              
              return (
                <Grid key={index} xs={1}>
                  <Tooltip title={`${hour.hour}:00 - ${hour.conversations} conversations, ${formatCost(hour.cost)}`}>
                    <Box sx={{
                      height: 40,
                      backgroundColor: intensity > 0 ? toRgba(chartPrimary, 0.2 + intensity * 0.8) : 'background.level2',
                      borderRadius: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: intensity > 0 ? toRgba(chartPrimary, 0.4 + intensity * 0.6) : 'background.level3',
                      },
                    }}>
                      <Typography 
                        level="body-xs" 
                        sx={{ 
                          color: intensity > 0.3 ? '#ffffff' : 'text.primary'
                        }}
                      >
                        {hour.hour}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
          
          <Typography level="body-xs" color="neutral" sx={{ mt: 1, textAlign: 'center' }}>
            Darker colors indicate higher activity. Hover for details.
          </Typography>
        </CardContent>
      </Card>

      {/* Usage Patterns */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChatIcon />
                Conversation Length Patterns
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Short (1-5 messages)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.usagePatterns.shortConversations}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.usagePatterns.shortConversations / analytics.totals.conversations) * 100}
                    color="success"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Medium (6-20 messages)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.usagePatterns.mediumConversations}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.usagePatterns.mediumConversations / analytics.totals.conversations) * 100}
                    color="warning"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Long (20+ messages)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.usagePatterns.longConversations}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.usagePatterns.longConversations / analytics.totals.conversations) * 100}
                    color="danger"
                    size="sm"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon />
                Cost Distribution Analysis
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Free (0¢)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.costDistribution.free}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.costDistribution.free / analytics.totals.conversations) * 100}
                    color="success"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Cheap (1¢-10¢)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.costDistribution.cheap}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.costDistribution.cheap / analytics.totals.conversations) * 100}
                    color="primary"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Moderate (10¢-$1)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.costDistribution.moderate}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.costDistribution.moderate / analytics.totals.conversations) * 100}
                    color="warning"
                    size="sm"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography level="body-sm">Expensive ($1+)</Typography>
                    <Typography level="body-sm" fontWeight="md">
                      {analytics.insights.costDistribution.expensive}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    determinate 
                    value={(analytics.insights.costDistribution.expensive / analytics.totals.conversations) * 100}
                    color="danger"
                    size="sm"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Metrics */}
      <Card>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon />
            Advanced Usage Metrics (Real Data)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, backgroundColor: 'background.level2', borderRadius: 1 }}>
                <Typography level="title-sm" color="primary">Cache Hit Rate</Typography>
                <Typography level="h4" color="primary">
                  {analytics.totals.tokens > 0 ? 
                    ((analytics.totals.cacheRead / analytics.totals.tokens) * 100).toFixed(1) : 0}%
                </Typography>
                <Typography level="body-xs" color="neutral">
                  {formatNumber(analytics.totals.cacheRead)} cached tokens
                </Typography>
              </Box>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, backgroundColor: 'background.level2', borderRadius: 1 }}>
                <Typography level="title-sm" color="success">Input/Output Ratio</Typography>
                <Typography level="h4" color="success">
                  {analytics.totals.outputTokens > 0 ? 
                    (analytics.totals.inputTokens / analytics.totals.outputTokens).toFixed(1) : 0}:1
                </Typography>
                <Typography level="body-xs" color="neutral">
                  input to output tokens
                </Typography>
              </Box>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, backgroundColor: 'background.level2', borderRadius: 1 }}>
                <Typography level="title-sm" color="warning">Peak Hour</Typography>
                <Typography level="h4" color="warning">
                  {analytics.insights.hourlyActivity.reduce((max, hour) => 
                    hour.conversations > max.conversations ? hour : max, { hour: 0, conversations: 0 }
                  ).hour}:00
                </Typography>
                <Typography level="body-xs" color="neutral">
                  most active time
                </Typography>
              </Box>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, backgroundColor: 'background.level2', borderRadius: 1 }}>
                <Typography level="title-sm" color="danger">Longest Chat</Typography>
                <Typography level="h4" color="danger">
                  {Math.max(...analytics.insights.topConversations.map(c => c.messageCount), 0)}
                </Typography>
                <Typography level="body-xs" color="neutral">
                  messages in one conversation
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}; 