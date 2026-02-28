import type { MetadataRoute } from "next";
import { getCards } from "../lib/cards";

const SITE_URL = "https://heresthething.life";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const cards = await getCards();
	const now = new Date();

	const staticEntries: MetadataRoute.Sitemap = [
		{
			url: SITE_URL,
			lastModified: now,
			changeFrequency: "daily",
			priority: 1,
		},
	];

	const cardEntries: MetadataRoute.Sitemap = cards.map((card) => ({
		url: `${SITE_URL}/card/${card.slug}`,
		lastModified: now,
		changeFrequency: "weekly",
		priority: 0.7,
	}));

	return [...staticEntries, ...cardEntries];
}
