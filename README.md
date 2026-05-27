# Libra AI

Libra is a mobile-first, AI-powered personal literary critic designed to help readers instantly decide whether a book matches their taste.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Framer Motion** for animations
- Dark mode only — cinematic, minimalist aesthetic

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/              # App Router pages & global styles
├── components/
│   ├── layout/       # Shell, header, footer, container
│   ├── motion/       # Framer Motion wrappers
│   ├── sections/     # Page sections
│   └── ui/           # shadcn/ui primitives
├── hooks/            # Reusable React hooks
├── lib/              # Utilities & constants
└── types/            # Shared TypeScript types
```

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Start dev server         |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint              |
