# Here's the Thing

A Next.js application showcasing life advice with a modern, optimized architecture.

## Architecture

- **Frontend**: Next.js 15.4.1 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **Images**: Local files in `/public/img/`
- **Data Source**: Notion database (297 advice items)
- **Styling**: Tailwind CSS with GSAP animations

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Notion API (for data syncing)
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Sync API security
SYNC_API_KEY=your_secure_sync_api_key
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Sync data from Notion (if needed)
npm run sync
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## API Endpoints

- `GET /api/supabase` - Returns advice items from Supabase database
- `GET /api/notion` - Fallback endpoint for direct Notion API access
- `POST /api/sync` - Manual sync from Notion to Supabase (requires SYNC_API_KEY)

## Database Schema

```sql
CREATE TABLE advice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notion_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    optimized_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production
- All variables from `.env.local`
- Ensure `NEXT_PUBLIC_*` variables are properly set
- Configure `SYNC_API_KEY` for manual syncing

## Performance Features

- **CDN-optimized images** with Next.js Image component
- **Cached data** from Supabase reduces API calls
- **Graceful fallbacks** (Supabase → Notion → local images)
- **Progressive enhancement** with GSAP animations

## Data Management

- **Source of truth**: Notion database (297 items)
- **Performance cache**: Supabase database
- **Images**: Local files with filename correction mapping
- **Sync**: Manual via `npm run sync` or API endpoint

Built with Next.js and deployed on Vercel.
