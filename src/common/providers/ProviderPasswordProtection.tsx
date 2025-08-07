import * as React from 'react';
import { PasswordProtection } from '~/common/components/PasswordProtection';

interface PasswordProtectionProviderProps {
  children: React.ReactNode;
}

export const ProviderPasswordProtection: React.FC<PasswordProtectionProviderProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = React.useState(true);

  // Check if password protection is enabled and if already unlocked
  React.useEffect(() => {
    const checkPasswordRequired = async () => {
      try {
        console.log('Checking password protection...');
        
        // Check if already unlocked (persistent across browser sessions)
        const persistentUnlocked = localStorage.getItem('app-unlocked') === 'true';
        console.log('Persistent unlocked:', persistentUnlocked);
        
        if (persistentUnlocked) {
          setIsUnlocked(true);
          setIsCheckingPassword(false);
          return;
        }

        // Check if password protection is enabled by making a test call
        const response = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: '' }),
        });

        console.log('Password check response status:', response.status);

        if (response.status === 401) {
          // Password protection is enabled and password is required
          console.log('Password protection is enabled');
          setIsUnlocked(false);
        } else {
          // No password protection or password is not required
          console.log('No password protection needed');
          setIsUnlocked(true);
        }
      } catch (error) {
        console.error('Error checking password protection:', error);
        // On error, assume no protection needed
        setIsUnlocked(true);
      } finally {
        setIsCheckingPassword(false);
      }
    };

    checkPasswordRequired();
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  // Show loading or nothing while checking
  if (isCheckingPassword) {
    return null;
  }

  // Show password protection overlay if not unlocked
  if (!isUnlocked) {
    return <PasswordProtection onUnlock={handleUnlock} />;
  }

  // Show app if unlocked
  return <>{children}</>;
}; 