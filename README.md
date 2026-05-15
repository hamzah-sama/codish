# Codish

AI-powered code editor inspired by modern developer tools like Cursor.

Codish is a browser-based development environment focused on AI-assisted coding workflows, real-time interaction, and modern developer experience. Built with a full-stack TypeScript architecture using Next.js, CodeMirror, WebContainers, and AI SDK integrations.

---

## Features

- AI-powered code generation and editing assistance
- Multi-language code editor support
- Browser-based development environment
- Integrated terminal experience with xterm.js
- Real-time streaming AI responses
- Persistent workspace and editor state
- Markdown, code, math, and Mermaid rendering support
- Modern IDE-style responsive interface
- Authentication and workspace management

---

## Supported Languages

- JavaScript
- TypeScript
- Python
- Go
- Rust
- Java
- C++
- SQL
- HTML/CSS
- PHP
- YAML
- Markdown
- XML

---

## Tech Stack

### Frontend
- React 19
- Next.js 16
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- Framer Motion

### Editor & Developer Tooling
- CodeMirror 6
- WebContainers API
- xterm.js
- Replit Minimap

### AI & Backend Services
- OpenAI SDK
- Google AI SDK
- AI SDK
- Inngest
- Convex

### Additional Libraries
- Streamdown
- Mermaid Rendering
- Octokit
- TanStack Form
- Zod

---

## Architecture Highlights

- Browser-based execution environments powered by WebContainers
- Modular AI workflow orchestration using AI SDK and Inngest
- Streaming-first interaction patterns for responsive AI experiences
- Multi-language editor architecture using CodeMirror extensions
- Scalable component-driven frontend structure
- Type-safe validation and state management patterns

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/hamzah-sama/codish.git
cd codish
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file:

```env
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
CODISH_CONVEX_INTERNAL_KEY=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
FIRECRAWL_API_KEY=


GOOGLE_GENERATIVE_AI_API_KEY =

OPENAI_API_KEY=
NEXT_PUBLIC_CONVEX_SITE_URL=

SENTRY_AUTH_TOKEN=

```

### Run the development server

```bash
npm run dev
```

---

## Project Goals

Codish was built to explore:
- AI-native developer tooling
- browser-based coding environments
- real-time AI interaction patterns
- scalable frontend architecture
- modern TypeScript application design

The project focuses heavily on developer experience, interactive UI systems, and AI-assisted workflows inspired by next-generation coding platforms.

---

## Status

Actively developed and continuously improved.

---

## License

MIT