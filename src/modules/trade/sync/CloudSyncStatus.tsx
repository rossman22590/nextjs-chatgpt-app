import React from 'react';
import { Box, Chip, Typography } from '@mui/joy';
import { useChatCloudSync } from './chat-cloud-sync';

/**
 * Component that displays the current cloud sync status and provides sync controls
 */
export const CloudSyncStatus: React.FC = () => {
  const { isAuthenticated, syncStatus, loadFromCloud, syncToCloud } = useChatCloudSync();

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
      
      {syncStatus.lastSync && (
        <Typography level="body-xs" sx={{ mt: 0.5, opacity: 0.7 }}>
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  );
};

export default CloudSyncStatus; 