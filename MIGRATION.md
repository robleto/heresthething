# Notion to Supabase Migration

This document outlines the migration from direct Notion API calls with slow image loading to a Supabase-powered architecture with optimized image delivery.

## Architecture Overview

### Before
- Frontend → Notion API → Images from `/public/img/`
- Issues: Slow image loading, timeouts, direct API dependency

### After
- Frontend → Supabase API → Optimized images from Supabase Storage
- Notion → Sync Script → Supabase Database
- Benefits: Fast loading, CDN delivery, cached data, fallback support

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the schema script in the SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/schema.sql
   ```
3. Create a storage bucket named `advice-images` with public access
4. Copy your project credentials

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Existing Notion variables
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id

# New Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sync API security
SYNC_API_KEY=your_secure_sync_api_key
```

### 3. Initial Data Sync

Run the sync script to migrate your data:

```bash
npm run sync
```

This will:
- Fetch all advice items from Notion
- Upload images from `/public/img/` to Supabase Storage
- Store metadata in the Supabase database

## API Endpoints

### `/api/supabase` (GET)
Returns advice items from Supabase database with optimized image URLs.

### `/api/sync` (POST)
Triggers a manual sync from Notion to Supabase.
- Requires `SYNC_API_KEY` environment variable
- Use for manual updates or webhook integration

### `/api/notion` (GET)
Legacy endpoint - still available as fallback.

## Database Schema

```sql
CREATE TABLE advice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notion_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,              -- Original image path
    optimized_image_url TEXT,    -- Supabase Storage URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

## Image Optimization

The sync script automatically:
1. Reads images from `/public/img/{slug}.png`
2. Uploads to Supabase Storage bucket `advice-images`
3. Generates optimized CDN URLs
4. Provides fallback to local images

## Fallback Strategy

The frontend implements a graceful fallback system:
1. Try Supabase API first
2. If Supabase fails, fallback to Notion API
3. If optimized image fails, fallback to local image
4. Comprehensive error handling throughout

## Deployment Considerations

### Vercel
- Add environment variables to Vercel dashboard
- Supabase Edge Functions can be used for advanced sync logic

### Automated Syncing
- Set up Notion webhooks to trigger `/api/sync`
- Or run periodic syncs via cron jobs
- Monitor sync status and errors

## Performance Benefits

- **Faster Loading**: Supabase Storage provides CDN-optimized delivery
- **Reduced API Calls**: Data cached in Supabase reduces Notion API dependency
- **Better UX**: Immediate loading with progressive enhancement
- **Scalability**: Supabase handles scaling automatically

## Monitoring

- Check Supabase dashboard for database metrics
- Monitor API endpoint response times
- Track image loading success rates
- Set up alerts for sync failures

## Development

```bash
# Start development server
npm run dev

# Run manual sync
npm run sync

# Watch for changes and re-sync
npm run sync:watch
```

## Migration Steps

1. ✅ Set up Supabase project and database
2. ✅ Create sync script and API endpoints
3. ✅ Update frontend to use Supabase with fallbacks
4. 🔄 **Current**: Configure environment variables
5. ⏳ Run initial sync
6. ⏳ Test and validate data
7. ⏳ Deploy to production
8. ⏳ Set up automated syncing
