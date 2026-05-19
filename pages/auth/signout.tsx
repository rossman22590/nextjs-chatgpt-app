import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Card, CardContent, Avatar, CircularProgress } from '@mui/joy';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

import { AuthLightSurface } from '~/common/components/auth/AuthLightSurface';

export default function SignOut() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Auto-redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const handleCancel = () => {
    router.push('/');
  };

  // Show loading spinner if checking authentication
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.body' }}>
        <CircularProgress size="lg" />
      </Box>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.body', p: 2 }}>
      <AuthLightSurface sx={{ maxWidth: 420, width: '100%' }}>
        <Card variant="outlined" sx={{ width: '100%', boxShadow: 'sm', bgcolor: 'background.popup', borderRadius: 'lg', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', bgcolor: 'danger.solidBg', color: 'danger.solidColor', mb: 2 }}>
              <LogoutIcon sx={{ fontSize: 32 }} />
            </Box>

            <Typography level="h2" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
              Sign Out
            </Typography>

            {session?.user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {session.user.image ? (
                  <Avatar
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    size="sm"
                  />
                ) : (
                  <Avatar size="sm">
                    <PersonIcon />
                  </Avatar>
                )}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography level="body-sm" fontWeight="lg">
                    {session.user.name || 'User'}
                  </Typography>
                  <Typography level="body-xs" color="neutral">
                    {session.user.email}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          
          <Typography level="body-md" sx={{ mb: 4, color: 'text.secondary' }}>
            Are you sure you want to sign out of your account?
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="solid" color="danger" onClick={handleSignOut} startDecorator={<LogoutIcon />} sx={{ minWidth: 120 }}>
              Sign Out
            </Button>
            
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleCancel}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
          </Box>
        </CardContent>
        </Card>
      </AuthLightSurface>
    </Box>
  );
} 