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
					overflow: "hidden",
					background: "#e5e7eb",
					alignItems: "center",
					justifyContent: "center",
					padding: "28px",
				}}
			>
				<img
					src={card.imageUrl}
					alt=""
					style={{
						position: "absolute",
						inset: 0,
						width: "100%",
						height: "100%",
						objectFit: "cover",
						filter: "blur(30px) saturate(110%) brightness(110%)",
						opacity: 0.9,
						transform: "scale(1.08)",
					}}
				/>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "rgba(255,255,255,0.1)",
					}}
				/>
				<img
					src={card.imageUrl}
					alt={title}
					style={{
						position: "relative",
						zIndex: 1,
						width: "574px",
						height: "574px",
						objectFit: "contain",
						borderRadius: "16px",
						boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
					}}
				/>
			</div>
		),
		size,
	);
}
