# Letterboxd Collage

Generate a visual collage of your Letterboxd diary — movie poster grids for the past month, quarter, or year. Download or save for Instagram Stories.

Live at [collage.alessandrordgs.com.br](https://collage.alessandrordgs.com.br).

## How it works

Enter your Letterboxd username and choose a period (1 month, 3 months, or 12 months). The app fetches your diary via the Letterboxd RSS feed, assembles the film posters into a grid on an HTML canvas, and renders a downloadable image with a header and footer.

## Features

- Collage generation from Letterboxd RSS (no API key required)
- Three time periods: last month, last 3 months, last 12 months
- Download as PNG
- Download formatted for Instagram Stories (9:16)
- Copy to clipboard via right-click context menu

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- HTML Canvas API for image generation
- JSDOM for RSS parsing

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
