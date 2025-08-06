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
        gap: 4,
        p: 4,
        borderRadius: 'lg',
        border: '2px solid',
        borderColor: 'primary.500',
        backgroundColor: 'background.surface',
        boxShadow: 'lg',
        maxWidth: 600,
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
          🚀 NEW FEATURES
        </Typography>
        
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          textAlign: 'left',
          width: '100%'
        }}>
          <Typography level="h3" sx={{ color: 'primary.600', mb: 1 }}>
            What&apos;s New in This Update:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#10b981', fontSize: '1.2em' }}>☁️</span>
              <strong>Cloud Storage:</strong> Save and sync your conversations across devices
            </Typography>
            
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#3b82f6', fontSize: '1.2em' }}>🤖</span>
              <strong>More AI Models:</strong> Access to latest GPT, Claude, and open-source models
            </Typography>
            
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#8b5cf6', fontSize: '1.2em' }}>👤</span>
              <strong>User Profiles:</strong> Personalized experience with Google OAuth authentication
            </Typography>
            
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#f59e0b', fontSize: '1.2em' }}>📊</span>
              <strong>Analytics:</strong> Track your usage and conversation insights
            </Typography>
            
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#ef4444', fontSize: '1.2em' }}>🔗</span>
              <strong>Share Links:</strong> Generate shareable links for your conversations
            </Typography>
            
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color: '#06b6d4', fontSize: '1.2em' }}>🛡️</span>
              <strong>Enhanced Security:</strong> Secure authentication and data protection
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant='solid'
          color='primary'
          size='lg'
          component={Link}
          href={ROUTE_INDEX}
          noLinkStyle
          sx={{
            minWidth: 200,
            boxShadow: 'md',
            fontSize: '1.1rem',
            py: 1.5,
          }}
        >
          Explore New Features
        </Button>
        
      </Box>
      
    </Box>
  );
}
