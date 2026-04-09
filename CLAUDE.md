# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack) at localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run Vitest
npm run setup        # Install deps + Prisma generate + migrate (initial setup)
npm run db:reset     # Reset database (destructive)
```

Environment: Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it, the app uses a `MockLanguageModel` that returns hardcoded example components.

## Architecture

UIGen is a Next.js 15 app where users describe React components in a chat interface and Claude generates them into a virtual file system, with live preview in an iframe.

### Core abstractions

**Virtual File System** (`src/lib/file-system.ts`)  
In-memory Map-based file tree. No disk I/O. All file operations (create/read/update/delete) go through this. Serialized to JSON for persistence in the database `Project.data` column.

**AI Tool Calling** (`src/lib/tools/`)  
Claude manipulates the virtual file system through two tools:
- `str_replace_editor` — view, create, and edit files via string replacement
- `file_manager` — rename and delete files/directories

The system prompt (`src/lib/prompts/generation.tsx`) instructs Claude how to use these tools to generate components.

**Chat + AI pipeline** (`src/lib/contexts/chat-context.tsx` → `src/app/api/chat/route.ts`)  
Chat context manages message state and calls the streaming `/api/chat` route. The route uses Vercel AI SDK with `streamText`, passes tool definitions, and streams results back. File system mutations happen as tool calls arrive in the stream.

**Preview** (`src/components/preview/PreviewFrame.tsx`)  
Renders generated components inside a sandboxed `<iframe>`. Uses Babel standalone for JSX→JS transformation at runtime. `src/lib/transform/jsx-transformer.ts` handles the transform logic.

**Language model provider** (`src/lib/provider.ts`)  
Returns `claude-haiku-4-5` via `@ai-sdk/anthropic`, or `MockLanguageModel` if no API key is set.

### Data flow

1. User types a message → `chat-context` sends it to `/api/chat`
2. API route streams Claude's response; tool calls mutate the virtual file system via context callbacks
3. File system context updates trigger re-render of the file tree and editor
4. Preview iframe re-transforms and re-renders updated files

### Auth & persistence

- JWT sessions stored in cookies (7-day expiry), managed in `src/lib/auth.ts`
- Server actions in `src/actions/` handle sign-up/sign-in/sign-out and CRUD for projects
- Prisma + SQLite: `User` has many `Project`s; projects store serialized file system state and chat messages
- Anonymous users can create projects without signing up; projects persist only in local state unless saved

### UI layout

`src/app/main-content.tsx` renders a resizable split panel: chat (35% left) and either a preview or a code view (65% right). Code view is a nested split: file tree (30%) + editor (70%). All panels use `react-resizable-panels`.

### Path aliases

`@/` maps to `src/` (configured in `tsconfig.json`).
