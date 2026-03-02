import { promises as fs } from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";

export interface AdviceCard {
	id: string;
	slug: string;
	title: string;
	imageUrl: string;
	quoteText?: string;
	backgroundColor?: string;
}

const MANIFEST_TIMEOUT_MS = 6000;
const NOTION_TIMEOUT_MS = 8000;
const NOTION_CACHE_TTL_MS = 5 * 60 * 1000;

let notionCopyCache: { expiresAt: number; map: Map<string, Pick<AdviceCard, "title" | "quoteText">> } | null = null;

function getManifestPath() {
	return path.join(process.cwd(), "public", "data", "local-cards.json");
}

function getQuoteMapPath() {
	return path.join(process.cwd(), "public", "data", "card-text.json");
}

function getColorMapPath() {
	return path.join(process.cwd(), "public", "data", "card-colors.json");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			setTimeout(() => reject(new Error("Manifest request timed out")), timeoutMs);
		}),
	]);
}

function readTextFromProperty(
	properties: Record<string, unknown>,
	propertyName: string,
	expectedType: "title" | "rich_text"
): string | null {
	const rawProperty = properties[propertyName];
	if (!rawProperty || typeof rawProperty !== "object") return null;

	const property = rawProperty as Record<string, unknown>;
	if (property.type !== expectedType) return null;

	const rawItems = property[expectedType];
	if (!Array.isArray(rawItems) || rawItems.length === 0) return null;

	const firstItem = rawItems[0];
	if (!firstItem || typeof firstItem !== "object") return null;

	const plainText = (firstItem as Record<string, unknown>).plain_text;
	if (typeof plainText !== "string") return null;

	const normalized = plainText.replace(/\s+/g, " ").trim();
	return normalized || null;
}

function extractNotionTitle(properties: Record<string, unknown>): string {
	const fromAdviceText = readTextFromProperty(properties, "Advice Text", "rich_text");
	const fromName = readTextFromProperty(properties, "Name", "title");
	const fromTitle = readTextFromProperty(properties, "Title", "title");

	return (fromAdviceText || fromName || fromTitle || "").trim();
}

function extractNotionSlug(properties: Record<string, unknown>): string {
	const richTextSlug =
		readTextFromProperty(properties, "slug", "rich_text") ||
		readTextFromProperty(properties, "Slug", "rich_text");

	const titleSlug =
		readTextFromProperty(properties, "slug", "title") ||
		readTextFromProperty(properties, "Slug", "title");

	return (richTextSlug || titleSlug || "").trim();
}

async function fetchNotionCopyMap(): Promise<Map<string, Pick<AdviceCard, "title" | "quoteText">>> {
	const databaseId = process.env.NOTION_DATABASE_ID;
	const apiKey = process.env.NOTION_API_KEY;

	if (!databaseId || !apiKey) {
		return new Map();
	}

	if (notionCopyCache && notionCopyCache.expiresAt > Date.now()) {
		return notionCopyCache.map;
	}

	const notion = new Client({ auth: apiKey });
	const copyBySlug = new Map<string, Pick<AdviceCard, "title" | "quoteText">>();
	let hasMore = true;
	let cursor: string | undefined;

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

		const response = await withTimeout(
			notion.databases.query(query),
			NOTION_TIMEOUT_MS
		);

		for (const page of response.results) {
			if (!("properties" in page)) continue;

			const properties = page.properties as Record<string, unknown>;
			const slug = extractNotionSlug(properties);
			if (!slug) continue;

			const title = extractNotionTitle(properties);
			if (!title) continue;

			copyBySlug.set(slug, {
				title,
				quoteText: title,
			});
		}

		hasMore = response.has_more;
		cursor = response.next_cursor ?? undefined;
	}

	notionCopyCache = {
		expiresAt: Date.now() + NOTION_CACHE_TTL_MS,
		map: copyBySlug,
	};

	return copyBySlug;
}

function sanitizeSlug(value: unknown): string {
	if (typeof value !== "string") return "";
	return value.trim();
}

function sanitizeTitle(value: unknown, slug: string): string {
	if (typeof value === "string" && value.trim()) return value.trim();
	return slug || "Untitled";
}

function normalizeImageUrl(slug: string, rawImageUrl: unknown): string {
	const base = process.env.R2_IMAGE_BASE_URL || process.env.NEXT_PUBLIC_R2_IMAGE_BASE_URL;

	if (typeof rawImageUrl === "string" && rawImageUrl.trim()) {
		const trimmed = rawImageUrl.trim();
		const isAbsolute = /^https?:\/\//i.test(trimmed);

		if (isAbsolute) {
			return trimmed;
		}

		if (base) {
			return `${base.replace(/\/$/, "")}/${slug}.png`;
		}

		return trimmed;
	}

	if (base) {
		return `${base.replace(/\/$/, "")}/${slug}.png`;
	}

	return `/img/${slug}.png`;
}

function sanitizeQuoteText(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const normalized = value.replace(/\s+/g, " ").trim();
	return normalized || undefined;
}

function sanitizeBackgroundColor(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const normalized = value.trim().toLowerCase();
	if (!/^#[0-9a-f]{6}$/.test(normalized)) return undefined;
	return normalized;
}

async function loadJsonObjectMap(filePath: string): Promise<Record<string, string>> {
	function parseObjectMap(rawJson: string): Record<string, string> {
		const parsed = JSON.parse(rawJson) as unknown;

		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return {};
		}

		const map: Record<string, string> = {};
		for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
			if (typeof value !== "string") continue;

			const normalizedKey = key.trim();
			const normalizedValue = value.trim();
			if (!normalizedKey || !normalizedValue) continue;

			map[normalizedKey] = normalizedValue;
		}

		return map;
	}

	function resolvePublicMapUrl(fromFilePath: string): string | null {
		const fileName = path.basename(fromFilePath);
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
		if (!siteUrl) return null;
		return `${siteUrl.replace(/\/$/, "")}/data/${fileName}`;
	}

	try {
		const raw = await fs.readFile(filePath, "utf8");
		return parseObjectMap(raw);
	} catch {
		const publicUrl = resolvePublicMapUrl(filePath);
		if (!publicUrl) return {};

		try {
			const response = await withTimeout(
				fetch(publicUrl, { cache: "no-store" }),
				MANIFEST_TIMEOUT_MS
			);

			if (!response.ok) {
				return {};
			}

			const raw = await response.text();
			return parseObjectMap(raw);
		} catch {
			return {};
		}
	}
}

function normalizeCards(raw: unknown): AdviceCard[] {
	if (!Array.isArray(raw)) return [];

	const cards: AdviceCard[] = [];

	raw.forEach((item, index) => {
		if (!item || typeof item !== "object") return;

		const record = item as Record<string, unknown>;
		const slug = sanitizeSlug(record.slug);
		if (!slug) return;

		const id = typeof record.id === "string" && record.id.trim()
			? record.id.trim()
			: `${slug}-${index}`;

		cards.push({
			id,
			slug,
			title: sanitizeTitle(record.title, slug),
			imageUrl: normalizeImageUrl(slug, record.imageUrl),
			quoteText: sanitizeQuoteText(record.quoteText),
			backgroundColor: sanitizeBackgroundColor(record.backgroundColor),
		});
	});

	return cards;
}

async function fetchR2Cards(): Promise<AdviceCard[]> {
	const manifestUrl = process.env.R2_MANIFEST_URL || process.env.NEXT_PUBLIC_R2_MANIFEST_URL;
	if (!manifestUrl) return [];

	const response = await withTimeout(
		fetch(manifestUrl, { cache: "no-store" }),
		MANIFEST_TIMEOUT_MS
	);

	if (!response.ok) {
		throw new Error(`R2 manifest fetch failed (${response.status})`);
	}

	const data = await response.json();
	return normalizeCards(data);
}

export async function getLocalCards(): Promise<AdviceCard[]> {
	const filePath = getManifestPath();
	const raw = await fs.readFile(filePath, "utf8");
	const parsed = JSON.parse(raw) as unknown;
	return normalizeCards(parsed);
}

export async function getCards(): Promise<AdviceCard[]> {
	let cards: AdviceCard[] = [];
	const [localQuoteMap, localColorMap] = await Promise.all([
		loadJsonObjectMap(getQuoteMapPath()),
		loadJsonObjectMap(getColorMapPath()),
	]);

	try {
		const r2Cards = await fetchR2Cards();
		if (r2Cards.length > 0) {
			cards = r2Cards.map((card) => ({
				...card,
				quoteText: card.quoteText || sanitizeQuoteText(localQuoteMap[card.slug]),
				backgroundColor:
					card.backgroundColor || sanitizeBackgroundColor(localColorMap[card.slug]),
			}));
		}
	} catch {
		// fall through to local manifest
	}

	if (cards.length === 0) {
		const localCards = await getLocalCards();
		cards = localCards.map((card) => ({
			...card,
			quoteText: card.quoteText || sanitizeQuoteText(localQuoteMap[card.slug]),
			backgroundColor:
				card.backgroundColor || sanitizeBackgroundColor(localColorMap[card.slug]),
		}));
	}

	try {
		const notionCopyBySlug = await fetchNotionCopyMap();
		if (notionCopyBySlug.size === 0) return cards;

		return cards.map((card) => {
			const notionCopy = notionCopyBySlug.get(card.slug);
			if (!notionCopy) return card;

			return {
				...card,
				title: notionCopy.title || card.title,
				quoteText: notionCopy.quoteText || card.quoteText,
			};
		});
	} catch {
		return cards;
	}
}

export async function getCardBySlug(slug: string): Promise<AdviceCard | null> {
	const cards = await getCards();
	return cards.find((card) => card.slug === slug) ?? null;
}
