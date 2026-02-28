import { NextResponse } from "next/server";
import { getCards } from "../../../lib/cards";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export const revalidate = 300;

export async function GET() {
	try {
		const cards = await getCards();
		return NextResponse.json(cards, {
			headers: {
				"Cache-Control": CACHE_CONTROL,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to load cards" },
			{
				status: 500,
				headers: {
					"Cache-Control": CACHE_CONTROL,
				},
			}
		);
	}
}
