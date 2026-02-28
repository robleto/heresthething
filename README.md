# Here's the Thing

A Next.js application showcasing life advice with a modern, optimized architecture.

## Architecture

- **Frontend**: Next.js 15.4.1 with Turbopack
- **Build**: Next.js App Router (`app/`)
- **Images**: Local files in `/public/img/`
- **Primary Data Source**: Local manifest in `/public/data/local-cards.json`
- **Optional Fallback**: Notion API via `/api/notion`
- **Styling**: Tailwind CSS with GSAP animations

## Getting Started

### Prerequisites

- Node.js 18+

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Optional: Notion API fallback
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run lint
npm run lint

# Run production build (regenerates local-cards.json)
npm run build

# Start production server (auto-uses first open port in 3000-3010)
npm run start
```

`npm run dev` and `npm run start` automatically try the first available port in `3000-3010`.

Open the local URL printed in your terminal to view the application.

## API Endpoints

- `GET /api/notion` - Optional Notion fallback endpoint (cached + revalidated every 5 minutes)

## Runtime Data Flow

1. Grid loads cards from `/data/local-cards.json`
2. If local fetch fails, Grid falls back to `/api/notion`
3. Notion response is normalized into `{ id, title, slug }` and mapped to local image paths

## Scripts

- `npm run dev` - start local development server (auto-tries ports 3000-3010)
- `npm run lint` - run ESLint checks
- `npm run build` - regenerate local card manifest and build for production
- `npm run start` - run built app (auto-tries ports 3000-3010)

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production

- None required for local-only operation
- Add `NOTION_API_KEY` and `NOTION_DATABASE_ID` only if using Notion fallback

## Performance Features

- **Static/local data loading** from generated manifest
- **Graceful fallback** (local manifest → Notion)
- **Progressive enhancement** with GSAP animations

## Data Management

- **Source of truth**: local files in `/public/img`
- **Generated manifest**: `/public/data/local-cards.json`
- **Build step**: `node scripts/generate-local-cards.js`
- **Optional external source**: Notion via `/api/notion`

## Release Checklist

1. Run `npm run lint`
2. Run `npm run build`
3. Verify homepage renders cards from local manifest
4. If using Notion fallback, verify `NOTION_API_KEY` and `NOTION_DATABASE_ID` in deployment env
5. Deploy

Built with Next.js and deployed on Vercel.
