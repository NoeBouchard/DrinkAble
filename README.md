# DrinkAble 🥤

A web app to track and discover drinks you love, and stay on top of your daily hydration.

> **MVP** – web-first, with mobile support planned for a future iteration.

## Tech stack

| Layer       | Technology                               |
| ----------- | ---------------------------------------- |
| Framework   | [Next.js 16](https://nextjs.org/) (App Router) |
| Language    | TypeScript                               |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com/) |
| Linting     | ESLint (via `eslint-config-next`)        |
| Deployment  | [Vercel](https://vercel.com/) (recommended) |

## Getting started

### Prerequisites

- Node.js ≥ 18

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Deployment

The easiest way to deploy DrinkAble is via [Vercel](https://vercel.com/new):

1. Push to GitHub (already done ✅)
2. Import the repository on Vercel
3. Click **Deploy** — Vercel will detect Next.js automatically

## Project structure

```
src/
└── app/
    ├── layout.tsx   # Root layout (fonts, metadata)
    ├── page.tsx     # Home / landing page
    └── globals.css  # Global styles (Tailwind base)
public/              # Static assets
```
