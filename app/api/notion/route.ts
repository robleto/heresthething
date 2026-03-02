import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const NOTION_TIMEOUT_MS = 20000;
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export const revalidate = 300;

type NotionPageProperties = Record<string, unknown>;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			setTimeout(() => reject(new Error("Notion request timed out")), timeoutMs);
		}),
	]);
}

function readTextFromProperty(
	properties: NotionPageProperties,
	propertyName: string,
	expectedType: "title" | "rich_text"
): string | null {
	const rawProperty = properties[propertyName];
	if (!rawProperty || typeof rawProperty !== "object") {
		return null;
	}

	const property = rawProperty as Record<string, unknown>;
	if (property.type !== expectedType) {
		return null;
	}

	const rawItems = property[expectedType];
	if (!Array.isArray(rawItems) || rawItems.length === 0) {
		return null;
	}

	const firstItem = rawItems[0];
	if (!firstItem || typeof firstItem !== "object") {
		return null;
	}

	const plainText = (firstItem as Record<string, unknown>).plain_text;
	return typeof plainText === "string" ? plainText : null;
}

function extractTitle(properties: NotionPageProperties): string {
	const fromAdviceText = readTextFromProperty(properties, "Advice Text", "rich_text");
	const fromName = readTextFromProperty(properties, "Name", "title");
	const fromTitle = readTextFromProperty(properties, "Title", "title");
	return (fromAdviceText || fromName || fromTitle || "Untitled").trim();
}

function extractSlug(properties: NotionPageProperties): string {
	const richTextSlug =
		readTextFromProperty(properties, "slug", "rich_text") ||
		readTextFromProperty(properties, "Slug", "rich_text");

	const titleSlug =
		readTextFromProperty(properties, "slug", "title") ||
		readTextFromProperty(properties, "Slug", "title");

	return (richTextSlug || titleSlug || "").trim();
}

export async function GET() {
	try {
		const databaseId = process.env.NOTION_DATABASE_ID;
		if (!databaseId) {
			return NextResponse.json(
				{ error: "Notion Database ID is missing" },
				{ status: 500 }
			);
		}

		let hasMore = true;
		let cursor: string | undefined;
		const pages: Array<{ id: string; title: string; slug: string }> = [];

		while (hasMore) {
			const query: {
				database_id: string;
				page_size: number;
				start_cursor?: string;
			} = {
				database_id: databaseId,
				page_size: 100,
			};

			if (cursor) {
				query.start_cursor = cursor;
			}

			let response;
			try {
				response = await withTimeout(
					notion.databases.query(query),
					NOTION_TIMEOUT_MS
				);
			} catch {
				if (pages.length > 0) {
					break;
				}
				throw new Error("Notion query failed");
			}

			const currentPage = response.results
				.filter((page) => "properties" in page)
				.map((page) => {
					const properties = page.properties as NotionPageProperties;
					const title = extractTitle(properties);
					const slug = extractSlug(properties);
					return { id: page.id, title, slug };
				})
				.filter((item) => Boolean(item.slug));

			pages.push(...currentPage);
			hasMore = response.has_more;
			cursor = response.next_cursor ?? undefined;
		}

		return NextResponse.json(pages, {
			headers: {
				"Cache-Control": CACHE_CONTROL,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch Notion data" },
			{
				status: 500,
				headers: {
					"Cache-Control": CACHE_CONTROL,
				},
			}
		);
	}
}
