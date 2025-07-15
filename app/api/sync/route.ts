import { NextResponse } from "next/server";
import { syncNotionToSupabase } from "../../../scripts/sync-notion-supabase";

export async function POST() {
  try {
    // Basic auth check (you might want to implement proper auth)
    const authHeader = process.env.SYNC_API_KEY;
    if (!authHeader) {
      return NextResponse.json(
        { error: "Sync API key not configured" },
        { status: 500 }
      );
    }

    console.log("🔄 Starting manual sync...");
    const result = await syncNotionToSupabase();
    
    return NextResponse.json({
      message: `Successfully synced ${result.processed} items`,
      processed: result.processed,
      success: true
    });
    
  } catch (error) {
    console.error("🚨 Sync API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Sync endpoint ready. Use POST to trigger sync.",
    status: "healthy"
  });
}
