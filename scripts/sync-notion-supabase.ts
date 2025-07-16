import { Client } from "@notionhq/client";
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🔍 Debug Environment Variables:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SERVICE_KEY:', supabaseServiceKey ? 'Set (length: ' + supabaseServiceKey.length + ')' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface NotionAdviceItem {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string;
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
    
    // Test Supabase connection first
    console.log('🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('advice_items')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      throw testError;
    } else {
      console.log('✅ Supabase connection successful');
    }
    
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

  console.log('🔍 Fetching all pages from Notion with pagination...');
  let allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const queryParams: any = {
      database_id: databaseId,
      page_size: 100, // Maximum allowed by Notion API
    };

    if (startCursor) {
      queryParams.start_cursor = startCursor;
    }

    const response = await notion.databases.query(queryParams);
    
    allResults = allResults.concat(response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor || undefined;

    console.log(`📄 Fetched ${response.results.length} items (Total so far: ${allResults.length})`);
  }

  console.log(`✅ Total items fetched from Notion: ${allResults.length}`);

  return allResults
    .filter((page) => "properties" in page)
    .map((page, index) => {
      // Debug: Log first few items to understand the data structure
      if (index < 3) {
        console.log(`🔍 Debug page ${index}:`, JSON.stringify(page.properties, null, 2));
      }

      // Extract title from "Advice Text" field (the actual advice content)
      const title =
        page.properties["Advice Text"]?.type === "rich_text" &&
        Array.isArray(page.properties["Advice Text"].rich_text) &&
        page.properties["Advice Text"].rich_text.length > 0
          ? page.properties["Advice Text"].rich_text[0].plain_text
          : "Untitled";

      // Extract slug from "slug" field (which is actually the title field in Notion)
      let slug = "untitled";
      if (page.properties.slug?.type === "title" &&
          Array.isArray(page.properties.slug.title) &&
          page.properties.slug.title.length > 0) {
        slug = page.properties.slug.title[0].plain_text || "untitled";
      }

      // Extract image URL from Image field
      let imageUrl = "";
      if (page.properties.Image?.type === "files" &&
          Array.isArray(page.properties.Image.files) &&
          page.properties.Image.files.length > 0) {
        const imageFile = page.properties.Image.files[0];
        if (imageFile.type === "file" && imageFile.file) {
          imageUrl = imageFile.file.url;
        } else if (imageFile.type === "external" && imageFile.external) {
          imageUrl = imageFile.external.url;
        }
      }

      return {
        id: page.id,
        title,
        slug,
        imageUrl
      };
    });
}

// Helper function to generate URL-friendly slug from title
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
    || 'untitled'; // Fallback if empty
}

// Helper function to ensure unique slugs
function generateUniqueSlug(baseSlug: string, notionId: string): string {
  // Use part of the Notion ID to make it unique
  const idSuffix = notionId.replace(/-/g, '').substring(0, 8);
  return `${baseSlug}-${idSuffix}`;
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
    image_url: item.imageUrl || `/img/${item.slug}.png`, // Use Notion image or fallback to local
  };

  // 3. Check if local image exists and upload to Supabase Storage
  const localImagePath = path.join(process.cwd(), 'public', 'img', `${item.slug}.png`);
  
  if (fs.existsSync(localImagePath)) {
    try {
      // Upload image to Supabase Storage
      const optimizedImageUrl = await uploadImageToSupabase(item.slug, localImagePath);
      supabaseItem.optimized_image_url = optimizedImageUrl;
      // Keep both: Notion URL as primary, local as backup
    } catch (error) {
      console.warn(`⚠️  Failed to upload image for ${item.slug}:`, error);
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
