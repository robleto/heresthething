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

		// Log available properties for debugging
		if (response.results.length > 0 && "properties" in response.results[0]) {
			console.log("🔹 Available properties:", Object.keys(response.results[0].properties));
			console.log("🔹 First item properties:", JSON.stringify(response.results[0].properties, null, 2));
		}

		// Process the data correctly
		const pages = response.results
			.filter((page) => "properties" in page)
			.map((page) => {
				// Extract title from "Advice Text" field (which is the title field)
				const title =
					page.properties["Advice Text"]?.type === "title" &&
					Array.isArray(page.properties["Advice Text"].title) &&
					page.properties["Advice Text"].title.length > 0
						? page.properties["Advice Text"].title[0].plain_text
						: page.properties.Name?.type === "title" &&
						  Array.isArray(page.properties.Name.title) &&
						  page.properties.Name.title.length > 0
						? page.properties.Name.title[0].plain_text
						: page.properties.Title?.type === "title" &&
						  Array.isArray(page.properties.Title.title) &&
						  page.properties.Title.title.length > 0
						? page.properties.Title.title[0].plain_text
						: "Untitled";

				// Try different possible property names and types for slug
				let slug = "default";
				
				// Check for 'slug' as rich_text property (this is the correct one)
				if (page.properties.slug?.type === "rich_text" &&
					Array.isArray(page.properties.slug.rich_text) &&
					page.properties.slug.rich_text.length > 0) {
					slug = page.properties.slug.rich_text[0].plain_text || "default";
				}
				// Check for 'Slug' as rich_text property
				else if (page.properties.Slug?.type === "rich_text" &&
					Array.isArray(page.properties.Slug.rich_text) &&
					page.properties.Slug.rich_text.length > 0) {
					slug = page.properties.Slug.rich_text[0].plain_text || "default";
				}
				// Check for 'slug' as title property
				else if (page.properties.slug?.type === "title" &&
					Array.isArray(page.properties.slug.title) &&
					page.properties.slug.title.length > 0) {
					slug = page.properties.slug.title[0].plain_text || "default";
				}
				// Check for 'Slug' as title property
				else if (page.properties.Slug?.type === "title" &&
					Array.isArray(page.properties.Slug.title) &&
					page.properties.Slug.title.length > 0) {
					slug = page.properties.Slug.title[0].plain_text || "default";
				}

				console.log(`🔹 Processing item: title="${title}", slug="${slug}"`);
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
