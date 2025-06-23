import React from 'react';
import { Box, Chip, Typography, IconButton } from '@mui/joy';
import SyncIcon from '@mui/icons-material/Sync';
import { useChatCloudSync } from './chat-cloud-sync';

/**
 * Component that displays the current cloud sync status and provides sync controls
 */
export const CloudSyncStatus: React.FC = () => {
  const { isAuthenticated, syncStatus, loadFromCloud, syncToCloud } = useChatCloudSync();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSyncClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Load all chats from database to get app in sync
      await loadFromCloud();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Chip variant="outlined" color="neutral" size="sm">
          💾 Sign in to sync chats to database
        </Chip>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Chip 
          variant="soft" 
          color={syncStatus.isEnabled ? "success" : "neutral"} 
          size="sm"
        >
          {syncStatus.isEnabled ? (
            <>
              ✅ Cloud Active ({syncStatus.syncedCount} chats synced)
            </>
          ) : (
            <>
              💾 Database sync disabled
            </>
          )}
        </Chip>
        
        {syncStatus.isEnabled && (
          <IconButton
            size="sm"
            variant="soft"
            color="primary"
            loading={isLoading}
            onClick={handleSyncClick}
            title="Sync all chats from database"
          >
            <SyncIcon />
          </IconButton>
        )}
      </Box>
      
      {syncStatus.lastSync && (
        <Typography level="body-xs" sx={{ mt: 0.5, opacity: 0.7 }}>
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </Typography>
      )}
      
      {isLoading && (
        <Typography level="body-xs" sx={{ mt: 0.5, color: 'primary.main' }}>
          Syncing chats from database...
        </Typography>
      )}
    </Box>
  );
};

export default CloudSyncStatus; 