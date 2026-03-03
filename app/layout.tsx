import type { Metadata } from "next";
import "./styles/global.css";

export const metadata: Metadata = {
	metadataBase: new URL("https://heresthething.life"),

	title: {
		default: "Here's the Thing",
		template: "%s | Here's the Thing",
	},
	description:
		"A growing collection of advice, wisdom, and hard-won lessons — one card at a time.",
	alternates: {
		canonical: "https://heresthething.life",
	},

	openGraph: {
		type: "website",
		url: "https://heresthething.life",
		siteName: "Here's the Thing",
		title: "Here's the Thing",
		description:
			"A growing collection of advice, wisdom, and hard-won lessons — one card at a time.",
		// Replace /public/og-image.png with a 1200×630 branded image before launch
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Here's the Thing",
			},
		],
	},

	twitter: {
		card: "summary_large_image",
		site: "@heresthething",
		title: "Here's the Thing",
		description:
			"A growing collection of advice, wisdom, and hard-won lessons — one card at a time.",
		images: ["/og-image.png"],
	},

	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const imageBaseUrl =
		process.env.NEXT_PUBLIC_R2_IMAGE_BASE_URL || process.env.R2_IMAGE_BASE_URL;

	let imageOrigin: string | null = null;
	if (imageBaseUrl) {
		try {
			imageOrigin = new URL(imageBaseUrl).origin;
		} catch {
			imageOrigin = null;
		}
	}

	return (
		<html lang="en">
			<head>
				{imageOrigin ? (
					<>
						<link rel="preconnect" href={imageOrigin} crossOrigin="" />
						<link rel="dns-prefetch" href={imageOrigin} />
					</>
				) : null}
			</head>
			<body className="bg-gray-200 text-black flex flex-col min-h-screen">
				{children}
			</body>
		</html>
	);
}
