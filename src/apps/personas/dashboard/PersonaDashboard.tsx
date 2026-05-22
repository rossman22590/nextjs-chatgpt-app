import * as React from 'react';
import Image from 'next/image';
import { Box, Button, Grid, IconButton, Switch, Typography, Modal, ModalDialog, List, ListItemButton, Input } from '@mui/joy';
import type { SxProps } from '@mui/joy/styles/types';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
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


const _styles = {

  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    position: 'relative',
  } as const,

  ambientGlow: {
    position: 'absolute',
    top: '-8%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '720px',
    height: '380px',
    background: 'radial-gradient(ellipse, var(--joy-palette-primary-softBg), var(--joy-palette-primary-softHoverBg) 36%, transparent 70%)',
    pointerEvents: 'none',
    filter: 'blur(80px)',
    zIndex: 0,
    opacity: 0.85,
  } as const,

  hero: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
  } as const,

  heroTitle: {
    fontFamily: 'display',
    fontWeight: 700,
    fontSize: { xs: '2rem', md: '2.5rem' },
    letterSpacing: '-0.035em',
    lineHeight: 1.1,
    background: 'linear-gradient(135deg, var(--joy-palette-primary-solidBg) 0%, var(--joy-palette-primary-softColor) 50%, var(--joy-palette-primary-solidHoverBg) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as const,

  heroSubtitle: {
    fontFamily: 'body',
    color: 'text.secondary',
    fontSize: 'md',
    maxWidth: '36rem',
    lineHeight: 1.55,
  } as const,

  actionRow: {
    position: 'relative',
    zIndex: 1,
  } as const,

  actionButton: {
    fontFamily: 'display',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    borderRadius: 'md',
    py: 1.25,
    color: 'text.primary',
    background: 'var(--agi-shell-bg)',
    border: '1px solid var(--agi-shell-border)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    boxShadow: 'inset 0 1px 0 rgba(255 255 255 / 0.35)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: 'var(--agi-shell-border-strong)',
      boxShadow: 'var(--agi-shell-shadow), inset 0 1px 0 rgba(255 255 255 / 0.45)',
      background: 'var(--agi-shell-elevated)',
    },
  } as const,

  filterRow: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1.5,
    flexWrap: 'wrap',
    background: 'var(--agi-shell-soft)',
    border: '1px solid var(--agi-shell-border)',
    borderRadius: 'md',
    p: 1.5,
    backdropFilter: 'blur(10px) saturate(140%)',
    WebkitBackdropFilter: 'blur(10px) saturate(140%)',
  } as const,

  sectionTitle: {
    fontFamily: 'display',
    fontWeight: 600,
    fontSize: 'sm',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    color: 'text.primary',
  } as const,

  gridRow: {
    position: 'relative',
    zIndex: 1,
  } as const,

  tile: {
    position: 'relative',
    overflow: 'hidden',
    isolation: 'isolate',
    height: '10rem',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'lg',
    background: `linear-gradient(168deg,
      rgba(255 255 255 / 0.38) 0%,
      var(--agi-shell-bg) 42%,
      rgba(var(--joy-palette-primary-mainChannel) / 0.07) 100%)`,
    backdropFilter: 'blur(16px) saturate(175%)',
    WebkitBackdropFilter: 'blur(16px) saturate(175%)',
    border: '1px solid var(--agi-shell-border)',
    boxShadow: 'var(--agi-shell-shadow), inset 0 1px 0 rgba(255 255 255 / 0.45), inset 0 -1px 0 rgba(var(--joy-palette-primary-mainChannel) / 0.05)',
    transition: 'transform 0.24s cubic-bezier(.4,0,.2,1), box-shadow 0.24s ease, border-color 0.24s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(125deg, rgba(255 255 255 / 0.6) 0%, rgba(255 255 255 / 0.12) 22%, transparent 44%)',
      zIndex: 0,
      borderRadius: 'inherit',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(0deg, rgba(var(--joy-palette-primary-mainChannel) / 0.08) 0%, transparent 38%)',
      zIndex: 0,
      borderRadius: 'inherit',
    },
    '[data-joy-color-scheme="dark"] &': {
      boxShadow: 'var(--agi-shell-shadow), inset 0 1px 0 rgba(255 255 255 / 0.1)',
    },
    '[data-joy-color-scheme="dark"] &::before': {
      background: 'linear-gradient(125deg, rgba(255 255 255 / 0.18) 0%, rgba(255 255 255 / 0.05) 24%, transparent 44%)',
    },
    '& > *': { position: 'relative', zIndex: 1 },
    '&:hover': {
      transform: 'translateY(-3px)',
      borderColor: 'var(--agi-shell-border-strong)',
      boxShadow: 'var(--agi-shell-shadow-strong), inset 0 1px 0 rgba(255 255 255 / 0.5)',
    },
    '&:focus-visible': {
      outline: '2px solid var(--joy-palette-primary-outlinedBorder)',
      outlineOffset: '2px',
    },
  } as const,

  tileContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
    height: '100%',
    p: 2,
  } as const,

  tileHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 1.25,
  } as const,

  tileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 'md',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--joy-palette-primary-softBg), var(--joy-palette-primary-softHoverBg))',
    border: '1px solid var(--joy-palette-primary-outlinedBorder)',
    boxShadow: 'inset 0 1px 0 rgba(255 255 255 / 0.4)',
    fontSize: '1.5rem',
    flexShrink: 0,
    overflow: 'hidden',
    color: 'var(--joy-palette-primary-plainColor)',
  } as const,

  tileTitleBox: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.25,
  } as const,

  tileTitle: {
    fontFamily: 'display',
    fontWeight: 600,
    letterSpacing: '-0.015em',
    fontSize: 'md',
    color: 'text.primary',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  } as const,

  tileSubtitle: {
    fontFamily: 'body',
    color: 'text.secondary',
    fontSize: 'sm',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.45,
  } as const,

  tileFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'body',
  } as const,

  tileFooterText: {
    fontSize: 'xs',
    color: 'text.tertiary',
    fontWeight: 500,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  } as const,

  deleteButton: {
    color: 'text.tertiary',
    transition: 'color 0.15s ease, background-color 0.15s ease',
    '&:hover': { color: 'danger.plainColor' },
  } as const,

} as const;

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

  const Tile: React.FC<{ title: string; subtitle?: string; symbol?: string; imageUrl?: string; onClick?: () => void; onDelete?: () => void; dim?: boolean; isBuiltIn?: boolean; }> = ({ title, subtitle, symbol, imageUrl, onClick, onDelete, dim, isBuiltIn }) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClick) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    };
    const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onDelete?.();
    };
    const tileSx: SxProps = {
      ..._styles.tile,
      opacity: dim ? 0.6 : 1,
      cursor: onClick ? 'pointer' : 'default',
    };
    return (
      <Box
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : -1}
        aria-label={onClick ? `Edit persona ${title}` : title}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        sx={tileSx}
      >
        <Box sx={_styles.tileContent}>

          <Box sx={_styles.tileHeaderRow}>
            <Box sx={_styles.tileAvatarBox}>
              {imageUrl ? (
                <Image src={imageUrl} alt='' width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
              ) : (
                <Box component='span' aria-hidden>{symbol || '✦'}</Box>
              )}
            </Box>
            <Box sx={_styles.tileTitleBox}>
              <Typography sx={_styles.tileTitle}>{title}</Typography>
              {!!subtitle && <Typography sx={_styles.tileSubtitle}>{subtitle}</Typography>}
            </Box>
            {onDelete && (
              <IconButton
                size='sm'
                variant='plain'
                aria-label={`Delete persona ${title}`}
                onClick={handleDeleteClick}
                sx={_styles.deleteButton}
              >
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            )}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={_styles.tileFooter}>
            <Typography sx={_styles.tileFooterText}>
              {isBuiltIn ? 'Built-in' : 'Tap to edit'}
            </Typography>
            {onClick && (
              <ChevronRightIcon sx={{ fontSize: '1.1rem', color: 'text.tertiary', opacity: 0.7 }} />
            )}
          </Box>

        </Box>
      </Box>
    );
  };

  return (
    <Box sx={_styles.root}>

      <Box sx={_styles.ambientGlow} aria-hidden />

      <Box sx={_styles.hero}>
        <Typography sx={_styles.heroTitle}>Persona Dashboard</Typography>
        <Typography sx={_styles.heroSubtitle}>
          Craft, refine, and orchestrate the AI personalities that bring every conversation to life.
        </Typography>
      </Box>

      {/* Create Row */}
      <Grid container spacing={1.5} sx={_styles.actionRow}>
        <Grid xs={12} md={4}>
          <Button fullWidth variant='plain' startDecorator={<AddIcon />} onClick={onCreateNew} sx={_styles.actionButton}>
            Create New
          </Button>
        </Grid>
        <Grid xs={12} md={4}>
          <Button fullWidth variant='plain' startDecorator={<ContentCopyIcon />} onClick={() => setCopyOpen(true)} sx={_styles.actionButton}>
            Copy Existing
          </Button>
        </Grid>
        <Grid xs={12} md={4}>
          <Button fullWidth variant='plain' startDecorator={<FingerprintIcon />} onClick={onSoulGrab} sx={_styles.actionButton}>
            Soul Grab
          </Button>
        </Grid>
      </Grid>

      {/* Inline Editor area (appears under the create buttons, above the tiles) */}
      {editor && (
        <Box sx={{ mt: 1, position: 'relative', zIndex: 1 }}>
          {editor}
        </Box>
      )}

      <Box sx={_styles.filterRow}>
        <Typography sx={_styles.sectionTitle}>All Personas</Typography>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search personas...'
          startDecorator={<SearchIcon fontSize='small' />}
          endDecorator={query && (
            <IconButton size='sm' onClick={() => setQuery('')} aria-label='Clear search'>
              <ClearIcon fontSize='small' />
            </IconButton>
          )}
          sx={{ flex: 1, minWidth: 200, maxWidth: 420, background: 'var(--agi-shell-elevated)' }}
          aria-label='Search personas'
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
          <Typography level='body-xs' sx={{ fontFamily: 'body', color: 'text.secondary' }}>Show built-ins</Typography>
          <Switch checked={showBuiltins} onChange={(e) => setShowBuiltins(e.target.checked)} size='sm' />
        </Box>
      </Box>

      {/* Tiles: user first, then built-ins */}
      <Grid container spacing={1.5} sx={_styles.gridRow}>
        {filteredItems.map(p => (
          <Grid key={p.id} xs={12} sm={6} md={4}>
            <Tile
              title={p.name || 'Untitled'}
              subtitle={p.description || ''}
              symbol={p.symbol || '✦'}
              imageUrl={p.pictureUrl || undefined}
              onClick={() => onOpenPersona(p)}
              onDelete={async () => { try { await apiAsyncNode.persona.delete.mutate({ id: p.id }); await load(); } catch {} }}
            />
          </Grid>
        ))}
        {showBuiltins && filteredBuiltins.map(p => (
          <Grid key={`builtin-${p.id}`} xs={12} sm={6} md={4}>
            <Tile
              title={p.name || 'Persona'}
              subtitle={p.description || ''}
              symbol={p.symbol || undefined}
              imageUrl={p.pictureUrl || undefined}
              isBuiltIn
              dim
            />
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
