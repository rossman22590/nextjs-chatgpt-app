import * as React from 'react';

import { Box, MenuItem, Radio, Typography } from '@mui/joy';

import { CloseableMenu } from '~/common/components/CloseableMenu';
import { KeyStroke, platformAwareKeystrokes } from '~/common/components/KeyStroke';
import { useUIPreferencesStore } from '~/common/state/store-ui';

import { ChatModeId } from '../../AppChat';
const isBeamEnabled = false; // Set this to true if you want to enable Beam mode

interface ChatModeDescription {
  label: string;
  description: string | React.JSX.Element;
  highlight?: boolean;
  shortcut?: string;
  hideOnDesktop?: boolean;
  requiresTTI?: boolean;
}
type ChatModeItemsType = {
  'generate-text': ChatModeDescription;
  'generate-text-beam'?: ChatModeDescription; // Make it optional
  'append-user': ChatModeDescription;
  'generate-image': ChatModeDescription;
  'generate-react': ChatModeDescription;
};

const ChatModeItems: ChatModeItemsType = {
  'generate-text': {
    label: 'Chat',
    description: 'Persona replies',
  },
  ...(isBeamEnabled ? {
    'generate-text-beam': {
      label: 'Beam',
      description: 'Combine multiple models',
      shortcut: 'Ctrl + Enter',
      hideOnDesktop: true,
    },
  } : {}),
  'append-user': {
    label: 'Write',
    description: 'Append a message',
    shortcut: 'Alt + Enter',
  },
  'generate-image': {
    label: 'Draw',
    description: 'AI Image Generation',
    requiresTTI: true,
  },
  'generate-react': {
    label: 'Reason + Act',
    description: 'Answer questions in multiple steps',
  },
};

function fixNewLineShortcut(shortcut: string, enterIsNewLine: boolean) {
  if (shortcut === 'ENTER')
    return enterIsNewLine ? 'Shift + Enter' : 'Enter';
  return shortcut;
}

export function ChatModeMenu(props: {
  isMobile: boolean,
  anchorEl: HTMLAnchorElement | null,
  onClose: () => void,
  chatModeId: ChatModeId,
  onSetChatModeId: (chatMode: ChatModeId) => void,
  capabilityHasTTI: boolean,
}) {

  // external state
  const enterIsNewline = useUIPreferencesStore(state => state.enterIsNewline);

  return (
    <CloseableMenu
      placement='top-end'
      open anchorEl={props.anchorEl} onClose={props.onClose}
      sx={{ minWidth: 320 }}
    >

      {/*<MenuItem color='neutral' selected>*/}
      {/*  Conversation Mode*/}
      {/*</MenuItem>*/}
      {/**/}
      {/*<ListDivider />*/}

      {/* ChatMode items */}
      {Object.entries(ChatModeItems)
        .filter(([_key, data]) => !data.hideOnDesktop || props.isMobile)
        .map(([key, data]) =>
          <MenuItem key={'chat-mode-' + key} onClick={() => props.onSetChatModeId(key as ChatModeId)}>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Radio color={data.highlight ? 'success' : undefined} checked={key === props.chatModeId} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography>{data.label}</Typography>
                <Typography level='body-xs'>{data.description}{(data.requiresTTI && !props.capabilityHasTTI) ? 'Unconfigured' : ''}</Typography>
              </Box>
              {(key === props.chatModeId || !!data.shortcut) && (
                <KeyStroke combo={platformAwareKeystrokes(fixNewLineShortcut((key === props.chatModeId) ? 'ENTER' : data.shortcut ? data.shortcut : 'ENTER', enterIsNewline))} />
              )}
            </Box>
          </MenuItem>)}

    </CloseableMenu>
  );
}