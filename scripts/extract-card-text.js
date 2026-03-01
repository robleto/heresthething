const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");

function listPngFiles(imagesDir) {
	const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.filter((name) => name.toLowerCase().endsWith(".png"))
		.sort((a, b) => a.localeCompare(b));
}

function normalizeText(rawText) {
	if (typeof rawText !== "string") return "";

	return rawText
		.replace(/\r/g, "")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
}

function parseArgs(argv) {
	const args = {
		all: false,
		limit: null,
	};

	for (const item of argv) {
		if (item === "--all") {
			args.all = true;
			continue;
		}

		if (item.startsWith("--limit=")) {
			const value = Number(item.slice("--limit=".length));
			if (Number.isFinite(value) && value > 0) {
				args.limit = Math.floor(value);
			}
		}
	}

	return args;
}

function loadExistingMap(filePath) {
	if (!fs.existsSync(filePath)) return {};

	const raw = fs.readFileSync(filePath, "utf8");
	const parsed = JSON.parse(raw);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

	const output = {};
	for (const [key, value] of Object.entries(parsed)) {
		if (typeof key !== "string") continue;
		if (typeof value !== "string") continue;
		const slug = key.trim();
		const text = normalizeText(value);
		if (!slug || !text) continue;
		output[slug] = text;
	}

	return output;
}

async function extractTextFromImage(filePath, cachePath) {
	const result = await Tesseract.recognize(filePath, "eng", {
		cachePath,
	});
	return normalizeText(result?.data?.text || "");
}

async function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const imagesDir = path.join(repoRoot, "public", "img");
	const outDir = path.join(repoRoot, "public", "data");
	const outFile = path.join(outDir, "card-text.json");
	const ocrCachePath = path.join(repoRoot, ".cache", "tesseract");
	const args = parseArgs(process.argv.slice(2));

	if (!fs.existsSync(imagesDir)) {
		throw new Error(`Images dir not found: ${imagesDir}`);
	}

	const existingMap = loadExistingMap(outFile);
	const files = listPngFiles(imagesDir);
	const selected = [];

	for (const fileName of files) {
		const slug = fileName.slice(0, -4);
		if (!args.all && existingMap[slug]) {
			continue;
		}
		selected.push(fileName);
		if (args.limit && selected.length >= args.limit) break;
	}

	if (selected.length === 0) {
		console.log("ℹ️ No images need OCR. Use --all to reprocess everything.");
		return;
	}

	fs.mkdirSync(ocrCachePath, { recursive: true });

	const outputMap = { ...existingMap };
	const total = selected.length;

	for (let index = 0; index < selected.length; index += 1) {
		const fileName = selected[index];
		const slug = fileName.slice(0, -4);
		const filePath = path.join(imagesDir, fileName);
		console.log(`🔎 OCR ${index + 1}/${total}: ${fileName}`);

		try {
			const text = await extractTextFromImage(filePath, ocrCachePath);
			if (text) {
				outputMap[slug] = text;
			}
		} catch (error) {
			console.warn(`⚠️ Failed OCR for ${fileName}:`, error?.message || error);
		}
	}

	fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(outFile, JSON.stringify(outputMap, null, 2) + "\n", "utf8");
	console.log(`✅ Wrote OCR text for ${Object.keys(outputMap).length} cards to ${path.relative(repoRoot, outFile)}`);
}

main().catch((error) => {
	console.error("❌ OCR extraction failed:", error);
	process.exit(1);
});
