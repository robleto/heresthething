const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

function normalizeQuote(value) {
	if (typeof value !== "string") return "";
	return value.replace(/\s+/g, " ").trim();
}

function listPngBasenames(imagesDir) {
	const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.filter((name) => name.toLowerCase().endsWith(".png"))
		.map((name) => name.slice(0, -4))
		.sort((a, b) => a.localeCompare(b));
}

function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}

function loadQuoteMap(filePath) {
	if (!fs.existsSync(filePath)) return {};

	const raw = fs.readFileSync(filePath, "utf8");
	const parsed = JSON.parse(raw);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return {};
	}

	const quoteMap = {};
	for (const [slug, quote] of Object.entries(parsed)) {
		const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
		if (!normalizedSlug) continue;

		const normalizedQuote = normalizeQuote(quote);
		if (!normalizedQuote) continue;

		quoteMap[normalizedSlug] = normalizedQuote;
	}

	return quoteMap;
}

function readTextFromProperty(properties, propertyName, expectedType) {
	const rawProperty = properties[propertyName];
	if (!rawProperty || typeof rawProperty !== "object") return null;

	if (rawProperty.type !== expectedType) return null;
	const rawItems = rawProperty[expectedType];
	if (!Array.isArray(rawItems) || rawItems.length === 0) return null;

	const plainText = rawItems[0] && rawItems[0].plain_text;
	if (typeof plainText !== "string") return null;

	return plainText.replace(/\s+/g, " ").trim() || null;
}

function extractNotionSlug(properties) {
	return (
		readTextFromProperty(properties, "slug", "rich_text") ||
		readTextFromProperty(properties, "Slug", "rich_text") ||
		readTextFromProperty(properties, "slug", "title") ||
		readTextFromProperty(properties, "Slug", "title") ||
		""
	).trim();
}

function extractNotionAdviceText(properties) {
	return (
		readTextFromProperty(properties, "Advice Text", "rich_text") ||
		readTextFromProperty(properties, "Name", "title") ||
		readTextFromProperty(properties, "Title", "title") ||
		""
	).trim();
}

async function fetchNotionQuoteMap() {
	const databaseId = process.env.NOTION_DATABASE_ID;
	const apiKey = process.env.NOTION_API_KEY;
	if (!databaseId || !apiKey) return {};

	const notion = new Client({ auth: apiKey });
	const map = {};

	let hasMore = true;
	let cursor;

	while (hasMore) {
		const query = {
			database_id: databaseId,
			page_size: 100,
		};

		if (cursor) {
			query.start_cursor = cursor;
		}

		const response = await notion.databases.query(query);

		for (const page of response.results) {
			if (!page || typeof page !== "object" || !("properties" in page)) continue;
			const properties = page.properties;
			const slug = extractNotionSlug(properties);
			const text = extractNotionAdviceText(properties);
			if (!slug || !text) continue;
			map[slug] = text;
		}

		hasMore = response.has_more;
		cursor = response.next_cursor || undefined;
	}

	return map;
}

async function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const imagesDir = path.join(repoRoot, "public", "img");
	const outDir = path.join(repoRoot, "public", "data");
	const outFile = path.join(outDir, "local-cards.json");
	const quoteMapFile = path.join(outDir, "card-text.json");

	if (!fs.existsSync(imagesDir)) {
		throw new Error(`Images dir not found: ${imagesDir}`);
	}

	const slugs = listPngBasenames(imagesDir);
	const fallbackQuoteMap = loadQuoteMap(quoteMapFile);
	let notionQuoteMap = {};

	try {
		notionQuoteMap = await fetchNotionQuoteMap();
	} catch (error) {
		console.warn("⚠️ Notion copy fetch failed, falling back to card-text map");
	}

	const payload = slugs.map((slug) => ({
		id: slug,
		slug,
		title: slug,
		imageUrl: `/img/${slug}.png`,
		quoteText: notionQuoteMap[slug] || fallbackQuoteMap[slug] || undefined,
	}));

	ensureDir(outDir);
	fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
	console.log(`✅ Wrote ${payload.length} local cards to ${path.relative(repoRoot, outFile)}`);
}

main().catch((error) => {
	console.error("❌ Failed to generate local cards:", error);
	process.exitCode = 1;
});
