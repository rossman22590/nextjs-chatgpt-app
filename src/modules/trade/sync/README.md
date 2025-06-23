# Chat Cloud Sync

This module provides automatic cloud synchronization for chat conversations, allowing users to access their chats across multiple devices and ensure their chat history is safely stored in the cloud.

## Features

- **Automatic Sync**: Conversations are automatically synced to the cloud when they are created or updated
- **Bidirectional Sync**: Load existing chats from the cloud when signing in
- **Conflict Resolution**: Smart handling of conflicts when the same chat exists both locally and in the cloud
- **Authentication Required**: Only authenticated users can sync their chats
- **Persistent Storage**: Uses Prisma and PostgreSQL for reliable cloud storage

## How It Works

### Authentication
The system uses NextAuth.js for authentication. Users must be signed in to sync their chats to the cloud.

### Automatic Sync
The `useChatCloudSync` hook automatically:
1. Detects when a user signs in
2. Loads existing chats from the cloud
3. Monitors local chat changes and syncs them to the cloud
4. Prevents duplicate syncing using metadata tracking

### Data Storage
Chats are stored in the `linkStorage` table with:
- `dataType`: Set to `CHAT_V1` for chat conversations
- `ownerId`: The authenticated user's ID
- `data`: The complete conversation object
- `dataTitle`: The chat title for easy identification
- `expiresAt`: Set to null (never expires) for permanent storage

## Usage

### Basic Setup
```tsx
import { useChatCloudSync } from '~/modules/trade/sync/chat-cloud-sync';

const MyComponent = () => {
  const { isAuthenticated, syncStatus, loadFromCloud, syncToCloud } = useChatCloudSync();
  
  // The hook automatically handles syncing in the background
  // You can check sync status and manually trigger operations if needed
  
  return (
    <div>
      <p>Sync enabled: {syncStatus.isEnabled ? 'Yes' : 'No'}</p>
      <p>Synced chats: {syncStatus.syncedCount}</p>
      {syncStatus.lastSync && (
        <p>Last sync: {new Date(syncStatus.lastSync).toLocaleString()}</p>
      )}
    </div>
  );
};
```

### Using the Status Component
```tsx
import { CloudSyncStatus } from '~/modules/trade/sync/CloudSyncStatus';

const App = () => {
  return (
    <div>
      <CloudSyncStatus />
      {/* Your other components */}
    </div>
  );
};
```

## API Reference

### `useChatCloudSync()` Hook

Returns an object with:

- `isAuthenticated: boolean` - Whether the user is signed in
- `syncStatus: SyncStatus` - Current sync status information
- `loadFromCloud: () => Promise<void>` - Manually load chats from cloud
- `syncToCloud: (conversation: DConversation) => Promise<void>` - Manually sync a specific chat

### `SyncStatus` Object

```typescript
interface SyncStatus {
  isEnabled: boolean;        // Whether sync is enabled (user is authenticated)
  lastSync: number | null;   // Timestamp of last sync operation
  syncedCount: number;       // Number of conversations that have been synced
}
```

## Database Schema

The cloud sync uses the existing `linkStorage` table:

```sql
model LinkStorage {
  id          String              @id @default(cuid())
  ownerId     String
  visibility  LinkStorageVisibility
  dataType    LinkStorageDataType
  dataTitle   String?
  dataSize    Int
  data        Json
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  expiresAt   DateTime?
  deletionKey String
  isDeleted   Boolean             @default(false)
}
```

For chat sync:
- `dataType` is set to `CHAT_V1`
- `data` contains the complete `DConversation` object
- `ownerId` is the authenticated user's ID
- `visibility` is set to `PRIVATE`

## Error Handling

The system includes comprehensive error handling:
- Network failures are logged and don't prevent local usage
- Authentication errors are handled gracefully
- Sync conflicts are resolved by timestamp comparison
- Failed sync attempts are logged for debugging

## Security

- Only authenticated users can sync chats
- Each user can only access their own synced chats
- All chat data is stored with proper user isolation
- Deletion keys are generated for additional security

## Troubleshooting

### Chats Not Syncing
1. Check that the user is authenticated
2. Verify database connectivity
3. Check browser console for error messages
4. Ensure Prisma client is properly configured

### Sync Conflicts
The system automatically resolves conflicts by comparing timestamps:
- If cloud version is newer, it overwrites local
- If local version is newer, it uploads to cloud
- Ties are resolved in favor of the cloud version

### Performance Considerations
- Large chat histories may take time to sync initially
- The system avoids syncing empty conversations
- Sync operations are debounced to prevent excessive API calls

## Configuration

Environment variables needed:
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

Make sure to run Prisma migrations:
```bash
npm run db:push
``` 