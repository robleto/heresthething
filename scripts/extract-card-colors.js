const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function listPngBasenames(imagesDir) {
	const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.filter((name) => name.toLowerCase().endsWith(".png"))
		.map((name) => name.slice(0, -4))
		.sort((a, b) => a.localeCompare(b));
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function toHex(value) {
	return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function pickPixel(data, info, x, y) {
	const channels = info.channels;
	const index = (y * info.width + x) * channels;
	return {
		r: data[index],
		g: data[index + 1],
		b: data[index + 2],
	};
}

async function extractBackgroundColor(imagePath) {
	const { data, info } = await sharp(imagePath)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const insetX = Math.max(1, Math.floor(info.width * 0.06));
	const insetY = Math.max(1, Math.floor(info.height * 0.06));

	const samplePoints = [
		[insetX, insetY],
		[info.width - 1 - insetX, insetY],
		[insetX, info.height - 1 - insetY],
		[info.width - 1 - insetX, info.height - 1 - insetY],
		[Math.floor(info.width / 2), insetY],
		[Math.floor(info.width / 2), info.height - 1 - insetY],
		[insetX, Math.floor(info.height / 2)],
		[info.width - 1 - insetX, Math.floor(info.height / 2)],
	];

	const samples = samplePoints.map(([x, y]) => pickPixel(data, info, x, y));

	const avg = samples.reduce(
		(acc, pixel) => ({
			r: acc.r + pixel.r,
			g: acc.g + pixel.g,
			b: acc.b + pixel.b,
		}),
		{ r: 0, g: 0, b: 0 }
	);

	const count = samples.length;
	const r = avg.r / count;
	const g = avg.g / count;
	const b = avg.b / count;

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const imagesDir = path.join(repoRoot, "public", "img");
	const outDir = path.join(repoRoot, "public", "data");
	const outFile = path.join(outDir, "card-colors.json");

	if (!fs.existsSync(imagesDir)) {
		throw new Error(`Images dir not found: ${imagesDir}`);
	}

	const slugs = listPngBasenames(imagesDir);
	const colorMap = {};

	for (const slug of slugs) {
		const imagePath = path.join(imagesDir, `${slug}.png`);
		colorMap[slug] = await extractBackgroundColor(imagePath);
	}

	fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(outFile, `${JSON.stringify(colorMap, null, 2)}\n`, "utf8");
	console.log(`✅ Wrote ${Object.keys(colorMap).length} colors to ${path.relative(repoRoot, outFile)}`);
}

main().catch((error) => {
	console.error("❌ Failed to extract card colors:", error);
	process.exitCode = 1;
});
