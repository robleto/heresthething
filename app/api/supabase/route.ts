import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    console.log("🔹 Fetching from Supabase...");
    
    // Function to fix filename mismatches between database slugs and actual image files
    const fixImagePath = (slug: string): string => {
      // Handle specific filename mismatches
      const filenameFixes: { [key: string]: string } = {
        'personal-brand': 'personal–board',
        'running-toilet': 'running–toilet', 
        'saving-today': 'saving–today',
        'say-thier-name': 'say-their-name',
        'car-not-investment': 'car-not -investment',
        'one-instrument': 'one instrument', 
        'run-late': 'run late',
        'signature-app': 'signature–app',
        'spontaneity-credit-cards': 'spontaneity–credit–cards'
      };
      
      const correctedSlug = filenameFixes[slug] || slug;
      return `/img/${correctedSlug}.png`;
    };
    
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
      // Use the filename fix function to handle mismatched image names
      imageUrl: fixImagePath(item.slug)
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
