-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create advice_items table
CREATE TABLE IF NOT EXISTS public.advice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    notion_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    optimized_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_advice_items_slug ON public.advice_items(slug);
CREATE INDEX IF NOT EXISTS idx_advice_items_notion_id ON public.advice_items(notion_id);
CREATE INDEX IF NOT EXISTS idx_advice_items_is_active ON public.advice_items(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.advice_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active items
CREATE POLICY "Allow public read access to active advice items" ON public.advice_items
    FOR SELECT USING (is_active = true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access" ON public.advice_items
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_advice_items_updated_at 
    BEFORE UPDATE ON public.advice_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
