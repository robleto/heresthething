import { ImageResponse } from "next/og";
import { getCardBySlug } from "../../../lib/cards";

export const runtime = "nodejs";

export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

function humanizeSlug(value: string) {
	return value
		.split(/[-_]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatCardTitle(title: string, slug: string) {
	const preferred = title && title !== "Untitled" ? title : slug;
	const looksLikeSlug = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(preferred);

	if (looksLikeSlug) {
		return humanizeSlug(preferred);
	}

	return preferred;
}

export default async function TwitterImage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const card = await getCardBySlug(slug);

	if (!card) {
		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "#0f172a",
						color: "#ffffff",
						fontSize: 56,
						fontWeight: 600,
					}}
				>
					Here&apos;s the Thing
				</div>
			),
			size,
		);
	}

	const title = formatCardTitle(card.title, card.slug);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					position: "relative",
					background: "#0f172a",
					alignItems: "center",
					justifyContent: "center",
					padding: "24px",
				}}
			>
				<img
					src={card.imageUrl}
					alt={title}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
						borderRadius: "16px",
					}}
				/>
			</div>
		),
		size,
	);
}
