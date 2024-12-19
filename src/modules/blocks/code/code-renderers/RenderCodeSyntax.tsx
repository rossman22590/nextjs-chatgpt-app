// import * as React from 'react';

// import { Box } from '@mui/joy';


// export function RenderCodeSyntax(props: {
//   highlightedSyntaxAsHtml: string | null;
//   presenterMode?: boolean;
// }) {
//   return (
//     <Box
//       component='div'
//       aria-label='Code block'
//       className='code-container'
//       dangerouslySetInnerHTML={{ __html: props.highlightedSyntaxAsHtml ?? '' }}
//       sx={props.presenterMode ? { fontSize: '125%' } : undefined}
//     />
//   );
// }
import * as React from 'react';
import { Box } from '@mui/joy';

export function RenderCodeSyntax(props: {
  highlightedSyntaxAsHtml: string | null;
  presenterMode?: boolean;
}) {
  return (
    <Box
      component='pre'
      aria-label='Code block'
      className='code-container'
      sx={{
        position: 'relative',
        margin: 0,
        padding: 0,
        ...(props.presenterMode ? { fontSize: '125%' } : {}),
        '& code': {
          display: 'block',
          position: 'relative',
          padding: 0,
        },
        '& .line-numbers-rows': {
          position: 'absolute',
          pointerEvents: 'none',
          top: 0,
          left: -40,
          width: 30,
          borderRight: '1px solid var(--joy-palette-neutral-400)',
          userSelect: 'none',
          '& > span': {
            display: 'block',
            counterIncrement: 'linenumber',
            '&:before': {
              content: 'counter(linenumber)',
              color: 'var(--joy-palette-neutral-400)',
              display: 'block',
              paddingRight: '0.8em',
              textAlign: 'right',
            },
          },
        },
      }}
    >
      <code 
        dangerouslySetInnerHTML={{ __html: props.highlightedSyntaxAsHtml ?? '' }}
      />
    </Box>
  );
}
