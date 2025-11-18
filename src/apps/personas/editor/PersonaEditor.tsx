import * as React from 'react';
import { Box, Button, Card, CardContent, FormLabel, Grid, Input, Sheet, Tab, TabList, TabPanel, Tabs, Textarea, Typography } from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
// @ts-ignore - emoji-mart data (JSON)
import emojiData from '@emoji-mart/data';

type EmojiItem = { native: string; name?: string; keywords?: string[] };
const toNative = (unified?: string): string | null => {
  if (!unified) return null;
  try {
    const codePoints = unified.split('-').map(u => parseInt(u, 16));
    return String.fromCodePoint(...codePoints);
  } catch { return null; }
};
const emojiIndex: EmojiItem[] = (() => {
  const out: EmojiItem[] = [] as EmojiItem[];
  // data.emojis is a dict of entries; be tolerant to shape differences
  const anyData: any = emojiData as any;
  const emojis = anyData.emojis || anyData; // fallback
  for (const key in emojis) {
    const e = emojis[key];
    if (!e) continue;
    const name = e.name || key;
    const keywords: string[] = e.keywords || e.shortcodes?.split('_') || [];
    let native: string | null = null;
    if (Array.isArray(e.skins) && e.skins.length) native = e.skins[0].native || toNative(e.skins[0].unified);
    if (!native && e.unified) native = toNative(e.unified);
    if (!native) continue;
    out.push({ native, name, keywords });
  }
  return out;
})();

const EmojiQuickSearch: React.FC<{ onPick: (emoji: string) => void }>= ({ onPick }) => {
  const [q, setQ] = React.useState('');
  const [dq, setDQ] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDQ(q), 120);
    return () => clearTimeout(t);
  }, [q]);
  const results = React.useMemo(() => {
    const source = dq.trim();
    const top = (arr: EmojiItem[]) => arr.slice(0, 6);
    if (!source) return top(emojiIndex);
    const lq = source.toLowerCase();
    return top(emojiIndex.filter(e => (e.name?.toLowerCase().includes(lq)) || (e.keywords?.some(k => k?.toLowerCase().includes(lq)))));
  }, [dq]);
  return (
    <Sheet variant='outlined' sx={{ p: 1, borderRadius: 'md', bgcolor: 'background.popup', minWidth: 320, maxWidth: 520 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search emoji…'
          startDecorator={<SearchIcon fontSize='small' />}
          endDecorator={q && (
            <Button size='sm' variant='plain' onClick={() => setQ('')}>
              <ClearIcon fontSize='small' />
            </Button>
          )}
          sx={{ flex: 1 }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5, alignItems: 'center' }}>
        {results.map((e, i) => (
          <Button
            key={i}
            size='sm'
            variant='soft'
            onClick={() => onPick(e.native)}
            sx={{
              height: 40,
              minWidth: 40,
              p: 0,
              fontSize: 20,
              lineHeight: 1,
              borderRadius: 'md',
              boxShadow: 'xs',
              transition: 'transform 120ms ease',
              '&:hover': { transform: 'scale(1.06)' },
            }}
          >
            {e.native}
          </Button>
        ))}
      </Box>
    </Sheet>
  );
};
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';

import { apiAsyncNode } from '~/common/util/trpc.client';

export type PersonaDraft = {
  id?: string;
  name?: string;
  description?: string;
  symbol?: string;
  pictureUrl?: string;
  systemPrompt: string;
  instructionHints?: any;
  data?: any;
  aiSettings?: any;
};

export const PersonaEditor: React.FC<{
  initial?: PersonaDraft;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, onClose, onSaved }) => {
  const [tab, setTab] = React.useState(0);
  const [draft, setDraft] = React.useState<PersonaDraft>(initial ?? { systemPrompt: '' });
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    setBusy(true);
    try {
      if (draft.id) {
        await apiAsyncNode.persona.update.mutate({
          id: draft.id,
          name: draft.name,
          description: draft.description,
          symbol: draft.symbol,
          pictureUrl: draft.pictureUrl,
          systemPrompt: draft.systemPrompt,
          instructionHints: draft.instructionHints,
          data: draft.data,
          aiSettings: draft.aiSettings,
        });
      } else {
        await apiAsyncNode.persona.create.mutate({
          name: draft.name,
          description: draft.description,
          symbol: draft.symbol,
          pictureUrl: draft.pictureUrl,
          systemPrompt: draft.systemPrompt,
          instructionHints: draft.instructionHints,
          data: draft.data,
          aiSettings: draft.aiSettings,
        });
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!draft.id) return onClose();
    setBusy(true);
    try {
      await apiAsyncNode.persona.delete.mutate({ id: draft.id });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography level='title-lg'>{draft.id ? 'Editing Persona' : 'Create Persona'}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {draft.id && (
              <Button variant='plain' color='danger' startDecorator={<DeleteOutlineIcon />} disabled={busy} onClick={remove}>Delete</Button>
            )}
            <Button variant='solid' startDecorator={<SaveIcon />} loading={busy} onClick={save}>Save</Button>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_e, v) => setTab(v as number)}>
          <TabList>
            <Tab>Details</Tab>
            <Tab>Instruction</Tab>
          </TabList>

          <TabPanel value={0}>
            <Grid container spacing={2}>
              <Grid xs={12}>
                <FormLabel>Name</FormLabel>
                <Input value={draft.name || ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
              </Grid>
              <Grid xs={12}>
                <FormLabel>Short Description</FormLabel>
                <Textarea minRows={2} value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
              </Grid>
              <Grid xs={12} md={6}>
                <FormLabel>Symbol</FormLabel>
                <Input value={draft.symbol || ''} onChange={e => setDraft(d => ({ ...d, symbol: e.target.value }))} placeholder='Emoji or short symbol' />
              </Grid>
              <Grid xs={12} md={6}>
                <FormLabel>Emoji</FormLabel>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Input value={draft.symbol || ''} onChange={e => setDraft(d => ({ ...d, symbol: e.target.value }))} placeholder='Paste emoji' sx={{ width: 160 }} />
                    <Box sx={{ fontSize: 32, width: 40, textAlign: 'center' }}>{draft.symbol || '🙂'}</Box>
                  </Box>
                  <EmojiQuickSearch onPick={(em) => setDraft(d => ({ ...d, symbol: em }))} />
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={1}>
            <FormLabel>Chat System Instruction</FormLabel>
            <Textarea minRows={8} value={draft.systemPrompt} onChange={e => setDraft(d => ({ ...d, systemPrompt: e.target.value }))} />
            <Sheet variant='soft' sx={{ p: 1, mt: 1 }}>
              <Typography level='body-xs'>Hints: Mermaid Diagrams, UML Diagrams, Interactive HTML, Vector Graphics, Interactive Charts, Prefer Tables. Variables: Date and Time, Knowledge Cutoff.</Typography>
            </Sheet>
          </TabPanel>

          {/* Data and AI tabs removed per request */}
        </Tabs>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button variant='plain' onClick={onClose}>Close</Button>
          <Button variant='solid' onClick={save} loading={busy}>Next</Button>
        </Box>
      </CardContent>
    </Card>
  );
};
