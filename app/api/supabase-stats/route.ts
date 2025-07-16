import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('advice_items')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error("Error getting total count:", totalError);
      return NextResponse.json({ error: "Failed to get total count" }, { status: 500 });
    }

    // Get active count
    const { count: activeCount, error: activeError } = await supabase
      .from('advice_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) {
      console.error("Error getting active count:", activeError);
      return NextResponse.json({ error: "Failed to get active count" }, { status: 500 });
    }

    return NextResponse.json({
      total: totalCount,
      active: activeCount,
      inactive: (totalCount || 0) - (activeCount || 0)
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
