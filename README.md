# Ai Tutor Plus

A multi-model AI chat workspace. Chat with many models side by side, bring your own API keys,
and keep conversations in your browser.

This deployment is configured for the **free tier**: the OpenRouter service lists only
free-of-charge models.

## Features

- Chat with typed message fragments (text, images, documents, tool results)
- Voice calls with AI personas
- Persona creator, text comparison, tokenizer tools
- Shareable chat links
- Attachments: files, images, web pages, YouTube transcripts
- Local-first storage: chats live in IndexedDB in your browser

## Run locally
 
```bash
npm install
npm run dev
```

The app starts on http://localhost:3000.

## Configuration

Model vendors are configured either in the UI (per-user API keys, stored in the browser)
or server-side via environment variables. Each vendor reads one key, for example:

```
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

See `src/server/env.server.ts` for the full list of supported variables.

## Build

```bash
npm run build     # production build
npm run tsclint   # type-check only
npm run lint      # eslint
```

## License

MIT - see [LICENSE](LICENSE).
