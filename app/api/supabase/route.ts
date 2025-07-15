import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    console.log("🔹 Fetching from Supabase...");
    
    // Fetch active advice items from Supabase
    const { data: adviceItems, error } = await supabase
      .from('advice_items')
      .select('id, title, slug, optimized_image_url, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("🚨 Supabase fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch advice data" },
        { status: 500 }
      );
    }

    // Transform data to match the existing format expected by the frontend
    const formattedData = adviceItems.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      // Use optimized image URL if available, fallback to original
      imageUrl: item.optimized_image_url || item.image_url || `/img/${item.slug}.png`
    }));

    console.log(`✅ Fetched ${formattedData.length} items from Supabase`);
    
    return NextResponse.json(formattedData);
    
  } catch (error) {
    console.error("🚨 API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
