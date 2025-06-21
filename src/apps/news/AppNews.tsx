import * as React from 'react';
import { Box, Button, Typography } from '@mui/joy';
import { Link } from '~/common/components/Link';
import { ROUTE_INDEX } from '~/common/app.routes';
import { BaseProduct, Release } from '~/common/app.release';

// Make sure this is exported as a named export for DesktopNav.tsx
export function BuildInfoCard({ noMargin = false }: { noMargin?: boolean }) {
  return (
    <Box sx={{ 
      p: 4, 
      textAlign: 'center',
      ...(noMargin ? {} : { m: 2 })
    }}>
      <Typography level="h4" sx={{ mb: 2 }}>
        Build Information
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        gap: 1, 
        bgcolor: 'background.level1', 
        p: 2, 
        borderRadius: 'md' 
      }}>
        <Typography>
          <strong>Version:</strong> {Release.App.versionCode || 'Development'}
        </Typography>
        <Typography>
          <strong>Build Date:</strong> {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
}

export function AppNews() {
  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      p: { xs: 3, md: 6 },
    }}>
      
      <Box sx={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 3,
        p: 4,
        borderRadius: 'lg',
        border: '2px solid',
        borderColor: 'primary.500',
        backgroundColor: 'background.surface',
        boxShadow: 'lg',
        maxWidth: 400,
        textAlign: 'center',
      }}>
        
        <Typography 
          level='h1' 
          sx={{ 
            fontSize: '2.5rem',
            color: 'primary.500',
            fontWeight: 'bold',
          }}
        >
          BETA UPDATE
        </Typography>
        
        <Button
          variant='solid' 
          color='primary' 
          size='lg'
          component={Link} 
          href={ROUTE_INDEX} 
          noLinkStyle
          sx={{
            minWidth: 150,
            boxShadow: 'md',
          }}
        >
          Continue
        </Button>
        
      </Box>
      
    </Box>
  );
}
