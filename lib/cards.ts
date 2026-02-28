import { promises as fs } from "node:fs";
import path from "node:path";

export interface AdviceCard {
	id: string;
	slug: string;
	title: string;
	imageUrl: string;
}

function getManifestPath() {
	return path.join(process.cwd(), "public", "data", "local-cards.json");
}

export async function getLocalCards(): Promise<AdviceCard[]> {
	const filePath = getManifestPath();
	const raw = await fs.readFile(filePath, "utf8");
	return JSON.parse(raw) as AdviceCard[];
}

export async function getCardBySlug(slug: string): Promise<AdviceCard | null> {
	const cards = await getLocalCards();
	return cards.find((card) => card.slug === slug) ?? null;
}
