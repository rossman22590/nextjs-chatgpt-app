import * as React from 'react';

import { Box, Container, ListDivider, Typography } from '@mui/joy';

import { OptimaDrawerIn } from '~/common/layout/optima/portals/OptimaPortalsIn';

import { Creator } from './creator/Creator';
import { CreatorDrawer } from './creator/CreatorDrawer';
import { Viewer } from './creator/Viewer';
import { PersonaDashboard } from './dashboard/PersonaDashboard';
import { PersonaEditor, PersonaDraft } from './editor/PersonaEditor';


export function AppPersonas() {

  // state
  const [selectedSimplePersonaId, setSelectedSimplePersonaId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'dashboard' | 'creator' | 'viewer'>('dashboard');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorInitial, setEditorInitial] = React.useState<PersonaDraft | undefined>(undefined);
  const [refreshKey, setRefreshKey] = React.useState(0);
  React.useEffect(() => {
    if (editorOpen && typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [editorOpen]);

  return <>

    {/* -> Drawer */}
    <OptimaDrawerIn>
      <CreatorDrawer
        selectedSimplePersonaId={selectedSimplePersonaId}
        setSelectedSimplePersonaId={setSelectedSimplePersonaId}
      />
    </OptimaDrawerIn>

    <Box sx={{
      flexGrow: 1,
      overflowY: 'auto',
      p: { xs: 3, md: 6 },
    }}>

      <Container disableGutters maxWidth='md' sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

        {mode === 'dashboard' && (
          <PersonaDashboard
            onCreateNew={() => { setEditorInitial({ systemPrompt: '' }); setEditorOpen(true); }}
            onSoulGrab={() => setMode('creator')}
            onOpenPersona={(p) => { setEditorInitial({ id: p.id, name: p.name ?? undefined, description: p.description ?? undefined, symbol: p.symbol ?? undefined, pictureUrl: p.pictureUrl ?? undefined, systemPrompt: p.systemPrompt }); setEditorOpen(true); }}
            onCopyExisting={(p) => { setEditorInitial({ name: `${p.name || 'Copy'} (copy)`, description: p.description ?? undefined, symbol: p.symbol ?? undefined, systemPrompt: p.systemPrompt, instructionHints: (p as any).instructionHints, data: (p as any).data, aiSettings: (p as any).aiSettings }); setEditorOpen(true); }}
            refreshKey={refreshKey}
            editor={editorOpen ? (
              <PersonaEditor
                initial={editorInitial}
                onClose={() => setEditorOpen(false)}
                onSaved={() => { setEditorOpen(false); setRefreshKey(k => k + 1); }}
              />
            ) : undefined}
          />
        )}

        {mode === 'viewer' && !!selectedSimplePersonaId && (
          <Viewer selectedSimplePersonaId={selectedSimplePersonaId} />
        )}

        {mode === 'creator' && (
          <Creator display={true} />
        )}

      </Container>

    </Box>
  </>;
}