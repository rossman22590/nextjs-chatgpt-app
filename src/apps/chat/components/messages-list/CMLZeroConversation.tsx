import * as React from 'react';
import { useSession } from 'next-auth/react';

import { Box, Button, Typography } from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BrushIcon from '@mui/icons-material/Brush';
import CodeIcon from '@mui/icons-material/Code';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { primaryCtaButtonSx } from '~/common/app.theme';
import { CUSTOM_PERSONA_PREFIX } from '~/common/stores/chat/chat.conversation';
import { usePersonaCacheStore } from '~/common/stores/chat/store-persona-cache';
import { apiAsyncNode } from '~/common/util/trpc.client';


const _suggestions = [
  { label: 'Write copy', Icon: EditNoteIcon },
  { label: 'Create images', Icon: BrushIcon },
  { label: 'Write code', Icon: CodeIcon },
  { label: 'Brainstorm', Icon: AutoAwesomeIcon },
];

const _iconSx = { fontSize: '1.25rem' } as const;

const _styles = {

  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    py: { xs: 6, md: 10 },
    px: 3,
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  } as const,

  ambientGlow: {
    position: 'absolute',
    top: '-24%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '720px',
    height: '480px',
    background: 'radial-gradient(ellipse, var(--joy-palette-primary-softBg), var(--joy-palette-primary-softHoverBg) 40%, transparent 68%)',
    pointerEvents: 'none',
    filter: 'blur(80px)',
  } as const,

  ambientGlow2: {
    position: 'absolute',
    bottom: '-10%',
    left: '30%',
    width: '400px',
    height: '300px',
    background: 'radial-gradient(ellipse, var(--joy-palette-primary-softBg), transparent 60%)',
    pointerEvents: 'none',
    filter: 'blur(100px)',
  } as const,

  heroBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    position: 'relative',
    zIndex: 1,
  } as const,

  heading: {
    fontFamily: 'display',
    fontSize: { xs: '2.25rem', md: '3rem' },
    fontWeight: 700,
    letterSpacing: '-0.04em',
    textAlign: 'center',
    background: 'linear-gradient(135deg, var(--joy-palette-primary-solidBg) 0%, var(--joy-palette-primary-softColor) 50%, var(--joy-palette-primary-solidHoverBg) 100%)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1.1,
  } as const,

  subtitle: {
    textAlign: 'center',
    color: 'text.secondary',
    maxWidth: '28rem',
    lineHeight: 1.7,
    fontSize: 'md',
  } as const,

  cardsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
    zIndex: 1,
  } as const,

  cardBase: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 1.5,
    py: 3,
    px: 2.5,
    width: { xs: '130px', md: '148px' },
    borderRadius: '14px',
    border: '1px solid var(--agi-shell-border, var(--joy-palette-primary-outlinedBorder))',
    background: 'linear-gradient(135deg, var(--joy-palette-primary-softBg), var(--joy-palette-background-level1))',
    cursor: 'pointer',
    backdropFilter: 'blur(12px) saturate(130%)',
    transition: 'transform 0.24s cubic-bezier(.4,0,.2,1), box-shadow 0.24s ease, border-color 0.24s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 'var(--agi-shell-shadow, var(--joy-shadow-md))',
      borderColor: 'var(--agi-shell-border-strong, var(--joy-palette-primary-softActiveBg))',
    },
  },

  cardIconBox: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--joy-palette-primary-solidBg), var(--joy-palette-primary-solidHoverBg))',
    color: 'var(--joy-palette-primary-solidColor, #fff)',
    boxShadow: '0 4px 14px rgba(var(--joy-palette-primary-mainChannel) / 0.22)',
  } as const,

  cardLabel: {
    fontWeight: 600,
    fontSize: 'xs',
    color: 'text.primary',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  } as const,

  ctaButton: {
    px: 4,
    py: 1.5,
    fontSize: 'sm',
    mt: 1,
    position: 'relative',
    zIndex: 1,
    borderRadius: 'md',
    ...primaryCtaButtonSx,
  } as const,

};


export function CMLZeroConversation(props: {
  onConversationNew: (forceNoRecycle: boolean, isIncognito: boolean, initialPurposeId?: import('~/common/stores/chat/chat.conversation').ConversationPurposeId) => void,
}) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [customPersonas, setCustomPersonas] = React.useState<Array<{ id: string; name: string | null; symbol: string | null; pictureUrl: string | null }>>([]);
  const setPersonasCache = usePersonaCacheStore(state => state.setPersonas);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiAsyncNode.persona.list.query()
      .then((list) => {
        if (cancelled) return;
        setCustomPersonas(list.map(p => ({ id: p.id, name: p.name, symbol: p.symbol, pictureUrl: p.pictureUrl })));
        setPersonasCache(list.map(p => ({ id: p.id, name: p.name, systemPrompt: p.systemPrompt, symbol: p.symbol })));
      })
      .catch(() => { if (!cancelled) setCustomPersonas([]); });
    return () => { cancelled = true; };
  }, [isAuthenticated, setPersonasCache]);

  const handlePersonaClick = React.useCallback((personaId: string) => {
    props.onConversationNew(true, false, `${CUSTOM_PERSONA_PREFIX}${personaId}` as const);
  }, [props]);

  return (
    <Box sx={_styles.root}>

      <Box sx={_styles.ambientGlow} />
      <Box sx={_styles.ambientGlow2} />

      <Box sx={_styles.heroBox}>
        <Typography sx={_styles.heading}>
          What would you like to create?
        </Typography>
        <Typography level='body-md' sx={_styles.subtitle}>
          Start a conversation, explore ideas, or bring something new to life.
        </Typography>
      </Box>

      {isAuthenticated && customPersonas.length > 0 && (
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Typography level='body-sm' sx={{ color: 'text.secondary', fontWeight: 600 }}>
            My Personas
          </Typography>
          <Box sx={{ ..._styles.cardsRow, gap: 1.5 }}>
            {customPersonas.map((p) => (
              <Box
                key={p.id}
                role='button'
                tabIndex={0}
                aria-label={p.name || 'Persona'}
                onClick={() => handlePersonaClick(p.id)}
                onKeyDown={(e) => e.key === 'Enter' && handlePersonaClick(p.id)}
                sx={_styles.cardBase}
              >
                <Box sx={{ ..._styles.cardIconBox, overflow: 'hidden' }}>
                  {p.pictureUrl ? (
                    <Box
                      component="img"
                      src={p.pictureUrl}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: '1.35rem', lineHeight: 1 }}>
                      {p.symbol || '🎭'}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ ..._styles.cardLabel, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name || 'Persona'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={_styles.cardsRow}>
        {_suggestions.map(({ label, Icon }) => (
          <Box
            key={label}
            role='button'
            tabIndex={0}
            aria-label={label}
            onClick={() => props.onConversationNew(true, false)}
            onKeyDown={(e) => e.key === 'Enter' && props.onConversationNew(true, false)}
            sx={_styles.cardBase}
          >
            <Box sx={_styles.cardIconBox}>
              <Icon sx={_iconSx} />
            </Box>
            <Typography sx={_styles.cardLabel}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Button
        variant='solid'
        onClick={() => props.onConversationNew(true, false)}
        startDecorator={<AddIcon />}
        sx={_styles.ctaButton}
      >
        New conversation
      </Button>

    </Box>
  );
}
