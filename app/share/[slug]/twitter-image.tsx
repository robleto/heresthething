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

function hexToRgba90(hex?: string) {
	if (!hex) return "rgba(229,231,235,0.9)";
	const normalized = hex.trim().toLowerCase();
	if (!/^#[0-9a-f]{6}$/.test(normalized)) return "rgba(229,231,235,0.9)";

	const r = parseInt(normalized.slice(1, 3), 16);
	const g = parseInt(normalized.slice(3, 5), 16);
	const b = parseInt(normalized.slice(5, 7), 16);

	return `rgba(${r},${g},${b},0.9)`;
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
	const backgroundFill = hexToRgba90(card.backgroundColor);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					position: "relative",
					overflow: "hidden",
					background: "#ffffff",
					alignItems: "center",
					justifyContent: "center",
					padding: "28px",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: backgroundFill,
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
