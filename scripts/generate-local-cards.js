const fs = require("fs");
const path = require("path");

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

function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const imagesDir = path.join(repoRoot, "public", "img");
	const outDir = path.join(repoRoot, "public", "data");
	const outFile = path.join(outDir, "local-cards.json");
	const quoteMapFile = path.join(outDir, "card-text.json");

	if (!fs.existsSync(imagesDir)) {
		throw new Error(`Images dir not found: ${imagesDir}`);
	}

	const slugs = listPngBasenames(imagesDir);
	const quoteMap = loadQuoteMap(quoteMapFile);

	const payload = slugs.map((slug) => ({
		id: slug,
		slug,
		title: slug,
		imageUrl: `/img/${slug}.png`,
		quoteText: quoteMap[slug] || undefined,
	}));

	ensureDir(outDir);
	fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
	console.log(`✅ Wrote ${payload.length} local cards to ${path.relative(repoRoot, outFile)}`);
}

main();
