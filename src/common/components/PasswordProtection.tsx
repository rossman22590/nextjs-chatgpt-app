import * as React from 'react';
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
import LockIcon from '@mui/icons-material/Lock';
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
        // Store in cookie that password was verified (expires in 24 hours)
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
        document.cookie = `app-unlocked=true; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;
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
        background: 'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%)',
        zIndex: 9999,
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(16px)',
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              mx: 'auto',
              mb: 3,
            }}
          >
            <LockIcon sx={{ fontSize: 32, color: 'white' }} />
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
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 'md',
                py: 1.5,
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