import { promises as fs } from "node:fs";
import path from "node:path";

export interface AdviceCard {
	id: string;
	slug: string;
	title: string;
	imageUrl: string;
}

const MANIFEST_TIMEOUT_MS = 6000;

function getManifestPath() {
	return path.join(process.cwd(), "public", "data", "local-cards.json");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			setTimeout(() => reject(new Error("Manifest request timed out")), timeoutMs);
		}),
	]);
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
	if (typeof rawImageUrl === "string" && rawImageUrl.trim()) {
		return rawImageUrl.trim();
	}

	const base = process.env.R2_IMAGE_BASE_URL || process.env.NEXT_PUBLIC_R2_IMAGE_BASE_URL;
	if (base) {
		return `${base.replace(/\/$/, "")}/${slug}.png`;
	}

	return `/img/${slug}.png`;
}

function normalizeCards(raw: unknown): AdviceCard[] {
	if (!Array.isArray(raw)) return [];

	return raw
		.map((item, index) => {
			if (!item || typeof item !== "object") return null;

			const record = item as Record<string, unknown>;
			const slug = sanitizeSlug(record.slug);
			if (!slug) return null;

			const id = typeof record.id === "string" && record.id.trim()
				? record.id.trim()
				: `${slug}-${index}`;

			return {
				id,
				slug,
				title: sanitizeTitle(record.title, slug),
				imageUrl: normalizeImageUrl(slug, record.imageUrl),
			};
		})
		.filter((item): item is AdviceCard => Boolean(item));
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
	try {
		const r2Cards = await fetchR2Cards();
		if (r2Cards.length > 0) return r2Cards;
	} catch {
		// fall through to local manifest
	}

	return getLocalCards();
}

export async function getCardBySlug(slug: string): Promise<AdviceCard | null> {
	const cards = await getCards();
	return cards.find((card) => card.slug === slug) ?? null;
}
