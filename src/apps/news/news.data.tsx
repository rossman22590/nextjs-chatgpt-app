import * as React from 'react';

import { Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/joy';
import LaunchIcon from '@mui/icons-material/Launch';

import { Brand } from '~/common/app.config';
import { Link } from '~/common/components/Link';
import { clientUtmSource } from '~/common/util/pwaUtils';
import { platformAwareKeystrokes } from '~/common/components/KeyStroke';


// update this variable every time you want to broadcast a new version to clients
export const incrementalVersion: number = 10;

const B = (props: { href?: string, children: React.ReactNode }) => {
  const boldText = <Typography color={!!props.href ? 'primary' : 'neutral'} sx={{ fontWeight: 600 }}>{props.children}</Typography>;
  return props.href ?
    <Link href={props.href + clientUtmSource()} target='_blank' sx={{ /*textDecoration: 'underline'*/ }}>{boldText} <LaunchIcon sx={{ ml: 1 }} /></Link> :
    boldText;
};

const { OpenRepo, OpenProject } = Brand.URIs;
const RCode = `${OpenRepo}/blob/main`;
const RIssues = `${OpenRepo}/issues`;

// callout, for special occasions
export const newsCallout =
<Card>
<CardContent sx={{ gap: 2 }}>
  <Typography level='title-lg'>
    Open Roadmap
  </Typography>
  <Typography level='body-md'>
    Take a peek at our roadmap to see what&apos;s in the pipeline.
    Discover upcoming features and let us know what excites you the most!
  </Typography>
  <Grid container spacing={1}>
    <Grid xs={12} sm={7}>
      <Button
        fullWidth variant='soft' color='primary' endDecorator={<LaunchIcon />}
        component={Link} href='https://docs.myapps.ai/help-center' noLinkStyle target='_blank'
      >
        Docs
      </Button>
    </Grid>
    <Grid xs={12} sm={5} sx={{ display: 'flex', flexAlign: 'center', justifyContent: 'center' }}>
      <Button
        fullWidth variant='plain' color='primary' endDecorator={<LaunchIcon />}
        component={Link} href='https://calendly.com/techinschools/30min' noLinkStyle target='_blank'
      >
        Get Help
      </Button>
    </Grid>
  </Grid>
</CardContent>
</Card>;


// news and feature surfaces
export const NewsItems: NewsItem[] = [
  // still unannounced: phone calls, split windows, ...
  {
    versionCode: '1.9.0',
    versionName: 'Creative Horizons',
    versionMoji: '🎨🌌',
    versionDate: new Date('2023-12-28T22:30:00Z'),
    items: [
      { text: <><B href={RIssues + '#'}>DALL·E 3</B> support (/draw), with advanced control</>, },
      { text: <><B href={RIssues + '#'}>Perfect scrolling</B> UX, on all devices</>,  },
      { text: <>Create personas <B href={RIssues + '#'}>from text</B></>,  },
      { text: <>Openrouter: auto-detect models, support free-tiers and rates</>,  },
      { text: <>Image drawing: unified UX, including auto-prompting</> },
      { text: <>Fix layout on Firefox</>,},
      { text: <>Developers: new Text2Image subsystem, Optima layout subsystem, ScrollToBottom library, using new Panes library, improved Llms subsystem</>, dev: true },
    ],
  },
  {
    versionCode: '1.8.0',
    versionName: 'To The Moon And Back',
    // versionMoji: '🚀🌕🔙❤️',
    versionDate: new Date('2023-12-20T09:30:00Z'),
    items: [
      { text: <><B href={RIssues + '#'}>Google Gemini</B> models support</> },
      { text: <><B href={RIssues + '#'}>Mistral Platform</B> support</> },
      { text: <><B href={RIssues + '#'}>Ollama chats</B> perfection</> },
      { text: <>Custom <B href={RIssues + '#'}>diagrams instructions</B> (@joriskalz)</> },
      { text: <><B>Single-Tab</B> mode, enhances data integrity and prevents DB corruption</> },
      { text: <>Updated Ollama (v0.1.17) and OpenRouter models</> },
      { text: <>More: fixed ⌘ shortcuts on Mac</> },
      { text: <><Link href='https://myapps.ai'>Website</Link>: official downloads</> },
      // { text: <>Easier Vercel deployment, documented <Link href='https://github.com/enricoros/big-AGI/issues/276#issuecomment-1858591483'>network troubleshooting</Link></>, dev: true },
    ],
  },
  {
    versionCode: '1.7.0',
    versionName: 'Attachment Theory',
    // versionDate: new Date('2023-12-11T06:00:00Z'), // 1.7.3
    versionDate: new Date('2023-12-10T12:00:00Z'), // 1.7.0
    items: [
      { text: <>Redesigned <B href={RIssues + '#'}>attachments system</B>: drag, paste, link, snap, images, text, pdfs</> },
      { text: <>Desktop <B href={RIssues + '/#'}>webcam access</B> for direct image capture (Labs option)</> },
      { text: <>Independent browsing with <B href={RCode + '#'}>Browserless</B> support</> },
      { text: <><B href={RIssues + '#'}>Overheat</B> LLMs with higher temperature limits</> },
      { text: <>Enhanced security via <B href={RCode + '#'}>password protection</B></> },
      { text: <>{platformAwareKeystrokes('Ctrl+Shift+O')}: quick access to model options</> },
      { text: <>Optimized voice input and performance</> },
      { text: <>Latest Ollama and Oobabooga models</> },
    ],
  },
  {
    versionCode: '1.6.0',
    versionName: 'Surf\'s Up',
    versionDate: new Date('2023-11-28T21:00:00Z'),
    items: [
      { text: <><B href={RIssues + '#'}>Web Browsing</B> support, see the <B href={RCode + '/docs/config-browse.md'}>browsing user guide</B></> },
      { text: <><B href={RIssues + '#'}>Branching Discussions</B> at any message</> },
      { text: <><B href={RIssues + '#'}>Keyboard Navigation</B>: use {platformAwareKeystrokes('Ctrl+Shift+Left/Right')} to navigate chats</> },
      { text: <><B href={RIssues + '#'}>UI fixes</B> (thanks to the first sponsor)</> },
      { text: <>Added support for Anthropic Claude 2.1</> },
      { text: <>Large rendering performance optimization</> },
      { text: <>More: <Chip>/help</Chip>, import ChatGPT from source, new Flattener</> },
      { text: <>Devs: improved code quality, snackbar framework</>, dev: true },
    ],
  },
  {
    versionCode: '1.5.0',
    versionName: 'Loaded!',
    versionDate: new Date('2023-11-19T21:00:00Z'),
    items: [
      { text: <><B href={RIssues + '#'}>Continued Voice</B> for hands-free interaction</> },
      { text: <><B href={RIssues + '#'}>Visualization</B> Tool for data representations</> },
      { text: <><B href={RCode + '#'}>Ollama (guide)</B> local models support</> },
      { text: <><B href={RIssues + '#'}>Text Tools</B> including highlight differences</> },
      { text: <><B href='https://mermaid.js.org/'>Mermaid</B> Diagramming Rendering</> },
      { text: <><B>OpenAI 1106</B> Chat Models</> },
      { text: <><B>SDXL</B> support with Prodia</> },
      { text: <>Cloudflare OpenAI API Gateway</> },
      { text: <>Helicone for Anthropic</> },
    ],
  },
  {
    versionCode: '1.4.0',
    items: [
      { text: <><B>Share and clone</B> conversations, with public links</> },
      { text: <><B href={RCode + '/docs/config-azure-openai.md'}>Azure</B> models, incl. gpt-4-32k</> },
      { text: <><B>OpenRouter</B> models full support, incl. gpt-4-32k</> },
      { text: <>Latex Rendering</> },
      { text: <>Augmented Chat modes (Labs)</> },
    ],
  },
  {
    versionCode: '1.3.5',
    items: [
      { text: <>AI in the real world with <B>Camera OCR</B> - MOBILE-ONLY</> },
      { text: <><B>Anthropic</B> models full support</> },
      { text: <>Removed the 20 chats hard limit</> },
      { text: <>Backup chats (export all)</> },
      { text: <>Import ChatGPT shared chats</> },
      { text: <>Cleaner, better, newer UI, including relative chats size</> },
    ],
  },
  {
    versionCode: '1.3.1',
    items: [
      { text: <><B>Flattener</B> - 4-mode conversations summarizer</> },
      { text: <><B>Forking</B> - branch your conversations</> },
      { text: <><B>/s</B> and <B>/a</B> to append a <i>system</i> or <i>assistant</i> message</> },
      { text: <>Local LLMs with <Link href={RCode + '/docs/config-local-oobabooga.md'} target='_blank'>Oobabooga server</Link></> },
      { text: 'NextJS STOP bug.. squashed, with Vercel!' },
    ],
  },
  {
    versionCode: '1.2.1',
    // text: '',
    items: [
      { text: <>New home page: <b><Link href={Brand.URIs.Home + clientUtmSource()} target='_blank'>{Brand.URIs.Home.replace('https://', '')}</Link></b></> },
      { text: 'Support 𝑓unction models' }, // (n)
      { text: <Box sx={{ display: 'flex', alignItems: 'center' }}>Labs: experiments</Box> }, // ⚗️🧬🔬🥼 🥽🧪 <ScienceIcon sx={{ fontSize: 24, opacity: 0.5 }} />
    ],
  },
];


interface NewsItem {
  versionCode: string;
  versionName?: string;
  versionMoji?: string;
  versionDate?: Date;
  text?: string | React.JSX.Element;
  items?: {
    text: string | React.JSX.Element;
    dev?: boolean;
    issue?: number;
  }[];
}
