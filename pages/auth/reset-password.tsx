import * as React from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  FormControl, 
  FormLabel, 
  Input, 
  Stack, 
  Typography,
  Alert,
  Link
} from '@mui/joy';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/joy/IconButton';

import { Brand } from '~/common/app.config';
import { AuthLightSurface } from '~/common/components/auth/AuthLightSurface';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const { token } = router.query;

  React.useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const validateForm = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin?reset=success');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2,
        }}
      >
        <AuthLightSurface sx={{ width: '90%', maxWidth: '420px' }}>
          <Card
            sx={{
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(16px)',
              background: 'rgba(255, 255, 255, 0.95)',
            }}
          >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%)',
                  mb: 2,
                }}
              >
                <LockResetIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>

              <Typography level="h2" component="h1" fontWeight="bold" color="success">
                Password Reset Successful!
              </Typography>
              <Typography level="body-sm" color="neutral" textAlign="center">
                Your password has been updated. Redirecting to sign in...
              </Typography>
            </Box>
          </CardContent>
        </Card>
        </AuthLightSurface>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <AuthLightSurface sx={{ width: '90%', maxWidth: '420px' }}>
        <Card
          sx={{
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                mb: 2,
              }}
            >
              <LockResetIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>

            <Typography level="h2" component="h1" fontWeight="bold">
              Reset Your Password
            </Typography>
            <Typography level="body-sm" color="neutral" textAlign="center">
              Enter your new password for {Brand.Title.Base}
            </Typography>
          </Box>

          {error && (
            <Alert color="danger" variant="soft" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <FormControl required>
                <FormLabel>New Password</FormLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  size="lg"
                  sx={{ borderRadius: 'md' }}
                  endDecorator={
                    <IconButton
                      variant="plain"
                      color="neutral"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  }
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  size="lg"
                  sx={{ borderRadius: 'md' }}
                  endDecorator={
                    <IconButton
                      variant="plain"
                      color="neutral"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  }
                />
              </FormControl>

              <Button
                type="submit"
                disabled={isLoading || !token}
                loading={isLoading}
                size="lg"
                variant="solid"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 'md',
                  py: 1.5,
                }}
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography level="body-sm" color="neutral">
              Remember your password?{' '}
              <Link
                component="button"
                onClick={() => router.push('/auth/signin')}
                fontWeight="md"
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
      </AuthLightSurface>
    </Box>
  );
} 