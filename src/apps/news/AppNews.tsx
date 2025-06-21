import * as React from 'react';
import { Box, Button, Typography } from '@mui/joy';
import { Link } from '~/common/components/Link';
import { ROUTE_INDEX } from '~/common/app.routes';

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
