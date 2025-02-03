import { Client } from "@notionhq/client";
import type { APIRoute } from "astro";

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });

export const GET: APIRoute = async () => {
	try {
		const databaseId = import.meta.env.NOTION_DATABASE_ID;
		const response = await notion.databases.query({
			database_id: databaseId,
		});

		const pages = response.results
			.filter((page) => "properties" in page)
			.map((page) => {
				const title =
					page.properties.Name?.type === "title" &&
					Array.isArray(page.properties.Name.title) &&
					page.properties.Name.title.length > 0
						? page.properties.Name.title[0].plain_text
						: "Untitled";

				// Fix for missing `title` in slug field
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

		return new Response(JSON.stringify(pages), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error fetching Notion data:", error);
		return new Response(
			JSON.stringify({ error: "Failed to fetch Notion data" }),
			{ status: 500 }
		);
	}
};
