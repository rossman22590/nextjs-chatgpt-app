import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
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
  Link,
  Divider,
  CircularProgress
} from '@mui/joy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/joy/IconButton';

import { Brand } from '~/common/app.config';
import { useAppStateStore } from '~/common/state/store-appstate';

// Check if signup is disabled via environment variable
const isSignupDisabled = process.env.DISABLE_SIGNUP === 'true';

export default function SignUp() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Redirect to signin if signup is disabled
  React.useEffect(() => {
    if (isSignupDisabled) {
      router.push('/auth/signin');
    }
  }, [router]);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // Redirect to sign-in page on success
      router.push('/auth/signin?registered=true');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Don't render if already authenticated (will redirect) or if signup is disabled
  if (status === 'authenticated' || isSignupDisabled) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.body',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '90%',
          maxWidth: '420px',
          boxShadow: 'sm',
          bgcolor: 'background.popup',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Image src="/apple-touch-icon.png" alt={Brand.Title.Base} width={56} height={56} style={{ marginBottom: 8 }} />

            <Typography level="h2" component="h1" fontWeight="bold">
              Create your account
            </Typography>
            <Typography level="body-sm" color="neutral" textAlign="center">
              Join {Brand.Title.Base} and start your AI journey
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
                <FormLabel>Full Name</FormLabel>
                <Input
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  size="lg"
                  sx={{ borderRadius: 'md' }}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  size="lg"
                  sx={{ borderRadius: 'md' }}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Password</FormLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min 6 characters)"
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
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
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
                disabled={isLoading}
                loading={isLoading}
                size="lg"
                variant="solid"
                color="primary"
                sx={{ borderRadius: 'md', py: 1.5 }}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 4 }}>or</Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography level="body-sm" color="neutral">
              Already have an account?{' '}
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
    </Box>
  );
}
