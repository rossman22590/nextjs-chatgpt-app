import { useRouter } from 'next/router';
import { Box, Typography, Button, Alert } from '@mui/joy';
import { Warning } from '@mui/icons-material';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An unexpected error occurred. Please try again.',
};

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;
  
  const errorMessage = errorMessages[error as string] || errorMessages.Default;

  const handleRetry = () => {
    router.push('/auth/signin');
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #1e1e2f, #2d2d44)',
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 500,
          width: '100%',
          p: 4,
          bgcolor: 'background.surface',
          borderRadius: 'lg',
          boxShadow: 'lg',
          textAlign: 'center',
        }}
      >
        <Warning 
          sx={{ 
            fontSize: 60, 
            color: 'warning.main', 
            mb: 2 
          }} 
        />
        
        <Typography level="h2" sx={{ mb: 2 }}>
          Authentication Error
        </Typography>
        
        <Alert 
          color="warning" 
          variant="soft"
          sx={{ mb: 4, textAlign: 'left' }}
        >
          <Typography level="body-md">
            {errorMessage}
          </Typography>
          {error && (
            <Typography level="body-xs" sx={{ mt: 1, opacity: 0.7 }}>
              Error code: {error}
            </Typography>
          )}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="solid"
            color="primary"
            onClick={handleRetry}
            sx={{ minWidth: 120 }}
          >
            Try Again
          </Button>
          
          <Button
            variant="outlined"
            color="neutral"
            onClick={handleHome}
            sx={{ minWidth: 120 }}
          >
            Go Home
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 