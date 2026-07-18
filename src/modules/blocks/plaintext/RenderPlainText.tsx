import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Chip, Typography } from '@mui/joy';

import { extractChatCommand } from '../../../apps/chat/commands/commands.registry';


const _style = {
  mx: 1.5,
  // display: 'flex', // Commented on 2023-12-29: the commands were drawn as columns
  alignItems: 'baseline',
  overflowWrap: 'anywhere',
  whiteSpace: 'break-spaces',
} as const;


/**
 * Renders a text block with chat commands.
 * NOTE: should remove the commands parsing dependency.
 */
export const RenderPlainText = (props: { content: string; sx?: SxProps; }) => {

  const elements = extractChatCommand(props.content);

  const memoSx = React.useMemo(() => ({ ..._style, ...props.sx }), [props.sx]);

  return (
    <Typography sx={memoSx}>
      {elements.map((element, index) =>
        <React.Fragment key={index}>
          {element.type === 'cmd'
            ? <>
              <Chip
                component='span' size='md' variant='solid'
                // use the user's theme color (primary) for the pill, red for a bad command
                color={element.isErrorNoArgs ? 'danger' : 'primary'}
                // Force the pill's own contrasting label color (solidColor) on BOTH root and the label span,
                // so it never inherits the surrounding message text color (e.g. the /draw bubble's
                // warning.softColor) and render dark-on-dark. Nested selector beats the inherited cascade.
                sx={{
                  mr: 1,
                  '&, & .MuiChip-label': {
                    color: element.isErrorNoArgs ? 'var(--joy-palette-danger-solidColor)' : 'var(--joy-palette-primary-solidColor)',
                  },
                }}
              >
                {element.command}
              </Chip>
              <span>{element.params}</span>
            </>
            : <span>{element.value}</span>
          }
        </React.Fragment>,
      )}
    </Typography>
  );
};