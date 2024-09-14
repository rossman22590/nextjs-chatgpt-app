import * as React from 'react';
import { fileOpen, FileWithHandle } from 'browser-fs-access';

import { Box, Button, IconButton, Tooltip } from '@mui/joy';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';

import { KeyStroke } from '~/common/components/KeyStroke';


const attachFileLegend =
  <Box sx={{ px: 1, py: 0.75, lineHeight: '1.5rem' }}>
    <b>Attach files</b><br />
    Drag & drop in chat for faster loads ⚡
    <KeyStroke combo='Ctrl + Shift + F' sx={{ mt: 1, mb: 0.5 }} />
  </Box>;


export async function openFileForAttaching(
  multiple: boolean,
  onAttachFiles: (files: FileWithHandle[]) => void,
) {
  try {
    const selectedFiles = await fileOpen({ multiple });
    if (selectedFiles) {
      if (Array.isArray(selectedFiles)) {
        if (selectedFiles.length)
          onAttachFiles(selectedFiles);
      } else {
        onAttachFiles([selectedFiles]);
      }
    }
  } catch (error) {
    // ignore...
  }
}


export const ButtonAttachFilesMemo = React.memo(ButtonAttachFiles);

function ButtonAttachFiles(props: { isMobile?: boolean, fullWidth?: boolean, multiple?: boolean, noToolTip?: boolean, onAttachFiles: (files: FileWithHandle[]) => void }) {

  const { onAttachFiles } = props;

  const handleAttachFilePicker = React.useCallback(() => openFileForAttaching(props.multiple || false, onAttachFiles), [onAttachFiles, props.multiple]);

  return props.isMobile ? (
    <IconButton onClick={handleAttachFilePicker}>
      <AttachFileRoundedIcon />
    </IconButton>
  ) : (
    <Tooltip disableInteractive variant='solid' placement='top-start' title={props.noToolTip ? null : attachFileLegend}>
      <Button
        fullWidth={props.fullWidth}
        variant='plain'
        color='neutral'
        onClick={handleAttachFilePicker}
        startDecorator={<AttachFileRoundedIcon />}
        sx={{ justifyContent: 'flex-start' }}
      >
        File
      </Button>
    </Tooltip>
  );
}
