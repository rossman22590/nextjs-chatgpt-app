import * as React from 'react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
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
  Link,
  Divider,
  CircularProgress
} from '@mui/joy';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/joy/IconButton';

import { Brand } from '~/common/app.config';
import { useAppStateStore } from '~/common/state/store-appstate';

// Check if signup is disabled via environment variable
const isSignupDisabled = process.env.DISABLE_SIGNUP === 'true';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResetLoading, setIsResetLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [showResetForm, setShowResetForm] = React.useState(false);
  const { callbackUrl } = router.query;

  // Redirect if already authenticated
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl ? String(callbackUrl) : '/');
    }
  }, [status, router, callbackUrl]);

  // Show registration success message
  React.useEffect(() => {
    if (router.query.registered === 'true') {
      setSuccessMessage('Account created. An admin must activate it and add credits before chat is available.');
    }
    if (router.query.reset === 'true') {
      setSuccessMessage('Password reset email sent! Check your inbox.');
    }
    if (router.query.reset === 'success') {
      setSuccessMessage('Password updated successfully! Please sign in with your new password.');
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        setSuccessMessage('Sign in successful! Redirecting...');
        setTimeout(() => {
          router.push(callbackUrl ? String(callbackUrl) : '/');
        }, 1000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn('google', {
        callbackUrl: callbackUrl ? String(callbackUrl) : '/',
      });
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setIsResetLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccessMessage('Password reset email sent! Check your inbox.');
        setShowResetForm(false);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsResetLoading(false);
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

  // Don&apos;t render if already authenticated (will redirect)
  if (status === 'authenticated') {
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
              Welcome back
            </Typography>
            <Typography level="body-sm" color="neutral" textAlign="center">
              Sign in to your {Brand.Title.Base} account
            </Typography>
          </Box>

          {error && (
            <Alert color="danger" variant="soft" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert color="success" variant="soft" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {/* Google Sign In Button */}
          <Button
            variant="outlined"
            color="neutral"
            size="lg"
            startDecorator={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            sx={{
              width: '100%',
              borderRadius: 'md',
              py: 1.5,
              mb: 3,
            }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 3 }}>or</Divider>

          {!showResetForm ? (
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    sx={{ fontSize: 'sm' }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  size="lg"
                  variant="solid"
                  color="primary"
                  sx={{ borderRadius: 'md', py: 1.5 }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset}>
              <Stack spacing={3}>
                <Box>
                  <Typography level="title-md" sx={{ mb: 1 }}>
                    Reset Your Password
                  </Typography>
                  <Typography level="body-sm" color="neutral">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </Typography>
                </Box>

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

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="neutral"
                    size="lg"
                    onClick={() => setShowResetForm(false)}
                    sx={{ flex: 1 }}
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetLoading}
                    loading={isResetLoading}
                    size="lg"
                    variant="solid"
                    color="primary"
                    sx={{ flex: 1 }}
                  >
                    {isResetLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}

          {!isSignupDisabled && (
            <>
              <Divider sx={{ my: 4 }}>or</Divider>
              <Box sx={{ textAlign: 'center' }}>
                <Typography level="body-sm" color="neutral">
                  Don&apos;t have an account?{' '}
                  <Link
                    component="button"
                    onClick={() => router.push('/auth/signup')}
                    fontWeight="md"
                  >
                    Sign up for free
                  </Link>
                </Typography>
              </Box>
            </>
          )}

          {isSignupDisabled && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography level="body-sm" color="neutral">
                Registration is currently disabled. Please contact an administrator for access.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
