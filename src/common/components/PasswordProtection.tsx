import * as React from 'react';
import Image from 'next/image';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Input,
  Typography,
  Alert,
  IconButton,
} from '@mui/joy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { Brand } from '~/common/app.config';

interface PasswordProtectionProps {
  onUnlock: () => void;
}

export const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onUnlock }) => {
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store in local storage that password was verified (persists across browser sessions)
        localStorage.setItem('app-unlocked', 'true');
        onUnlock();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.body',
        zIndex: 9999,
        p: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          width: '90%',
          maxWidth: '400px',
          boxShadow: 'lg',
          borderRadius: 'lg',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image
              src="/apple-touch-icon.png"
              alt={Brand.Title.Base}
              width={56}
              height={56}
              priority
              style={{ borderRadius: 12 }}
            />
          </Box>

          <Typography level="h2" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
            Protected Access
          </Typography>
          
          <Typography level="body-sm" color="neutral" sx={{ mb: 4 }}>
            Enter the password to access {Brand.Title.Base}
          </Typography>

          {error && (
            <Alert color="danger" variant="soft" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl required sx={{ mb: 3 }}>
              <FormLabel>Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="lg"
                sx={{ borderRadius: 'md' }}
                endDecorator={
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    variant="plain"
                    color="neutral"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                }
              />
            </FormControl>

            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              loading={isLoading}
              size="lg"
              variant="solid"
              color="primary"
              fullWidth
              sx={{
                borderRadius: 'md',
                py: 1.5,
                '&.Mui-disabled': { color: 'white' },
              }}
            >
              {isLoading ? 'Verifying...' : 'Unlock App'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}; 