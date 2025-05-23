import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
	try {
		const databaseId = process.env.NOTION_DATABASE_ID;
		if (!databaseId) {
			console.error("🚨 Notion Database ID is missing!");
			return NextResponse.json(
				{ error: "Notion Database ID is missing" },
				{ status: 500 }
			);
		}

		// Fetch from Notion API
		console.log("🔹 Fetching from Notion API...");
		const response = await notion.databases.query({
			database_id: databaseId,
		});

		// Log full response for debugging
		console.log(
			"🔹 Raw Notion API Response:",
			JSON.stringify(response, null, 2)
		);

		// Process the data correctly
		const pages = response.results
			.filter((page) => "properties" in page)
			.map((page) => {
				const title =
					page.properties.Name?.type === "title" &&
					Array.isArray(page.properties.Name.title) &&
					page.properties.Name.title.length > 0
						? page.properties.Name.title[0].plain_text
						: "Untitled";

				let slug = "default";
				if (
					page.properties.slug &&
					page.properties.slug.type === "title" &&
					Array.isArray(page.properties.slug.title) &&
					page.properties.slug.title.length > 0
				) {
					slug =
						page.properties.slug.title[0].plain_text || "default";
				}

				return { id: page.id, title, slug };
			});

		// Log formatted data
		console.log(
			"✅ Formatted Notion Data:",
			JSON.stringify(pages, null, 2)
		);

		// Return JSON response
		return NextResponse.json(pages);
	} catch (error) {
		console.error("🚨 Notion API fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch Notion data" },
			{ status: 500 }
		);
	}
}
