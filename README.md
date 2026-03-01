# Here's the Thing

A Next.js application showcasing life advice with a modern, optimized architecture.

## Architecture

- **Frontend**: Next.js 15.4.1 with Turbopack
- **Build**: Next.js App Router (`app/`)
- **Images**: Cloudflare R2 (optional) or local `/public/img/`
- **Primary Data Source**: `R2_MANIFEST_URL` (if set) with local manifest fallback
- **Optional Fallback**: Notion API via `/api/notion`
- **Styling**: Tailwind CSS with GSAP animations
- **Reliability**: CI workflow + security headers + sitemap/robots

## Getting Started

### Prerequisites

- Node.js 18+

### Environment Setup

Copy `env.template` to `.env.local` and configure:

```bash
# Optional: Notion API fallback
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id

# Optional: Cloudflare R2 preferred source
R2_MANIFEST_URL=https://your-public-r2-domain/data/cards.json
R2_IMAGE_BASE_URL=https://your-public-r2-domain/img
NEXT_PUBLIC_R2_IMAGE_BASE_URL=https://your-public-r2-domain/img
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

- `GET /api/cards` - Primary cards endpoint (R2 manifest → local manifest fallback)
- `GET /api/notion` - Optional Notion fallback endpoint (cached + revalidated every 5 minutes)

## Runtime Data Flow

1. Grid loads cards from `/api/cards`
2. `/api/cards` resolves data source in order: `R2_MANIFEST_URL` → local manifest
3. If `/api/cards` fails, Grid falls back to `/api/notion`
4. Notion response is normalized into `{ id, title, slug }` and mapped to image paths

## Scripts

- `npm run dev` - start local development server (auto-tries ports 3000-3010)
- `npm run lint` - run ESLint checks
- `npm run build` - regenerate local card manifest and build for production
- `npm run start` - run built app (auto-tries ports 3000-3010)

## Cloudflare R2 Format

If `R2_MANIFEST_URL` is configured, it should return an array like:

```json
[
  {
    "id": "card-1",
    "slug": "example-card",
    "title": "Example Card",
    "imageUrl": "https://your-public-r2-domain/img/example-card.png"
  }
]
```

`imageUrl` is optional if `R2_IMAGE_BASE_URL` is set.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production

- None required for local-only operation
- Add `NOTION_API_KEY` and `NOTION_DATABASE_ID` only if using Notion fallback

## Performance Features

- **R2-first data loading** with local fallback
- **Graceful fallback chain** (`R2_MANIFEST_URL` → local manifest → Notion)
- **Progressive enhancement** with GSAP animations

## Robustness Features

- **CI checks** on pushes/PRs via `.github/workflows/ci.yml`
- **Security headers** set in `next.config.ts`
- **SEO discovery routes** at `/sitemap.xml` and `/robots.txt`

## Data Management

- **Source of truth**: local files in `/public/img`
- **Generated manifest**: `/public/data/local-cards.json`
- **Build step**: `node scripts/generate-local-cards.js`
- **Preferred external source**: `R2_MANIFEST_URL`
- **Optional external fallback**: Notion via `/api/notion`

## Release Checklist

1. Run `npm run lint`
2. Run `npm run build`
3. Verify homepage renders cards from local manifest
4. If using Notion fallback, verify `NOTION_API_KEY` and `NOTION_DATABASE_ID` in deployment env
5. If using R2, verify `R2_MANIFEST_URL` and `R2_IMAGE_BASE_URL`
6. Deploy

Built with Next.js and deployed on Vercel.
