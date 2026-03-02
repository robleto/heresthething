const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

// Load .env files manually (no dotenv dependency needed)
function loadEnvFile(filePath) {
	if (!fs.existsSync(filePath)) return;
	const lines = fs.readFileSync(filePath, "utf8").split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq < 1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		// Strip surrounding quotes
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		// Don't override vars already set in the environment
		if (!process.env[key]) process.env[key] = val;
	}
}

const repoRootForEnv = path.resolve(__dirname, "..");
loadEnvFile(path.join(repoRootForEnv, ".env.local"));
loadEnvFile(path.join(repoRootForEnv, ".env"));

// Typographic characters that sometimes come through garbled from Notion or OCR
const CHAR_FIXES = [
	[/Ñ/g, "—"],     // em dash stored as Ñ (encoding artifact)
	[/\u00d1/g, "—"], // same, explicit codepoint
	[/\u2019/g, "'"], // right single quotation mark → apostrophe
	[/\u201c/g, '"'], // left double quotation mark
	[/\u201d/g, '"'], // right double quotation mark
	[/\u2013/g, "-"], // en dash → hyphen (in body copy context)
	[/\u00e2\u0080\u0094/g, "—"], // UTF-8 mojibake for em dash
];

function normalizeQuote(value) {
	if (typeof value !== "string") return "";
	let s = value.replace(/\s+/g, " ").trim();
	for (const [pattern, replacement] of CHAR_FIXES) {
		s = s.replace(pattern, replacement);
	}
	return s;
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
			const text = normalizeQuote(extractNotionAdviceText(properties));
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

	let notionHits = 0;
	let fallbackHits = 0;
	let missing = 0;

	const payload = slugs.map((slug) => {
		let quoteText;
		if (notionQuoteMap[slug]) {
			quoteText = notionQuoteMap[slug];
			notionHits++;
		} else if (fallbackQuoteMap[slug]) {
			quoteText = fallbackQuoteMap[slug];
			fallbackHits++;
			console.warn(`⚠️  Notion miss — using fallback for: ${slug}`);
		} else {
			missing++;
			console.warn(`❌ No quote found for: ${slug}`);
		}
		return { id: slug, slug, title: slug, imageUrl: `/img/${slug}.png`, quoteText };
	});

	ensureDir(outDir);
	fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
	console.log(`\n✅ Wrote ${payload.length} cards → Notion: ${notionHits}, fallback: ${fallbackHits}, missing: ${missing}`);
	console.log(`   Output: ${path.relative(repoRoot, outFile)}`);
}

main().catch((error) => {
	console.error("❌ Failed to generate local cards:", error);
	process.exitCode = 1;
});
