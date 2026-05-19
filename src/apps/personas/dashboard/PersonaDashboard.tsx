import * as React from 'react';
import Image from 'next/image';
import { Box, Button, Card, CardContent, Grid, IconButton, Switch, Typography, Modal, ModalDialog, List, ListItemButton, Input } from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { apiAsyncNode } from '~/common/util/trpc.client';
import { SystemPurposes } from '../../../data';

type PersonaItem = {
  id: string;
  name: string | null;
  description?: string | null;
  systemPrompt: string;
  pictureUrl: string | null;
  symbol?: string | null;
  instructionHints?: any;
  data?: any;
  aiSettings?: any;
  created: Date;
  updated: Date;
};

export const PersonaDashboard: React.FC<{ onCreateNew: () => void; onSoulGrab: () => void; onOpenPersona: (p: PersonaItem) => void; onCopyExisting?: (p: PersonaItem) => void; refreshKey?: number; editor?: React.ReactNode; }>= ({ onCreateNew, onSoulGrab, onOpenPersona, onCopyExisting, refreshKey, editor }) => {
  const [items, setItems] = React.useState<PersonaItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [showBuiltins, setShowBuiltins] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem('personaShowBuiltins');
    return v !== 'false';
  });
  const [copyOpen, setCopyOpen] = React.useState(false);
  const [copyQuery, setCopyQuery] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAsyncNode.persona.list.query();
      setItems(res as unknown as PersonaItem[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load, refreshKey]);
  React.useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('personaShowBuiltins', String(showBuiltins));
  }, [showBuiltins]);

  const builtins = React.useMemo(() => Object.entries(SystemPurposes).map(([id, p]) => ({ id, name: p.title, description: typeof p.description === 'string' ? p.description : 'Built-in', systemPrompt: p.systemMessage, pictureUrl: p.imageUri ?? null, symbol: p.symbol, created: new Date(), updated: new Date() })), []);
  const lcQuery = query.trim().toLowerCase();
  const filteredItems = React.useMemo(() =>
    lcQuery ? items.filter(p => (p.name || '').toLowerCase().includes(lcQuery) || (p.description || '').toLowerCase().includes(lcQuery)) : items
  , [items, lcQuery]);
  const filteredBuiltins = React.useMemo(() =>
    lcQuery ? builtins.filter(p => (p.name || '').toLowerCase().includes(lcQuery) || (p.description || '').toLowerCase().includes(lcQuery)) : builtins
  , [builtins, lcQuery]);

  const TILE_H = '8.5rem';
  const Tile: React.FC<{ title: string; subtitle?: string; symbol?: string; imageUrl?: string; onClick?: () => void; onDelete?: () => void; dim?: boolean; }>= ({ title, subtitle, symbol, imageUrl, onClick, onDelete, dim }) => (
    <Card variant='outlined'
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : -1}
          onClick={onClick}
          onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
          sx={{ opacity: dim ? 0.55 : 1, cursor: onClick ? 'pointer' : 'default', height: TILE_H, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography level='title-sm'>{title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onDelete && (
              <IconButton size='sm' variant='plain' color='danger' onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <DeleteOutlineIcon />
              </IconButton>
            )}
            <Box sx={{ fontSize: 'lg' }}>{imageUrl ? <Image src={imageUrl} alt="" width={24} height={24} style={{ borderRadius: 6 }} unoptimized /> : (symbol ?? '')}</Box>
          </Box>
        </Box>
        {!!subtitle && <Typography level='body-sm' sx={{ opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{subtitle}</Typography>}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
          <Typography level='body-xs'>Tap to edit</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography level='h3'>Persona Dashboard</Typography>
        <Typography level='body-sm' sx={{ opacity: 0.7 }}>Manage and create your AI personas</Typography>
      </Box>

      {/* Create Row */}
      <Grid container spacing={1}>
        <Grid xs={12} md={4}><Button fullWidth variant='soft' startDecorator={<AddIcon />} onClick={onCreateNew}>Create New</Button></Grid>
        <Grid xs={12} md={4}><Button fullWidth variant='soft' startDecorator={<ContentCopyIcon />} onClick={() => setCopyOpen(true)}>Copy Existing</Button></Grid>
        <Grid xs={12} md={4}><Button fullWidth variant='soft' startDecorator={<FingerprintIcon />} onClick={onSoulGrab}>Soul Grab</Button></Grid>
      </Grid>

      {/* Inline Editor area (appears under the create buttons, above the tiles) */}
      {editor && (
        <Box sx={{ mt: 2 }}>
          {editor}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, gap: 1 }}>
        <Typography level='title-sm' sx={{ whiteSpace: 'nowrap' }}>All Personas</Typography>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search personas…'
          startDecorator={<SearchIcon fontSize='small' />}
          endDecorator={query && (
            <IconButton size='sm' onClick={() => setQuery('')}>
              <ClearIcon fontSize='small' />
            </IconButton>
          )}
          sx={{ flex: 1, maxWidth: 420 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
          <Typography level='body-xs'>Show built-ins</Typography>
          <Switch checked={showBuiltins} onChange={(e) => setShowBuiltins(e.target.checked)} size='sm' />
          <Button size='sm' variant='plain' startDecorator={<EditRoundedIcon />}>Customize</Button>
        </Box>
      </Box>

      {/* Tiles: user first, then built-ins */}
      <Grid container spacing={1}>
        {filteredItems.map(p => (
          <Grid key={p.id} xs={12} sm={6} md={4}>
            <Tile
              title={p.name || 'Untitled'}
              subtitle={p.description || ''}
              symbol={p.symbol || '🎭'}
              imageUrl={p.pictureUrl || undefined}
              onClick={() => onOpenPersona(p)}
              onDelete={async () => { try { await apiAsyncNode.persona.delete.mutate({ id: p.id }); await load(); } catch {} }}
            />
          </Grid>
        ))}
        {showBuiltins && filteredBuiltins.map(p => (
          <Grid key={`builtin-${p.id}`} xs={12} sm={6} md={4}>
            <Tile title={p.name || 'Persona'} subtitle={p.description || ''} symbol={p.symbol || undefined} imageUrl={p.pictureUrl || undefined} />
          </Grid>
        ))}
      </Grid>

      {/* Copy Existing Modal */}
      <Modal open={copyOpen} onClose={() => setCopyOpen(false)}>
        <ModalDialog sx={{ width: 520, maxWidth: '90vw' }}>
          <Typography level='title-md' sx={{ mb: 1 }}>Copy Existing Persona</Typography>
          <Input placeholder='Search…' value={copyQuery} onChange={e => setCopyQuery(e.target.value)} sx={{ mb: 1 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, maxHeight: '50vh', overflowY: 'auto' }}>
            <Typography level='body-xs' sx={{ opacity: 0.7 }}>My Personas</Typography>
            <List>
              {items
                .filter(p => !copyQuery || (p.name || '').toLowerCase().includes(copyQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(copyQuery.toLowerCase()))
                .map(p => (
                  <ListItemButton key={p.id} onClick={() => { onCopyExisting && onCopyExisting(p); setCopyOpen(false); }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{ fontSize: 20 }}>{p.symbol || '🎭'}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography level='body-sm'>{p.name || 'Untitled'}</Typography>
                        {!!p.description && <Typography level='body-xs' sx={{ opacity: 0.7 }}>{p.description}</Typography>}
                      </Box>
                      <Button size='sm' variant='soft'>Copy</Button>
                    </Box>
                  </ListItemButton>
                ))}
            </List>
            <Typography level='body-xs' sx={{ opacity: 0.7, mt: 1 }}>Built-ins</Typography>
            <List>
              {builtins
                .filter(p => !copyQuery || (p.name || '').toLowerCase().includes(copyQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(copyQuery.toLowerCase()))
                .map(p => (
                  <ListItemButton key={p.id} onClick={() => { onCopyExisting && onCopyExisting(p as PersonaItem); setCopyOpen(false); }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{ fontSize: 20 }}>{p.symbol || '✨'}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography level='body-sm'>{p.name || 'Persona'}</Typography>
                        {!!p.description && <Typography level='body-xs' sx={{ opacity: 0.7 }}>{p.description}</Typography>}
                      </Box>
                      <Button size='sm' variant='soft'>Copy</Button>
                    </Box>
                  </ListItemButton>
                ))}
            </List>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button variant='plain' onClick={() => setCopyOpen(false)}>Close</Button>
          </Box>
        </ModalDialog>
      </Modal>

    </Box>
  );
};
