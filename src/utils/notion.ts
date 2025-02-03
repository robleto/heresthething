import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });

export async function fetchNotionData() {
	const databaseId = import.meta.env.NOTION_DATABASE_ID;
	const response = await notion.databases.query({ database_id: databaseId });

	// Filter only full Notion pages
	const pages = response.results.filter(
		(page): page is PageObjectResponse => "properties" in page
	);

	// Map data safely
	return pages.map((page) => ({
		id: page.id,
		title:
			page.properties.Name?.type === "title" &&
			page.properties.Name.title[0]?.type === "text"
				? page.properties.Name.title[0].text.content
				: "Untitled",

		slug:
			page.properties.slug?.type === "title" &&
			page.properties.slug.title.length > 0 &&
			page.properties.slug.title[0]?.type === "text"
				? page.properties.slug.title[0].text.content
				: "default", // 👈 Guarantees a fallback string
	}));
}
