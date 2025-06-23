import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button, Dropdown, Menu, MenuButton, MenuItem, ListItemDecorator, Avatar, Box, Typography } from '@mui/joy';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

interface AuthButtonProps {
  variant?: 'icon' | 'text' | 'full';
  size?: 'sm' | 'md' | 'lg';
  sx?: any;
  showAvatar?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  variant = 'text', 
  size = 'md', 
  sx,
  showAvatar = false 
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  // Loading state
  if (isLoading) {
    return (
      <Button
        variant="plain"
        disabled
        size={size}
        sx={sx}
      >
        Loading...
      </Button>
    );
  }

  // Authenticated state - show user menu
  if (isAuthenticated && session?.user) {
    if (variant === 'icon') {
      return (
        <Dropdown>
          <MenuButton
            slots={{ root: Button }}
            slotProps={{
              root: {
                variant: 'plain',
                color: 'neutral',
                size,
                sx: {
                  borderRadius: '50%',
                  minWidth: 'auto',
                  aspectRatio: '1',
                  ...sx,
                },
              },
            }}
          >
            {showAvatar && session.user.image ? (
              <Avatar
                src={session.user.image}
                alt={session.user.name || 'User'}
                size="sm"
              />
            ) : (
              <PersonIcon />
            )}
          </MenuButton>
          <Menu placement="bottom-end">
            <MenuItem onClick={handleProfile}>
              <ListItemDecorator><PersonIcon /></ListItemDecorator>
              Profile
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <ListItemDecorator><LogoutIcon /></ListItemDecorator>
              Sign Out
            </MenuItem>
          </Menu>
        </Dropdown>
      );
    }

    if (variant === 'full') {
      return (
        <Dropdown>
          <MenuButton
            slots={{ root: Button }}
            slotProps={{
              root: {
                variant: 'plain',
                color: 'neutral',
                size,
                sx: {
                  gap: 1,
                  ...sx,
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showAvatar && session.user.image ? (
                <Avatar
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  size="sm"
                />
              ) : (
                <PersonIcon />
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
          </MenuButton>
          <Menu placement="bottom-end">
            <MenuItem onClick={handleProfile}>
              <ListItemDecorator><PersonIcon /></ListItemDecorator>
              Profile
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <ListItemDecorator><LogoutIcon /></ListItemDecorator>
              Sign Out
            </MenuItem>
          </Menu>
        </Dropdown>
      );
    }

    // Default text variant for authenticated users
    return (
      <Button
        variant="plain"
        color="neutral"
        size={size}
        onClick={handleSignOut}
        sx={{
          flexDirection: 'column',
          gap: 0.75,
          ...sx,
        }}
      >
        <LogoutIcon />
        <Box component='span'>
          Sign Out
        </Box>
      </Button>
    );
  }

  // Unauthenticated state - show sign in button
  if (variant === 'icon') {
    return (
      <Button
        variant="plain"
        color="primary"
        size={size}
        onClick={handleSignIn}
        sx={{
          borderRadius: '50%',
          minWidth: 'auto',
          aspectRatio: '1',
          ...sx,
        }}
      >
        <LoginIcon />
      </Button>
    );
  }

  return (
    <Button
      variant="plain"
      color="primary"
      size={size}
      onClick={handleSignIn}
      sx={{
        flexDirection: 'column',
        gap: 0.75,
        ...sx,
      }}
    >
      <LoginIcon />
      <Box component='span'>
        Sign In
      </Box>
    </Button>
  );
}; 