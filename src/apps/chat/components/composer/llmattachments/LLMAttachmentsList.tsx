import * as React from 'react';

import { Box, IconButton, ListDivider, ListItemDecorator, MenuItem } from '@mui/joy';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';

import { CloseableMenu } from '~/common/components/CloseableMenu';
import { ConfirmationModal } from '~/common/components/ConfirmationModal';

import type { AttachmentDraftId } from '~/common/attachment-drafts/attachment.types';
import type { AttachmentDraftsStoreApi } from '~/common/attachment-drafts/store-attachment-drafts-slice';

import type { LLMAttachmentDrafts } from './useLLMAttachmentDrafts';
import { LLMAttachmentButtonMemo } from './LLMAttachmentButton';
import { LLMAttachmentMenu } from './LLMAttachmentMenu';


export type LLMAttachmentDraftsAction = 'inline-text' | 'copy-text';


/**
 * Renderer of attachment drafts, with menus, etc.
 */
export function LLMAttachmentsList(props: {
  attachmentDraftsStoreApi: AttachmentDraftsStoreApi,
  llmAttachmentDrafts: LLMAttachmentDrafts,
  onAttachmentDraftsAction: (attachmentDraftId: AttachmentDraftId | null, actionId: LLMAttachmentDraftsAction) => void,
}) {

  // state
  const [confirmClearAttachmentDrafts, setConfirmClearAttachmentDrafts] = React.useState<boolean>(false);
  const [draftMenu, setDraftMenu] = React.useState<{ anchor: HTMLAnchorElement, attachmentDraftId: AttachmentDraftId } | null>(null);
  const [overallMenuAnchor, setOverallMenuAnchor] = React.useState<HTMLAnchorElement | null>(null);

  // derived state

  const { llmAttachmentDrafts, canInlineSomeFragments } = props.llmAttachmentDrafts;

  const hasAttachments = llmAttachmentDrafts.length >= 1;

  // derived item menu state

  const itemMenuAnchor = draftMenu?.anchor;
  const itemMenuAttachmentDraftId = draftMenu?.attachmentDraftId;
  const itemMenuAttachmentDraft = itemMenuAttachmentDraftId ? llmAttachmentDrafts.find(la => la.attachmentDraft.id === draftMenu.attachmentDraftId) : undefined;
  const itemMenuIndex = itemMenuAttachmentDraft ? llmAttachmentDrafts.indexOf(itemMenuAttachmentDraft) : -1;


  // overall menu

  const { onAttachmentDraftsAction } = props;

  const handleOverallMenuHide = React.useCallback(() => setOverallMenuAnchor(null), []);

  const handleOverallMenuToggle = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.shiftKey && console.log(llmAttachmentDrafts);
    event.preventDefault(); // added for the Right mouse click (to prevent the menu)
    setOverallMenuAnchor(anchor => anchor ? null : event.currentTarget);
  }, [llmAttachmentDrafts]);

  const handleOverallCopyText = React.useCallback(() => {
    handleOverallMenuHide();
    onAttachmentDraftsAction(null, 'copy-text');
  }, [handleOverallMenuHide, onAttachmentDraftsAction]);

  const handleOverallInlineText = React.useCallback(() => {
    handleOverallMenuHide();
    onAttachmentDraftsAction(null, 'inline-text');
  }, [handleOverallMenuHide, onAttachmentDraftsAction]);

  const handleOverallClear = React.useCallback(() => setConfirmClearAttachmentDrafts(true), []);

  const handleOverallClearConfirmed = React.useCallback(() => {
    handleOverallMenuHide();
    setConfirmClearAttachmentDrafts(false);
    props.attachmentDraftsStoreApi.getState().removeAllAttachmentDrafts();
  }, [handleOverallMenuHide, props.attachmentDraftsStoreApi]);


  // item menu

  const handleDraftMenuHide = React.useCallback(() => setDraftMenu(null), []);

  const handleDraftMenuToggle = React.useCallback((attachmentDraftId: AttachmentDraftId, anchor: HTMLAnchorElement) => {
    handleOverallMenuHide();
    setDraftMenu(prev => prev?.attachmentDraftId === attachmentDraftId ? null : { anchor, attachmentDraftId });
  }, [handleOverallMenuHide]);

  const handleDraftAction = React.useCallback((attachmentDraftId: AttachmentDraftId, actionId: LLMAttachmentDraftsAction) => {
    // pass-through, but close the menu as well, as the action is destructive for the caller
    handleDraftMenuHide();
    onAttachmentDraftsAction(attachmentDraftId, actionId);
  }, [handleDraftMenuHide, onAttachmentDraftsAction]);


  // no components without attachments
  if (!hasAttachments)
    return null;

  return <>

    {/* Attachment Drafts bar */}
    <Box sx={{ position: 'relative' }}>

      {/* Horizontally scrollable Attachments */}
      <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, height: '100%', pr: 5 }}>
        {llmAttachmentDrafts.map((llmAttachment) =>
          <LLMAttachmentButtonMemo
            key={llmAttachment.attachmentDraft.id}
            llmAttachment={llmAttachment}
            menuShown={llmAttachment.attachmentDraft.id === itemMenuAttachmentDraftId}
            onToggleMenu={handleDraftMenuToggle}
          />,
        )}
      </Box>

      {/* Overall Menu button */}
      <IconButton
        onClick={handleOverallMenuToggle}
        onContextMenu={handleOverallMenuToggle}
        sx={{
          // borderRadius: 'sm',
          borderRadius: 0,
          position: 'absolute', right: 0, top: 0,
          backgroundColor: 'neutral.softDisabledBg',
        }}
      >
        <ExpandLessIcon />
      </IconButton>

    </Box>


    {/* LLM Draft Menu */}
    {!!itemMenuAnchor && !!itemMenuAttachmentDraft && !!props.attachmentDraftsStoreApi && (
      <LLMAttachmentMenu
        attachmentDraftsStoreApi={props.attachmentDraftsStoreApi}
        llmAttachmentDraft={itemMenuAttachmentDraft}
        menuAnchor={itemMenuAnchor}
        isPositionFirst={itemMenuIndex === 0}
        isPositionLast={itemMenuIndex === llmAttachmentDrafts.length - 1}
        onDraftAction={handleDraftAction}
        onClose={handleDraftMenuHide}
      />
    )}


    {/* All Drafts Menu */}
    {!!overallMenuAnchor && (
      <CloseableMenu
        dense placement='top-start'
        open anchorEl={overallMenuAnchor} onClose={handleOverallMenuHide}
        sx={{ minWidth: 200 }}
      >
        <MenuItem onClick={handleOverallInlineText} disabled={!canInlineSomeFragments}>
          <ListItemDecorator><VerticalAlignBottomIcon /></ListItemDecorator>
          Inline all text
        </MenuItem>
        <MenuItem onClick={handleOverallCopyText} disabled={!canInlineSomeFragments}>
          <ListItemDecorator><ContentCopyIcon /></ListItemDecorator>
          Copy all text
        </MenuItem>
        <ListDivider />
        <MenuItem onClick={handleOverallClear}>
          <ListItemDecorator><ClearIcon /></ListItemDecorator>
          Remove All{llmAttachmentDrafts.length > 5 ? <span style={{ opacity: 0.5 }}> {llmAttachmentDrafts.length} attachments</span> : null}
        </MenuItem>
      </CloseableMenu>
    )}

    {/* 'Clear' Confirmation */}
    {confirmClearAttachmentDrafts && (
      <ConfirmationModal
        open onClose={() => setConfirmClearAttachmentDrafts(false)} onPositive={handleOverallClearConfirmed}
        title='Confirm Removal'
        positiveActionText='Remove All'
        confirmationText={`This action will remove all (${llmAttachmentDrafts.length}) attachments. Do you want to proceed?`}
      />
    )}

  </>;
}