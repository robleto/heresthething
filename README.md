# Here's the Thing

A Next.js application showcasing life advice with a modern, optimized architecture.

## Architecture

- **Frontend**: Next.js 15.4.1 with Turbopack
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
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## API Endpoints

- `GET /api/notion` - Optional fallback endpoint for direct Notion API access

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

Built with Next.js and deployed on Vercel.
