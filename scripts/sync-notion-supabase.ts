import { Client } from "@notionhq/client";
import { supabaseAdmin } from "../lib/supabase";
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

interface NotionAdviceItem {
  id: string;
  title: string;
  slug: string;
}

interface SupabaseAdviceItem {
  notion_id: string;
  title: string;
  slug: string;
  image_url?: string;
  optimized_image_url?: string;
}

export async function syncNotionToSupabase() {
  try {
    console.log('🔄 Starting Notion to Supabase sync...');
    
    // 1. Fetch data from Notion
    const notionData = await fetchFromNotion();
    console.log(`📝 Fetched ${notionData.length} items from Notion`);
    
    // 2. Process each item
    for (const item of notionData) {
      try {
        await processAdviceItem(item);
        console.log(`✅ Processed: ${item.slug}`);
      } catch (error) {
        console.error(`❌ Failed to process ${item.slug}:`, error);
      }
    }
    
    console.log('🎉 Sync completed successfully!');
    return { success: true, processed: notionData.length };
    
  } catch (error) {
    console.error('💥 Sync failed:', error);
    throw error;
  }
}

async function fetchFromNotion(): Promise<NotionAdviceItem[]> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error("Notion Database ID is missing");
  }

  const response = await notion.databases.query({
    database_id: databaseId,
  });

  return response.results
    .filter((page) => "properties" in page)
    .map((page) => {
      // Extract title from "Advice Text" field
      const title =
        page.properties["Advice Text"]?.type === "title" &&
        Array.isArray(page.properties["Advice Text"].title) &&
        page.properties["Advice Text"].title.length > 0
          ? page.properties["Advice Text"].title[0].plain_text
          : "Untitled";

      // Extract slug
      let slug = "default";
      if (page.properties.slug?.type === "rich_text" &&
          Array.isArray(page.properties.slug.rich_text) &&
          page.properties.slug.rich_text.length > 0) {
        slug = page.properties.slug.rich_text[0].plain_text || "default";
      }

      return {
        id: page.id,
        title,
        slug
      };
    });
}

async function processAdviceItem(item: NotionAdviceItem) {
  // 1. Check if item already exists in Supabase
  const { data: existingItem } = await supabaseAdmin
    .from('advice_items')
    .select('*')
    .eq('notion_id', item.id)
    .single();

  // 2. Prepare the data for Supabase
  const supabaseItem: SupabaseAdviceItem = {
    notion_id: item.id,
    title: item.title,
    slug: item.slug,
  };

  // 3. Check if local image exists and upload to Supabase Storage
  const localImagePath = path.join(process.cwd(), 'public', 'img', `${item.slug}.png`);
  
  if (fs.existsSync(localImagePath)) {
    try {
      // Upload image to Supabase Storage
      const optimizedImageUrl = await uploadImageToSupabase(item.slug, localImagePath);
      supabaseItem.optimized_image_url = optimizedImageUrl;
      supabaseItem.image_url = `/img/${item.slug}.png`; // Keep original reference
    } catch (error) {
      console.warn(`⚠️  Failed to upload image for ${item.slug}:`, error);
      supabaseItem.image_url = `/img/${item.slug}.png`; // Fallback to local
    }
  }

  // 4. Insert or update in Supabase
  if (existingItem) {
    // Update existing item
    const { error } = await supabaseAdmin
      .from('advice_items')
      .update({
        title: supabaseItem.title,
        slug: supabaseItem.slug,
        image_url: supabaseItem.image_url,
        optimized_image_url: supabaseItem.optimized_image_url,
        updated_at: new Date().toISOString()
      })
      .eq('notion_id', item.id);

    if (error) throw error;
  } else {
    // Insert new item
    const { error } = await supabaseAdmin
      .from('advice_items')
      .insert(supabaseItem);

    if (error) throw error;
  }
}

async function uploadImageToSupabase(slug: string, localPath: string): Promise<string> {
  const fileName = `advice-images/${slug}.png`;
  
  // Read the file
  const fileBuffer = fs.readFileSync(localPath);
  
  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from('advice-images')
    .upload(fileName, fileBuffer, {
      contentType: 'image/png',
      upsert: true // Replace if exists
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('advice-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Allow running this script directly
if (require.main === module) {
  syncNotionToSupabase()
    .then(() => {
      console.log('✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    });
}
