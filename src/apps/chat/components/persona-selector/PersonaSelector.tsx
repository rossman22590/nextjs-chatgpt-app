import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';

import type { SxProps } from '@mui/joy/styles/types';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemButton,
  Textarea,
  Tooltip,
  Typography,
} from '@mui/joy';
import ClearIcon from '@mui/icons-material/Clear';
import DoneIcon from '@mui/icons-material/Done';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import TelegramIcon from '@mui/icons-material/Telegram';

import { SystemPurposeData, SystemPurposeExample, SystemPurposeId, SystemPurposes } from '../../../../data';

import { YouTubeURLInput } from '~/modules/youtube/YouTubeURLInput';
import { bareBonesPromptMixer } from '~/modules/persona/pmix/pmix';

import {
  ConversationPurposeId,
  CUSTOM_PERSONA_PREFIX,
  DConversationId,
  getPersonaIdFromPurposeId,
  isCustomPersonaPurposeId,
} from '~/common/stores/chat/chat.conversation';
import { ExpanderControlledBox } from '~/common/components/ExpanderControlledBox';
import { createDMessageTextContent } from '~/common/stores/chat/chat.message';
import { lineHeightTextareaMd } from '~/common/app.theme';
import { navigateToPersonas } from '~/common/app.routes';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useChipBoolean } from '~/common/components/useChipBoolean';
import { useModelDomain } from '~/common/stores/llms/hooks/useModelDomain';
import { usePersonaCacheStore } from '~/common/stores/chat/store-persona-cache';
import { useUIPreferencesStore } from '~/common/stores/store-ui';
import { apiAsyncNode } from '~/common/util/trpc.client';
import { getSystemPurpose, setCustomSystemPurposeMessage } from '~/modules/persona/system-personas.catalog';
import { useSystemPersonaCatalog } from '~/modules/persona/useSystemPersonaCatalog';

import { usePurposeStore } from './store-purposes';

// 'special' purpose IDs, for tile hiding purposes
const PURPOSE_ID_PERSONA_CREATOR = '__persona-creator__';
const TILE_ACTIVE_COLOR = 'primary' as const;

// Square cornered-rectangle tiles (icon top, label bottom - no circular avatar)
const tileSize = 8.25; // rem - larger for readable label
const tileGap = 0.5; // rem

/** Glass shell + specular highlight for persona tiles (uses --agi-shell-* tokens). */
function personaTileGlassSx(isSelected: boolean, isHighlighted: boolean): SxProps {
  if (isSelected) {
    return {
      color: 'primary.solidColor',
      background:
        'linear-gradient(145deg, var(--joy-palette-primary-solidHoverBg) 0%, var(--joy-palette-primary-solidBg) 52%, var(--joy-palette-primary-600, var(--joy-palette-primary-solidBg)) 100%)',
      border: '1px solid rgba(255 255 255 / 0.32)',
      boxShadow:
        '0 14px 36px rgba(var(--joy-palette-primary-mainChannel) / 0.45), 0 2px 10px rgba(var(--joy-palette-primary-mainChannel) / 0.32), inset 0 1px 0 rgba(255 255 255 / 0.4), inset 0 -2px 8px rgba(0 0 0 / 0.18)',
      '&::before': {
        background:
          'linear-gradient(125deg, rgba(255 255 255 / 0.55) 0%, rgba(255 255 255 / 0.18) 26%, transparent 50%)',
      },
      '&:hover': {
        transform: 'translateY(-3px) scale(1.025)',
        boxShadow:
          '0 18px 44px rgba(var(--joy-palette-primary-mainChannel) / 0.52), 0 4px 14px rgba(var(--joy-palette-primary-mainChannel) / 0.36), inset 0 1px 0 rgba(255 255 255 / 0.45), inset 0 -2px 8px rgba(0 0 0 / 0.14)',
      },
    };
  }

  return {
    color: 'text.primary',
    background: isHighlighted
      ? `linear-gradient(160deg,
          rgba(255 255 255 / 0.55) 0%,
          rgba(255 255 255 / 0.28) 28%,
          rgba(var(--joy-palette-primary-lightChannel) / 0.22) 68%,
          rgba(var(--joy-palette-primary-mainChannel) / 0.14) 100%)`
      : `linear-gradient(160deg,
          rgba(255 255 255 / 0.6) 0%,
          rgba(255 255 255 / 0.32) 32%,
          var(--agi-shell-bg, rgba(var(--joy-palette-background-popupChannel) / 0.82)) 70%,
          rgba(var(--joy-palette-primary-mainChannel) / 0.12) 100%)`,
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid',
    borderColor: isHighlighted
      ? 'rgba(var(--joy-palette-primary-mainChannel) / 0.4)'
      : 'rgba(255 255 255 / 0.45)',
    boxShadow: isHighlighted
      ? '0 10px 32px rgba(var(--joy-palette-primary-mainChannel) / 0.22), 0 2px 8px rgba(var(--joy-palette-primary-mainChannel) / 0.12), inset 0 1px 0 rgba(255 255 255 / 0.55), inset 0 -1px 0 rgba(var(--joy-palette-primary-mainChannel) / 0.08)'
      : '0 8px 28px rgba(var(--joy-palette-primary-mainChannel) / 0.14), 0 2px 6px rgba(15 23 42 / 0.04), inset 0 1px 0 rgba(255 255 255 / 0.7), inset 0 -1px 0 rgba(var(--joy-palette-primary-mainChannel) / 0.06)',
    '&::before': {
      background:
        'linear-gradient(125deg, rgba(255 255 255 / 0.85) 0%, rgba(255 255 255 / 0.22) 22%, transparent 48%)',
    },
    '&::after': {
      background:
        'radial-gradient(120% 80% at 50% 110%, rgba(var(--joy-palette-primary-mainChannel) / 0.16) 0%, transparent 60%)',
    },
    '[data-joy-color-scheme="dark"] &': {
      borderColor: isHighlighted
        ? 'rgba(var(--joy-palette-primary-mainChannel) / 0.42)'
        : 'rgba(255 255 255 / 0.12)',
      background: isHighlighted
        ? `linear-gradient(160deg,
            rgba(255 255 255 / 0.1) 0%,
            rgba(255 255 255 / 0.05) 30%,
            rgba(var(--joy-palette-primary-mainChannel) / 0.18) 100%)`
        : `linear-gradient(160deg,
            rgba(255 255 255 / 0.08) 0%,
            rgba(255 255 255 / 0.03) 30%,
            var(--agi-shell-bg) 70%,
            rgba(var(--joy-palette-primary-mainChannel) / 0.14) 100%)`,
      boxShadow: isHighlighted
        ? '0 10px 32px rgba(var(--joy-palette-primary-mainChannel) / 0.32), inset 0 1px 0 rgba(255 255 255 / 0.18)'
        : '0 8px 28px rgba(0 0 0 / 0.4), inset 0 1px 0 rgba(255 255 255 / 0.14)',
    },
    '[data-joy-color-scheme="dark"] &::before': {
      background:
        'linear-gradient(125deg, rgba(255 255 255 / 0.28) 0%, rgba(255 255 255 / 0.08) 24%, transparent 46%)',
    },
    '&:hover': {
      transform: 'translateY(-3px)',
      borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.5)',
      boxShadow: '0 14px 40px rgba(var(--joy-palette-primary-mainChannel) / 0.22), 0 4px 12px rgba(var(--joy-palette-primary-mainChannel) / 0.12), inset 0 1px 0 rgba(255 255 255 / 0.75)',
    },
    '&:active': {
      transform: 'translateY(-1px)',
    },
  };
}

function Tile(props: {
  text?: string;
  imageUrl?: string;
  symbol?: string;
  isActive: boolean;
  isEditMode: boolean;
  isHidden?: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
  sx?: SxProps;
}) {
  const isSelected = !props.isEditMode && props.isActive;

  return (
    <Button
      variant={isSelected ? 'solid' : 'plain'}
      color={isSelected || props.isHighlighted ? 'primary' : TILE_ACTIVE_COLOR}
      onClick={props.onClick}
      sx={{
        '--Button-gap': '0px',
        position: 'relative',
        aspectRatio: 1,
        width: `${tileSize}rem`,
        height: `${tileSize}rem`,
        minWidth: `${tileSize}rem`,
        maxWidth: `${tileSize}rem`,
        p: 0,
        overflow: 'hidden',
        borderRadius: 'md',
        isolation: 'isolate',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        gap: 0,
        fontWeight: 'md',
        lineHeight: 'xs',
        whiteSpace: 'normal',
        transition: 'transform 0.24s cubic-bezier(.4,0,.2,1), box-shadow 0.24s ease, border-color 0.24s ease',
        // Specular glass reflection (diagonal sheen + bottom depth)
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 0,
          background: 'linear-gradient(0deg, rgba(0 0 0 / 0.04) 0%, transparent 35%)',
        },
        '& > *': { position: 'relative', zIndex: 1 },
        ...personaTileGlassSx(isSelected, !!props.isHighlighted),
        ...props.sx,
      }}
    >
      {props.isEditMode && (
        <Checkbox
          variant="soft"
          color={TILE_ACTIVE_COLOR}
          checked={!props.isHidden}
          sx={{ position: 'absolute', left: `${tileGap}rem`, top: `${tileGap}rem`, zIndex: 2 }}
        />
      )}

      {/* Icon zone (upper ~58%) */}
      <Box
        sx={{
          flex: '1 1 58%',
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: props.isEditMode ? 1.75 : 1.25,
          px: 0.5,
          filter: isSelected ? 'drop-shadow(0 3px 8px rgba(0 0 0 / 0.22))' : 'none',
        }}
      >
        {props.imageUrl ? (
          <Box
            component="img"
            src={props.imageUrl}
            alt=""
            sx={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: 'sm',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 6px 16px rgba(var(--joy-palette-primary-mainChannel) / 0.22), inset 0 1px 0 rgba(255 255 255 / 0.4)',
              border: '1px solid rgba(255 255 255 / 0.28)',
            }}
          />
        ) : (
          <Box
            component="span"
            sx={{
              fontSize: '2.4rem',
              lineHeight: 1,
              flexShrink: 0,
              filter: 'drop-shadow(0 1px 3px rgba(0 0 0 / 0.14))',
            }}
          >
            {props.symbol}
          </Box>
        )}
      </Box>

      {/* Label zone - transparent, sits seamlessly on the tile glass */}
      <Box
        sx={{
          flex: '0 0 42%',
          minHeight: 0,
          maxHeight: '42%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 0.75,
          pb: 0.85,
          pt: 0.5,
          background: 'transparent',
        }}
      >
        {!!props.text && (
          <Typography
            sx={{
              width: '100%',
              textAlign: 'center',
              fontFamily: 'display',
              fontWeight: 600,
              fontSize: '0.8125rem',
              letterSpacing: '-0.012em',
              color: 'inherit',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              wordBreak: 'break-word',
              textShadow: isSelected ? '0 1px 2px rgba(0 0 0 / 0.24)' : 'none',
            }}
          >
            {props.text}
          </Typography>
        )}
      </Box>
    </Button>
  );
}

/**
 * Purpose selector for the current chat. Clicking on any item activates it for the current chat.
 */
export function PersonaSelector(props: { conversationId: DConversationId; isMobile: boolean; runExample: (example: SystemPurposeExample) => void }) {
  // state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredIDs, setFilteredIDs] = React.useState<string[] | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [showBuiltins, setShowBuiltins] = React.useState<boolean>(true);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => setShowBuiltins(window.localStorage.getItem('personaShowBuiltins') !== 'false');
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'personaShowBuiltins') read();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [userPersonas, setUserPersonas] = React.useState<
    Array<{
      id: string;
      name: string | null;
      systemPrompt: string;
      pictureUrl: string | null;
      symbol?: string | null;
      inputProvenance: any | null;
      inputText: string | null;
      llmLabel: string | null;
      created: Date;
      updated: Date;
    }>
  >([]);
  const [loadingPersonas, setLoadingPersonas] = React.useState(false);

  // external state
  const { complexityMode, showPersonaFinder } = useUIPreferencesStore(
    useShallow((state) => ({
      complexityMode: state.complexityMode,
      showPersonaFinder: state.showPersonaFinder,
    })),
  );
  const [showExamples, showExamplescomponent] = useChipBoolean('Examples', complexityMode === 'extra' && !props.isMobile);
  const [showPrompt, showPromptComponent] = useChipBoolean('Prompt', false);
  const { systemPurposeId, setSystemPurposeId } = useChatStore(
    useShallow((state) => {
      const conversation = state.conversations.find((conversation) => conversation.id === props.conversationId);
      return {
        systemPurposeId: conversation ? conversation.systemPurposeId : null,
        setSystemPurposeId: conversation ? state.setSystemPurposeId : null,
      };
    }),
  );
  const { hiddenPurposeIDs, toggleHiddenPurposeId } = usePurposeStore(
    useShallow((state) => ({
      hiddenPurposeIDs: state.hiddenPurposeIDs,
      toggleHiddenPurposeId: state.toggleHiddenPurposeId,
    })),
  );
  const { domainModelId: chatLLMId } = useModelDomain('primaryChat');
  const chatLLM = { id: chatLLMId ?? undefined }; // adapter for porting
  const systemPersonaCatalog = useSystemPersonaCatalog();
  const setPersonasCache = usePersonaCacheStore((state) => state.setPersonas);
  const personaCacheById = usePersonaCacheStore((state) => state.byId);

  // derived state

  const isCustomPurpose = systemPurposeId === 'Custom';
  const isYouTubeTranscriber = systemPurposeId === 'YouTubeTranscriber';

  const { selectedPurpose, fourExamples } = React.useMemo(() => {
    let selectedPurpose: SystemPurposeData | null = null;
    if (systemPurposeId) {
      if (isCustomPersonaPurposeId(systemPurposeId)) {
        // Resolve user-created persona from cache (or the just-loaded list) into the SystemPurposeData shape
        const personaId = getPersonaIdFromPurposeId(systemPurposeId);
        const cached = personaId ? personaCacheById[personaId] : undefined;
        const fromList = personaId ? userPersonas.find((p) => p.id === personaId) : undefined;
        if (cached || fromList) {
          selectedPurpose = {
            title: cached?.name || fromList?.name || 'My Persona',
            description: 'Custom persona from your Persona Manager.',
            systemMessage: cached?.systemPrompt || fromList?.systemPrompt || '',
            symbol: cached?.symbol || fromList?.symbol || '🎭',
            imageUri: fromList?.pictureUrl || undefined,
          };
        }
      } else if (systemPurposeId === 'Custom') {
        selectedPurpose = getSystemPurpose(systemPurposeId);
      } else {
        selectedPurpose = systemPersonaCatalog[systemPurposeId] ?? getSystemPurpose(systemPurposeId);
      }
    }
    const fourExamples = selectedPurpose?.examples?.slice(0, 4) ?? null;
    return { selectedPurpose, fourExamples };
  }, [personaCacheById, systemPersonaCatalog, systemPurposeId, userPersonas]);

  const unfilteredPurposeIDs = filteredIDs && showPersonaFinder ? filteredIDs : Object.keys(systemPersonaCatalog);
  const visiblePurposeIDs = editMode ? unfilteredPurposeIDs : unfilteredPurposeIDs.filter((id) => !hiddenPurposeIDs.includes(id));
  const hidePersonaCreator = hiddenPurposeIDs.includes(PURPOSE_ID_PERSONA_CREATOR);

  // Handlers

  const handlePurposeChanged = React.useCallback(
    (purposeId: string | null) => {
      if (purposeId && setSystemPurposeId) {
        setSystemPurposeId(props.conversationId, purposeId as ConversationPurposeId);
        // Clear custom symbol so built-in symbol shows in titles
        useChatStore.getState().setUserSymbol(props.conversationId, null);
      }
    },
    [props.conversationId, setSystemPurposeId],
  );

  const handleAppendTranscriptAsMessage = React.useCallback(
    (messageText: string) => {
      // Create a new message object
      const newMessage = createDMessageTextContent('assistant', messageText); // [chat] append assistant:YouTube transcript

      // Append the new message to the conversation
      useChatStore.getState().appendMessage(props.conversationId, newMessage);
    },
    [props.conversationId],
  );

  const handleCustomSystemMessageChange = React.useCallback((v: React.ChangeEvent<HTMLTextAreaElement>): void => {
    // TODO: persist this change? Right now it's reset every time.
    //       maybe we shall have a "save" button just save on a state to persist between sessions
    setCustomSystemPurposeMessage(v.target.value);
  }, []);

  const handleSwitchToCustom = React.useCallback(
    (customText: string) => {
      if (setSystemPurposeId) {
        setCustomSystemPurposeMessage(customText);
        setSystemPurposeId(props.conversationId, 'Custom');
      }
    },
    [props.conversationId, setSystemPurposeId],
  );

  const toggleEditMode = React.useCallback(() => setEditMode((on) => !on), []);

  const handleSelectUserPersona = React.useCallback(
    (personaId: string) => {
      if (!setSystemPurposeId) return;
      const purposeId = `${CUSTOM_PERSONA_PREFIX}${personaId}` as ConversationPurposeId;
      setSystemPurposeId(props.conversationId, purposeId);
      // Clear any prior per-conversation symbol so the persona's own symbol (resolved from cache) wins
      useChatStore.getState().setUserSymbol(props.conversationId, null);
    },
    [props.conversationId, setSystemPurposeId],
  );

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoadingPersonas(true);
    apiAsyncNode.persona.list
      .query()
      .then((items) => {
        if (cancelled) return;
        setUserPersonas(items);
        // Mirror items into the global persona cache so the rest of the app (drawer items,
        // message avatars, ConversationHandler system-message resolution) can look them up by id.
        setPersonasCache(items.map((p) => ({ id: p.id, name: p.name, systemPrompt: p.systemPrompt, symbol: p.symbol })));
      })
      .catch(() => {
        if (!cancelled) setUserPersonas([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPersonas(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setPersonasCache]);

  // Search (filtering)

  const handleSearchClear = React.useCallback(() => {
    setSearchQuery('');
    setFilteredIDs(null);
  }, []);

  const handleSearchOnChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      if (!query) return handleSearchClear();

      // Filter results based on search term (title and description)
      const lcQuery = query.toLowerCase();
      const ids = Object.keys(systemPersonaCatalog).filter((key) => {
        const purpose = systemPersonaCatalog[key];
        return (
          purpose.title.toLowerCase().includes(lcQuery) || (typeof purpose.description === 'string' && purpose.description.toLowerCase().includes(lcQuery))
        );
      });

      setSearchQuery(query);
      setFilteredIDs(ids);

      // If there's a search term, activate the first item
      // if (ids.length && systemPurposeId && !ids.includes(systemPurposeId))
      //   handlePurposeChanged(ids[0] as SystemPurposeId);
    },
    [handleSearchClear, systemPersonaCatalog],
  );

  const handleSearchOnKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key == 'Escape') handleSearchClear();
    },
    [handleSearchClear],
  );

  // safety check - shouldn't happen - this is set to null when the conversation is not found
  if (!setSystemPurposeId) return null;

  return (
    <Box
      sx={{
        maxWidth: 'md',
        minWidth: `${2 + 1 + tileSize * 2}rem`, // accomodate at least 2 columns (scroll-x in case)
        mx: 'auto',
        minHeight: '90%', // was 60svh - looked too big on desktop stacked
        display: 'grid',
        px: { xs: 0.5, sm: 1, md: 2 },
        py: 2,
      }}
    >
      {showPersonaFinder && (
        <Box>
          <Input
            fullWidth
            variant="outlined"
            color="neutral"
            value={searchQuery}
            onChange={handleSearchOnChange}
            onKeyDown={handleSearchOnKeyDown}
            placeholder="Search for purpose…"
            startDecorator={<SearchIcon />}
            endDecorator={
              searchQuery && (
                <IconButton onClick={handleSearchClear}>
                  <ClearIcon />
                </IconButton>
              )
            }
            sx={{
              boxShadow: 'sm',
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          my: 'auto',
          // layout
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${tileSize}rem, ${tileSize}rem))`,
          justifyContent: 'center',
          gap: `${tileGap}rem`,
        }}
      >
        {/* [row 0] ...  Edit mode [ ] */}
        <Box
          sx={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography level="title-sm">AI Persona</Typography>
          <Tooltip disableInteractive title={editMode ? 'Done Editing' : 'Edit Tiles'}>
            <IconButton size="sm" onClick={toggleEditMode} sx={{ my: '-0.25rem' /* absorb the button padding */ }}>
              {editMode ? <DoneIcon /> : <EditRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* My Personas (from DB) - behave like built-ins: clicking selects, no editable prompt */}
        {!!userPersonas.length && (
          <>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography level="body-sm">My Personas</Typography>
            </Box>
            {userPersonas.map((p) => {
              const purposeId = `${CUSTOM_PERSONA_PREFIX}${p.id}` as ConversationPurposeId;
              const isActive = systemPurposeId === purposeId;
              return (
                <Tile
                  key={`user-persona-${p.id}`}
                  text={p.name || p.llmLabel || 'Persona'}
                  imageUrl={p.pictureUrl || undefined}
                  symbol={p.symbol || (p.pictureUrl ? undefined : '🎭')}
                  isActive={isActive}
                  isEditMode={false}
                  isHidden={false}
                  onClick={() => handleSelectUserPersona(p.id)}
                />
              );
            })}
          </>
        )}

        {/* Personas Tiles (built-ins); can be hidden via dashboard switch */}
        {showBuiltins &&
          visiblePurposeIDs.map((spId) => {
            const isActive = systemPurposeId === spId;
            const systemPurpose = systemPersonaCatalog[spId];
            return (
              <Tile
                key={'tile-' + spId}
                text={systemPurpose?.title}
                imageUrl={systemPurpose?.imageUri}
                symbol={systemPurpose?.symbol}
                isActive={isActive}
                isEditMode={editMode}
                isHidden={hiddenPurposeIDs.includes(spId)}
                isHighlighted={systemPurpose?.highlighted}
                onClick={() => (editMode ? toggleHiddenPurposeId(spId) : handlePurposeChanged(spId))}
              />
            );
          })}

        {/* Persona Creator Tile */}
        {(editMode || !hidePersonaCreator) && (
          <Tile
            text="Persona Creator"
            symbol="🎭"
            isActive={false}
            isEditMode={editMode}
            isHidden={hidePersonaCreator}
            onClick={() => (editMode ? toggleHiddenPurposeId(PURPOSE_ID_PERSONA_CREATOR) : void navigateToPersonas())}
            sx={{
              fontSize: 'xs',
              background:
                'linear-gradient(168deg, rgba(255 255 255 / 0.2) 0%, var(--joy-palette-neutral-softBg) 55%, rgba(var(--joy-palette-neutral-mainChannel) / 0.08) 100%)',
              borderColor: 'var(--joy-palette-neutral-outlinedBorder)',
              '&::before': {
                background:
                  'linear-gradient(125deg, rgba(255 255 255 / 0.45) 0%, transparent 42%)',
              },
            }}
          />
        )}

        {/* [row -3] Description */}
        <Box sx={{ gridColumn: '1 / -1', mt: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {/* Description*/}
          <Typography level="body-sm" sx={{ color: 'text.primary' }}>
            {!selectedPurpose
              ? 'Cannot find the former persona' + (systemPurposeId ? ` "${systemPurposeId}"` : '')
              : selectedPurpose?.description || 'No description available'}
          </Typography>

          {/* Examples/Prompt Toggles */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {fourExamples && showExamplescomponent}
            {!isCustomPurpose && showPromptComponent}
          </Box>
        </Box>

        {/* [row -3] Example incipits */}
        {systemPurposeId !== 'Custom' && (
          <Box sx={{ gridColumn: '1 / -1', pt: 1 }}>
            <ExpanderControlledBox expanded={showExamples || (!isCustomPurpose && showPrompt)}>
              {showExamples && (
                <List
                  aria-label="Persona Conversation Starters"
                  sx={{
                    // example items 2-col layout
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(${tileSize * 3 + 1}rem, 1fr))`,
                    gap: 1,
                  }}
                >
                  {fourExamples?.map((example, idx) => (
                    <ListItem
                      key={idx}
                      variant="outlined"
                      sx={{
                        // padding: '0.25rem 0.5rem',
                        backgroundColor: 'background.popup',
                        borderRadius: 'md',
                        boxShadow: 'xs',
                        '& svg': { opacity: 0.1, transition: 'opacity 0.2s' },
                        '&:hover svg': { opacity: 1 },
                      }}
                    >
                      <ListItemButton onClick={() => props.runExample(example)} sx={{ justifyContent: 'space-between', borderRadius: 'md' }}>
                        <Typography level="body-sm">
                          {/* Icon 📁 when the .action is 'require-data-attachment' */}
                          {typeof example === 'object' && example.action === 'require-data-attachment' ? '📁 ' : ''}
                          {typeof example === 'string' ? example : example.prompt}
                        </Typography>
                        <TelegramIcon color="primary" sx={{}} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
              {!isCustomPurpose && showPrompt && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography level="title-sm">System Prompt</Typography>
                      <Button
                        variant="plain"
                        color="neutral"
                        size="sm"
                        endDecorator={<EditNoteIcon />}
                        onClick={() => handleSwitchToCustom(bareBonesPromptMixer(selectedPurpose?.systemMessage || 'No system message available', chatLLM?.id))}
                        sx={{ ml: 'auto', my: '-0.25rem' /* absorb the button padding */ }}
                      >
                        Custom
                      </Button>
                    </Box>
                    <Typography level="body-sm" sx={{ whiteSpace: 'break-spaces' }}>
                      {bareBonesPromptMixer(selectedPurpose?.systemMessage || 'No system message available', chatLLM?.id)}
                    </Typography>
                    {!!selectedPurpose?.systemMessageNotes && (
                      <Alert sx={{ m: -1, mt: 1, p: 1 }}>
                        <Typography level="body-xs">Prompt notes: {selectedPurpose.systemMessageNotes}</Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </ExpanderControlledBox>
          </Box>
        )}

        {/* [row -1] Custom Prompt box */}
        {systemPurposeId === 'Custom' && (
          <Textarea
            autoFocus
            variant="outlined"
            placeholder="Craft your custom system message here…"
            minRows={3}
            defaultValue={SystemPurposes['Custom']?.systemMessage}
            onChange={handleCustomSystemMessageChange}
            endDecorator={
              <Alert sx={{ flex: 1, p: 1 }}>
                <Typography level="body-xs">Just start chatting when done.</Typography>
              </Alert>
            }
            sx={{
              gridColumn: '1 / -1',
              backgroundColor: 'background.surface',
              '&:focus-within': {
                backgroundColor: 'background.popup',
              },
              lineHeight: lineHeightTextareaMd,
            }}
          />
        )}

        {/* [row -1] YouTube URL */}
        {isYouTubeTranscriber && (
          <YouTubeURLInput
            onSubmit={handleAppendTranscriptAsMessage}
            sx={{
              gridColumn: '1 / -1',
            }}
          />
        )}
      </Box>
    </Box>
  );
}
