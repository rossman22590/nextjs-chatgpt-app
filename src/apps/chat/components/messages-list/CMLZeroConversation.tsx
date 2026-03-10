import * as React from 'react';
import { useSession } from 'next-auth/react';

import { Avatar, Box, Button, Typography } from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BrushIcon from '@mui/icons-material/Brush';
import CodeIcon from '@mui/icons-material/Code';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { CUSTOM_PERSONA_PREFIX } from '~/common/stores/chat/chat.conversation';
import { usePersonaCacheStore } from '~/common/stores/chat/store-persona-cache';
import { apiAsyncNode } from '~/common/util/trpc.client';


const _suggestions = [
  { label: 'Write copy', Icon: EditNoteIcon, gradient: 'linear-gradient(135deg, rgba(224 64 160 / 0.12), rgba(160 32 240 / 0.06))', iconGradient: 'linear-gradient(135deg, #e040a0, #c840d8)', fg: '#fff' },
  { label: 'Create images', Icon: BrushIcon, gradient: 'linear-gradient(135deg, rgba(160 32 240 / 0.12), rgba(120 20 200 / 0.06))', iconGradient: 'linear-gradient(135deg, #a020f0, #7112b5)', fg: '#fff' },
  { label: 'Write code', Icon: CodeIcon, gradient: 'linear-gradient(135deg, rgba(120 40 220 / 0.12), rgba(80 20 180 / 0.06))', iconGradient: 'linear-gradient(135deg, #8040dc, #5020b4)', fg: '#fff' },
  { label: 'Brainstorm', Icon: AutoAwesomeIcon, gradient: 'linear-gradient(135deg, rgba(200 64 216 / 0.12), rgba(160 32 240 / 0.06))', iconGradient: 'linear-gradient(135deg, #c840d8, #a020f0)', fg: '#fff' },
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
    background: 'radial-gradient(ellipse, rgba(160 32 240 / 0.18), rgba(224 64 160 / 0.1) 40%, transparent 68%)',
    pointerEvents: 'none',
    filter: 'blur(80px)',
  } as const,

  ambientGlow2: {
    position: 'absolute',
    bottom: '-10%',
    left: '30%',
    width: '400px',
    height: '300px',
    background: 'radial-gradient(ellipse, rgba(224 64 160 / 0.08), transparent 60%)',
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
    background: 'linear-gradient(135deg, #a020f0 0%, #e040a0 40%, #c840d8 70%, #a020f0 100%)',
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
    border: '1px solid rgba(160 32 240 / 0.1)',
    cursor: 'pointer',
    backdropFilter: 'blur(16px) saturate(140%)',
    transition: 'transform 0.24s cubic-bezier(.4,0,.2,1), box-shadow 0.24s ease, border-color 0.24s ease',
    '&:hover': {
      transform: 'translateY(-6px)',
      boxShadow: '0 20px 48px rgba(160 32 240 / 0.18), 0 4px 12px rgba(224 64 160 / 0.1)',
      borderColor: 'rgba(160 32 240 / 0.2)',
    },
  },

  cardIconBox: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(160 32 240 / 0.2)',
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
    fontWeight: 700,
    letterSpacing: '-0.01em',
    mt: 1,
    position: 'relative',
    zIndex: 1,
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

      {/* Decorative ambient glows */}
      <Box sx={_styles.ambientGlow} />
      <Box sx={_styles.ambientGlow2} />

      {/* Hero content */}
      <Box sx={_styles.heroBox}>
        <Typography sx={_styles.heading}>
          What would you like to create?
        </Typography>
        <Typography level='body-md' sx={_styles.subtitle}>
          Start a conversation, explore ideas, or bring something new to life.
        </Typography>
      </Box>

      {/* My Personas (custom) - when authenticated and have personas */}
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
                sx={{
                  ..._styles.cardBase,
                  background: 'linear-gradient(135deg, rgba(160 32 240 / 0.08), rgba(224 64 160 / 0.06))',
                }}
              >
                <Box sx={_styles.cardIconBox}>
                  <Avatar
                    src={p.pictureUrl || undefined}
                    sx={{ '--Avatar-size': '40px', fontSize: '1.25rem' }}
                  >
                    {p.symbol || '🎭'}
                  </Avatar>
                </Box>
                <Typography sx={{ ..._styles.cardLabel, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name || 'Persona'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Suggestion cards */}
      <Box sx={_styles.cardsRow}>
        {_suggestions.map(({ label, Icon, gradient, iconGradient, fg }) => (
          <Box
            key={label}
            role='button'
            tabIndex={0}
            aria-label={label}
            onClick={() => props.onConversationNew(true, false)}
            onKeyDown={(e) => e.key === 'Enter' && props.onConversationNew(true, false)}
            sx={{ ..._styles.cardBase, background: gradient }}
          >
            <Box sx={{ ..._styles.cardIconBox, background: iconGradient, color: fg }}>
              <Icon sx={_iconSx} />
            </Box>
            <Typography sx={_styles.cardLabel}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* CTA button */}
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
