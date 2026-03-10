import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';

import type { SxProps } from '@mui/joy/styles/types';
import { Alert, Avatar, Box, Button, Card, CardContent, Checkbox, IconButton, Input, List, ListItem, ListItemButton, Textarea, Tooltip, Typography } from '@mui/joy';
import ClearIcon from '@mui/icons-material/Clear';
import DoneIcon from '@mui/icons-material/Done';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import TelegramIcon from '@mui/icons-material/Telegram';

import { SystemPurposeData, SystemPurposeExample, SystemPurposeId, SystemPurposes } from '../../../../data';

import { YouTubeURLInput } from '~/modules/youtube/YouTubeURLInput';
import { bareBonesPromptMixer } from '~/modules/persona/pmix/pmix';

import { CUSTOM_PERSONA_PREFIX, getPersonaIdFromPurposeId, isCustomPersonaPurposeId } from '~/common/stores/chat/chat.conversation';
import type { DConversationId } from '~/common/stores/chat/chat.conversation';
import { usePersonaCacheStore } from '~/common/stores/chat/store-persona-cache';
import { ExpanderControlledBox } from '~/common/components/ExpanderControlledBox';
import { createDMessageTextContent } from '~/common/stores/chat/chat.message';
import { lineHeightTextareaMd } from '~/common/app.theme';
import { navigateToPersonas } from '~/common/app.routes';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useChipBoolean } from '~/common/components/useChipBoolean';
import { useModelDomain } from '~/common/stores/llms/hooks/useModelDomain';
import { useUIPreferencesStore } from '~/common/stores/store-ui';
import { apiAsyncNode } from '~/common/util/trpc.client';

import { usePurposeStore } from './store-purposes';


// 'special' purpose IDs, for tile hiding purposes
const PURPOSE_ID_PERSONA_CREATOR = '__persona-creator__';
const TILE_ACTIVE_COLOR = 'primary' as const;

const tileGap = 0.75; // rem


function Tile(props: {
  text?: string,
  imageUrl?: string,
  symbol?: string,
  isActive: boolean,
  isEditMode: boolean,
  isHidden?: boolean,
  isHighlighted?: boolean,
  onClick: () => void,
  sx?: SxProps,
}) {
  const isActiveCard = !props.isEditMode && props.isActive;

  return (
    <Box
      component='button'
      onClick={props.onClick}
      aria-pressed={isActiveCard}
      sx={{
        // reset button
        border: 'none',
        font: 'inherit',
        cursor: 'pointer',
        outline: 'none',
        padding: 0,
        textAlign: 'left',

        // card layout
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: '0.875rem 0.5rem 0.75rem',
        borderRadius: '16px',

        // transitions
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease',

        ...(props.isHidden && props.isEditMode && { opacity: 0.38 }),

        ...(isActiveCard ? {
          background: 'linear-gradient(145deg, #a020f0 0%, #c934b8 55%, #e040a0 100%)',
          boxShadow: '0 6px 24px rgba(160 32 240 / 0.35), 0 2px 8px rgba(160 32 240 / 0.2)',
          color: '#fff',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 10px 28px rgba(160 32 240 / 0.42)',
          },
          '&:active': { transform: 'translateY(-1px)' },
          '&:focus-visible': { outline: '2px solid rgba(255 255 255 / 0.7)', outlineOffset: 2 },
        } : props.isHighlighted ? {
          background: 'rgba(160 32 240 / 0.08)',
          boxShadow: '0 2px 10px rgba(160 32 240 / 0.1)',
          border: '1.5px solid rgba(160 32 240 / 0.22)',
          color: 'var(--joy-palette-text-primary)',
          '&:hover': {
            background: 'rgba(160 32 240 / 0.14)',
            borderColor: 'rgba(160 32 240 / 0.38)',
            transform: 'translateY(-3px)',
            boxShadow: '0 6px 18px rgba(160 32 240 / 0.18)',
          },
          '&:active': { transform: 'translateY(-1px)' },
          '&:focus-visible': { outline: '2px solid rgba(160 32 240 / 0.5)', outlineOffset: 2 },
        } : {
          background: 'var(--joy-palette-background-popup)',
          boxShadow: '0 2px 10px rgba(120 40 180 / 0.07)',
          border: '1.5px solid rgba(120 60 200 / 0.1)',
          color: 'var(--joy-palette-text-primary)',
          '&:hover': {
            background: 'rgba(160 32 240 / 0.06)',
            borderColor: 'rgba(160 32 240 / 0.28)',
            transform: 'translateY(-3px)',
            boxShadow: '0 6px 18px rgba(120 40 180 / 0.13)',
          },
          '&:active': { transform: 'translateY(-1px)' },
          '&:focus-visible': { outline: '2px solid rgba(160 32 240 / 0.5)', outlineOffset: 2 },
        }),

        ...props.sx,
      }}
    >
      {/* Edit mode checkbox */}
      {props.isEditMode && (
        <Checkbox
          variant='soft' color={TILE_ACTIVE_COLOR}
          checked={!props.isHidden}
          sx={{ position: 'absolute', left: '0.5rem', top: '0.5rem', pointerEvents: 'none' }}
        />
      )}

      {/* Emoji / image */}
      <Avatar
        variant='plain'
        src={props.imageUrl}
        sx={{
          '--Avatar-size': '2.75rem',
          fontSize: '1.75rem',
          borderRadius: props.imageUrl ? 'md' : 0,
          background: 'transparent',
          boxShadow: (props.imageUrl && !isActiveCard) ? '0 2px 8px rgba(0 0 0 / 0.1)' : 'none',
          filter: (props.isHidden && props.isEditMode) ? 'grayscale(1)' : 'none',
        }}
      >
        {props.symbol}
      </Avatar>

      {/* Title */}
      <Box sx={{
        width: '100%',
        fontSize: '0.72rem',
        fontWeight: isActiveCard ? 700 : 500,
        lineHeight: 1.25,
        textAlign: 'center',
        color: isActiveCard ? '#fff' : 'var(--joy-palette-text-primary)',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        hyphens: 'auto',
        px: '2px',
      }}>
        {props.text}
      </Box>
    </Box>
  );
}


/**
 * Purpose selector for the current chat. Clicking on any item activates it for the current chat.
 */
export function PersonaSelector(props: {
  conversationId: DConversationId,
  isMobile: boolean,
  runExample: (example: SystemPurposeExample) => void,
}) {

  // state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredIDs, setFilteredIDs] = React.useState<SystemPurposeId[] | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [showBuiltins, setShowBuiltins] = React.useState<boolean>(true);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => setShowBuiltins(window.localStorage.getItem('personaShowBuiltins') !== 'false');
    read();
    const onStorage = (e: StorageEvent) => { if (e.key === 'personaShowBuiltins') read(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [userPersonas, setUserPersonas] = React.useState<Array<{
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
  }>>([]);
  const [loadingPersonas, setLoadingPersonas] = React.useState(false);


  // external state
  const { complexityMode, showPersonaFinder } = useUIPreferencesStore(useShallow(state => ({
    complexityMode: state.complexityMode,
    showPersonaFinder: state.showPersonaFinder,
  })));
  const [showExamples, showExamplescomponent] = useChipBoolean('Examples', complexityMode === 'extra' && !props.isMobile);
  const [showPrompt, showPromptComponent] = useChipBoolean('Prompt', false);
  const { systemPurposeId, setSystemPurposeId } = useChatStore(useShallow(state => {
    const conversation = state.conversations.find(conversation => conversation.id === props.conversationId);
    return {
      systemPurposeId: conversation ? conversation.systemPurposeId : null,
      setSystemPurposeId: conversation ? state.setSystemPurposeId : null,
    };
  }));
  const { hiddenPurposeIDs, toggleHiddenPurposeId } = usePurposeStore(useShallow(state => ({
    hiddenPurposeIDs: state.hiddenPurposeIDs,
    toggleHiddenPurposeId: state.toggleHiddenPurposeId,
  })));
  const getPersonaFromCache = usePersonaCacheStore(state => state.getPersona);
  const cachedCustomPersona = systemPurposeId && isCustomPersonaPurposeId(systemPurposeId)
    ? getPersonaFromCache(getPersonaIdFromPurposeId(systemPurposeId)!)
    : null;
  const { domainModelId: chatLLMId } = useModelDomain('primaryChat');
  const chatLLM = { id: chatLLMId ?? undefined }; // adapter for porting


  // derived state

  const isCustomPurpose = systemPurposeId === 'Custom';
  const isYouTubeTranscriber = systemPurposeId === 'YouTubeTranscriber';

  const { selectedPurpose, fourExamples } = React.useMemo(() => {
    const selectedPurpose: SystemPurposeData | null = systemPurposeId && !isCustomPersonaPurposeId(systemPurposeId)
      ? (SystemPurposes[systemPurposeId as SystemPurposeId] ?? null)
      : null;
    // const selectedExample = selectedPurpose?.examples?.length
    //   ? selectedPurpose.examples[Math.floor(Math.random() * selectedPurpose.examples.length)]
    //   : null;
    const fourExamples = selectedPurpose?.examples?.slice(0, 4) ?? null;
    return { selectedPurpose, fourExamples };
  }, [systemPurposeId]);


  const unfilteredPurposeIDs = (filteredIDs && showPersonaFinder) ? filteredIDs : Object.keys(SystemPurposes) as SystemPurposeId[];
  const visiblePurposeIDs = editMode ? unfilteredPurposeIDs : unfilteredPurposeIDs.filter(id => !hiddenPurposeIDs.includes(id));
  const hidePersonaCreator = hiddenPurposeIDs.includes(PURPOSE_ID_PERSONA_CREATOR);


  // Handlers

  const handlePurposeChanged = React.useCallback((purposeId: SystemPurposeId | null) => {
    if (purposeId && setSystemPurposeId) {
      setSystemPurposeId(props.conversationId, purposeId);
      // Clear custom symbol so built-in symbol shows in titles
      useChatStore.getState().setUserSymbol(props.conversationId, null);
    }
  }, [props.conversationId, setSystemPurposeId]);

  const handleAppendTranscriptAsMessage = React.useCallback((messageText: string) => {
    // Create a new message object
    const newMessage = createDMessageTextContent('assistant', messageText); // [chat] append assistant:YouTube transcript

    // Append the new message to the conversation
    useChatStore.getState().appendMessage(props.conversationId, newMessage);
  }, [props.conversationId]);


  const handleCustomSystemMessageChange = React.useCallback((v: React.ChangeEvent<HTMLTextAreaElement>): void => {
    // TODO: persist this change? Right now it's reset every time.
    //       maybe we shall have a "save" button just save on a state to persist between sessions
    SystemPurposes['Custom'].systemMessage = v.target.value;
  }, []);

  const handleSwitchToCustom = React.useCallback((customText: string) => {
    if (setSystemPurposeId) {
      SystemPurposes['Custom'].systemMessage = customText;
      setSystemPurposeId(props.conversationId, 'Custom');
    }
  }, [props.conversationId, setSystemPurposeId]);

  const toggleEditMode = React.useCallback(() => setEditMode(on => !on), []);

  const handleApplyPersona = React.useCallback((personaId: string, _systemPrompt: string, symbol?: string | null) => {
    if (setSystemPurposeId) {
      const purposeId = `${CUSTOM_PERSONA_PREFIX}${personaId}` as const;
      setSystemPurposeId(props.conversationId, purposeId);
      useChatStore.getState().setUserSymbol(props.conversationId, symbol ?? null);
    }
  }, [props.conversationId, setSystemPurposeId]);

  const setPersonasCache = usePersonaCacheStore(state => state.setPersonas);
  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoadingPersonas(true);
    apiAsyncNode.persona.list.query()
      .then((items) => {
        if (!cancelled) {
          setUserPersonas(items);
          setPersonasCache(items.map(p => ({ id: p.id, name: p.name, systemPrompt: p.systemPrompt, symbol: p.symbol })));
        }
      })
      .catch(() => { if (!cancelled) setUserPersonas([]); })
      .finally(() => { if (!cancelled) setLoadingPersonas(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, setPersonasCache]);


  // Search (filtering)

  const handleSearchClear = React.useCallback(() => {
    setSearchQuery('');
    setFilteredIDs(null);
  }, []);

  const handleSearchOnChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query)
      return handleSearchClear();

    // Filter results based on search term (title and description)
    const lcQuery = query.toLowerCase();
    const ids = (Object.keys(SystemPurposes) as SystemPurposeId[])
      .filter(key => SystemPurposes.hasOwnProperty(key))
      .filter(key => {
        const purpose = SystemPurposes[key as SystemPurposeId];
        return purpose.title.toLowerCase().includes(lcQuery)
          || (typeof purpose.description === 'string' && purpose.description.toLowerCase().includes(lcQuery));
      });

    setSearchQuery(query);
    setFilteredIDs(ids);

    // If there's a search term, activate the first item
    // if (ids.length && systemPurposeId && !ids.includes(systemPurposeId))
    //   handlePurposeChanged(ids[0] as SystemPurposeId);
  }, [handleSearchClear]);

  const handleSearchOnKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key == 'Escape')
      handleSearchClear();
  }, [handleSearchClear]);


  // safety check - shouldn't happen - this is set to null when the conversation is not found
  if (!setSystemPurposeId)
    return null;


  return (
    <Box sx={{
      maxWidth: 'md',
      minWidth: '14rem',
      mx: 'auto',
      minHeight: '90%',
      display: 'grid',
      px: { xs: 0.5, sm: 1, md: 2 },
      py: 2,
    }}>

      {showPersonaFinder && <Box>
        <Input
          fullWidth
          variant='outlined' color='neutral'
          value={searchQuery} onChange={handleSearchOnChange}
          onKeyDown={handleSearchOnKeyDown}
          placeholder='Search for purpose…'
          startDecorator={<SearchIcon />}
          endDecorator={searchQuery && (
            <IconButton onClick={handleSearchClear}>
              <ClearIcon />
            </IconButton>
          )}
          sx={{
            boxShadow: 'sm',
          }}
        />
      </Box>}


      <Box sx={{
        my: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(6.5rem, 1fr))',
        gap: `${tileGap}rem`,
      }}>

        {/* [row 0] ...  Edit mode [ ] */}
        <Box sx={{
          gridColumn: '1 / -1',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography level='title-sm'>
            AI Persona
          </Typography>
          <Tooltip disableInteractive title={editMode ? 'Done Editing' : 'Edit Tiles'}>
            <IconButton size='sm' onClick={toggleEditMode} sx={{ my: '-0.25rem' /* absorb the button padding */ }}>
              {editMode ? <DoneIcon /> : <EditRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* My Personas (from DB) */}
        {!!userPersonas.length && (
          <>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography level='body-sm'>My Personas</Typography>
            </Box>
            {userPersonas.map(p => (
              <Tile
                key={`user-persona-${p.id}`}
                text={p.name || p.llmLabel || 'Persona'}
                imageUrl={p.pictureUrl || undefined}
                symbol={p.symbol || (p.pictureUrl ? undefined : '🎭')}
                isActive={systemPurposeId === `${CUSTOM_PERSONA_PREFIX}${p.id}`}
                isEditMode={false}
                isHidden={false}
                onClick={() => handleApplyPersona(p.id, p.systemPrompt, p.symbol)}
              />
            ))}
          </>
        )}

        {/* Personas Tiles (built-ins); can be hidden via dashboard switch */}
        {showBuiltins && visiblePurposeIDs.map((spId: SystemPurposeId) => {
          const isActive = systemPurposeId === spId;
          const systemPurpose = SystemPurposes[spId];
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
              onClick={() => editMode ? toggleHiddenPurposeId(spId) : handlePurposeChanged(spId)}
            />
          );
        })}

        {/* Persona Creator Tile */}
        {(editMode || !hidePersonaCreator) && (
          <Tile
            text='Persona Creator'
            symbol='🎭'
            isActive={false}
            isEditMode={editMode}
            isHidden={hidePersonaCreator}
            onClick={() => editMode ? toggleHiddenPurposeId(PURPOSE_ID_PERSONA_CREATOR) : void navigateToPersonas()}
            sx={{
              opacity: 0.7,
            }}
          />
        )}


        {/* [row -3] Description */}
        <Box sx={{ gridColumn: '1 / -1', mt: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>

          {/* Description: built-in purpose or custom persona from cache */}
          <Typography level='body-sm' sx={{ color: 'text.primary' }}>
            {selectedPurpose
              ? (selectedPurpose.description || 'No description available')
              : cachedCustomPersona
                ? (cachedCustomPersona.name || 'Custom persona')
                : systemPurposeId
                  ? 'Cannot find the former persona' + ` "${systemPurposeId}"`
                  : 'Select a persona above'}
          </Typography>

          {/* Examples/Prompt Toggles: only for built-in (not Custom, not custom persona) */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {fourExamples && showExamplescomponent}
            {!isCustomPurpose && !cachedCustomPersona && showPromptComponent}
          </Box>

        </Box>

        {/* [row -3] Example incipits (built-in only; custom personas have no examples) */}
        {systemPurposeId !== 'Custom' && !cachedCustomPersona && (
          <ExpanderControlledBox expanded={showExamples || (!isCustomPurpose && showPrompt)} sx={{ gridColumn: '1 / -1', pt: 1 }}>
            {showExamples && (
              <List
                aria-label='Persona Conversation Starters'
                sx={{
                  // example items 2-col layout
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(22rem, 1fr))`,
                  gap: 1,
                }}
              >
                {fourExamples?.map((example, idx) => (
                  <ListItem
                    key={idx}
                    variant='outlined'
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
                      <Typography level='body-sm'>
                        {/* Icon 📁 when the .action is 'require-data-attachment' */}
                        {(typeof example === 'object' && example.action === 'require-data-attachment') ? '📁 ' : ''}
                        {(typeof example === 'string') ? example : example.prompt}
                      </Typography>
                      <TelegramIcon color='primary' sx={{}} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
            {(!isCustomPurpose && showPrompt) && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography level='title-sm'>
                      System Prompt
                    </Typography>
                    <Button
                      variant='plain' color='neutral' size='sm'
                      endDecorator={<EditNoteIcon />}
                      onClick={() => handleSwitchToCustom(bareBonesPromptMixer(selectedPurpose?.systemMessage || 'No system message available', chatLLM?.id))}
                      sx={{ ml: 'auto', my: '-0.25rem' /* absorb the button padding */ }}
                    >
                      Custom
                    </Button>
                  </Box>
                  <Typography level='body-sm' sx={{ whiteSpace: 'break-spaces' }}>
                    {bareBonesPromptMixer(selectedPurpose?.systemMessage || 'No system message available', chatLLM?.id)}
                  </Typography>
                  {!!selectedPurpose?.systemMessageNotes && (
                    <Alert sx={{ m: -1, mt: 1, p: 1 }}>
                      <Typography level='body-xs'>
                        Prompt notes: {selectedPurpose.systemMessageNotes}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </ExpanderControlledBox>
        )}

        {/* [row -1] Custom Prompt box */}
        {systemPurposeId === 'Custom' && (
          <Textarea
            autoFocus
            variant='outlined'
            placeholder='Craft your custom system message here…'
            minRows={3}
            defaultValue={SystemPurposes['Custom']?.systemMessage}
            onChange={handleCustomSystemMessageChange}
            endDecorator={
              <Alert sx={{ flex: 1, p: 1 }}>
                <Typography level='body-xs'>
                  Just start chatting when done.
                </Typography>
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