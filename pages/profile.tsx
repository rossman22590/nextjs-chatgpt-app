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

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState(0);

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